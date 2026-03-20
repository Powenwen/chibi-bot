import { Message, GuildMember } from "discord.js";
import { redis } from "./RedisDB";
import Logger from "./Logger";
import ModerationSystem from "./ModerationSystem";
import AntiSpam from "./AntiSpam";
import WordFilter from "./WordFilter";
import LinkFilter from "./LinkFilter";
import DuplicateFilter from "./DuplicateFilter";
import { IAutoModeration } from "../models/AutoModerationModel";

interface ModerationMetrics {
    totalChecks: number;
    triggeredActions: number;
    avgResponseTime: number;
    filterBreakdown: {
        antiSpam: number;
        wordFilter: number;
        linkFilter: number;
        duplicateFilter: number;
        capsFilter: number;
    };
}

export default class AutoModerationManager {
    private static metricsCache = new Map<string, ModerationMetrics>();

    /**
     * Main entry point for auto-moderation checks
     * Processes all filters in parallel for optimal performance
     */
    static async processMessage(message: Message): Promise<boolean> {
        if (!message.guild || !message.member || message.author.bot) return false;

        const startTime = Date.now();
        const guildId = message.guild.id;

        try {
            // Get settings once and cache for all filters
            const settings = await this.getCachedSettings(guildId);
            if (!settings || !settings.enabled) return false;

            // Check if user has global bypass permissions
            if (this.hasGlobalBypass(message.member)) return false;

            // Run all moderation checks in parallel for better performance
            const moderationResults = await Promise.allSettled([
                this.checkAntiSpam(message, settings),
                this.checkWordFilter(message, settings),
                this.checkLinkFilter(message, settings),
                this.checkDuplicateFilter(message, settings),
                this.checkCapsFilter(message, settings)
            ]);

            // Process results and track metrics
            const triggered = this.processResults(moderationResults, guildId);
            
            // Track performance metrics
            await this.trackMetrics(guildId, Date.now() - startTime, triggered);

            return triggered.length > 0;

        } catch (error) {
            Logger.error(`Auto-moderation error for guild ${guildId}: ${error}`);
            return false;
        }
    }

    /**
     * Get cached settings with fallback to database
     */
    private static async getCachedSettings(guildId: string): Promise<IAutoModeration | null> {
        return await ModerationSystem.getAutoModSettings(guildId);
    }

    /**
     * Check for global bypass permissions
     */
    private static hasGlobalBypass(member: GuildMember): boolean {
        return member.permissions.has("Administrator") || 
               member.permissions.has("ManageMessages") ||
               member.permissions.has("ModerateMembers");
    }

    /**
     * Enhanced anti-spam check with Redis-based tracking
     */
    private static async checkAntiSpam(message: Message, settings: IAutoModeration): Promise<string | null> {
        if (!settings.antiSpam.enabled) return null;

        try {
            const result = await AntiSpam.checkMessage(message);
            return result ? 'antiSpam' : null;
        } catch (error) {
            Logger.error(`Anti-spam check failed: ${error}`);
            return null;
        }
    }

    /**
     * Enhanced word filter check
     */
    private static async checkWordFilter(message: Message, settings: IAutoModeration): Promise<string | null> {
        if (!settings.wordFilter.enabled) return null;

        try {
            const result = await WordFilter.checkMessage(message);
            return result ? 'wordFilter' : null;
        } catch (error) {
            Logger.error(`Word filter check failed: ${error}`);
            return null;
        }
    }

    /**
     * Enhanced link filter check
     */
    private static async checkLinkFilter(message: Message, settings: IAutoModeration): Promise<string | null> {
        if (!settings.linkFilter.enabled) return null;

        try {
            const result = await LinkFilter.checkMessage(message);
            return result ? 'linkFilter' : null;
        } catch (error) {
            Logger.error(`Link filter check failed: ${error}`);
            return null;
        }
    }

    /**
     * Enhanced duplicate filter check
     */
    private static async checkDuplicateFilter(message: Message, settings: IAutoModeration): Promise<string | null> {
        if (!settings.duplicateFilter.enabled) return null;

        try {
            const result = await DuplicateFilter.checkMessage(message);
            return result ? 'duplicateFilter' : null;
        } catch (error) {
            Logger.error(`Duplicate filter check failed: ${error}`);
            return null;
        }
    }

    /**
     * New caps filter implementation
     */
    private static async checkCapsFilter(message: Message, settings: IAutoModeration): Promise<string | null> {
        if (!settings.caps?.enabled) return null;

        try {
            const { percentage, minLength, action } = settings.caps;
            const content = message.content;

            // Skip short messages
            if (content.length < minLength) return null;

            // Calculate caps percentage
            const uppercaseCount = (content.match(/[A-Z]/g) || []).length;
            const capsPercentage = (uppercaseCount / content.length) * 100;

            if (capsPercentage >= percentage) {
                await this.handleCapsViolation(message, action);
                return 'capsFilter';
            }

            return null;
        } catch (error) {
            Logger.error(`Caps filter check failed: ${error}`);
            return null;
        }
    }

    /**
     * Handle caps filter violations
     */
    private static async handleCapsViolation(message: Message, action: string): Promise<void> {
        try {
            // Delete the message
            await message.delete().catch(() => null);

            if (action === 'warn' && message.guild) {
                await ModerationSystem.createCase(
                    message.guild,
                    message.author,
                    message.client.user!,
                    "warn",
                    "Excessive use of capital letters"
                );
            }

            // Send temporary warning
            if (message.channel.isTextBased() && 'send' in message.channel) {
                const warningMessage = await message.channel.send({
                    content: `${message.author}, please avoid using excessive capital letters.`
                }).catch(() => null);

                if (warningMessage) {
                    setTimeout(async () => {
                        try {
                            await warningMessage.delete();
                        } catch {}
                    }, 5000);
                }
            }

        } catch (error) {
            Logger.error(`Failed to handle caps violation: ${error}`);
        }
    }

    /**
     * Process moderation results and track what was triggered
     */
    private static processResults(results: PromiseSettledResult<string | null>[], guildId: string): string[] {
        const triggered: string[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                triggered.push(result.value);
            } else if (result.status === 'rejected') {
                const filterNames = ['antiSpam', 'wordFilter', 'linkFilter', 'duplicateFilter', 'capsFilter'];
                Logger.error(`Auto-mod filter ${filterNames[index]} failed for guild ${guildId}: ${result.reason}`);
            }
        });

        return triggered;
    }

    /**
     * Track performance metrics
     */
    private static async trackMetrics(guildId: string, responseTime: number, triggeredFilters: string[]): Promise<void> {
        try {
            const metricsKey = `automod:metrics:${guildId}`;
            const dailyKey = `automod:daily:${guildId}:${new Date().toISOString().split('T')[0]}`;

            // Update in-memory metrics
            let metrics = this.metricsCache.get(guildId) || {
                totalChecks: 0,
                triggeredActions: 0,
                avgResponseTime: 0,
                filterBreakdown: {
                    antiSpam: 0,
                    wordFilter: 0,
                    linkFilter: 0,
                    duplicateFilter: 0,
                    capsFilter: 0
                }
            };

            metrics.totalChecks++;
            if (triggeredFilters.length > 0) {
                metrics.triggeredActions++;
            }

            // Update response time (rolling average)
            metrics.avgResponseTime = (metrics.avgResponseTime * (metrics.totalChecks - 1) + responseTime) / metrics.totalChecks;

            // Update filter breakdown
            triggeredFilters.forEach(filter => {
                if (filter in metrics.filterBreakdown) {
                    metrics.filterBreakdown[filter as keyof typeof metrics.filterBreakdown]++;
                }
            });

            this.metricsCache.set(guildId, metrics);

            // Store in Redis for persistence (every 10 checks to reduce overhead)
            if (metrics.totalChecks % 10 === 0) {
                await Promise.all([
                    redis.setex(metricsKey, 86400, JSON.stringify(metrics)), // 24 hours
                    redis.hincrby(dailyKey, 'checks', 10),
                    redis.hincrby(dailyKey, 'actions', triggeredFilters.length > 0 ? 1 : 0),
                    redis.expire(dailyKey, 86400 * 30) // 30 days
                ]);
            }

        } catch (error) {
            Logger.error(`Failed to track auto-mod metrics: ${error}`);
        }
    }

    /**
     * Get auto-moderation statistics for a guild
     */
    static async getStatistics(guildId: string): Promise<ModerationMetrics | null> {
        try {
            // Try in-memory cache first
            if (this.metricsCache.has(guildId)) {
                return this.metricsCache.get(guildId)!;
            }

            // Fall back to Redis
            const cached = await redis.get(`automod:metrics:${guildId}`);
            if (cached) {
                const metrics = JSON.parse(cached) as ModerationMetrics;
                this.metricsCache.set(guildId, metrics);
                return metrics;
            }

            return null;
        } catch (error) {
            Logger.error(`Failed to get auto-mod statistics: ${error}`);
            return null;
        }
    }

    /**
     * Reset statistics for a guild
     */
    static async resetStatistics(guildId: string): Promise<void> {
        try {
            this.metricsCache.delete(guildId);
            await redis.del(`automod:metrics:${guildId}`);
            
            // Clean up daily metrics for the past 30 days
            const promises = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dailyKey = `automod:daily:${guildId}:${date.toISOString().split('T')[0]}`;
                promises.push(redis.del(dailyKey));
            }
            await Promise.all(promises);

        } catch (error) {
            Logger.error(`Failed to reset auto-mod statistics: ${error}`);
        }
    }
}