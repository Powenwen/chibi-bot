/**
 * Chibi Bot Dashboard - Session Service
 * Custom Redis-backed session store using ioredis with proper JSON serialization.
 * Avoids connect-redis which is incompatible with ioredis clients.
 */

import session from 'express-session';
import Redis from 'ioredis';
import type { DashboardSessionData } from '../types';

const SESSION_PREFIX = 'sess:';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Dedicated ioredis client for sessions (no global keyPrefix)
let sessionRedisClient: Redis | null = null;

function getSessionRedisClient(): Redis {
  if (!sessionRedisClient) {
    sessionRedisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      db: 0,
    });
  }
  return sessionRedisClient;
}

/**
 * Cache guild data in Redis to avoid hitting Discord API rate limits.
 * Key: guilds:<userId>, TTL: 5 minutes.
 */
export async function cacheGetGuilds(userId: string): Promise<string | null> {
  const client = getSessionRedisClient();
  return client.get(`guilds:${userId}`);
}

export async function cacheSetGuilds(userId: string, data: string): Promise<void> {
  const client = getSessionRedisClient();
  // Cache for 5 minutes to avoid rate limits
  await client.setex(`guilds:${userId}`, 300, data);
}

/**
 * Custom session store backed by ioredis with JSON serialization.
 */
class IoRedisStore extends session.Store {
  private client: Redis;
  private prefix: string;
  private ttl: number;

  constructor(client: Redis, prefix: string, ttl: number) {
    super();
    this.client = client;
    this.prefix = prefix;
    this.ttl = ttl;
  }

  private key(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  get(sid: string, cb: (err: any, session?: session.SessionData | null) => void): void {
    this.client.get(this.key(sid), (err, data) => {
      if (err) return cb(err);
      if (!data) return cb(null);
      try {
        cb(null, JSON.parse(data));
      } catch (e) {
        cb(e);
      }
    });
  }

  set(sid: string, sess: session.SessionData, cb?: (err?: any) => void): void {
    const data = JSON.stringify(sess);
    this.client.setex(this.key(sid), this.ttl, data, (err) => {
      if (cb) cb(err);
    });
  }

  destroy(sid: string, cb?: (err?: any) => void): void {
    this.client.del(this.key(sid), (err) => {
      if (cb) cb(err);
    });
  }

  touch(sid: string, sess: session.SessionData, cb?: (err?: any) => void): void {
    this.client.expire(this.key(sid), this.ttl, (err) => {
      if (cb) cb(err);
    });
  }
}

/**
 * Create the session middleware with our custom ioredis store.
 */
export function createSessionMiddleware() {
  const useRedis = process.env.USE_SESSION_REDIS !== 'false';
  let store: session.Store | undefined;

  if (useRedis) {
    try {
      const client = getSessionRedisClient();
      store = new IoRedisStore(client, SESSION_PREFIX, SESSION_TTL_SECONDS);
    } catch (err) {
      console.warn('[Session] Failed to create IoRedisStore, falling back to MemoryStore:', err);
    }
  }

  return session({
    store: store,
    secret: process.env.SESSION_SECRET || 'chibi-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'chibi.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: SESSION_TTL_SECONDS * 1000,
      path: '/',
    },
  });
}

/**
 * Store dashboard session data after successful OAuth.
 */
export function setSessionData(
  req: Express.Request & { session: { data?: DashboardSessionData } },
  data: DashboardSessionData
): void {
  req.session.data = data;
}

/**
 * Get dashboard session data from the current request.
 */
export function getSessionData(
  req: Express.Request & { session: { data?: DashboardSessionData } }
): DashboardSessionData | undefined {
  return req.session.data;
}

/**
 * Save the session explicitly and call the callback when done.
 * Use this before redirecting to ensure the Set-Cookie header is sent.
 */
export function saveSession(
  req: Express.Request & { session: { save: (cb: (err: unknown) => void) => void } }
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Destroy the current session (logout).
 */
export function destroySession(
  req: Express.Request & { session: { destroy: (cb: (err: unknown) => void) => void } }
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
