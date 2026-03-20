import { DiscordAPIError, RepliableInteraction, MessageFlags, InteractionReplyOptions, Interaction, InteractionEditReplyOptions } from 'discord.js';
import { CustomError } from './CustomError';
import Logger from '../features/Logger';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

export interface ErrorContext {
    userId?: string;
    guildId?: string | null; // Guild ID can be null for DMs
    channelId?: string | null; // Channel ID can be null for DMs
    commandName?: string | null; // Command name can be null for non-command interactions
    feature?: string;
    metadata?: Record<string, unknown>;
}

export interface ErrorLog {
    id: string;
    timestamp: string;
    name: string;
    message: string;
    stack?: string | undefined;
    context: ErrorContext;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
    private static redis: Redis;
    private static readonly RETRY_ATTEMPTS = 3;
    private static readonly ERROR_TTL = 86400 * 7; // 7 days

    public static initialize(redisClient: Redis): void {
        this.redis = redisClient;
    }

    public static async handle(
        error: Error, 
        interaction?: Interaction, 
        context?: string | ErrorContext
    ): Promise<string> {
        try {
            const errorContext = this.normalizeContext(context, interaction);
            const errorId = await this.logError(error, errorContext);
            const repliableInteraction = interaction?.isRepliable() ? interaction : undefined;

            if (error instanceof CustomError) {
                await this.handleCustomError(error, repliableInteraction);
            } else if (error instanceof DiscordAPIError) {
                await this.handleDiscordError(error, repliableInteraction);
            } else {
                await this.handleUnknownError(error, repliableInteraction, errorId);
            }

            return errorId;
        } catch (handlingError) {
            Logger.error(`Error in error handler: ${handlingError}`);
            return 'error-handler-failed';
        }
    }

    private static normalizeContext(
        context?: string | ErrorContext, 
        interaction?: Interaction
    ): ErrorContext {
        const baseContext: ErrorContext = {};

        if (interaction) {
            baseContext.userId = interaction.user?.id;
            baseContext.guildId = interaction.guildId;
            baseContext.channelId = interaction.channelId;
            baseContext.commandName = interaction.isChatInputCommand() ? interaction.commandName : null;
        }

        if (typeof context === 'string') {
            baseContext.feature = context;
        } else if (context) {
            Object.assign(baseContext, context);
        }

        return baseContext;
    }

    private static async logError(error: Error, context: ErrorContext): Promise<string> {
        const errorId = randomBytes(8).toString('hex');
        const errorLog: ErrorLog = {
            id: errorId,
            timestamp: new Date().toISOString(),
            name: error.name,
            message: error.message,
            stack: error.stack,
            context,
            type: this.getErrorType(error),
            severity: this.getErrorSeverity(error)
        };

        // Combine Redis operations for better performance
        if (this.redis?.status === 'ready') {
            try {
                const pipeline = this.redis.pipeline();
                pipeline.setex(`error:${errorId}`, this.ERROR_TTL, JSON.stringify(errorLog));
                
                const patternKey = `error_pattern:${error.name}:${context.feature || 'unknown'}`;
                pipeline.incr(patternKey);
                pipeline.expire(patternKey, 3600);
                
                await pipeline.exec();
            } catch (redisError) {
                Logger.error(`Failed to store error in Redis: ${redisError instanceof Error ? redisError.message : String(redisError)}`);
            }
        }

        const contextStr = Object.entries(context)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${String(value)}`)
            .join(' ');

        Logger.error(`[${errorId}] [${errorLog.severity}] ${contextStr ? `[${contextStr}] ` : ''}${error.message}`);
        if (error.stack && errorLog.severity !== 'low') {
            Logger.error(error.stack);
        }

        return errorId;
    }



    private static getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
        if (error instanceof CustomError) return error.severity || 'medium';
        if (error instanceof DiscordAPIError) {
            const criticalCodes = [50001, 50013]; // Permission errors
            return criticalCodes.includes(error.code as number) ? 'high' : 'medium';
        }
        if (error.name.includes('Database') || error.name.includes('Redis') || error.name.includes('Mongo')) return 'critical';
        if (error.name.includes('Network') || error.name.includes('Timeout')) return 'high';
        return 'medium';
    }

    private static getErrorType(error: Error): string {
        if (error instanceof CustomError) return 'CustomError';
        if (error instanceof DiscordAPIError) return 'DiscordAPIError';
        if (error.name === 'ValidationError') return 'ValidationError';
        if (error.name === 'MongoError') return 'DatabaseError';
        return 'UnknownError';
    }

    private static async handleCustomError(error: CustomError, interaction?: RepliableInteraction): Promise<void> {
        if (interaction) {
            const message = error.userMessage || 'An error occurred while processing your request.';
            await this.replyToInteraction(interaction, {
                content: message,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    private static async handleDiscordError(error: DiscordAPIError, interaction?: RepliableInteraction): Promise<void> {
        const errorMessages: Record<number, string> = {
            50001: "Missing Access - The bot lacks necessary permissions.",
            50013: "Missing Permissions - The bot cannot perform this action.",
            50035: "Invalid Form Body - Some provided data was invalid.",
            10003: "Unknown Channel - The specified channel does not exist.",
            10004: "Unknown Guild - The specified server does not exist.",
            10013: "Unknown User - The specified user does not exist.",
            10062: "Unknown Interaction - The interaction has expired.",
            40060: "Interaction has already been acknowledged."
        };

        if (interaction) {
            const message = errorMessages[error.code as number] || `Discord API Error: ${error.message}`;
            await this.replyToInteraction(interaction, {
                content: message,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    private static async handleUnknownError(_error: Error, interaction?: RepliableInteraction, errorId?: string): Promise<void> {
        if (interaction) {
            const message = errorId 
                ? `An unexpected error occurred. Error ID: ${errorId}` 
                : 'An unexpected error occurred. Please try again later.';
            
            await this.replyToInteraction(interaction, {
                content: message,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    private static async replyToInteraction(interaction: RepliableInteraction, options: InteractionReplyOptions | InteractionEditReplyOptions): Promise<void> {
        try {
            if (interaction.replied || interaction.deferred) {
                // Use followUp for already replied interactions, editReply for deferred
                if (interaction.replied) {
                    await interaction.followUp(options as InteractionReplyOptions);
                } else {
                    await interaction.editReply(options as InteractionEditReplyOptions);
                }
            } else {
                await interaction.reply(options as InteractionReplyOptions);
            }
        } catch (replyError) {
            const errorMsg = replyError instanceof Error ? replyError.message : String(replyError);
            Logger.error(`Failed to reply to interaction: ${errorMsg}`);
            
            // Attempt fallback for critical cases
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'An error occurred processing your request.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (fallbackError) {
                Logger.error(`Fallback reply also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            }
        }
    }

    public static async handleAsyncOperation<T>(
        operation: () => Promise<T>,
        context: string,
        interaction?: Interaction
    ): Promise<T | null> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                Logger.warn(`Attempt ${attempt}/${this.RETRY_ATTEMPTS} failed for ${context}: ${error}`);
                
                if (attempt < this.RETRY_ATTEMPTS) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        // Handle the final error if all attempts failed
        if (lastError) {
            await this.handle(lastError, interaction, context);
        }
        
        return null;
    }

    public static async getErrorStats(_timeframe: number = 3600): Promise<Record<string, number>> {
        if (!this.redis?.status || this.redis.status !== 'ready') {
            Logger.warn('Redis client not available for error stats');
            return {};
        }

        try {
            const stats: Record<string, number> = {};
            let cursor = '0';
            
            do {
                const [newCursor, patterns] = await this.redis.scan(cursor, 'MATCH', 'error_pattern:*', 'COUNT', 100);
                cursor = newCursor;

                if (patterns.length > 0) {
                    const pipeline = this.redis.pipeline();
                    patterns.forEach(pattern => pipeline.get(pattern));
                    const results = await pipeline.exec();

                    patterns.forEach((pattern, index) => {
                        const result = results?.[index];
                        if (result?.[1]) {
                            const cleanPattern = pattern.replace('error_pattern:', '');
                            const count = parseInt(String(result[1]), 10);
                            if (!isNaN(count)) {
                                stats[cleanPattern] = count;
                            }
                        }
                    });
                }
            } while (cursor !== '0');

            return stats;
        } catch (error) {
            Logger.error(`Failed to get error stats: ${error instanceof Error ? error.message : String(error)}`);
            return {};
        }
    }
}