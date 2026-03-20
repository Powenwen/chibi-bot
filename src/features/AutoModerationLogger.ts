import { Guild, TextChannel, EmbedBuilder, ColorResolvable, Message, User } from "discord.js";
import ModerationLogModel from "../models/ModerationLogModel";
import Logger from "./Logger";
import { redis } from "./RedisDB";

interface AutoModAction {
    guildId: string;
    userId: string;
    username: string;
    action: string;
    filter: string;
    reason: string;
    content?: string;
    channelId: string;
    channelName: string;
    timestamp: Date;
    responseTime?: number;
}

export default class AutoModerationLogger {
    private static readonly LOG_BUFFER_SIZE = 10;
    private static readonly REDIS_STATS_PREFIX = 'automod_stats';
    private static logBuffer = new Map<string, AutoModAction[]>();

    /**
     * Log an auto-moderation action
     */
    static async logAction(
        guild: Guild, 
        user: User, 
        message: Message, 
        filter: string, 
        action: string, 
        reason: string,
        responseTime?: number
    ): Promise<void> {
        try {
            const logData: AutoModAction = {
                guildId: guild.id,
                userId: user.id,
                username: user.tag,
                action,
                filter,
                reason,
                content: message.content.length > 100 ? 
                    message.content.substring(0, 97) + '...' : 
                    message.content,
                channelId: message.channel.id,
                channelName: (message.channel as TextChannel).name,
                timestamp: new Date(),
                responseTime
            };

            // Buffer logs for batch processing
            await this.bufferLog(guild.id, logData);

            // Update daily statistics
            await this.updateDailyStats(guild.id, filter, responseTime, user.id);

            // Send to Discord log channel if configured
            await this.sendToLogChannel(guild, logData);

        } catch (error) {
            Logger.error(`Failed to log auto-moderation action: ${error}`);
        }
    }

    /**
     * Buffer logs for batch processing
     */
    private static async bufferLog(guildId: string, logData: AutoModAction): Promise<void> {
        try {
            if (!this.logBuffer.has(guildId)) {
                this.logBuffer.set(guildId, []);
            }

            const buffer = this.logBuffer.get(guildId)!;
            buffer.push(logData);

            // Flush buffer when it reaches the limit
            if (buffer.length >= this.LOG_BUFFER_SIZE) {
                await this.flushLogBuffer(guildId);
            }

        } catch (error) {
            Logger.error(`Failed to buffer auto-mod log: ${error}`);
        }
    }

    /**
     * Flush log buffer to Redis
     */
    static async flushLogBuffer(guildId: string): Promise<void> {
        try {
            const buffer = this.logBuffer.get(guildId);
            if (!buffer || buffer.length === 0) return;

            const key = `automod_logs:${guildId}:${Date.now()}`;
            await redis.setex(key, 86400 * 7, JSON.stringify(buffer)); // Keep for 7 days

            // Clear buffer
            this.logBuffer.set(guildId, []);

            Logger.debug(`Flushed ${buffer.length} auto-mod logs for guild ${guildId}`);

        } catch (error) {
            Logger.error(`Failed to flush auto-mod log buffer: ${error}`);
        }
    }

    /**
     * Update daily statistics
     */
    private static async updateDailyStats(guildId: string, filter: string, responseTime?: number, userId?: string): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const statsKey = `${this.REDIS_STATS_PREFIX}:${guildId}:${today}`;

            const pipeline = redis.pipeline();
            pipeline.hincrby(statsKey, 'totalActions', 1);
            pipeline.hincrby(statsKey, `filter_${filter}`, 1);
            
            if (responseTime !== undefined) {
                pipeline.hincrby(statsKey, 'totalResponseTime', responseTime);
                pipeline.hincrby(statsKey, 'responseTimeCount', 1);
            }

            if (userId) {
                pipeline.sadd(`${statsKey}:users`, userId);
            }

            pipeline.expire(statsKey, 86400 * 30); // Keep for 30 days
            if (userId) {
                pipeline.expire(`${statsKey}:users`, 86400 * 30);
            }

            await pipeline.exec();

        } catch (error) {
            Logger.error(`Failed to update daily auto-mod stats: ${error}`);
        }
    }

    /**
     * Send log to Discord channel
     */
    private static async sendToLogChannel(guild: Guild, logData: AutoModAction): Promise<void> {
        try {
            const logSettings = await ModerationLogModel.findOne({ guildID: guild.id });
            
            // Check if auto-mod logging is enabled and channel is set
            if (!logSettings?.autoModLog?.enabled || !logSettings.autoModLog.channelID) {
                return;
            }

            const logChannel = guild.channels.cache.get(logSettings.autoModLog.channelID) as TextChannel;
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Auto-Moderation Action')
                .setColor(this.getFilterColor(logData.filter) as ColorResolvable)
                .addFields(
                    { name: 'Filter', value: this.formatFilterName(logData.filter), inline: true },
                    { name: 'Action', value: logData.action.toUpperCase(), inline: true },
                    { name: 'User', value: `${logData.username} (${logData.userId})`, inline: true },
                    { name: 'Channel', value: `#${logData.channelName}`, inline: true },
                    { name: 'Reason', value: logData.reason, inline: false }
                )
                .setTimestamp(logData.timestamp)
                .setFooter({ text: `Auto-Moderation System` });

            if (logData.content) {
                embed.addFields({ name: 'Content', value: `\`\`\`${logData.content}\`\`\``, inline: false });
            }

            if (logData.responseTime) {
                embed.addFields({ name: 'Response Time', value: `${logData.responseTime}ms`, inline: true });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Failed to send auto-mod log to Discord: ${error}`);
        }
    }

    /**
     * Get color for different filters
     */
    private static getFilterColor(filter: string): string {
        const colors = {
            antiSpam: '#FF6B6B',
            wordFilter: '#FF4444',
            linkFilter: '#FFA500',
            duplicateFilter: '#9B59B6',
            capsFilter: '#3498DB'
        };
        return colors[filter as keyof typeof colors] || '#808080';
    }

    /**
     * Format filter name for display
     */
    private static formatFilterName(filter: string): string {
        const names = {
            antiSpam: 'Anti-Spam',
            wordFilter: 'Word Filter',
            linkFilter: 'Link Filter',
            duplicateFilter: 'Duplicate Filter',
            capsFilter: 'Caps Filter'
        };
        return names[filter as keyof typeof names] || filter;
    }

    /**
     * Get auto-moderation statistics for a guild
     */
    static async getStatistics(guildId: string, days: number = 7): Promise<any> {
        try {
            const stats = [];
            const today = new Date();

            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const statsKey = `${this.REDIS_STATS_PREFIX}:${guildId}:${dateStr}`;

                const dayStats = await redis.hgetall(statsKey);
                const uniqueUsers = await redis.scard(`${statsKey}:users`);

                if (Object.keys(dayStats).length > 0) {
                    const totalActions = parseInt(dayStats.totalActions || '0');
                    const totalResponseTime = parseInt(dayStats.totalResponseTime || '0');
                    const responseTimeCount = parseInt(dayStats.responseTimeCount || '0');

                    stats.push({
                        date: dateStr,
                        totalActions,
                        uniqueUsers,
                        averageResponseTime: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
                        filterBreakdown: {
                            antiSpam: parseInt(dayStats.filter_antiSpam || '0'),
                            wordFilter: parseInt(dayStats.filter_wordFilter || '0'),
                            linkFilter: parseInt(dayStats.filter_linkFilter || '0'),
                            duplicateFilter: parseInt(dayStats.filter_duplicateFilter || '0'),
                            capsFilter: parseInt(dayStats.filter_capsFilter || '0')
                        }
                    });
                }
            }

            return stats.reverse(); // Most recent first

        } catch (error) {
            Logger.error(`Failed to get auto-mod statistics: ${error}`);
            return [];
        }
    }

    /**
     * Get recent auto-moderation logs
     */
    static async getRecentLogs(guildId: string, limit: number = 50): Promise<AutoModAction[]> {
        try {
            const pattern = `automod_logs:${guildId}:*`;
            const keys = await redis.keys(pattern);
            
            // Sort keys by timestamp (newest first)
            keys.sort((a, b) => {
                const timestampA = parseInt(a.split(':').pop() || '0');
                const timestampB = parseInt(b.split(':').pop() || '0');
                return timestampB - timestampA;
            });

            const logs: AutoModAction[] = [];
            
            for (const key of keys.slice(0, Math.ceil(limit / this.LOG_BUFFER_SIZE))) {
                const logData = await redis.get(key);
                if (logData) {
                    const parsedLogs = JSON.parse(logData) as AutoModAction[];
                    logs.push(...parsedLogs);
                }
            }

            return logs.slice(0, limit);

        } catch (error) {
            Logger.error(`Failed to get recent auto-mod logs: ${error}`);
            return [];
        }
    }

    /**
     * Flush all pending log buffers (called on shutdown)
     */
    static async flushAllBuffers(): Promise<void> {
        try {
            const flushPromises = Array.from(this.logBuffer.keys()).map(guildId => 
                this.flushLogBuffer(guildId)
            );
            await Promise.all(flushPromises);
        } catch (error) {
            Logger.error(`Failed to flush all auto-mod log buffers: ${error}`);
        }
    }
}

// Auto-flush buffers every 5 minutes
setInterval(async () => {
    for (const guildId of AutoModerationLogger['logBuffer'].keys()) {
        await AutoModerationLogger.flushLogBuffer(guildId);
    }
}, 5 * 60 * 1000);