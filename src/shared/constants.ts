/**
 * @fileoverview Global constants and configuration values for Chibi Bot
 * @author Chibi Bot Development Team
 * @version 3.1.2
 */

// ============================================================================
// Application Constants
// ============================================================================

/** Application metadata */
export const APP_INFO = {
  NAME: 'Chibi Bot',
  VERSION: '3.1.2',
  DESCRIPTION: 'A comprehensive Discord moderation and community management bot built with TypeScript',
  AUTHOR: 'Chibi Bot Development Team',
  REPOSITORY: 'https://github.com/Powenwen/Chibi-bot',
  WEBSITE: 'https://chibi-bot.dev',
  SUPPORT_SERVER: 'https://discord.gg/chibi-bot'
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

/** Cache key patterns for consistent Redis key naming */
export const CACHE_KEYS = {
  // User-related cache keys
  USER_DATA: 'user:data',
  USER_PREFERENCES: 'user:preferences',
  USER_VIOLATIONS: 'user:violations',
  
  // Guild-related cache keys
  GUILD_DATA: 'guild:data',
  GUILD_CONFIG: 'guild:config',
  GUILD_STATS: 'guild:stats',
  
  // Feature-specific cache keys
  STICKY_MESSAGES: 'feature:sticky_messages',
  AUTO_REACTIONS: 'feature:auto_reactions',
  WELCOME_SYSTEMS: 'feature:welcome_systems',
  SUGGESTIONS: 'feature:suggestions',
  MODERATION_CASES: 'feature:moderation_cases',
  
  // System cache keys
  ERROR_STATS: 'system:error_stats',
  HEALTH_STATUS: 'system:health_status',
  RATE_LIMITS: 'system:rate_limits'
} as const;

/** Default cache TTL values (in seconds) */
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

// ============================================================================
// Discord Bot Permissions
// ============================================================================

/** Bot permission constants mapped to Discord permission flags */
export const BOT_PERMISSIONS = {
  // Administrative permissions
  ADMINISTRATOR: 'Administrator',
  MANAGE_GUILD: 'ManageGuild',
  MANAGE_ROLES: 'ManageRoles',
  MANAGE_CHANNELS: 'ManageChannels',
  
  // Moderation permissions
  KICK_MEMBERS: 'KickMembers',
  BAN_MEMBERS: 'BanMembers',
  MODERATE_MEMBERS: 'ModerateMembers',
  MANAGE_MESSAGES: 'ManageMessages',
  
  // General permissions
  VIEW_CHANNELS: 'ViewChannel',
  SEND_MESSAGES: 'SendMessages',
  EMBED_LINKS: 'EmbedLinks',
  ATTACH_FILES: 'AttachFiles',
  READ_MESSAGE_HISTORY: 'ReadMessageHistory',
  ADD_REACTIONS: 'AddReactions',
  USE_EXTERNAL_EMOJIS: 'UseExternalEmojis',
  MENTION_EVERYONE: 'MentionEveryone'
} as const;

/** Minimum required permissions for the bot to function */
export const REQUIRED_PERMISSIONS = [
  BOT_PERMISSIONS.VIEW_CHANNELS,
  BOT_PERMISSIONS.SEND_MESSAGES,
  BOT_PERMISSIONS.EMBED_LINKS,
  BOT_PERMISSIONS.READ_MESSAGE_HISTORY
] as const;

// ============================================================================
// Command Categories
// ============================================================================

/** Command category definitions */
export const COMMAND_CATEGORIES = {
  ADMIN: 'admin',
  MODERATION: 'moderation',
  UTILITY: 'utility',
  DEVELOPMENT: 'dev',
  INFORMATION: 'info',
  STICKY_MESSAGE: 'sticky-message',
  AUTO_REACTION: 'auto-reaction',
  SUGGESTION_SYSTEM: 'suggestion-system',
  WELCOME_SYSTEM: 'welcome-system',
  FUN: 'fun'
} as const;

// ============================================================================
// Error and Logging Constants
// ============================================================================

/** Error severity levels */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

/** Log levels for the logging system */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  SUCCESS: 'success'
} as const;

// ============================================================================
// Moderation Constants
// ============================================================================

/** Auto-moderation action types */
export const AUTO_MOD_ACTIONS = {
  DELETE: 'delete',
  WARN: 'warn',
  MUTE: 'mute',
  KICK: 'kick',
  BAN: 'ban'
} as const;

/** Moderation case types */
export const MODERATION_ACTIONS = {
  WARN: 'warn',
  MUTE: 'mute',
  UNMUTE: 'unmute',
  KICK: 'kick',
  BAN: 'ban',
  UNBAN: 'unban',
  TIMEOUT: 'timeout',
  REMOVE_TIMEOUT: 'remove_timeout'
} as const;

/** Default moderation settings */
export const MODERATION_DEFAULTS = {
  CASE_ID_LENGTH: 8,
  MAX_REASON_LENGTH: 512,
  DEFAULT_MUTE_DURATION: 3600, // 1 hour in seconds
  MAX_HISTORY_ITEMS: 50
} as const;

// ============================================================================
// Feature Limits and Defaults
// ============================================================================

/** System limits to prevent abuse */
export const SYSTEM_LIMITS = {
  // Message limits
  MAX_MESSAGE_LENGTH: 2000,
  MAX_EMBED_FIELDS: 25,
  MAX_EMBED_DESCRIPTION: 4096,
  
  // User limits
  MAX_WARNINGS_PER_USER: 10,
  MAX_VIOLATIONS_TRACKED: 100,
  
  // Guild limits
  MAX_STICKY_MESSAGES_PER_GUILD: 10,
  MAX_AUTO_REACTIONS_PER_GUILD: 50,
  MAX_SUGGESTION_CHANNELS_PER_GUILD: 5,
  
  // Rate limits
  COMMAND_RATE_LIMIT: 5, // commands per minute
  MESSAGE_RATE_LIMIT: 20, // messages per minute
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
} as const;

// ============================================================================
// Time Constants
// ============================================================================

/** Time durations in milliseconds */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
} as const;

/** Default timeouts and intervals */
export const TIMEOUTS = {
  INTERACTION_TIMEOUT: 15 * TIME_CONSTANTS.MINUTE,
  HEALTH_CHECK_INTERVAL: 5 * TIME_CONSTANTS.MINUTE,
  ACTIVITY_ROTATION_INTERVAL: 30 * TIME_CONSTANTS.SECOND,
  CACHE_CLEANUP_INTERVAL: TIME_CONSTANTS.HOUR,
  DATABASE_RECONNECT_TIMEOUT: 30 * TIME_CONSTANTS.SECOND
} as const;

// ============================================================================
// Discord API Constants
// ============================================================================

/** Discord API limits and constraints */
export const DISCORD_LIMITS = {
  MAX_GUILD_NAME_LENGTH: 100,
  MAX_CHANNEL_NAME_LENGTH: 100,
  MAX_ROLE_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 32,
  MAX_NICKNAME_LENGTH: 32,
  MAX_REASON_LENGTH: 512,
  MAX_AUDIT_LOG_ENTRIES: 100
} as const;

/** Discord color constants for embeds */
export const DISCORD_COLORS = {
  // Status colors
  SUCCESS: 0x00FF00,
  ERROR: 0xFF0000,
  WARNING: 0xFFFF00,
  INFO: 0x0099FF,
  
  // Brand colors
  DISCORD_BLURPLE: 0x5865F2,
  DISCORD_GREEN: 0x57F287,
  DISCORD_YELLOW: 0xFEE75C,
  DISCORD_FUCHSIA: 0xEB459E,
  DISCORD_RED: 0xED4245,
  
  // Moderation colors
  MODERATION_WARN: 0xFFCC00,
  MODERATION_MUTE: 0xFF6600,
  MODERATION_KICK: 0xFF3300,
  MODERATION_BAN: 0xFF0000,
  
  // Feature colors
  WELCOME: 0x00FF7F,
  SUGGESTION: 0x9932CC,
  STICKY: 0x32CD32,
  AUTO_REACTION: 0xFFD700
} as const;

// ============================================================================
// Environment Constants
// ============================================================================

/** Valid environment types */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;

/** Feature flags default values */
export const DEFAULT_FEATURES = {
  WELCOME_SYSTEM: false,
  STICKY_MESSAGES: false,
  AUTO_REACTIONS: false,
  HEALTH_CHECKS: true,
  ERROR_REPORTING: true,
  ANALYTICS: false
} as const;

// ============================================================================
// Utility Functions for Constants
// ============================================================================

/**
 * Generates a cache key with proper formatting
 * @param category - The cache category
 * @param identifier - The specific identifier
 * @returns Formatted cache key
 */
export function generateCacheKey(category: string, identifier: string): string {
  return `${category}:${identifier}`;
}

/**
 * Checks if a permission is in the required permissions list
 * @param permission - The permission to check
 * @returns True if permission is required
 */
export function isRequiredPermission(permission: string): boolean {
  return REQUIRED_PERMISSIONS.includes(permission as any);
}

/**
 * Converts time duration to milliseconds
 * @param duration - The duration value
 * @param unit - The time unit
 * @returns Duration in milliseconds
 */
export function timeToMs(duration: number, unit: keyof typeof TIME_CONSTANTS): number {
  return duration * TIME_CONSTANTS[unit];
}
