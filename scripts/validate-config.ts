import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ConfigManager } from '../src/config/ConfigManager';

dotenv.config();

// Environment variable schema - updated to match ConfigManager
const envSchema = z.object({
    TOKEN: z.string().min(1, 'Discord bot token is required'),
    CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
    GUILD_ID: z.string().min(1, 'Discord guild ID is required'),
    MONGO_URI: z.string().url('Invalid MongoDB URI'),
    MONGO_DB_NAME: z.string().optional().default('chibibase'),
    REDIS_HOST: z.string().optional().default('localhost'),
    REDIS_PORT: z.string().regex(/^\d+$/, 'Redis port must be a number').optional().default('6379'),
    REDIS_PASSWORD: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
    // Feature flags
    ENABLE_WELCOME_SYSTEM: z.string().optional().default('false'),
    ENABLE_STICKY_MESSAGES: z.string().optional().default('false'),
    ENABLE_AUTO_REACTIONS: z.string().optional().default('false'),
    ENABLE_HEALTH_CHECKS: z.string().optional().default('true'),
    // Command registration and command prefix
    USE_GUILD_COMMANDS: z.string().optional(),
    TARGET_GUILD_ID: z.string().optional(),
    FORCE_REGISTER_COMMANDS: z.string().optional(),
    PREFIX: z.string().optional(),
    // Cache settings
    MESSAGE_CACHE_TTL: z.string().regex(/^\d+$/).optional(),
    USER_DATA_CACHE_TTL: z.string().regex(/^\d+$/).optional(),
    // Monitoring
    ERROR_THRESHOLD: z.string().regex(/^\d+$/).optional(),
    HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).optional()
});

class ConfigValidator {
    private errors: string[] = [];
    private warnings: string[] = [];

    validateEnvironment(): boolean {
        console.log('🔍 Validating environment variables...');
        
        try {
            const env = envSchema.parse(process.env);
            console.log('✅ Environment variables are valid');
            
            // Additional checks
            if (env.NODE_ENV === 'production' && !process.env.LOG_LEVEL) {
                this.warnings.push('LOG_LEVEL not set in production environment');
            }
            
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.log('❌ Environment validation failed:');
                error.errors.forEach(err => {
                    const message = `${err.path.join('.')}: ${err.message}`;
                    console.log(`   - ${message}`);
                    this.errors.push(message);
                });
            }
            return false;
        }
    }

    validateConfigManager(): boolean {
        console.log('🔍 Validating ConfigManager initialization...');
        
        try {
            const configManager = ConfigManager.getInstance();
            const config = configManager.getConfig();
            
            console.log('✅ ConfigManager successfully initialized');
            console.log(`   Environment: ${config.environment}`);
            console.log(`   MongoDB URI: ${config.database.mongodb.uri ? '✓' : '✗'}`);
            console.log(`   Redis Host: ${config.database.redis.host}`);
            console.log(`   Features enabled: ${Object.entries(config.features)
                .filter(([, enabled]) => enabled)
                .map(([feature]) => feature)
                .join(', ') || 'none'}`);
            
            return true;
        } catch (error) {
            const message = `ConfigManager validation failed: ${error instanceof Error ? error.message : String(error)}`;
            console.log(`❌ ${message}`);
            this.errors.push(message);
            return false;
        }
    }

    validateBotConfig(): boolean {
        console.log('🔍 Validating bot configuration...');
        
        try {
            const configPath = path.join(process.cwd(), 'src', 'config', 'config.ts');
            
            if (!fs.existsSync(configPath)) {
                this.errors.push('Bot config file not found at src/config/config.ts');
                return false;
            }

            // Since we can't easily import TypeScript files in this context,
            // we'll do basic file existence and syntax checks
            const configContent = fs.readFileSync(configPath, 'utf8');
            
            // Basic checks
            if (!configContent.includes('owners')) {
                this.errors.push('Bot config must export "owners" array');
            }
            
            if (!configContent.includes('guildID')) {
                this.warnings.push('guildID not found in config (optional for global commands)');
            }

            console.log('✅ Bot configuration file exists and has basic structure');
            return true;
        } catch (error) {
            const message = `Bot config validation failed: ${error instanceof Error ? error.message : String(error)}`;
            console.log(`❌ ${message}`);
            this.errors.push(message);
            return false;
        }
    }

    validateDirectoryStructure(): boolean {
        console.log('🔍 Validating directory structure...');
        
        const requiredDirs = [
            'src',
            'src/commands',
            'src/events',
            'src/structures',
            'src/utils',
            'src/config',
            'src/features'
        ];

        const requiredFiles = [
            'src/index.ts',
            'src/config/config.ts',
            'tsconfig.json',
            'package.json'
        ];

        let isValid = true;

        // Check directories
        for (const dir of requiredDirs) {
            const dirPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(dirPath)) {
                this.errors.push(`Required directory missing: ${dir}`);
                isValid = false;
            }
        }

        // Check files
        for (const file of requiredFiles) {
            const filePath = path.join(process.cwd(), file);
            if (!fs.existsSync(filePath)) {
                this.errors.push(`Required file missing: ${file}`);
                isValid = false;
            }
        }

        if (isValid) {
            console.log('✅ Directory structure is valid');
        } else {
            console.log('❌ Directory structure validation failed');
        }

        return isValid;
    }

    validatePackageJson(): boolean {
        console.log('🔍 Validating package.json...');
        
        try {
            const packagePath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            const requiredDeps = ['discord.js', 'mongoose', 'ioredis', 'dotenv', 'zod'];
            const requiredDevDeps = ['typescript', 'ts-node', '@types/node'];

            const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
            const missingDevDeps = requiredDevDeps.filter(dep => !packageJson.devDependencies?.[dep]);

            if (missingDeps.length > 0) {
                this.errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
            }

            if (missingDevDeps.length > 0) {
                this.warnings.push(`Missing dev dependencies: ${missingDevDeps.join(', ')}`);
            }

            if (missingDeps.length === 0) {
                console.log('✅ Package.json dependencies are valid');
                return true;
            } else {
                console.log('❌ Package.json validation failed');
                return false;
            }
        } catch (error) {
            const message = `Package.json validation failed: ${error instanceof Error ? error.message : String(error)}`;
            console.log(`❌ ${message}`);
            this.errors.push(message);
            return false;
        }
    }    async runValidation(): Promise<void> {
        console.log('🔧 Running configuration validation...\n');

        const results = [
            this.validateEnvironment(),
            this.validateConfigManager(),
            this.validateDirectoryStructure(),
            this.validatePackageJson(),
            this.validateBotConfig()
        ];

        const allValid = results.every(result => result);

        console.log('\n📋 Validation Summary:');
        console.log('======================');

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`   - ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`   - ${warning}`));
        }

        console.log('\n' + (allValid ? '🎉 Configuration is valid!' : '💥 Configuration validation failed!'));

        if (!allValid) {
            console.log('\nPlease fix the errors above before starting the bot.');
        }

        process.exit(allValid ? 0 : 1);
    }
}

// Run validation if this script is executed directly
if (require.main === module) {
    const validator = new ConfigValidator();
    validator.runValidation().catch((error) => {
        console.error('Validation script failed:', error);
        process.exit(1);
    });
}
