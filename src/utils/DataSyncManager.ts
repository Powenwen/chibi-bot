import { CacheManager } from './CacheManager';
import Logger from '../features/Logger';
import { CacheKeys, CacheTTL, CachePatterns } from '../constants/CacheKeys';

// Import all models
import AutoReactionModel from '../models/AutoReactionModel';
import AutoResponderModel from '../models/AutoResponderModel';
import StickyMessageModel from '../models/StickyMessageModel';
import WelcomeSystemModel from '../models/WelcomeSystemModel';
import SuggestionModel from '../models/SuggestionModel';
import SuggestionChannelModel from '../models/SuggestionChannelModel';
import WarningEscalationModel from '../models/WarningEscalationModel';
import AutoModerationModel from '../models/AutoModerationModel';

export interface SyncResult {
    feature: string;
    success: boolean;
    itemsSynced: number;
    errors: number;
    duration: number;
}

export interface ValidationResult {
    feature: string;
    valid: boolean;
    issues: string[];
    cacheCount: number;
    dbCount: number;
}

/**
 * Manages synchronization between Redis cache and MongoDB database
 * Ensures data consistency and provides tools for cache management
 */
export class DataSyncManager {
    private static instance: DataSyncManager;
    private cache: CacheManager;

    private constructor() {
        this.cache = CacheManager.getInstance();
    }

    public static getInstance(): DataSyncManager {
        if (!DataSyncManager.instance) {
            DataSyncManager.instance = new DataSyncManager();
        }
        return DataSyncManager.instance;
    }

    /**
     * Rebuild all caches from database
     */
    public async rebuildAllCaches(): Promise<SyncResult[]> {
        Logger.info('🔄 Starting full cache rebuild...');
        const startTime = Date.now();

        const results = await Promise.allSettled([
            this.rebuildAutoReactionCache(),
            this.rebuildAutoResponderCache(),
            this.rebuildStickyMessageCache(),
            this.rebuildWelcomeSystemCache(),
            this.rebuildSuggestionCache(),
            this.rebuildModerationCache(),
        ]);

        const syncResults: SyncResult[] = results.map((result, index) => {
            const features = [
                'AutoReaction',
                'AutoResponder',
                'StickyMessage',
                'WelcomeSystem',
                'Suggestion',
                'Moderation',
            ];

            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                Logger.error(`Failed to rebuild ${features[index]} cache: ${result.reason}`);
                return {
                    feature: features[index],
                    success: false,
                    itemsSynced: 0,
                    errors: 1,
                    duration: 0,
                };
            }
        });

        const totalTime = Date.now() - startTime;
        const totalSynced = syncResults.reduce((acc, r) => acc + r.itemsSynced, 0);
        const totalErrors = syncResults.reduce((acc, r) => acc + r.errors, 0);

        Logger.success(
            `✅ Cache rebuild complete: ${totalSynced} items synced, ${totalErrors} errors in ${totalTime}ms`
        );

        return syncResults;
    }

    /**
     * Rebuild auto reaction cache
     */
    private async rebuildAutoReactionCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            const reactions = await AutoReactionModel.find({});
            const guildGroups = new Map<string, typeof reactions>();

            // Group by guild
            reactions.forEach(reaction => {
                if (!guildGroups.has(reaction.guildID)) {
                    guildGroups.set(reaction.guildID, []);
                }
                guildGroups.get(reaction.guildID)!.push(reaction);
            });

            // Cache each guild's reactions
            for (const [guildId, guildReactions] of guildGroups) {
                try {
                    await this.cache.set(
                        CacheKeys.autoReaction.all(guildId),
                        guildReactions,
                        CacheTTL.STANDARD
                    );
                    itemsSynced += guildReactions.length;
                } catch (error) {
                    Logger.error(`Error caching reactions for guild ${guildId}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'AutoReaction',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild auto reaction cache: ${error}`);
            return {
                feature: 'AutoReaction',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rebuild auto responder cache
     */
    private async rebuildAutoResponderCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            const responders = await AutoResponderModel.find({});
            const guildGroups = new Map<string, typeof responders>();

            // Group by guild
            responders.forEach(responder => {
                if (!guildGroups.has(responder.guildID)) {
                    guildGroups.set(responder.guildID, []);
                }
                guildGroups.get(responder.guildID)!.push(responder);
            });

            // Cache each guild's responders
            for (const [guildId, guildResponders] of guildGroups) {
                try {
                    await this.cache.set(
                        CacheKeys.autoResponder.all(guildId),
                        guildResponders,
                        CacheTTL.LONG
                    );
                    itemsSynced += guildResponders.length;
                } catch (error) {
                    Logger.error(`Error caching responders for guild ${guildId}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'AutoResponder',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild auto responder cache: ${error}`);
            return {
                feature: 'AutoResponder',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rebuild sticky message cache
     */
    private async rebuildStickyMessageCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            const messages = await StickyMessageModel.find({});
            const guildGroups = new Map<string, typeof messages>();

            // Group by guild
            messages.forEach(message => {
                if (!guildGroups.has(message.guildID)) {
                    guildGroups.set(message.guildID, []);
                }
                guildGroups.get(message.guildID)!.push(message);
            });

            // Cache each guild's messages
            for (const [guildId, guildMessages] of guildGroups) {
                try {
                    await this.cache.set(
                        CacheKeys.stickyMessage.all(guildId),
                        guildMessages,
                        CacheTTL.MEDIUM
                    );
                    itemsSynced += guildMessages.length;
                } catch (error) {
                    Logger.error(`Error caching sticky messages for guild ${guildId}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'StickyMessage',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild sticky message cache: ${error}`);
            return {
                feature: 'StickyMessage',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rebuild welcome system cache
     */
    private async rebuildWelcomeSystemCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            const welcomeSystems = await WelcomeSystemModel.find({});

            for (const system of welcomeSystems) {
                try {
                    await this.cache.set(
                        CacheKeys.welcomeSystem.config(system.guildID),
                        system,
                        CacheTTL.STANDARD
                    );
                    itemsSynced++;
                } catch (error) {
                    Logger.error(`Error caching welcome system for guild ${system.guildID}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'WelcomeSystem',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild welcome system cache: ${error}`);
            return {
                feature: 'WelcomeSystem',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rebuild suggestion cache
     */
    private async rebuildSuggestionCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            // Cache suggestion channels
            const channels = await SuggestionChannelModel.find({});
            for (const channel of channels) {
                try {
                    await this.cache.set(
                        CacheKeys.suggestion.channel(channel.guildID),
                        channel,
                        CacheTTL.STANDARD
                    );
                    itemsSynced++;
                } catch (error) {
                    Logger.error(`Error caching suggestion channel for guild ${channel.guildID}: ${error}`);
                    errors++;
                }
            }

            // Cache suggestions grouped by guild
            const suggestions = await SuggestionModel.find({});
            const guildGroups = new Map<string, typeof suggestions>();

            suggestions.forEach(suggestion => {
                if (!guildGroups.has(suggestion.guildID)) {
                    guildGroups.set(suggestion.guildID, []);
                }
                guildGroups.get(suggestion.guildID)!.push(suggestion);
            });

            for (const [guildId, guildSuggestions] of guildGroups) {
                try {
                    await this.cache.set(
                        CacheKeys.suggestion.all(guildId),
                        guildSuggestions,
                        CacheTTL.SHORT
                    );
                    itemsSynced += guildSuggestions.length;
                } catch (error) {
                    Logger.error(`Error caching suggestions for guild ${guildId}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'Suggestion',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild suggestion cache: ${error}`);
            return {
                feature: 'Suggestion',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rebuild moderation cache
     */
    private async rebuildModerationCache(): Promise<SyncResult> {
        const startTime = Date.now();
        let itemsSynced = 0;
        let errors = 0;

        try {
            // Cache auto-moderation configs
            const autoModConfigs = await AutoModerationModel.find({});
            for (const config of autoModConfigs) {
                try {
                    await this.cache.set(
                        CacheKeys.moderation.automod(config.guildID),
                        config,
                        CacheTTL.MEDIUM
                    );
                    itemsSynced++;
                } catch (error) {
                    Logger.error(`Error caching automod config for guild ${config.guildID}: ${error}`);
                    errors++;
                }
            }

            // Cache warning escalations
            const escalations = await WarningEscalationModel.find({});
            for (const escalation of escalations) {
                try {
                    await this.cache.set(
                        CacheKeys.moderation.escalation(escalation.guildID),
                        escalation,
                        CacheTTL.MEDIUM
                    );
                    itemsSynced++;
                } catch (error) {
                    Logger.error(`Error caching escalation for guild ${escalation.guildID}: ${error}`);
                    errors++;
                }
            }

            return {
                feature: 'Moderation',
                success: errors === 0,
                itemsSynced,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            Logger.error(`Failed to rebuild moderation cache: ${error}`);
            return {
                feature: 'Moderation',
                success: false,
                itemsSynced: 0,
                errors: 1,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Validate cache-database consistency
     */
    public async validateIntegrity(): Promise<ValidationResult[]> {
        Logger.info('🔍 Validating cache-database consistency...');

        const results: ValidationResult[] = [];

        // Validate auto reactions
        results.push(await this.validateAutoReactions());
        results.push(await this.validateAutoResponders());
        results.push(await this.validateStickyMessages());
        results.push(await this.validateWelcomeSystems());
        results.push(await this.validateSuggestions());

        const invalid = results.filter(r => !r.valid);
        if (invalid.length === 0) {
            Logger.success('✅ All cache data is consistent with database');
        } else {
            Logger.warn(`⚠️ Found inconsistencies in ${invalid.length} features`);
            invalid.forEach(result => {
                Logger.warn(`  - ${result.feature}: ${result.issues.join(', ')}`);
            });
        }

        return results;
    }

    private async validateAutoReactions(): Promise<ValidationResult> {
        try {
            const dbCount = await AutoReactionModel.countDocuments();
            const guilds = await AutoReactionModel.distinct('guildID');
            let cacheCount = 0;
            const issues: string[] = [];

            for (const guildId of guilds) {
                const cached = await this.cache.get(CacheKeys.autoReaction.all(guildId));
                if (cached) {
                    cacheCount += (cached as any[]).length;
                } else {
                    issues.push(`Missing cache for guild ${guildId}`);
                }
            }

            return {
                feature: 'AutoReaction',
                valid: issues.length === 0 && dbCount === cacheCount,
                issues,
                cacheCount,
                dbCount,
            };
        } catch (error) {
            return {
                feature: 'AutoReaction',
                valid: false,
                issues: [`Validation error: ${error}`],
                cacheCount: 0,
                dbCount: 0,
            };
        }
    }

    private async validateAutoResponders(): Promise<ValidationResult> {
        try {
            const dbCount = await AutoResponderModel.countDocuments();
            const guilds = await AutoResponderModel.distinct('guildID');
            let cacheCount = 0;
            const issues: string[] = [];

            for (const guildId of guilds) {
                const cached = await this.cache.get(CacheKeys.autoResponder.all(guildId));
                if (cached) {
                    cacheCount += (cached as any[]).length;
                } else {
                    issues.push(`Missing cache for guild ${guildId}`);
                }
            }

            return {
                feature: 'AutoResponder',
                valid: issues.length === 0 && dbCount === cacheCount,
                issues,
                cacheCount,
                dbCount,
            };
        } catch (error) {
            return {
                feature: 'AutoResponder',
                valid: false,
                issues: [`Validation error: ${error}`],
                cacheCount: 0,
                dbCount: 0,
            };
        }
    }

    private async validateStickyMessages(): Promise<ValidationResult> {
        try {
            const dbCount = await StickyMessageModel.countDocuments();
            const guilds = await StickyMessageModel.distinct('guildID');
            let cacheCount = 0;
            const issues: string[] = [];

            for (const guildId of guilds) {
                const cached = await this.cache.get(CacheKeys.stickyMessage.all(guildId));
                if (cached) {
                    cacheCount += (cached as any[]).length;
                } else {
                    issues.push(`Missing cache for guild ${guildId}`);
                }
            }

            return {
                feature: 'StickyMessage',
                valid: issues.length === 0 && dbCount === cacheCount,
                issues,
                cacheCount,
                dbCount,
            };
        } catch (error) {
            return {
                feature: 'StickyMessage',
                valid: false,
                issues: [`Validation error: ${error}`],
                cacheCount: 0,
                dbCount: 0,
            };
        }
    }

    private async validateWelcomeSystems(): Promise<ValidationResult> {
        try {
            const dbCount = await WelcomeSystemModel.countDocuments();
            const guilds = await WelcomeSystemModel.distinct('guildID');
            let cacheCount = 0;
            const issues: string[] = [];

            for (const guildId of guilds) {
                const cached = await this.cache.get(CacheKeys.welcomeSystem.config(guildId));
                if (cached) {
                    cacheCount++;
                } else {
                    issues.push(`Missing cache for guild ${guildId}`);
                }
            }

            return {
                feature: 'WelcomeSystem',
                valid: issues.length === 0 && dbCount === cacheCount,
                issues,
                cacheCount,
                dbCount,
            };
        } catch (error) {
            return {
                feature: 'WelcomeSystem',
                valid: false,
                issues: [`Validation error: ${error}`],
                cacheCount: 0,
                dbCount: 0,
            };
        }
    }

    private async validateSuggestions(): Promise<ValidationResult> {
        try {
            const dbCount = await SuggestionModel.countDocuments();
            const guilds = await SuggestionModel.distinct('guildID');
            let cacheCount = 0;
            const issues: string[] = [];

            for (const guildId of guilds) {
                const cached = await this.cache.get(CacheKeys.suggestion.all(guildId));
                if (cached) {
                    cacheCount += (cached as any[]).length;
                } else {
                    issues.push(`Missing cache for guild ${guildId}`);
                }
            }

            return {
                feature: 'Suggestion',
                valid: issues.length === 0 && dbCount === cacheCount,
                issues,
                cacheCount,
                dbCount,
            };
        } catch (error) {
            return {
                feature: 'Suggestion',
                valid: false,
                issues: [`Validation error: ${error}`],
                cacheCount: 0,
                dbCount: 0,
            };
        }
    }

    /**
     * Clear all caches for a specific guild
     */
    public async clearGuildCache(guildId: string): Promise<number> {
        try {
            const pattern = CachePatterns.guild.pattern(guildId);
            const cleared = await this.cache.clear(pattern);
            Logger.info(`Cleared ${cleared} cache keys for guild ${guildId}`);
            return cleared;
        } catch (error) {
            Logger.error(`Failed to clear guild cache: ${error}`);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    public async getCacheStats(): Promise<any> {
        return await this.cache.getStats();
    }
}
