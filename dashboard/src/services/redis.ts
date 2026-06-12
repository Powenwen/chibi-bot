/**
 * Chibi Bot Dashboard - Redis Service
 * Session storage, caching, and rate limiting
 * 
 * In production, this runs on the backend server.
 * This file documents the Redis key patterns and operations.
 */

// ==================== REDIS CONFIGURATION ====================

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  keyPrefix: 'chibi:',
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// ==================== KEY PATTERNS ====================

export const RedisKeys = {
  // Sessions
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,
  
  // Rate limiting
  rateLimit: (userId: string, endpoint: string) => `ratelimit:${userId}:${endpoint}`,
  globalRateLimit: (endpoint: string) => `ratelimit:global:${endpoint}`,
  
  // Guild caching
  guildInfo: (guildId: string) => `guild:info:${guildId}`,
  guildChannels: (guildId: string) => `guild:channels:${guildId}`,
  guildRoles: (guildId: string) => `guild:roles:${guildId}`,
  guildMembers: (guildId: string) => `guild:members:${guildId}`,
  
  // User caching
  userGuilds: (userId: string) => `user:guilds:${userId}`,
  userInfo: (userId: string) => `user:info:${userId}`,
  
  // Bot stats caching
  botStats: () => 'bot:stats',
  botStatsTimestamp: () => 'bot:stats:timestamp',
  
  // Feature config caching
  welcomeConfig: (guildId: string) => `config:welcome:${guildId}`,
  stickyMessages: (guildId: string) => `config:sticky:${guildId}`,
  autoReactions: (guildId: string) => `config:autoreactions:${guildId}`,
  autoResponders: (guildId: string) => `config:autoresponders:${guildId}`,
  suggestionConfig: (guildId: string) => `config:suggestions:${guildId}`,
  automodConfig: (guildId: string) => `config:automod:${guildId}`,
  escalationRules: (guildId: string) => `config:escalations:${guildId}`,
  guildSettings: (guildId: string) => `config:settings:${guildId}`,
  
  // Moderation caching
  modLogs: (guildId: string) => `modlogs:${guildId}`,
  modLogsCursor: (guildId: string) => `modlogs:cursor:${guildId}`,
  
  // Command stats
  commandStats: (commandName: string) => `cmdstats:${commandName}`,
  commandStatsDaily: (date: string) => `cmdstats:daily:${date}`,
  
  // Global config
  globalConfig: () => 'config:global',
  
  // Maintenance
  maintenanceMode: () => 'maintenance',
  
  // WebSocket pub/sub
  wsChannel: (channel: string) => `ws:${channel}`,
  
  // Health checks
  healthStatus: (service: string) => `health:${service}`,
  healthLastCheck: (service: string) => `health:${service}:lastcheck`,
};

// ==================== TTL CONFIGURATION ====================

export const RedisTTL = {
  session: 7 * 24 * 60 * 60,        // 7 days
  userGuilds: 5 * 60,               // 5 minutes
  guildInfo: 10 * 60,               // 10 minutes
  guildChannels: 5 * 60,            // 5 minutes
  guildRoles: 5 * 60,               // 5 minutes
  botStats: 5 * 60,                 // 5 minutes
  featureConfig: 2 * 60,            // 2 minutes
  modLogs: 1 * 60,                  // 1 minute
  commandStats: 24 * 60 * 60,       // 24 hours
  rateLimit: 60,                    // 1 minute
  globalRateLimit: 60,              // 1 minute
  healthStatus: 30,                 // 30 seconds
};

// ==================== RATE LIMITING ====================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 100,
    keyPrefix: 'ratelimit:api',
  },
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,
    keyPrefix: 'ratelimit:auth',
  },
  guildConfig: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'ratelimit:config',
  },
  moderation: {
    windowMs: 60 * 1000,
    maxRequests: 50,
    keyPrefix: 'ratelimit:mod',
  },
  dev: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    keyPrefix: 'ratelimit:dev',
  },
};

// ==================== CACHE OPERATIONS ====================

/**
 * Cache operation result type
 */
export interface CacheResult<T> {
  hit: boolean;
  data?: T;
  stale?: boolean;
}

/**
 * Cache wrapper function signature
 * In production, this would use the actual Redis client
 */
export type CacheGet<T> = (key: string) => Promise<CacheResult<T>>;
export type CacheSet<T> = (key: string, value: T, ttl?: number) => Promise<void>;
export type CacheDelete = (key: string) => Promise<void>;
export type CacheInvalidate = (pattern: string) => Promise<void>;

// ==================== SESSION STORE ====================

export interface SessionData {
  sessionId: string;
  userId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  guilds: Array<{
    id: string;
    name: string;
    icon: string | null;
    permissions: number;
  }>;
  role: 'user' | 'developer';
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActive: number;
}

/**
 * Session store operations
 */
export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttl?: number): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  touch(sessionId: string): Promise<void>;
  getUserSessions(userId: string): Promise<string[]>;
  destroyUserSessions(userId: string): Promise<void>;
}

// ==================== PUB/SUB CHANNELS ====================

export const PubSubChannels = {
  LOGS: 'bot:logs',
  STATS: 'bot:stats',
  GUILD_EVENTS: 'bot:guilds',
  MODERATION: 'bot:moderation',
  ALERTS: 'bot:alerts',
  CONFIG_RELOAD: 'bot:config:reload',
};

export interface PubSubMessage<T = unknown> {
  channel: string;
  timestamp: number;
  payload: T;
}

// ==================== HEALTH CHECK CACHE ====================

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: number;
  message?: string;
}

// ==================== MOCK IMPLEMENTATION ====================

/**
 * In-memory cache for frontend demo
 * In production, this would be replaced with actual Redis ioredis client
 */
class InMemoryCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<CacheResult<T>> {
    const entry = this.store.get(key);
    if (!entry) return { hit: false };
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return { hit: false, stale: true };
    }
    
    return { hit: true, data: entry.value as T };
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const memoryCache = new InMemoryCache();
