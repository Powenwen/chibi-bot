import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Schema for bot configuration
const BotConfigSchema = z.object({
    token: z.string().min(1, 'Bot token is required'),
    clientId: z.string().min(1, 'Client ID is required'),
    guildId: z.string().min(1, 'Guild ID is required'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
    database: z.object({
        mongodb: z.object({
            uri: z.string().url('Invalid MongoDB URI'),
            dbName: z.string().min(1, 'Database name is required').default('chibibase')
        }),
        redis: z.object({
            host: z.string().min(1, 'Redis host is required').default('localhost'),
            port: z.number().int().positive().default(6379),
            password: z.string().optional()
        })
    }),
    features: z.object({
        welcomeSystem: z.boolean().default(false),
        stickyMessages: z.boolean().default(false),
        autoReactions: z.boolean().default(false),
        healthChecks: z.boolean().default(true)
    }),
    cache: z.object({
        messageTTL: z.number().int().positive().default(3600),
        userDataTTL: z.number().int().positive().default(7200)
    }),
    monitoring: z.object({
        errorThreshold: z.number().int().positive().default(50),
        healthCheckInterval: z.number().int().positive().default(300000) // 5 minutes
    }).default({})
});

export type BotConfig = z.infer<typeof BotConfigSchema>;

export class ConfigManager {
    private static instance: ConfigManager;
    private config: BotConfig = {} as BotConfig;
    private configPath: string;

    private constructor() {
        this.configPath = this.determineConfigPath();
        this.loadConfig();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private determineConfigPath(): string {
        const env = process.env.NODE_ENV || 'development';
        const basePath = process.cwd();
        
        // Try environment-specific file first
        const envPath = path.join(basePath, `.env.${env}`);
        
        return envPath;
    }

    private loadConfig(): void {
        // Load environment variables
        dotenv.config({ path: this.configPath });
        
        // Fallback to .env if specific env file doesn't exist
        if (process.env.NODE_ENV) {
            dotenv.config({ path: path.join(process.cwd(), '.env') });
        }

        try {
            const rawConfig = {
                token: process.env.TOKEN,
                clientId: process.env.CLIENT_ID,
                guildId: process.env.GUILD_ID,
                environment: process.env.NODE_ENV,
                database: {
                    mongodb: {
                        uri: process.env.MONGO_URI,
                        dbName: process.env.MONGO_DB_NAME
                    },
                    redis: {
                        host: process.env.REDIS_HOST,
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
                        password: process.env.REDIS_PASSWORD
                    }
                },
                features: {
                    welcomeSystem: process.env.ENABLE_WELCOME_SYSTEM === 'true',
                    stickyMessages: process.env.ENABLE_STICKY_MESSAGES === 'true',
                    autoReactions: process.env.ENABLE_AUTO_REACTIONS === 'true',
                    healthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false'
                },
                cache: {
                    messageTTL: process.env.MESSAGE_CACHE_TTL ? parseInt(process.env.MESSAGE_CACHE_TTL) : undefined,
                    userDataTTL: process.env.USER_DATA_CACHE_TTL ? parseInt(process.env.USER_DATA_CACHE_TTL) : undefined
                },
                monitoring: {
                    errorThreshold: process.env.ERROR_THRESHOLD ? parseInt(process.env.ERROR_THRESHOLD) : undefined,
                    healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL) : undefined
                }
            };

            this.config = BotConfigSchema.parse(rawConfig);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => 
                    `${err.path.join('.')}: ${err.message}`
                ).join('\n');
                throw new Error(`Configuration validation failed:\n${errorMessages}`);
            }
            throw error;
        }
    }

    public getConfig(): BotConfig {
        return this.config;
    }

    public reloadConfig(): void {
        this.loadConfig();
    }

    public isFeatureEnabled(feature: keyof BotConfig['features']): boolean {
        return this.config.features[feature];
    }

    public isDevelopment(): boolean {
        return this.config.environment === 'development';
    }

    public isProduction(): boolean {
        return this.config.environment === 'production';
    }
}