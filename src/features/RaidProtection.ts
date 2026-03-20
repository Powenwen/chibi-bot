import { Guild, GuildMember, TextChannel, Message } from "discord.js";
import ModerationSystem from "./ModerationSystem";
import AutoModerationLogger from "./AutoModerationLogger";
import Logger from "./Logger";
import { redis } from "./RedisDB";

interface JoinTracker {
    joinTimes: number[];
    lockdownActive: boolean;
    lockdownExpires?: number;
}

export default class RaidProtection {
    private static readonly REDIS_PREFIX = 'raid_protection';
    private static readonly FALLBACK_TRACKERS = new Map<string, JoinTracker>();

    /**
     * Check for potential raid when a member joins
     */
    static async checkJoin(member: GuildMember): Promise<boolean> {
        if (!member.guild) return false;

        const settings = await ModerationSystem.getAutoModSettings(member.guild.id);
        if (!settings || !settings.enabled || !settings.raidProtection?.enabled) return false;

        const guildId = member.guild.id;
        const now = Date.now();
        const timeWindow = settings.raidProtection.timeWindow * 1000; // Convert to ms

        try {
            // Get current join tracker
            let tracker = await this.getJoinTracker(guildId);
            if (!tracker) {
                tracker = { joinTimes: [now], lockdownActive: false };
            } else {
                // Remove old join times outside the window
                tracker.joinTimes = tracker.joinTimes.filter(time => (now - time) <= timeWindow);
                tracker.joinTimes.push(now);
            }

            // Check if lockdown is already active
            if (tracker.lockdownActive && tracker.lockdownExpires && now < tracker.lockdownExpires) {
                await this.handleJoinDuringLockdown(member, settings.raidProtection);
                return true;
            }

            // Check if join threshold exceeded
            if (tracker.joinTimes.length >= settings.raidProtection.joinThreshold) {
                await this.initiateRaidProtection(member.guild, settings.raidProtection, tracker);
                await this.setJoinTracker(guildId, tracker, timeWindow);
                return true;
            }

            // Update tracker
            await this.setJoinTracker(guildId, tracker, timeWindow);
            return false;

        } catch (error) {
            Logger.error(`Raid protection check failed for guild ${guildId}: ${error}`);
            return this.checkJoinFallback(member, settings);
        }
    }

    /**
     * Get join tracker from Redis with fallback
     */
    private static async getJoinTracker(guildId: string): Promise<JoinTracker | null> {
        try {
            const key = `${this.REDIS_PREFIX}:${guildId}`;
            const data = await redis.get(key);
            return data ? JSON.parse(data) as JoinTracker : null;
        } catch (error) {
            Logger.warn(`Failed to get join tracker from Redis: ${error}`);
            return this.FALLBACK_TRACKERS.get(guildId) || null;
        }
    }

    /**
     * Set join tracker in Redis with fallback
     */
    private static async setJoinTracker(guildId: string, tracker: JoinTracker, ttl: number): Promise<void> {
        try {
            const key = `${this.REDIS_PREFIX}:${guildId}`;
            // Set TTL to longer of timeWindow or lockdown time
            const cacheTtl = Math.max(Math.ceil(ttl / 1000), 1800); // At least 30 minutes
            await redis.setex(key, cacheTtl, JSON.stringify(tracker));
        } catch (error) {
            Logger.warn(`Failed to set join tracker in Redis: ${error}`);
            this.FALLBACK_TRACKERS.set(guildId, tracker);
        }
    }

    /**
     * Fallback join checking using in-memory tracking
     */
    private static checkJoinFallback(member: GuildMember, settings: any): boolean {
        const guildId = member.guild.id;
        const now = Date.now();
        const timeWindow = settings.raidProtection.timeWindow * 1000;

        let tracker = this.FALLBACK_TRACKERS.get(guildId);
        if (!tracker) {
            tracker = { joinTimes: [now], lockdownActive: false };
            this.FALLBACK_TRACKERS.set(guildId, tracker);
            return false;
        }

        // Remove old join times
        tracker.joinTimes = tracker.joinTimes.filter(time => (now - time) <= timeWindow);
        tracker.joinTimes.push(now);

        // Check lockdown
        if (tracker.lockdownActive && tracker.lockdownExpires && now < tracker.lockdownExpires) {
            this.handleJoinDuringLockdown(member, settings.raidProtection);
            return true;
        }

        // Check threshold
        if (tracker.joinTimes.length >= settings.raidProtection.joinThreshold) {
            this.initiateRaidProtection(member.guild, settings.raidProtection, tracker);
            return true;
        }

        return false;
    }

    /**
     * Initiate raid protection measures
     */
    private static async initiateRaidProtection(guild: Guild, settings: any, tracker: JoinTracker): Promise<void> {
        try {
            const lockdownTime = settings.lockdownTime * 60 * 1000; // Convert to ms
            tracker.lockdownActive = true;
            tracker.lockdownExpires = Date.now() + lockdownTime;

            Logger.warn(`Raid protection activated for guild ${guild.name} (${guild.id})`);

            // Log the raid protection activation
            // Note: Creating a minimal message-like object for logging purposes
            const systemChannel = guild.systemChannel || guild.channels.cache.find(ch => ch.isTextBased());
            if (systemChannel && systemChannel.isTextBased()) {
                const mockMessage = {
                    guild,
                    channel: systemChannel,
                    content: `Raid detected: ${tracker.joinTimes.length} joins in ${settings.timeWindow} seconds`,
                    author: guild.client.user!
                } as unknown as Message;
                
                await AutoModerationLogger.logAction(
                    guild,
                    guild.client.user!,
                    mockMessage,
                    'raidProtection',
                    'lockdown',
                    `Raid protection activated - ${tracker.joinTimes.length} joins detected`
                );
            }

            // Apply server measures
            const action = settings.action;
            switch (action) {
                case 'kick':
                    await this.kickRecentJoins(guild, settings);
                    break;
                case 'ban':
                    await this.banRecentJoins(guild, settings);
                    break;
                default:
                    // Default to lockdown
                    await this.applyLockdownMeasures(guild);
                    
                    // Schedule lockdown removal
                    setTimeout(async () => {
                        await this.removeLockdownMeasures(guild);
                    }, lockdownTime);
                    break;
            }

        } catch (error) {
            Logger.error(`Failed to initiate raid protection: ${error}`);
        }
    }

    /**
     * Apply lockdown measures to the server
     */
    private static async applyLockdownMeasures(guild: Guild): Promise<void> {
        try {
            // Get default role (@everyone)
            const everyoneRole = guild.roles.everyone;

            // Store original permissions for restoration
            const originalPerms = everyoneRole.permissions.toArray();
            await redis.setex(
                `raid_lockdown_perms:${guild.id}`,
                3600, // 1 hour
                JSON.stringify(originalPerms)
            );

            // Remove Send Messages permission from @everyone
            await everyoneRole.setPermissions(
                everyoneRole.permissions.remove('SendMessages'),
                'Automatic raid protection - lockdown active'
            );

            // Send notification
            const systemChannel = guild.systemChannel || 
                guild.channels.cache.find(ch => 
                    ch.isTextBased() && 
                    ch.permissionsFor(guild.members.me!)?.has('SendMessages')
                ) as TextChannel;
            
            if (systemChannel) {
                await systemChannel.send({
                    content: '🚨 **RAID DETECTED** - Server is now in lockdown mode. Messaging has been temporarily disabled for @everyone.'
                }).catch(() => null);
            }

            Logger.info(`Applied lockdown measures to guild ${guild.name}`);

        } catch (error) {
            Logger.error(`Failed to apply lockdown measures: ${error}`);
        }
    }

    /**
     * Remove lockdown measures from the server
     */
    private static async removeLockdownMeasures(guild: Guild): Promise<void> {
        try {
            // Restore original permissions
            const originalPermsData = await redis.get(`raid_lockdown_perms:${guild.id}`);
            if (originalPermsData) {
                const originalPerms = JSON.parse(originalPermsData) as bigint[];
                const everyoneRole = guild.roles.everyone;
                
                await everyoneRole.setPermissions(
                    originalPerms,
                    'Raid protection lockdown ended - restoring permissions'
                );

                await redis.del(`raid_lockdown_perms:${guild.id}`);
            }

            // Clear lockdown status
            const tracker = await this.getJoinTracker(guild.id);
            if (tracker) {
                tracker.lockdownActive = false;
                delete tracker.lockdownExpires;
                await this.setJoinTracker(guild.id, tracker, 300000); // 5 minutes cache
            }

            // Send notification
            const systemChannel = guild.systemChannel || 
                guild.channels.cache.find(ch => 
                    ch.isTextBased() && 
                    ch.permissionsFor(guild.members.me!)?.has('SendMessages')
                ) as TextChannel;
            
            if (systemChannel) {
                await systemChannel.send({
                    content: '✅ **RAID PROTECTION ENDED** - Server lockdown has been lifted. Normal operations resumed.'
                }).catch(() => null);
            }

            Logger.info(`Removed lockdown measures from guild ${guild.name}`);

        } catch (error) {
            Logger.error(`Failed to remove lockdown measures: ${error}`);
        }
    }

    /**
     * Handle new joins during active lockdown
     */
    private static async handleJoinDuringLockdown(member: GuildMember, settings: any): Promise<void> {
        try {
            const action = settings.action;

            if (action === 'kick') {
                await member.kick('Automatic raid protection - joined during lockdown');
                
                await ModerationSystem.createCase(
                    member.guild,
                    member.user,
                    member.client.user!,
                    "kick",
                    "Automatic raid protection - joined during active lockdown"
                );
            } else if (action === 'ban') {
                await member.ban({ 
                    reason: 'Automatic raid protection - joined during lockdown',
                    deleteMessageDays: 1
                });
                
                await ModerationSystem.createCase(
                    member.guild,
                    member.user,
                    member.client.user!,
                    "ban",
                    "Automatic raid protection - joined during active lockdown"
                );
            }

            Logger.info(`Applied ${action} action to ${member.user.tag} during raid lockdown in ${member.guild.name}`);

        } catch (error) {
            Logger.error(`Failed to handle join during lockdown: ${error}`);
        }
    }

    private static async kickRecentJoins(guild: Guild, settings: any): Promise<void> {
        try {
            const timeWindow = settings.timeWindow * 1000;
            const now = Date.now();
            
            // Fetch recent members
            const members = await guild.members.fetch();
            const recentJoins = members.filter(member => 
                member.joinedTimestamp && 
                (now - member.joinedTimestamp) < timeWindow &&
                !member.user.bot && // Don't kick bots
                !member.permissions.has('Administrator') // Don't kick admins
            );

            let kickedCount = 0;
            for (const [, member] of recentJoins) {
                try {
                    await member.kick('Raid protection - Recent join during raid');
                    kickedCount++;
                    
                    await ModerationSystem.createCase(
                        guild,
                        member.user,
                        guild.members.me!.user,
                        "kick",
                        "Raid protection - Recent join during raid"
                    );
                } catch (error) {
                    Logger.error(`Failed to kick ${member.user.tag}: ${error}`);
                }
            }

            Logger.info(`Kicked ${kickedCount} recent joins due to raid protection`);

        } catch (error) {
            Logger.error(`Failed to kick recent joins: ${error}`);
        }
    }

    private static async banRecentJoins(guild: Guild, settings: any): Promise<void> {
        try {
            const timeWindow = settings.timeWindow * 1000;
            const now = Date.now();
            
            // Fetch recent members
            const members = await guild.members.fetch();
            const recentJoins = members.filter(member => 
                member.joinedTimestamp && 
                (now - member.joinedTimestamp) < timeWindow &&
                !member.user.bot && // Don't ban bots
                !member.permissions.has('Administrator') // Don't ban admins
            );

            let bannedCount = 0;
            for (const [, member] of recentJoins) {
                try {
                    await member.ban({ 
                        reason: 'Raid protection - Recent join during raid',
                        deleteMessageDays: 1
                    });
                    bannedCount++;
                    
                    await ModerationSystem.createCase(
                        guild,
                        member.user,
                        guild.members.me!.user,
                        "ban",
                        "Raid protection - Recent join during raid"
                    );
                } catch (error) {
                    Logger.error(`Failed to ban ${member.user.tag}: ${error}`);
                }
            }

            Logger.info(`Banned ${bannedCount} recent joins due to raid protection`);

        } catch (error) {
            Logger.error(`Failed to ban recent joins: ${error}`);
        }
    }

    /**
     * Manually end raid protection for a guild
     */
    static async endRaidProtection(guild: Guild): Promise<boolean> {
        try {
            await this.removeLockdownMeasures(guild);
            
            // Clear tracker
            const key = `${this.REDIS_PREFIX}:${guild.id}`;
            await redis.del(key);
            this.FALLBACK_TRACKERS.delete(guild.id);

            Logger.info(`Manually ended raid protection for guild ${guild.name}`);
            return true;

        } catch (error) {
            Logger.error(`Failed to manually end raid protection: ${error}`);
            return false;
        }
    }

    /**
     * Check if guild is currently under raid protection
     */
    static async isUnderRaidProtection(guild: Guild): Promise<boolean> {
        try {
            const tracker = await this.getJoinTracker(guild.id);
            return (tracker?.lockdownActive && 
                   tracker.lockdownExpires && 
                   Date.now() < tracker.lockdownExpires) || false;
        } catch (error) {
            Logger.error(`Failed to check raid protection status: ${error}`);
            return false;
        }
    }

    // Clean up old entries periodically (enhanced)
    static async cleanupHistory(): Promise<void> {
        try {
            // Clean up fallback trackers
            const now = Date.now();
            for (const [guildId, tracker] of this.FALLBACK_TRACKERS.entries()) {
                // Remove expired lockdowns
                if (tracker.lockdownActive && tracker.lockdownExpires && now > tracker.lockdownExpires) {
                    tracker.lockdownActive = false;
                    delete tracker.lockdownExpires;
                }

                // Remove old join times
                tracker.joinTimes = tracker.joinTimes.filter(time => (now - time) <= 3600000); // 1 hour

                // Remove empty trackers
                if (tracker.joinTimes.length === 0 && !tracker.lockdownActive) {
                    this.FALLBACK_TRACKERS.delete(guildId);
                }
            }

            // Clean up Redis keys if there are too many
            const pattern = `${this.REDIS_PREFIX}:*`;
            const keys = await redis.keys(pattern);
            
            if (keys.length > 200) {
                Logger.info(`Cleaning up ${keys.length} raid protection keys from Redis`);
                
                for (const key of keys) {
                    const data = await redis.get(key);
                    if (data) {
                        const tracker = JSON.parse(data) as JoinTracker;
                        
                        // Remove expired lockdowns
                        if (tracker.lockdownActive && tracker.lockdownExpires && now > tracker.lockdownExpires) {
                            await redis.del(key);
                        }
                    }
                }
            }

        } catch (error) {
            Logger.error(`Failed to cleanup raid protection trackers: ${error}`);
        }
    }
}
