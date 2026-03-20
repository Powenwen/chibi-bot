import { Redis } from 'ioredis';
import { redis } from '../features/RedisDB';
import Logger from '../features/Logger';

export class CacheManager {
    private static instance: CacheManager;
    private redis: Redis;
    private readonly defaultTTL = 3600; // 1 hour

    private constructor() {
        this.redis = redis;
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * Get cached data with automatic JSON parsing
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            Logger.error(`Cache get error for key ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Set cached data with automatic JSON stringification
     */
    public async set(key: string, value: unknown, ttl: number = this.defaultTTL): Promise<boolean> {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            Logger.error(`Cache set error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Delete cached data
     */
    public async delete(key: string): Promise<boolean> {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            Logger.error(`Cache delete error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    public async exists(key: string): Promise<boolean> {
        try {
            return (await this.redis.exists(key)) === 1;
        } catch (error) {
            Logger.error(`Cache exists error for key ${key}: ${error}`);
            return false;
        }
    }

    /**
     * Get or set pattern - if data doesn't exist, fetch it and cache it
     */
    public async getOrSet<T>(
        key: string, 
        fetcher: () => Promise<T>, 
        ttl: number = this.defaultTTL
    ): Promise<T | null> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        try {
            const fresh = await fetcher();
            if (fresh !== null && fresh !== undefined) {
                await this.set(key, fresh, ttl);
            }
            return fresh;
        } catch (error) {
            Logger.error(`Error in getOrSet for key ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Clear all cache with optional pattern
     */
    public async clear(pattern?: string): Promise<number> {
        try {
            if (pattern) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    return await this.redis.del(...keys);
                }
                return 0;
            } else {
                await this.redis.flushdb();
                return 1;
            }
        } catch (error) {
            Logger.error(`Cache clear error: ${error}`);
            return 0;
        }
    }

    /**
     * Batch get multiple keys for better performance
     */
    public async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
        try {
            if (keys.length === 0) return {};

            const values = await this.redis.mget(...keys);
            const result: Record<string, T | null> = {};

            keys.forEach((key, index) => {
                const value = values[index];
                result[key] = value ? JSON.parse(value) : null;
            });

            return result;
        } catch (error) {
            Logger.error(`Cache mget error: ${error}`);
            return keys.reduce((acc, key) => {
                acc[key] = null;
                return acc;
            }, {} as Record<string, T | null>);
        }
    }

    /**
     * Get cache health and performance statistics
     */
    public async getStats(): Promise<{
        connected: boolean;
        memoryUsage?: string;
        connectedClients?: number;
        totalKeys?: number;
        hits?: number;
        misses?: number;
    }> {
        try {
            const info = await this.redis.info();
            const keyspaceInfo = await this.redis.info('keyspace');
            
            const lines = info.split('\r\n');
            const stats: any = {};
            
            lines.forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key] = value;
                }
            });

            let totalKeys = 0;
            const keyspaceLines = keyspaceInfo.split('\r\n');
            keyspaceLines.forEach(line => {
                if (line.startsWith('db')) {
                    const match = line.match(/keys=(\d+)/);
                    if (match) {
                        totalKeys += parseInt(match[1]);
                    }
                }
            });

            return {
                connected: true,
                memoryUsage: stats.used_memory_human,
                connectedClients: parseInt(stats.connected_clients) || 0,
                totalKeys,
                hits: parseInt(stats.keyspace_hits) || 0,
                misses: parseInt(stats.keyspace_misses) || 0
            };
        } catch (error) {
            Logger.error(`Failed to get cache stats: ${error}`);
            return { connected: false };
        }
    }
}