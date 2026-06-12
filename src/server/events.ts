/**
 * Chibi Bot Dashboard - Event Publisher
 * Publishes real-time events to Redis pub/sub channels,
 * which are then forwarded to WebSocket clients by the server.
 *
 * Usage in bot features:
 *   import { publishModerationEvent, publishConfigEvent, publishStatsEvent } from '../server/events';
 *
 *   // When a moderation action is taken:
 *   publishModerationEvent(redis, { guildId, caseId, action, userId, reason });
 *
 *   // When guild config is updated:
 *   publishConfigEvent(redis, { guildId, feature: 'welcome', data: config });
 *
 *   // When bot stats change:
 *   publishStatsEvent(redis, { guilds: 10, users: 500, uptime: '2h' });
 */

import type { Redis } from 'ioredis';

// ==================== Redis Channel Names ====================

const CHANNELS = {
  MODERATION: 'chibi:ws:moderation',
  CONFIG: 'chibi:ws:config',
  STATS: 'chibi:ws:stats',
} as const;

// ==================== Event Types ====================

export interface ModerationEventData {
  guildId: string;
  caseId?: string;
  action: 'warn' | 'mute' | 'kick' | 'ban' | 'unban' | 'timeout' | 'unmute';
  userId: string;
  moderatorId: string;
  reason: string;
  duration?: number;
  timestamp: string;
}

export interface ConfigEventData {
  guildId: string;
  feature: string;
  data: Record<string, unknown>;
  updatedBy?: string;
  timestamp: string;
}

export interface StatsEventData {
  guilds?: number;
  users?: number;
  uptime?: number;
  memory?: Record<string, number>;
  timestamp: string;
}

// ==================== Publish Functions ====================

/**
 * Publish a moderation event (new case, action taken, etc.)
 */
export async function publishModerationEvent(
  redis: Redis,
  event: ModerationEventData
): Promise<void> {
  try {
    await redis.publish(
      CHANNELS.MODERATION,
      JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('[Event Publisher] Failed to publish moderation event:', err);
  }
}

/**
 * Publish a config change event (feature settings updated)
 */
export async function publishConfigEvent(
  redis: Redis,
  event: ConfigEventData
): Promise<void> {
  try {
    await redis.publish(
      CHANNELS.CONFIG,
      JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('[Event Publisher] Failed to publish config event:', err);
  }
}

/**
 * Publish a stats update event (bot health, metrics)
 */
export async function publishStatsEvent(
  redis: Redis,
  event: StatsEventData
): Promise<void> {
  try {
    await redis.publish(
      CHANNELS.STATS,
      JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('[Event Publisher] Failed to publish stats event:', err);
  }
}

// ==================== Convenience Functions ====================

/**
 * Publish a new moderation case event.
 * Call this after creating a moderation case in the database.
 */
export async function publishNewCase(
  redis: Redis,
  data: {
    guildId: string;
    caseId: string;
    action: ModerationEventData['action'];
    userId: string;
    moderatorId: string;
    reason: string;
    duration?: number;
  }
): Promise<void> {
  await publishModerationEvent(redis, {
    guildId: data.guildId,
    caseId: data.caseId,
    action: data.action,
    userId: data.userId,
    moderatorId: data.moderatorId,
    reason: data.reason,
    duration: data.duration,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Publish a guild config update event.
 * Call this after updating any guild feature configuration.
 */
export async function publishGuildConfigUpdate(
  redis: Redis,
  data: {
    guildId: string;
    feature: string;
    config: Record<string, unknown>;
    updatedBy?: string;
  }
): Promise<void> {
  await publishConfigEvent(redis, {
    guildId: data.guildId,
    feature: data.feature,
    data: data.config,
    updatedBy: data.updatedBy,
    timestamp: new Date().toISOString(),
  });
}
