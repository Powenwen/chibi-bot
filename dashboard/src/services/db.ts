/**
 * Chibi Bot Dashboard - Database Service
 * MongoDB connection and collection accessors for chibibase
 * 
 * In a real deployment, this would run on the backend server.
 * This file documents the schema and provides type-safe collection accessors.
 */

import type {
  WelcomeConfig,
} from '../types/api';

// ==================== DATABASE CONFIGURATION ====================

export const DB_CONFIG = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/chibibase',
  dbName: process.env.MONGO_DB_NAME || 'chibibase',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

// ==================== COLLECTION NAMES ====================

export const Collections = {
  WELCOME_SYSTEMS: 'welcomesystems',
  STICKY_MESSAGES: 'stickymessages',
  AUTO_REACTIONS: 'autoreactions',
  AUTO_RESPONDERS: 'autoresponders',
  AUTHORIZED_USERS: 'authorizedusers',
  SUGGESTIONS: 'suggestions',
  SUGGESTION_CHANNELS: 'suggestionchannels',
  MODERATION_LOGS: 'moderationlogs',
  MODERATIONS: 'moderations',
  AUTO_MODERATIONS: 'automoderations',
  WARNING_ESCALATIONS: 'warningescalations',
  DASHBOARD_AUDIT: 'dashboardaudit',
  GLOBAL_CONFIG: 'globalconfig',
  COMMAND_STATS: 'commandstats',
  DEV_USERS: 'devusers',
  USER_SESSIONS: 'usersessions',
} as const;

// ==================== SCHEMA DOCUMENTS ====================

/**
 * Welcome System Document Schema
 */
export interface WelcomeSystemDoc {
  _id: string;
  guildId: string;
  enabled: boolean;
  channelId: string;
  messageTemplate: string;
  useEmbed: boolean;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  embedThumbnail: boolean;
  embedFooter: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Sticky Message Document Schema
 */
export interface StickyMessageDoc {
  _id: string;
  guildId: string;
  channelId: string;
  content: string;
  useEmbed: boolean;
  embedConfig?: {
    title: string;
    description: string;
    color: string;
    footer: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auto-Reaction Document Schema
 */
export interface AutoReactionDoc {
  _id: string;
  guildId: string;
  channelId: string;
  emoji: string;
  triggerType: 'always' | 'pattern';
  pattern: string | null;
  cooldown: number;
  createdBy: string;
  createdAt: Date;
}

/**
 * Auto-Responder Document Schema
 */
export interface AutoResponderDoc {
  _id: string;
  guildId: string;
  trigger: string;
  matchMode: 'exact' | 'contains' | 'regex';
  caseSensitive: boolean;
  responseText: string;
  useEmbed: boolean;
  embedConfig?: {
    title: string;
    description: string;
    color: string;
    footer: string;
  };
  channelIds: string[];
  cooldown: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Suggestion Channel Config Document Schema
 */
export interface SuggestionChannelDoc {
  _id: string;
  guildId: string;
  enabled: boolean;
  suggestionChannelId: string;
  approvalChannelId: string;
  upvoteEmoji: string;
  downvoteEmoji: string;
  requireDenialReason: boolean;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Suggestion Document Schema
 */
export interface SuggestionDoc {
  _id: string;
  guildId: string;
  messageId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  summary: string;
  fullText: string;
  status: 'pending' | 'approved' | 'denied' | 'implemented';
  upvotes: number;
  downvotes: number;
  moderatorId?: string;
  moderatorName?: string;
  reason?: string;
  submittedAt: Date;
  updatedAt: Date;
}

/**
 * Moderation Log Document Schema
 */
export interface ModerationLogDoc {
  _id: string;
  caseId: string;
  guildId: string;
  action: 'warn' | 'mute' | 'kick' | 'ban' | 'unban' | 'timeout' | 'unmute';
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar: string | null;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  duration?: string;
  evidence?: string;
  timestamp: Date;
}

/**
 * Auto-Moderation Document Schema
 */
export interface AutoModerationDoc {
  _id: string;
  guildId: string;
  antiSpamEnabled: boolean;
  spamThreshold: number;
  spamWindow: number;
  spamAction: 'mute' | 'kick' | 'ban';
  spamMuteDuration: string;
  wordFilterEnabled: boolean;
  blockedWords: string[];
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  raidProtectionEnabled: boolean;
  raidThreshold: number;
  raidWindow: number;
  raidAction: 'lockdown' | 'kick_new' | 'alert';
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Warning Escalation Document Schema
 */
export interface WarningEscalationDoc {
  _id: string;
  guildId: string;
  warningCount: number;
  action: 'mute' | 'kick' | 'ban' | 'notify';
  duration: string | null;
  resetWarnings: boolean;
  order: number;
  updatedAt: Date;
}

/**
 * Guild Settings Document Schema
 */
export interface GuildSettingsDoc {
  _id: string;
  guildId: string;
  prefix: string;
  authorizedUserIds: string[];
  featureFlags: {
    welcome: boolean;
    sticky: boolean;
    autoreactions: boolean;
    autoresponder: boolean;
    suggestions: boolean;
    moderation: boolean;
    healthchecks: boolean;
  };
  updatedAt: Date;
}

/**
 * Dashboard Audit Log Document Schema
 */
export interface DashboardAuditDoc {
  _id: string;
  userId: string;
  username: string;
  guildId?: string;
  action: string;
  resource: string;
  payload: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Global Config Document Schema
 */
export interface GlobalConfigDoc {
  _id: string;
  activities: string[];
  errorThreshold: number;
  healthCheckInterval: number;
  messageCacheTTL: number;
  userCacheTTL: number;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Command Stats Document Schema
 */
export interface CommandStatDoc {
  _id: string;
  commandName: string;
  guildId?: string;
  userId: string;
  channelId: string;
  timestamp: Date;
}

/**
 * Dev User Document Schema
 */
export interface DevUserDoc {
  _id: string;
  discordId: string;
  username: string;
  role: 'user' | 'developer';
  addedAt: Date;
  addedBy: string;
}

/**
 * User Session Document Schema (for Redis fallback)
 */
export interface UserSessionDoc {
  _id: string;
  sessionId: string;
  userId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  guilds: DiscordGuildInfo[];
  createdAt: Date;
  expiresAt: Date;
}

interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
  permissions: number;
}

// ==================== TYPE MAPPERS ====================

/**
 * Map database document to API type
 */
export function mapWelcomeDocToConfig(doc: WelcomeSystemDoc): WelcomeConfig {
  return {
    enabled: doc.enabled,
    channelId: doc.channelId,
    messageTemplate: doc.messageTemplate,
    useEmbed: doc.useEmbed,
    embedTitle: doc.embedTitle,
    embedDescription: doc.embedDescription,
    embedColor: doc.embedColor,
    embedThumbnail: doc.embedThumbnail,
    embedFooter: doc.embedFooter,
  };
}

/**
 * Map API config to database document
 */
export function mapConfigToWelcomeDoc(guildId: string, config: WelcomeConfig, userId: string): Partial<WelcomeSystemDoc> {
  return {
    guildId,
    enabled: config.enabled,
    channelId: config.channelId,
    messageTemplate: config.messageTemplate,
    useEmbed: config.useEmbed,
    embedTitle: config.embedTitle,
    embedDescription: config.embedDescription,
    embedColor: config.embedColor,
    embedThumbnail: config.embedThumbnail,
    embedFooter: config.embedFooter,
    updatedAt: new Date(),
    updatedBy: userId,
  };
}

// ==================== INDEX DEFINITIONS ====================

/**
 * Recommended MongoDB indexes for optimal query performance
 */
export const RECOMMENDED_INDEXES: Record<string, Array<{ keys: Record<string, number>; options?: Record<string, unknown> }>> = {
  [Collections.WELCOME_SYSTEMS]: [
    { keys: { guildId: 1 }, options: { unique: true } },
  ],
  [Collections.STICKY_MESSAGES]: [
    { keys: { guildId: 1, channelId: 1 } },
    { keys: { createdAt: -1 } },
  ],
  [Collections.AUTO_REACTIONS]: [
    { keys: { guildId: 1, channelId: 1 } },
  ],
  [Collections.AUTO_RESPONDERS]: [
    { keys: { guildId: 1 } },
    { keys: { guildId: 1, trigger: 1 } },
  ],
  [Collections.SUGGESTIONS]: [
    { keys: { guildId: 1, status: 1 } },
    { keys: { guildId: 1, submittedAt: -1 } },
    { keys: { authorId: 1 } },
  ],
  [Collections.MODERATION_LOGS]: [
    { keys: { guildId: 1, timestamp: -1 } },
    { keys: { guildId: 1, targetUserId: 1 } },
    { keys: { guildId: 1, moderatorId: 1 } },
    { keys: { caseId: 1 }, options: { unique: true } },
  ],
  [Collections.AUTO_MODERATIONS]: [
    { keys: { guildId: 1 }, options: { unique: true } },
  ],
  [Collections.WARNING_ESCALATIONS]: [
    { keys: { guildId: 1, order: 1 } },
  ],
  [Collections.DASHBOARD_AUDIT]: [
    { keys: { timestamp: -1 } },
    { keys: { userId: 1, timestamp: -1 } },
    { keys: { guildId: 1, timestamp: -1 } },
  ],
  [Collections.COMMAND_STATS]: [
    { keys: { commandName: 1, timestamp: -1 } },
    { keys: { guildId: 1, timestamp: -1 } },
    { keys: { timestamp: -1 } },
  ],
};

// ==================== VALIDATION SCHEMAS (Zod) ====================

/**
 * Zod validation schemas for request body validation
 * These would be used server-side with zod
 */
export const ValidationSchemas = {
  welcomeConfig: {
    enabled: 'boolean',
    channelId: 'string.min(1)',
    messageTemplate: 'string.max(2000)',
    useEmbed: 'boolean',
    embedTitle: 'string.max(256).optional',
    embedDescription: 'string.max(4096).optional',
    embedColor: 'string.regex(/^#[0-9A-Fa-f]{6}$/).optional',
    embedThumbnail: 'boolean.optional',
    embedFooter: 'string.max(2048).optional',
  },
  stickyMessage: {
    channelId: 'string.min(1)',
    content: 'string.min(1).max(2000)',
    useEmbed: 'boolean',
  },
  autoReaction: {
    channelId: 'string.min(1)',
    emoji: 'string.min(1)',
    triggerType: "enum(['always', 'pattern'])",
    pattern: 'string.optional',
    cooldown: 'number.min(0).max(3600)',
  },
  autoResponder: {
    trigger: 'string.min(1).max(100)',
    matchMode: "enum(['exact', 'contains', 'regex'])",
    caseSensitive: 'boolean',
    responseText: 'string.min(1).max(2000)',
    useEmbed: 'boolean',
    channelIds: 'array(string)',
    cooldown: 'number.min(0).max(3600)',
  },
  suggestionAction: {
    status: "enum(['approved', 'denied', 'implemented'])",
    reason: 'string.max(1000).optional',
  },
  automodConfig: {
    antiSpamEnabled: 'boolean',
    spamThreshold: 'number.min(1).max(100)',
    spamWindow: 'number.min(1).max(300)',
    spamAction: "enum(['mute', 'kick', 'ban'])",
    spamMuteDuration: 'string.optional',
    wordFilterEnabled: 'boolean',
    blockedWords: 'array(string)',
    exemptRoleIds: 'array(string)',
    exemptChannelIds: 'array(string)',
    raidProtectionEnabled: 'boolean',
    raidThreshold: 'number.min(1).max(1000)',
    raidWindow: 'number.min(1).max(3600)',
    raidAction: "enum(['lockdown', 'kick_new', 'alert'])",
  },
} as const;
