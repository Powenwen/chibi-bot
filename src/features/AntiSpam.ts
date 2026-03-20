import { Message, GuildMember, TextChannel } from "discord.js";
import ModerationSystem from "./ModerationSystem";
import Logger from "./Logger";
import AutoModerationLogger from "./AutoModerationLogger";
import { redis } from "./RedisDB";

interface SpamTracker {
    messages: number;
    firstMessage: number;
}

export default class AntiSpam {
    private static readonly REDIS_PREFIX = 'spam_tracker';
    private static readonly FALLBACK_TRACKERS = new Map<string, SpamTracker>();

    static async checkMessage(message: Message): Promise<boolean> {
        if (!message.guild || !message.member) return false;

        const settings = await ModerationSystem.getAutoModSettings(message.guild.id);
        if (!settings || !settings.enabled || !settings.antiSpam.enabled) return false;

        // Check if user has bypass permissions
        if (this.hasBypassPermissions(message.member, settings)) return false;

        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();
        const timeWindow = settings.antiSpam.timeWindow * 1000; // Convert to ms

        try {
            // Get or create spam tracker using Redis
            let tracker = await this.getSpamTracker(userId, guildId);
            if (!tracker || (now - tracker.firstMessage) > timeWindow) {
                tracker = { messages: 1, firstMessage: now };
                await this.setSpamTracker(userId, guildId, tracker, timeWindow);
                return false;
            }

            tracker.messages++;

            // Check if spam threshold exceeded
            if (tracker.messages > settings.antiSpam.maxMessages) {
                await this.handleSpam(message, settings);
                await this.deleteSpamTracker(userId, guildId); // Reset tracker
                return true;
            }

            // Update tracker
            await this.setSpamTracker(userId, guildId, tracker, timeWindow);
            return false;

        } catch (error) {
            Logger.error(`Anti-spam check failed for ${userId} in ${guildId}: ${error}`);
            
            // Fallback to in-memory tracking if Redis fails
            return this.checkMessageFallback(message, settings);
        }
    }

    /**
     * Get spam tracker from Redis with fallback
     */
    private static async getSpamTracker(userId: string, guildId: string): Promise<SpamTracker | null> {
        try {
            const key = `${this.REDIS_PREFIX}:${guildId}:${userId}`;
            const data = await redis.get(key);
            return data ? JSON.parse(data) as SpamTracker : null;
        } catch (error) {
            Logger.warn(`Failed to get spam tracker from Redis: ${error}`);
            return this.FALLBACK_TRACKERS.get(`${guildId}:${userId}`) || null;
        }
    }

    /**
     * Set spam tracker in Redis with fallback
     */
    private static async setSpamTracker(userId: string, guildId: string, tracker: SpamTracker, ttl: number): Promise<void> {
        try {
            const key = `${this.REDIS_PREFIX}:${guildId}:${userId}`;
            await redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(tracker));
        } catch (error) {
            Logger.warn(`Failed to set spam tracker in Redis: ${error}`);
            this.FALLBACK_TRACKERS.set(`${guildId}:${userId}`, tracker);
        }
    }

    /**
     * Delete spam tracker from Redis with fallback
     */
    private static async deleteSpamTracker(userId: string, guildId: string): Promise<void> {
        try {
            const key = `${this.REDIS_PREFIX}:${guildId}:${userId}`;
            await redis.del(key);
        } catch (error) {
            Logger.warn(`Failed to delete spam tracker from Redis: ${error}`);
        }
        this.FALLBACK_TRACKERS.delete(`${guildId}:${userId}`);
    }

    /**
     * Fallback spam checking using in-memory tracking
     */
    private static checkMessageFallback(message: Message, settings: any): boolean {
        const userId = message.author.id;
        const guildId = message.guild!.id;
        const now = Date.now();
        const timeWindow = settings.antiSpam.timeWindow * 1000;

        let tracker = this.FALLBACK_TRACKERS.get(`${guildId}:${userId}`);
        if (!tracker || (now - tracker.firstMessage) > timeWindow) {
            tracker = { messages: 1, firstMessage: now };
            this.FALLBACK_TRACKERS.set(`${guildId}:${userId}`, tracker);
            return false;
        }

        tracker.messages++;

        if (tracker.messages > settings.antiSpam.maxMessages) {
            this.handleSpam(message, settings);
            this.FALLBACK_TRACKERS.delete(`${guildId}:${userId}`);
            return true;
        }

        return false;
    }

    private static hasBypassPermissions(member: GuildMember, settings: any): boolean {
        // Check if user has admin/mod permissions
        if (member.permissions.has("Administrator") || member.permissions.has("ManageMessages")) {
            return true;
        }

        // Check if user has bypass roles
        return settings.antiSpam.ignoreRoles.some((roleId: string) => member.roles.cache.has(roleId));
    }

    private static async handleSpam(message: Message, settings: any): Promise<void> {
        try {
            const muteTime = settings.antiSpam.muteTime * 60 * 1000; // Convert to ms

            // Delete recent messages from this user
            await this.deleteRecentMessages(message);

            // Apply timeout
            if (message.member) {
                await message.member.timeout(muteTime, "Anti-spam: Exceeded message limit");
                
                // Create moderation case
                await ModerationSystem.createCase(
                    message.guild!,
                    message.author,
                    message.client.user!,
                    "timeout",
                    `Anti-spam: Sent ${settings.antiSpam.maxMessages + 1} messages in ${settings.antiSpam.timeWindow} seconds`,
                    muteTime
                );
            }

            // Log the auto-moderation action
            await AutoModerationLogger.logAction(
                message.guild!,
                message.author,
                message,
                'antiSpam',
                'timeout',
                `Exceeded message limit: ${settings.antiSpam.maxMessages + 1} messages in ${settings.antiSpam.timeWindow} seconds`
            );

            // Send warning message
            const channel = message.channel as TextChannel;
            const warningMessage = await channel.send({
                content: `${message.author}, you have been temporarily muted for spamming. Please slow down your messages.`
            });

            // Delete warning message after 10 seconds
            setTimeout(async () => {
                try {
                    await warningMessage.delete();
                } catch (error) {
                    // Message may already be deleted
                }
            }, 10000);

        } catch (error) {
            Logger.error(`Failed to handle spam: ${error}`);
        }
    }

    private static async deleteRecentMessages(message: Message): Promise<void> {
        try {
            const channel = message.channel as TextChannel;
            const messages = await channel.messages.fetch({ limit: 50 });
            
            const userMessages = messages.filter(msg => 
                msg.author.id === message.author.id && 
                (Date.now() - msg.createdTimestamp) < 30000 // Last 30 seconds
            );

            for (const msg of userMessages.values()) {
                try {
                    await msg.delete();
                } catch (error) {
                    // Message may already be deleted
                }
            }
        } catch (error) {
            Logger.error(`Failed to delete spam messages: ${error}`);
        }
    }

    // Clean up old trackers periodically (now handles both Redis and fallback)
    static async cleanupTrackers(): Promise<void> {
        try {
            // Clean up fallback trackers
            const now = Date.now();
            for (const [key, tracker] of this.FALLBACK_TRACKERS.entries()) {
                if ((now - tracker.firstMessage) > 60000) { // 1 minute
                    this.FALLBACK_TRACKERS.delete(key);
                }
            }

            // Redis keys will auto-expire, but we can scan for any lingering ones
            const pattern = `${this.REDIS_PREFIX}:*`;
            const keys = await redis.keys(pattern);
            
            if (keys.length > 1000) { // Only clean if there are too many keys
                Logger.info(`Cleaning up ${keys.length} spam tracker keys from Redis`);
                const pipeline = redis.pipeline();
                
                for (const key of keys) {
                    // Check if key is about to expire anyway (TTL < 60 seconds)
                    pipeline.ttl(key);
                }
                
                const ttls = await pipeline.exec();
                const keysToDelete = keys.filter((_, index) => {
                    const ttl = ttls?.[index]?.[1] as number;
                    return ttl !== undefined && ttl > 0 && ttl < 60;
                });

                if (keysToDelete.length > 0) {
                    await redis.del(...keysToDelete);
                    Logger.info(`Cleaned up ${keysToDelete.length} expired spam tracker keys`);
                }
            }

        } catch (error) {
            Logger.error(`Failed to cleanup spam trackers: ${error}`);
        }
    }
}

// Clean up trackers every minute (now async)
setInterval(async () => {
    await AntiSpam.cleanupTrackers();
}, 60000);
