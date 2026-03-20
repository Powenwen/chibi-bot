#!/usr/bin/env tsx

/**
 * CLI Management Tool for Chibi-bot
 * Provides utilities for cache, database, and system management
 * 
 * Usage:
 *   bun run cli cache:clear [pattern]
 *   bun run cli cache:rebuild
 *   bun run cli cache:stats
 *   bun run cli cache:validate
 *   bun run cli db:migrate
 *   bun run cli db:indexes
 *   bun run cli db:stats
 *   bun run cli health:check
 */

import { connect } from 'mongoose';
import { redis } from '../features/RedisDB';
import { ConfigManager } from '../config/ConfigManager';
import { CacheManager } from '../utils/CacheManager';
import { DataSyncManager } from '../utils/DataSyncManager';
import { DatabaseMigrations } from '../utils/DatabaseMigrations';
import Logger from '../features/Logger';

// Get command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

async function initialize(): Promise<void> {
    try {
        // Load configuration
        const config = ConfigManager.getInstance().getConfig();
        
        // Connect to MongoDB
        await connect(config.database.mongodb.uri, {
            dbName: config.database.mongodb.dbName,
        });
        Logger.success('✅ Connected to MongoDB');

        // Connect to Redis
        await redis.connect();
        Logger.success('✅ Connected to Redis');
    } catch (error) {
        Logger.error(`Failed to initialize: ${error}`);
        process.exit(1);
    }
}

async function cleanup(): Promise<void> {
    try {
        await redis.quit();
        Logger.info('Disconnected from Redis');
    } catch (error) {
        Logger.error(`Error during cleanup: ${error}`);
    }
}

// Command implementations
const commands = {
    'cache:clear': async () => {
        const pattern = args[0];
        const cache = CacheManager.getInstance();
        
        if (pattern) {
            Logger.info(`🧹 Clearing cache with pattern: ${pattern}`);
            const cleared = await cache.clear(pattern);
            Logger.success(`✅ Cleared ${cleared} cache keys`);
        } else {
            Logger.warn('⚠️  Clearing ALL cache data');
            await cache.clear();
            Logger.success('✅ All cache cleared');
        }
    },

    'cache:rebuild': async () => {
        Logger.info('🔄 Rebuilding all caches from database...');
        const syncManager = DataSyncManager.getInstance();
        const results = await syncManager.rebuildAllCaches();
        
        console.table(results.map(r => ({
            Feature: r.feature,
            Success: r.success ? '✅' : '❌',
            Items: r.itemsSynced,
            Errors: r.errors,
            Duration: `${r.duration}ms`,
        })));
    },

    'cache:stats': async () => {
        const cache = CacheManager.getInstance();
        const stats = await cache.getStats();
        
        console.log('\n📊 Cache Statistics:\n');
        console.table({
            'Status': stats.connected ? '✅ Connected' : '❌ Disconnected',
            'Memory Usage': stats.memoryUsage || 'N/A',
            'Total Keys': stats.totalKeys || 0,
            'Connected Clients': stats.connectedClients || 0,
            'Cache Hits': stats.hits || 0,
            'Cache Misses': stats.misses || 0,
            'Hit Rate': stats.hits && stats.misses 
                ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`
                : 'N/A',
        });
    },

    'cache:validate': async () => {
        Logger.info('🔍 Validating cache consistency...');
        const syncManager = DataSyncManager.getInstance();
        const results = await syncManager.validateIntegrity();
        
        console.log('\n📋 Validation Results:\n');
        console.table(results.map(r => ({
            Feature: r.feature,
            Valid: r.valid ? '✅' : '❌',
            'Cache Count': r.cacheCount,
            'DB Count': r.dbCount,
            'Issues': r.issues.length,
        })));

        results.forEach(r => {
            if (r.issues.length > 0) {
                console.log(`\n${r.feature} Issues:`);
                r.issues.forEach(issue => console.log(`  - ${issue}`));
            }
        });
    },

    'db:migrate': async () => {
        Logger.info('🔄 Running database migrations...');
        await DatabaseMigrations.runMigrations();
        await DatabaseMigrations.createIndexes();
    },

    'db:indexes': async () => {
        Logger.info('🔍 Creating database indexes...');
        await DatabaseMigrations.createIndexes();
        Logger.success('✅ Database indexes created');
    },

    'db:stats': async () => {
        Logger.info('📊 Fetching database statistics...');
        const stats = await DatabaseMigrations.getMigrationStats();
        
        console.log('\n📋 Database Collections:\n');
        for (const [collection, data] of Object.entries(stats)) {
            const collectionData = data as { documentCount: number; indexCount: number; indexes: string[] };
            console.log(`\n${collection}:`);
            console.log(`  Documents: ${collectionData.documentCount}`);
            console.log(`  Indexes: ${collectionData.indexCount}`);
            console.log(`  Index Names: ${collectionData.indexes.join(', ')}`);
        }
    },

    'health:check': async () => {
        Logger.info('🏥 Running health check...');
        
        const cache = CacheManager.getInstance();
        const cacheStats = await cache.getStats();
        
        console.log('\n🏥 System Health Report:\n');
        console.table({
            'MongoDB': '✅ Connected',
            'Redis': cacheStats.connected ? '✅ Connected' : '❌ Disconnected',
            'Cache Keys': cacheStats.totalKeys || 0,
            'Memory Usage': cacheStats.memoryUsage || 'N/A',
        });

        // Run validation
        const syncManager = DataSyncManager.getInstance();
        const validationResults = await syncManager.validateIntegrity();
        const allValid = validationResults.every(r => r.valid);
        
        if (allValid) {
            Logger.success('✅ All systems operational');
        } else {
            Logger.warn('⚠️  Some consistency issues detected');
        }
    },

    'guild:clear': async () => {
        const guildId = args[0];
        if (!guildId) {
            Logger.error('❌ Please provide a guild ID');
            return;
        }

        Logger.info(`🧹 Clearing cache for guild ${guildId}...`);
        const syncManager = DataSyncManager.getInstance();
        const cleared = await syncManager.clearGuildCache(guildId);
        Logger.success(`✅ Cleared ${cleared} cache keys for guild ${guildId}`);
    },

    'help': async () => {
        console.log(`
🤖 Chibi-bot CLI Management Tool

Usage: bun run cli <command> [args]

Cache Commands:
  cache:clear [pattern]  Clear cache (all or by pattern)
  cache:rebuild          Rebuild all caches from database
  cache:stats            Display cache statistics
  cache:validate         Validate cache-database consistency

Database Commands:
  db:migrate             Run database migrations
  db:indexes             Create database indexes
  db:stats               Display database statistics

System Commands:
  health:check           Run complete health check
  guild:clear <guildId>  Clear cache for specific guild

Examples:
  bun run cli cache:clear
  bun run cli cache:clear "*autoreaction*"
  bun run cli cache:rebuild
  bun run cli db:migrate
  bun run cli health:check
  bun run cli guild:clear 123456789
        `);
    },
};

// Main execution
async function main() {
    if (!command || command === 'help') {
        await commands.help();
        return;
    }

    if (!commands[command as keyof typeof commands]) {
        Logger.error(`❌ Unknown command: ${command}`);
        Logger.info('Run "bun run cli help" for available commands');
        process.exit(1);
    }

    try {
        await initialize();
        await commands[command as keyof typeof commands]();
        Logger.success('✅ Command completed successfully');
    } catch (error) {
        Logger.error(`❌ Command failed: ${error}`);
        process.exit(1);
    } finally {
        await cleanup();
        process.exit(0);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { commands };
