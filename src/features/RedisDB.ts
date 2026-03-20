import Redis from 'ioredis';
import { ConfigManager } from '../config/ConfigManager';

const createRedisClient = (): Redis => {
  try {
    const config = ConfigManager.getInstance().getConfig();
    
    return new Redis({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      db: 0,
      keyPrefix: 'chibi:'
    });
  } catch (error) {
    console.error('Failed to create Redis client with config, using defaults:', error);
    // Fallback to simple configuration
    return new Redis({ 
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true 
    });
  }
};

export const redis = createRedisClient();