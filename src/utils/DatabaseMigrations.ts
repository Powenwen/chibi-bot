import mongoose from 'mongoose';
import Logger from '../features/Logger';
import AutoReactionModel, { IEmojiReaction } from '../models/AutoReactionModel';
import AutoResponderModel from '../models/AutoResponderModel';
import StickyMessageModel from '../models/StickyMessageModel';
import WelcomeSystemModel from '../models/WelcomeSystemModel';
import SuggestionModel from '../models/SuggestionModel';
import SuggestionChannelModel from '../models/SuggestionChannelModel';

interface MigrationResult {
    success: boolean;
    message: string;
    migratedCount?: number;
    errorCount?: number;
}

export class DatabaseMigrations {
    /**
     * Run all database migrations
     */
    public static async runMigrations(): Promise<void> {
        try {
            Logger.info('🔄 Starting database migrations...');
            
            const migrations = [
                this.migrateAutoReactions(),
                this.migrateAutoResponders(),
                this.validateStickyMessages(),
                this.validateWelcomeSystems(),
                this.validateSuggestions(),
                this.validateSuggestionChannels()
            ];

            const results = await Promise.allSettled(migrations);
            
            let successCount = 0;
            let errorCount = 0;

            results.forEach((result, index) => {
                const migrationNames = [
                    'AutoReactions',
                    'AutoResponders',
                    'StickyMessages', 
                    'WelcomeSystems',
                    'Suggestions',
                    'SuggestionChannels'
                ];
                
                if (result.status === 'fulfilled' && result.value.success) {
                    Logger.success(`✅ ${migrationNames[index]}: ${result.value.message}`);
                    successCount++;
                } else {
                    const error = result.status === 'rejected' ? result.reason : result.value.message;
                    Logger.error(`❌ ${migrationNames[index]}: ${error}`);
                    errorCount++;
                }
            });

            if (errorCount === 0) {
                Logger.success(`🎉 Database migrations completed successfully! ${successCount} collections processed.`);
            } else {
                Logger.warn(`⚠️ Database migrations completed with ${errorCount} errors and ${successCount} successes.`);
            }
        } catch (error) {
            Logger.error(`Fatal error during database migrations: ${error}`);
            throw error;
        }
    }

    /**
     * Migrate old auto reaction format to new format
     */
    private static async migrateAutoReactions(): Promise<MigrationResult> {
        try {
            // Find all auto reactions with old format (emojis as string array)
            const oldFormatReactions = await AutoReactionModel.find({
                $or: [
                    { 'emojis.0': { $type: 'string' } }, // Old format: array of strings
                    { 'emojis': { $type: 'array', $not: { $elemMatch: { raw: { $exists: true } } } } }
                ]
            });

            if (oldFormatReactions.length === 0) {
                return {
                    success: true,
                    message: 'No auto reactions need migration',
                    migratedCount: 0
                };
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const reaction of oldFormatReactions) {
                try {
                    // Convert old emoji format to new format
                    const newEmojis: IEmojiReaction[] = [];
                    const oldEmojis = reaction.emojis as any[];

                    for (const emoji of oldEmojis) {
                        if (typeof emoji === 'string') {
                            // Check if it's a custom emoji
                            const customEmojiMatch = emoji.match(/<(a?):(.+?):(\d{17,19})>/);
                            
                            if (customEmojiMatch) {
                                // Custom emoji
                                const animated = customEmojiMatch[1] === 'a';
                                const name = customEmojiMatch[2];
                                const emojiId = customEmojiMatch[3];
                                
                                newEmojis.push({
                                    emojiID: emojiId,
                                    name,
                                    animated,
                                    isUnicode: false,
                                    raw: emoji
                                });
                            } else {
                                // Unicode emoji
                                newEmojis.push({
                                    name: emoji,
                                    animated: false,
                                    isUnicode: true,
                                    raw: emoji
                                });
                            }
                        }
                    }

                    // Update the document with new format
                    await AutoReactionModel.updateOne(
                        { _id: reaction._id },
                        { 
                            $set: { 
                                emojis: newEmojis,
                                updatedAt: new Date(),
                                // Add authorID if missing
                                ...((!reaction.authorID) && { authorID: '0' })
                            }
                        }
                    );

                    migratedCount++;
                } catch (error) {
                    Logger.error(`Error migrating auto reaction ${reaction._id}: ${error}`);
                    errorCount++;
                }
            }

            return {
                success: errorCount === 0,
                message: `Migrated ${migratedCount} auto reactions${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
                migratedCount,
                errorCount
            };
        } catch (error) {
            return {
                success: false,
                message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Migrate auto responders to add embed support fields
     */
    private static async migrateAutoResponders(): Promise<MigrationResult> {
        try {
            // Find all auto responders without the new embed fields
            const responders = await AutoResponderModel.find({
                $or: [
                    { useEmbed: { $exists: false } },
                    { embedColor: { $exists: false } }
                ]
            });

            if (responders.length === 0) {
                return {
                    success: true,
                    message: 'No auto responders need migration',
                    migratedCount: 0
                };
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const responder of responders) {
                try {
                    await AutoResponderModel.updateOne(
                        { _id: responder._id },
                        { 
                            $set: { 
                                useEmbed: false,
                                embedColor: "#5865F2",
                                updatedAt: new Date()
                            }
                        }
                    );

                    migratedCount++;
                } catch (error) {
                    Logger.error(`Error migrating auto responder ${responder._id}: ${error}`);
                    errorCount++;
                }
            }

            return {
                success: errorCount === 0,
                message: `Migrated ${migratedCount} auto responders${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
                migratedCount,
                errorCount
            };
        } catch (error) {
            return {
                success: false,
                message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Validate sticky messages collection
     */
    private static async validateStickyMessages(): Promise<MigrationResult> {
        try {
            const count = await StickyMessageModel.countDocuments();
            
            // Add any necessary indexes
            await StickyMessageModel.collection.createIndex({ guildID: 1, channelID: 1 });
            await StickyMessageModel.collection.createIndex({ uniqueID: 1 }, { unique: true });
            
            return {
                success: true,
                message: `Validated ${count} sticky messages, indexes updated`,
                migratedCount: count
            };
        } catch (error) {
            return {
                success: false,
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Validate welcome systems collection
     */
    private static async validateWelcomeSystems(): Promise<MigrationResult> {
        try {
            const count = await WelcomeSystemModel.countDocuments();
            
            // Add any necessary indexes
            await WelcomeSystemModel.collection.createIndex({ guildID: 1 }, { unique: true });
            
            return {
                success: true,
                message: `Validated ${count} welcome systems, indexes updated`,
                migratedCount: count
            };
        } catch (error) {
            return {
                success: false,
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Validate suggestions collection
     */
    private static async validateSuggestions(): Promise<MigrationResult> {
        try {
            const count = await SuggestionModel.countDocuments();
            
            // Add any necessary indexes
            await SuggestionModel.collection.createIndex({ guildID: 1, suggestionID: 1 });
            await SuggestionModel.collection.createIndex({ authorID: 1 });
            await SuggestionModel.collection.createIndex({ status: 1 });
            
            return {
                success: true,
                message: `Validated ${count} suggestions, indexes updated`,
                migratedCount: count
            };
        } catch (error) {
            return {
                success: false,
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Validate suggestion channels collection
     */
    private static async validateSuggestionChannels(): Promise<MigrationResult> {
        try {
            const count = await SuggestionChannelModel.countDocuments();
            
            // Add any necessary indexes
            await SuggestionChannelModel.collection.createIndex({ guildID: 1 }, { unique: true });
            
            return {
                success: true,
                message: `Validated ${count} suggestion channels, indexes updated`,
                migratedCount: count
            };
        } catch (error) {
            return {
                success: false,
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Create all necessary database indexes for optimal performance
     */
    public static async createIndexes(): Promise<void> {
        try {
            Logger.info('🔍 Creating database indexes...');
            
            // Auto Reactions indexes
            await AutoReactionModel.collection.createIndex({ guildID: 1, channelID: 1 }, { unique: true });
            await AutoReactionModel.collection.createIndex({ authorID: 1 });
            
            // Auto Responders indexes
            await AutoResponderModel.collection.createIndex({ guildID: 1, channelID: 1, trigger: 1 }, { unique: true });
            await AutoResponderModel.collection.createIndex({ authorID: 1 });
            
            Logger.success('✅ Database indexes created successfully');
        } catch (error) {
            Logger.error(`Error creating database indexes: ${error}`);
            // Don't throw here as this is not critical for startup
        }
    }

    /**
     * Get migration status and statistics
     */
    public static async getMigrationStats(): Promise<any> {
        try {
            const collections = await mongoose.connection.db?.collections();
            const stats: any = {};
            
            if (collections) {
                for (const collection of collections) {
                    const name = collection.collectionName;
                    const count = await collection.countDocuments();
                    const indexes = await collection.indexes();
                    
                    stats[name] = {
                        documentCount: count,
                        indexCount: indexes.length,
                        indexes: indexes.map((idx: any) => idx.name || 'unnamed')
                    };
                }
            }
            
            return stats;
        } catch (error) {
            Logger.error(`Error getting migration stats: ${error}`);
            return {};
        }
    }
}