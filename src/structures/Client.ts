import { ActivityType, Client, Collection, GatewayIntentBits } from 'discord.js';
import { BaseCommand, BaseEvent, BaseButton, BaseModal, BaseSelectMenu } from '../interfaces';
import { connect } from 'mongoose';
import { redis } from '../features/RedisDB';

import CommandHandler from './CommandHandler';
import EventHandler from './EventHandler';
import InteractionHandler from './InteractionHandler';
import LegacyCommandHandler from './LegacyCommandHandler';
import { ActivityManager } from './ActivityManager';

import { guildID, owners } from '../config/config'

import Logger from '../features/Logger';

import "dotenv/config";
import { ConfigManager } from '../config/ConfigManager';
import { CacheManager } from '../utils/CacheManager';
import { ErrorHandler } from '../utils/ErrorHandler';
import { DatabaseMigrations } from '../utils/DatabaseMigrations';

/**
 * Optional dependencies for the ChibiClient, allowing for dependency injection.
 */
export interface ClientDependencies {
    configManager?: ConfigManager;
    cacheManager?: CacheManager;
    errorHandler?: typeof ErrorHandler;
}

/**
 * The main client class for the bot, extending discord.js's Client.
 * This class orchestrates all the bot's components, including command handling,
 * event processing, database connections, and more.
 * @extends {Client}
 */
export default class ChibiClient extends Client {
    /** A collection of all registered commands. */
    public commands: Collection<string, BaseCommand> = new Collection();
    /** A collection of all registered events. */
    public events: Collection<string, BaseEvent> = new Collection();
    /** A collection of all registered button interactions. */
    public buttons: Collection<string, BaseButton> = new Collection();
    /** A collection of all registered modal interactions. */
    public modals: Collection<string, BaseModal> = new Collection();
    /** A collection of all registered select menu interactions. */
    public selectMenus: Collection<string, BaseSelectMenu> = new Collection();

    /** Bot configuration, including owner IDs. */
    public config: { owners: string[] } = { owners };
    /** A map to track message counts, primarily for anti-spam. */
    public messageCountMap: Map<string, number> = new Map();
    /** The Redis client instance. */
    public redis: typeof redis = redis;
    /** Manages the bot's presence and activity rotation. */
    public activityManager: ActivityManager;

    private commandHandler: CommandHandler;
    private eventHandler: EventHandler;
    private interactionHandler: InteractionHandler;
    private legacyCommandHandler: LegacyCommandHandler;
    private configManager: ConfigManager;
    private cacheManager: CacheManager;
    private isShuttingDown = false;
    private healthCheckInterval?: NodeJS.Timeout;

    /**
     * @param dependencies Optional dependencies for testing purposes.
     */
    constructor(dependencies?: ClientDependencies) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            allowedMentions: { parse: ["users", "roles"], repliedUser: true },
            shards: "auto",
            presence: {
                status: "online",
                activities: [
                    {
                        name: "over Chibimation Server!",
                        type: ActivityType.Watching // Watching
                    }
                ]
            }
        });

        this.configManager = dependencies?.configManager || ConfigManager.getInstance();
        this.cacheManager = dependencies?.cacheManager || CacheManager.getInstance();
        this.commandHandler = new CommandHandler(this);
        this.eventHandler = new EventHandler(this);
        this.interactionHandler = new InteractionHandler(this);
        this.legacyCommandHandler = new LegacyCommandHandler(this);
        this.activityManager = new ActivityManager(this);

        this.setupErrorHandlers();
        this.setupGracefulShutdown();

    }

    /**
     * Sets up global error handlers for uncaught exceptions and unhandled rejections.
     */
    private setupErrorHandlers(): void {
        process.on('unhandledRejection', async (reason, promise) => {
            const error = reason instanceof Error ? reason : new Error(String(reason));
            await ErrorHandler.handle(error, undefined, {
                feature: 'unhandled-rejection',
                metadata: { promise: promise.toString() }
            });
        });

        process.on('uncaughtException', async (error) => {
            await ErrorHandler.handle(error, undefined, {
                feature: 'uncaught-exception',
                metadata: { fatal: true }
            });
            process.exit(1);
        });

        this.on('error', async (error) => {
            await ErrorHandler.handle(error, undefined, { feature: 'discord-client' });
        });
    }

    /**
     * Sets up listeners for process signals to ensure a graceful shutdown.
     */
    private setupGracefulShutdown(): void {
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                if (this.isShuttingDown) return;
                
                Logger.info(`Received ${signal}, initiating graceful shutdown...`);
                await this.shutdown();
                process.exit(0);
            });
        });
    }

    /**
     * Performs a graceful shutdown of the bot, disconnecting from databases and Discord.
     */
    private async shutdown(): Promise<void> {
        this.isShuttingDown = true;
        
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }

            this.activityManager.stopRotation();
            this.destroy();
            Logger.info('Discord client destroyed');

            try {
                await this.redis.disconnect();
                Logger.info('Redis disconnected');
            } catch (redisError) {
                Logger.error(`Error disconnecting Redis: ${redisError}`);
            }

            Logger.success('Graceful shutdown completed');
        } catch (error) {
            Logger.error(`Error during shutdown: ${error}`);
        }
    }

    /**
     * Starts a periodic health check to monitor bot status and resource usage.
     */
    private startHealthChecks(): void {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const stats = this.getStats();
                const errorStats = await ErrorHandler.getErrorStats();
                
                const memoryMB = Math.round(stats.memoryUsage.heapUsed / 1024 / 1024);
                Logger.info(`Health Check - Guilds: ${stats.guilds}, Memory: ${memoryMB}MB, Ready: ${stats.ready}`);
                
                const totalErrors = Object.values(errorStats).reduce((sum, count) => sum + count, 0);
                if (totalErrors > 50) { // Threshold
                    Logger.warn(`High error rate detected: ${totalErrors} errors in last hour`);
                }
            } catch (error) {
                Logger.error(`Health check failed: ${error}`);
            }
        }, 300000); // 5 minutes
    }

    /**
     * Starts the bot. This includes connecting to databases, loading all components,
     * registering commands, and logging in to Discord.
     */
    public async start(): Promise<void> {
        try {
            const config = this.configManager.getConfig();
            
            ErrorHandler.initialize(this.cacheManager["redis"])
            
            await this.connectDatabase();
            await this.runDatabaseMigrations();
            await this.loadComponents();
            await this.registerCommands();
            await this.login(config.token);
            
            this.startHealthChecks();
            
            Logger.success("Bot successfully started!");

            this.activityManager.startRotation();
            
        } catch (error) {
            Logger.error(`Failed to start bot: ${error}`);
            await ErrorHandler.handle(error as Error, undefined, {
                feature: 'bot-startup',
                metadata: { fatal: true }
            });
            process.exit(1);
        }
    }

    /**
     * Registers application commands either globally or for a specific guild.
     */
    private async registerCommands(): Promise<void> {
        try {
            const useGuildCommands = process.env.USE_GUILD_COMMANDS === 'true';
            const targetGuildId = process.env.TARGET_GUILD_ID || guildID;
            const forceRegister = process.env.FORCE_REGISTER_COMMANDS === 'true';
            
            if (useGuildCommands) {
                Logger.info(`Using guild-specific commands for guild ${targetGuildId}`);
                await this.commandHandler.registerCommands('guild', targetGuildId, forceRegister);
            } else {
                const needsRegistration = forceRegister || await this.commandHandler.needsRegistration('global');
                
                if (needsRegistration) {
                    Logger.info("Registering commands globally");
                    await this.commandHandler.registerCommands('global');
                } else {
                    Logger.info("Global commands are already registered, skipping registration");
                }
            }
        } catch (error) {
            Logger.error(`Error registering commands: ${error}`);
            throw error; // Let the calling function handle this
        }
    }

    /**
     * Loads all bot components (commands, events, interactions).
     */
    private async loadComponents(): Promise<void> {
        try {
            this.commandHandler.loadCommands();
            await this.legacyCommandHandler.loadCommands('./src/legacyCommands');
            this.eventHandler.loadEvents();
            this.interactionHandler.loadButtons();
            this.interactionHandler.loadModals();
            this.interactionHandler.loadSelectMenus();
            
            Logger.success("All components loaded successfully");
        } catch (error) {
            throw new Error(`Failed to load components: ${error}`);
        }
    }

    /**
     * Connects to MongoDB and Redis databases.
     */
    private async connectDatabase(): Promise<void> {
        const config = this.configManager.getConfig();
        
        const connectMongo = async () => {
            await connect(config.database.mongodb.uri, {
                dbName: config.database.mongodb.dbName,
                bufferCommands: false,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                retryWrites: true,
                retryReads: true,
            });
            
            await new Promise((resolve, reject) => {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState === 1) {
                    resolve(true);
                    return;
                }
                
                const timeout = setTimeout(() => {
                    reject(new Error('Database connection timeout'));
                }, 15000);
                
                const cleanup = () => clearTimeout(timeout);
                
                mongoose.connection.once('connected', () => {
                    cleanup();
                    resolve(true);
                });
                
                mongoose.connection.once('error', (err: Error) => {
                    cleanup();
                    reject(err);
                });
            });
            
            Logger.success(`Connected to MongoDB (${config.database.mongodb.dbName}).`);
        };

        const connectRedis = async () => {
            await this.redis.connect();
            Logger.success(`Connected to Redis (${config.database.redis.host}:${config.database.redis.port}).`);
        };

        await Promise.all([
            ErrorHandler.handleAsyncOperation(connectMongo, 'mongodb-connection'),
            ErrorHandler.handleAsyncOperation(connectRedis, 'redis-connection')
        ]);
    }

    /**
     * Runs database migrations to ensure schema compatibility
     */
    private async runDatabaseMigrations(): Promise<void> {
        try {
            Logger.info('🚀 Running database migrations...');
            
            // Run migrations
            await DatabaseMigrations.runMigrations();
            
            // Create indexes for performance
            await DatabaseMigrations.createIndexes();
            
            // Log migration statistics
            const stats = await DatabaseMigrations.getMigrationStats();
            Logger.info('📊 Database migration statistics:');
            Object.entries(stats).forEach(([collection, stat]: [string, any]) => {
                Logger.info(`  ${collection}: ${stat.documentCount} documents, ${stat.indexCount} indexes`);
            });
            
        } catch (error) {
            Logger.error(`Database migration failed: ${error}`);
            throw error; // This will prevent bot startup if migrations fail
        }
    }

    /**
     * Checks if the client is ready.
     * @returns True if the client is ready, otherwise false.
     */
    public isClientReady(): boolean {
        return this.isReady();
    }

    /**
     * Gets the legacy command handler instance.
     * @returns The legacy command handler.
     */
    public getLegacyCommandHandler(): LegacyCommandHandler {
        return this.legacyCommandHandler;
    }

    /**
     * Retrieves current statistics about the bot's operation.
     * @returns An object containing various bot statistics.
     */
    public getStats(): {
        commands: number;
        events: number;
        buttons: number;
        modals: number;
        selectMenus: number;
        guilds: number;
        users: number;
        uptime: number | null;
        memoryUsage: NodeJS.MemoryUsage;
        ready: boolean;
        health: boolean;
        shutdownInProgress: boolean;
    } {
        const isHealthy = this.isReady() && !this.isShuttingDown;
        
        return {
            commands: this.commands.size,
            events: this.events.size,
            buttons: this.buttons.size,
            modals: this.modals.size,
            selectMenus: this.selectMenus.size,
            guilds: this.guilds.cache.size,
            users: this.users.cache.size,
            uptime: this.uptime,
            memoryUsage: process.memoryUsage(),
            ready: this.isReady(),
            health: isHealthy,
            shutdownInProgress: this.isShuttingDown
        };
    }

}