import { Message, GuildMember, TextChannel } from "discord.js";
import ModerationSystem from "./ModerationSystem";
import Logger from "./Logger";
import { redis } from "./RedisDB";

export default class DuplicateFilter {
    private static readonly REDIS_PREFIX = 'duplicate_tracker';
    private static readonly FALLBACK_HISTORY = new Map<string, { content: string; timestamp: number; count: number }>();

    static async checkMessage(message: Message): Promise<boolean> {
        if (!message.guild || !message.member) return false;

        const settings = await ModerationSystem.getAutoModSettings(message.guild.id);
        if (!settings || !settings.enabled || !settings.duplicateFilter.enabled) return false;

        // Check if user has bypass permissions
        if (this.hasBypassPermissions(message.member, settings)) return false;

        const userId = message.author.id;
        const guildId = message.guild.id;
        const messageContent = message.content.toLowerCase().trim();
        
        // Skip very short messages
        if (messageContent.length < 3) return false;

        const now = Date.now();
        const timeWindow = settings.duplicateFilter.timeWindow * 1000; // Convert to ms
        const key = `${userId}-${guildId}`;

        try {
            // Get or create user's message history using Redis
            let userHistory = await this.getMessageHistory(key);
            
            if (!userHistory || (now - userHistory.timestamp) > timeWindow) {
                // First message or outside time window
                userHistory = {
                    content: messageContent,
                    timestamp: now,
                    count: 1
                };
                await this.setMessageHistory(key, userHistory, timeWindow);
                return false;
            }

            // Check if message is duplicate
            if (userHistory.content === messageContent) {
                userHistory.count++;
                userHistory.timestamp = now;

                if (userHistory.count >= settings.duplicateFilter.maxDuplicates) {
                    await this.handleDuplicateSpam(message, settings);
                    
                    // Reset counter after action
                    userHistory.count = 0;
                    await this.setMessageHistory(key, userHistory, timeWindow);
                    return true;
                }
            } else {
                // Different message, reset tracking
                userHistory.content = messageContent;
                userHistory.count = 1;
                userHistory.timestamp = now;
            }

            await this.setMessageHistory(key, userHistory, timeWindow);
            return false;

        } catch (error) {
            Logger.error(`Duplicate filter check failed for ${userId} in ${guildId}: ${error}`);
            
            // Fallback to in-memory tracking
            return this.checkMessageFallback(message, settings);
        }
    }

    /**
     * Get message history from Redis with fallback
     */
    private static async getMessageHistory(key: string): Promise<{ content: string; timestamp: number; count: number } | null> {
        try {
            const redisKey = `${this.REDIS_PREFIX}:${key}`;
            const data = await redis.get(redisKey);
            return data ? JSON.parse(data) as { content: string; timestamp: number; count: number } : null;
        } catch (error) {
            Logger.warn(`Failed to get message history from Redis: ${error}`);
            return this.FALLBACK_HISTORY.get(key) || null;
        }
    }

    /**
     * Set message history in Redis with fallback
     */
    private static async setMessageHistory(key: string, history: { content: string; timestamp: number; count: number }, ttl: number): Promise<void> {
        try {
            const redisKey = `${this.REDIS_PREFIX}:${key}`;
            await redis.setex(redisKey, Math.ceil(ttl / 1000), JSON.stringify(history));
        } catch (error) {
            Logger.warn(`Failed to set message history in Redis: ${error}`);
            this.FALLBACK_HISTORY.set(key, history);
        }
    }

    /**
     * Fallback duplicate checking using in-memory tracking
     */
    private static checkMessageFallback(message: Message, settings: any): boolean {
        const userId = message.author.id;
        const guildId = message.guild!.id;
        const messageContent = message.content.toLowerCase().trim();
        const now = Date.now();
        const timeWindow = settings.duplicateFilter.timeWindow * 1000;
        const key = `${userId}-${guildId}`;

        let userHistory = this.FALLBACK_HISTORY.get(key);
        
        if (!userHistory || (now - userHistory.timestamp) > timeWindow) {
            this.FALLBACK_HISTORY.set(key, {
                content: messageContent,
                timestamp: now,
                count: 1
            });
            return false;
        }

        if (userHistory.content === messageContent) {
            userHistory.count++;
            userHistory.timestamp = now;

            if (userHistory.count >= settings.duplicateFilter.maxDuplicates) {
                this.handleDuplicateSpam(message, settings);
                userHistory.count = 0;
                return true;
            }
        } else {
            userHistory.content = messageContent;
            userHistory.count = 1;
            userHistory.timestamp = now;
        }

        return false;
    }

    private static hasBypassPermissions(member: GuildMember, settings: any): boolean {
        // Check if user has admin/mod permissions
        if (member.permissions.has("Administrator") || member.permissions.has("ManageMessages")) {
            return true;
        }

        // Check if user has bypass roles
        return settings.duplicateFilter.bypassRoles.some((roleId: string) => member.roles.cache.has(roleId));
    }

    private static async handleDuplicateSpam(message: Message, settings: any): Promise<void> {
        try {
            const action = settings.duplicateFilter.action;
            
            switch (action) {
                case "delete":
                    await this.deleteMessages(message);
                    break;
                    
                case "warn":
                    await this.deleteMessages(message);
                    await this.warnUser(message);
                    break;
                    
                case "mute":
                    await this.deleteMessages(message);
                    await this.muteUser(message);
                    break;
            }

            // Send temporary warning message
            const channel = message.channel as TextChannel;
            const warningMessage = await channel.send({
                content: `${message.author}, please stop posting duplicate messages.`
            }).catch(() => null);

            // Delete warning after 5 seconds
            if (warningMessage) {
                setTimeout(async () => {
                    try {
                        await warningMessage.delete();
                    } catch (error) {
                        // Message may already be deleted
                    }
                }, 5000);
            }

            Logger.info(`Handled duplicate message spam from ${message.author.tag} in ${message.guild?.name}`);

        } catch (error) {
            Logger.error(`Failed to handle duplicate spam: ${error}`);
        }
    }

    private static async deleteMessages(message: Message): Promise<void> {
        try {
            const channel = message.channel as TextChannel;
            const messages = await channel.messages.fetch({ limit: 50 });
            
            // Find recent duplicate messages from the same user
            const duplicateMessages = messages
                .filter(msg => 
                    msg.author.id === message.author.id &&
                    msg.content.toLowerCase().trim() === message.content.toLowerCase().trim() &&
                    (Date.now() - msg.createdTimestamp) < 60000 // Within last minute
                )
                .first(10); // Limit to prevent abuse

            // Delete duplicate messages
            for (const msg of duplicateMessages) {
                try {
                    await msg.delete();
                } catch (error) {
                    // Message may already be deleted
                }
            }
        } catch (error) {
            Logger.error(`Failed to delete duplicate messages: ${error}`);
        }
    }

    private static async warnUser(message: Message): Promise<void> {
        if (!message.guild) return;
        
        await ModerationSystem.createCase(
            message.guild,
            message.author,
            message.client.user!,
            "warn",
            "Posting duplicate messages (spam)"
        );
    }

    private static async muteUser(message: Message): Promise<void> {
        if (!message.guild || !message.member) return;
        
        const muteTime = 10 * 60 * 1000; // 10 minutes
        
        try {
            await message.member.timeout(muteTime, "Duplicate message spam");
            
            await ModerationSystem.createCase(
                message.guild,
                message.author,
                message.client.user!,
                "timeout",
                "Posting duplicate messages (spam)",
                muteTime
            );
        } catch (error) {
            Logger.error(`Failed to mute user for duplicate spam: ${error}`);
        }
    }

    // Clean up old entries periodically (now handles both Redis and fallback)
    static async cleanupHistory(): Promise<void> {
        try {
            // Clean up fallback history
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutes

            for (const [key, data] of this.FALLBACK_HISTORY.entries()) {
                if (now - data.timestamp > maxAge) {
                    this.FALLBACK_HISTORY.delete(key);
                }
            }

            // Redis keys will auto-expire, but clean up if there are too many
            const pattern = `${this.REDIS_PREFIX}:*`;
            const keys = await redis.keys(pattern);
            
            if (keys.length > 1000) {
                Logger.info(`Cleaning up ${keys.length} duplicate filter keys from Redis`);
                const pipeline = redis.pipeline();
                
                for (const key of keys) {
                    pipeline.ttl(key);
                }
                
                const ttls = await pipeline.exec();
                const keysToDelete = keys.filter((_, index) => {
                    const ttl = ttls?.[index]?.[1] as number;
                    return ttl !== undefined && ttl > 0 && ttl < 60;
                });

                if (keysToDelete.length > 0) {
                    await redis.del(...keysToDelete);
                    Logger.info(`Cleaned up ${keysToDelete.length} expired duplicate filter keys`);
                }
            }

        } catch (error) {
            Logger.error(`Failed to cleanup duplicate filter history: ${error}`);
        }
    }
}
