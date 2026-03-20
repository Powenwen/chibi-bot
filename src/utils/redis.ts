/**
 * @fileoverview Redis utility functions for the bot
 */

import { redis } from '../features/RedisDB';
import type Redis from 'ioredis';

/**
 * Get the Redis client instance
 */
export function getRedisClient(): Redis {
    return redis;
}
