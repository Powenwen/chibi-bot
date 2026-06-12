/**
 * API Type Definitions for Chibi Bot Dashboard
 * These types mirror the backend API contract
 */

// ==================== AUTH ====================

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface DashboardUser extends DiscordUser {
  role: 'anonymous' | 'user' | 'developer';
  guilds: DiscordGuild[];
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  features: string[];
}

// ==================== BOT STATS ====================

export interface BotStats {
  guilds: number;
  users: number;
  commandsRun: number;
  commandsToday: number;
  uptime: string;
  ping: number;
  memory: number;
  cpu: number;
}

export interface DailyCommandStat {
  day: string;
  count: number;
}

export interface CommandUsageStat {
  name: string;
  count: number;
}

// ==================== GUILD ====================

export interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  channelCount: number;
  roleCount: number;
  ownerId: string;
  joinedAt: string;
  features: string[];
}

export interface GuildChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'announcement' | 'forum';
  parentId?: string;
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: number;
  managed: boolean;
}

// ==================== WELCOME ====================

export interface WelcomeConfig {
  enabled: boolean;
  channelId: string;
  messageTemplate: string;
  useEmbed: boolean;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  embedThumbnail: boolean;
  embedFooter: string;
}

export interface WelcomeConfigUpdate extends Partial<WelcomeConfig> {}

// ==================== STICKY MESSAGES ====================

export interface StickyMessageCreate {
  channelId: string;
  content: string;
  useEmbed: boolean;
  embedTitle?: string;
  embedDescription?: string;
  embedColor?: string;
}

export interface StickyMessageUpdate extends Partial<StickyMessageCreate> {}

// ==================== AUTO-REACTIONS ====================

export interface AutoReactionRule {
  id: string;
  guildId: string;
  channelId: string;
  emoji: string;
  triggerType: 'always' | 'pattern';
  pattern: string | null;
  cooldown: number;
  createdBy: string;
  createdAt: string;
}

export interface AutoReactionCreate {
  channelId: string;
  emoji: string;
  triggerType: 'always' | 'pattern';
  pattern?: string;
  cooldown: number;
}

// ==================== AUTO-RESPONDER ====================

export interface AutoResponderRule {
  id: string;
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
  createdAt: string;
}

export interface AutoResponderCreate {
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
}

// ==================== SUGGESTIONS ====================

export interface SuggestionConfig {
  enabled: boolean;
  suggestionChannelId: string;
  approvalChannelId: string;
  upvoteEmoji: string;
  downvoteEmoji: string;
  requireDenialReason: boolean;
}

export interface SuggestionItem {
  id: string;
  guildId: string;
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
  submittedAt: string;
  updatedAt: string;
}

export interface SuggestionAction {
  status: 'approved' | 'denied' | 'implemented';
  reason?: string;
}

// ==================== MODERATION ====================

export interface ModerationLog {
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
  timestamp: string;
}

export interface ModerationLogFilters {
  action?: string;
  moderatorId?: string;
  targetUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface EscalationRule {
  id: string;
  guildId: string;
  warningCount: number;
  action: 'mute' | 'kick' | 'ban' | 'notify';
  duration: string | null;
  resetWarnings: boolean;
  order: number;
}

export interface EscalationCreate {
  warningCount: number;
  action: 'mute' | 'kick' | 'ban' | 'notify';
  duration: string | null;
  resetWarnings: boolean;
}

export interface AutoModConfig {
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
}

// ==================== SERVER SETTINGS ====================

export interface GuildSettings {
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
}

// ==================== DEVELOPER ====================

export interface DevUser {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  guildsManaged: number;
  lastLogin: string;
  role: 'user' | 'developer';
  sessions: number;
}

export interface DevGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  ownerId: string;
  joinedAt: string;
  activeFeatures: string[];
  botPermissions: number;
}

export interface ServiceHealth {
  name: string;
  status: 'online' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
}

export interface CacheStats {
  keyCount: number;
  hitRate: number;
  memoryUsage: number;
  evictedKeys: number;
}

export interface GlobalConfig {
  activities: string[];
  errorThreshold: number;
  healthCheckInterval: number;
  messageCacheTTL: number;
  userCacheTTL: number;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
}

export interface AlertRule {
  id: string;
  condition: string;
  threshold: number;
  metric: string;
  target: string;
  enabled: boolean;
  cooldown: number;
}

export interface AlertHistoryItem {
  id: string;
  ruleId: string;
  condition: string;
  triggeredAt: string;
  value: number;
  sent: boolean;
  error?: string;
}

// ==================== AUDIT ====================

export interface DashboardAuditLog {
  id: string;
  userId: string;
  username: string;
  guildId?: string;
  action: string;
  resource: string;
  payload: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
}

// ==================== WEBSOCKET ====================

export interface LogStreamMessage {
  type: 'log' | 'error' | 'stats' | 'ping';
  timestamp: string;
  data: unknown;
}

export interface WebSocketEvent {
  event: string;
  payload: unknown;
}
