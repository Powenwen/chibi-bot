/**
 * Chibi Bot Dashboard - Guild Data Service
 * Fetches guild-related data from the backend API.
 */

import type { GuildChannel, GuildRole } from '../types/api';
import { get, post, put, del } from './api';

// ==================== Feature Toggles ====================

export interface FeatureStates {
  welcome: boolean;
  sticky: boolean;
  autoreactions: boolean;
  autoresponder: boolean;
  suggestions: boolean;
  automod: boolean;
}

/**
 * Get enabled status for all features in a guild.
 */
export async function getFeatureStates(guildId: string): Promise<FeatureStates> {
  const data = await get<{ features: FeatureStates }>(`/api/guilds/${guildId}/features`);
  return data.features;
}

/**
 * Toggle a feature on/off for a guild.
 */
export async function toggleFeature(guildId: string, feature: string, enabled: boolean): Promise<{ feature: string; enabled: boolean }> {
  const data = await put<{ feature: string; enabled: boolean }>(`/api/guilds/${guildId}/features/${feature}`, { enabled });
  return data;
}

// ==================== Guild Info ====================

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

/**
 * Get guild channels from the bot's perspective.
 */
export async function getGuildChannels(guildId: string): Promise<GuildChannel[]> {
  const data = await get<{ channels: GuildChannel[] }>(`/api/guilds/${guildId}/channels`);
  return data.channels;
}

/**
 * Get guild roles from the bot's perspective.
 */
export async function getGuildRoles(guildId: string): Promise<GuildRole[]> {
  const data = await get<{ roles: GuildRole[] }>(`/api/guilds/${guildId}/roles`);
  return data.roles;
}

// ==================== Bot Permissions ====================

export interface BotPermissionInfo {
  botInGuild: boolean;
  botPermissions: string;
  botRoles: string[];
  guildOwnerId: string;
  guildName: string;
  hasAdministrator: boolean;
  missingPermissions: string[];
  requiredPermissions: string[];
}

/**
 * Get the bot's actual permissions in a guild (from member object + roles).
 */
export async function getBotPermissions(guildId: string): Promise<BotPermissionInfo> {
  const data = await get<BotPermissionInfo>(`/api/guilds/${guildId}/bot-permissions`);
  return data;
}

// ==================== Welcome System ====================

export interface WelcomeConfig {
  guildID: string;
  channelID: string;
  enabled: boolean;
  embed: {
    title: string;
    description: string;
    color: string;
    thumbnail: boolean;
    thumbnailUrl: string;
    image: boolean;
    imageUrl: string;
    author: { enabled: boolean; name: string; iconUrl: string; url: string };
    footer: { enabled: boolean; text: string; iconUrl: string; timestamp: boolean };
    fields: Array<{ name: string; value: string; inline: boolean }>;
    timestamp: boolean;
  };
  dmEnabled: boolean;
  dmMessage: string;
  roleEnabled: boolean;
  roleIDs: string[];
  type: string;
  message: string;
  useEmbed?: boolean;
}

export async function getWelcomeConfig(guildId: string): Promise<WelcomeConfig | null> {
  const data = await get<{ config: WelcomeConfig | null }>(`/api/guilds/${guildId}/welcome`);
  return data.config;
}

export async function updateWelcomeConfig(guildId: string, config: Partial<WelcomeConfig>): Promise<WelcomeConfig> {
  const data = await put<{ config: WelcomeConfig }>(`/api/guilds/${guildId}/welcome`, config);
  return data.config;
}

// ==================== Sticky Messages ====================

export interface StickyMessage {
  _id: string;
  guildID: string;
  channelID: string;
  messageID: string;
  messageChannelID: string;
  uniqueID: string;
  authorID: string;
  title: string;
  content: string;
  color: string;
  description: string;
  thumbnailUrl: string;
  imageUrl: string;
  footer: { text: string; iconUrl: string };
  author: { name: string; iconUrl: string; url: string };
  fields: Array<{ name: string; value: string; inline: boolean }>;
  timestamp: boolean;
  embedID: string;
  maxMessageCount: number;
  mode: 'message-count' | 'interval' | 'persistent';
  intervalSeconds: number;
  enabled: boolean;
  mentionRoleID: string;
  createdAt: string;
  updatedAt: string;
}

export async function getStickyMessages(guildId: string): Promise<StickyMessage[]> {
  const data = await get<{ messages: StickyMessage[] }>(`/api/guilds/${guildId}/sticky`);
  return data.messages;
}

export async function createStickyMessage(guildId: string, message: Partial<StickyMessage>): Promise<StickyMessage> {
  const data = await post<{ message: StickyMessage }>(`/api/guilds/${guildId}/sticky`, message);
  return data.message;
}

export async function updateStickyMessage(guildId: string, id: string, message: Partial<StickyMessage>): Promise<StickyMessage> {
  const data = await put<{ message: StickyMessage }>(`/api/guilds/${guildId}/sticky/${id}`, message);
  return data.message;
}

export async function deleteStickyMessage(guildId: string, id: string): Promise<void> {
  await del(`/api/guilds/${guildId}/sticky/${id}`);
}

// ==================== Auto-Reactions ====================

export interface AutoReactionRule {
  _id: string;
  guildID: string;
  channelID: string;
  emojis: Array<{
    emojiID?: string;
    name: string;
    animated: boolean;
    isUnicode: boolean;
    raw: string;
  }>;
  authorID: string;
  cooldown: number;
  ignoreBots: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAutoReactions(guildId: string): Promise<AutoReactionRule[]> {
  const data = await get<{ rules: AutoReactionRule[] }>(`/api/guilds/${guildId}/autoreactions`);
  return data.rules;
}

export async function createAutoReaction(guildId: string, rule: Partial<AutoReactionRule>): Promise<AutoReactionRule> {
  const data = await post<{ rule: AutoReactionRule }>(`/api/guilds/${guildId}/autoreactions`, rule);
  return data.rule;
}

export async function updateAutoReaction(guildId: string, id: string, rule: Partial<AutoReactionRule>): Promise<AutoReactionRule> {
  const data = await put<{ rule: AutoReactionRule }>(`/api/guilds/${guildId}/autoreactions/${id}`, rule);
  return data.rule;
}

export async function deleteAutoReaction(guildId: string, id: string): Promise<void> {
  await del(`/api/guilds/${guildId}/autoreactions/${id}`);
}

// ==================== Auto-Responder ====================

export interface AutoResponderRule {
  _id: string;
  guildID: string;
  channelID: string;
  trigger: string;
  response: string;
  authorID: string;
  caseSensitive: boolean;
  exactMatch: boolean;
  useRegex: boolean;
  useEmbed: boolean;
  embedTitle?: string;
  embedColor?: string;
  cooldown: number;
  responseDelay: number;
  suppressMentions: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAutoResponders(guildId: string): Promise<AutoResponderRule[]> {
  const data = await get<{ rules: AutoResponderRule[] }>(`/api/guilds/${guildId}/autoresponders`);
  return data.rules;
}

export async function createAutoResponder(guildId: string, rule: Partial<AutoResponderRule>): Promise<AutoResponderRule> {
  const data = await post<{ rule: AutoResponderRule }>(`/api/guilds/${guildId}/autoresponders`, rule);
  return data.rule;
}

export async function updateAutoResponder(guildId: string, id: string, rule: Partial<AutoResponderRule>): Promise<AutoResponderRule> {
  const data = await put<{ rule: AutoResponderRule }>(`/api/guilds/${guildId}/autoresponders/${id}`, rule);
  return data.rule;
}

export async function deleteAutoResponder(guildId: string, id: string): Promise<void> {
  await del(`/api/guilds/${guildId}/autoresponders/${id}`);
}

// ==================== Suggestions ====================

export interface SuggestionChannelConfig {
  guildID: string;
  channelID: string;
  enabled: boolean;
  emojis: { upvote: string; downvote: string };
  categories: string[];
  defaultCategory: string;
  cooldown: number;
  requiredRoleID: string;
  blockedRoleID: string;
  autoThread: boolean;
  maxSuggestionsPerUser: number;
  notifyRoleID: string;
  dmOnResponse: boolean;
}

export async function getSuggestionConfig(guildId: string): Promise<SuggestionChannelConfig | null> {
  const data = await get<{ config: SuggestionChannelConfig | null }>(`/api/guilds/${guildId}/suggestions/config`);
  return data.config;
}

export async function updateSuggestionConfig(guildId: string, config: Partial<SuggestionChannelConfig>): Promise<SuggestionChannelConfig> {
  const data = await put<{ config: SuggestionChannelConfig }>(`/api/guilds/${guildId}/suggestions/config`, config);
  return data.config;
}

export interface SuggestionItem {
  _id: string;
  guildID: string;
  channelID?: string;
  messageID?: string;
  suggestionID?: string;
  suggestion: string;
  authorID: string;
  authorName?: string;
  status: string;
  response?: string;
  responseAuthorID?: string;
  category?: string;
  anonymous?: boolean;
  priority?: string;
  attachmentUrl?: string;
  notes?: string;
  upvotes: string[];
  downvotes: string[];
  implementedAt?: string;
  implementedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSuggestions(
  guildId: string,
  options?: { status?: string; page?: number; limit?: number }
): Promise<{ suggestions: SuggestionItem[]; meta: { page: number; limit: number; total: number; pages: number } }> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/api/guilds/${guildId}/suggestions${query}`);
}

export async function approveSuggestion(guildId: string, id: string, reason?: string): Promise<SuggestionItem> {
  const data = await post<{ suggestion: SuggestionItem }>(`/api/guilds/${guildId}/suggestions/${id}/approve`, { reason });
  return data.suggestion;
}

export async function denySuggestion(guildId: string, id: string, reason?: string): Promise<SuggestionItem> {
  const data = await post<{ suggestion: SuggestionItem }>(`/api/guilds/${guildId}/suggestions/${id}/deny`, { reason });
  return data.suggestion;
}

// ==================== Auto-Moderation ====================

export interface AutoModConfig {
  guildID: string;
  enabled: boolean;
  antiSpam: {
    enabled: boolean;
    maxMessages: number;
    timeWindow: number;
    muteTime: number;
    ignoreRoles: string[];
    ignoreChannels: string[];
  };
  wordFilter: {
    enabled: boolean;
    words: string[];
    action: 'delete' | 'warn' | 'mute' | 'kick';
    whitelist: string[];
  };
  linkFilter: {
    enabled: boolean;
    allowedDomains: string[];
    action: 'delete' | 'warn' | 'mute';
    bypassRoles: string[];
  };
  raidProtection: {
    enabled: boolean;
    joinThreshold: number;
    timeWindow: number;
    action: 'kick' | 'ban';
    lockdownTime: number;
  };
  duplicateFilter: {
    enabled: boolean;
    maxDuplicates: number;
    timeWindow: number;
    action: 'delete' | 'warn' | 'mute';
  };
  caps: {
    enabled: boolean;
    percentage: number;
    minLength: number;
    action: 'delete' | 'warn';
  };
}

export async function getAutoModConfig(guildId: string): Promise<AutoModConfig | null> {
  const data = await get<{ config: AutoModConfig | null }>(`/api/guilds/${guildId}/automod`);
  return data.config;
}

export async function updateAutoModConfig(guildId: string, config: Partial<AutoModConfig>): Promise<AutoModConfig> {
  const data = await put<{ config: AutoModConfig }>(`/api/guilds/${guildId}/automod`, config);
  return data.config;
}

// ==================== Warning Escalations ====================

export interface EscalationRule {
  warningCount: number;
  action: 'timeout' | 'mute' | 'kick' | 'ban';
  duration?: number;
  reason: string;
  deleteMessages?: number;
}

export async function getEscalationRules(guildId: string): Promise<{ rules: EscalationRule[]; enabled: boolean }> {
  return get(`/api/guilds/${guildId}/escalations`);
}

export async function addEscalationRule(guildId: string, rule: EscalationRule): Promise<{ rules: EscalationRule[] }> {
  return post(`/api/guilds/${guildId}/escalations`, rule);
}

export async function updateEscalationRule(guildId: string, index: number, rule: Partial<EscalationRule>): Promise<{ rules: EscalationRule[] }> {
  return put(`/api/guilds/${guildId}/escalations/${index}`, rule);
}

export async function deleteEscalationRule(guildId: string, index: number): Promise<{ rules: EscalationRule[] }> {
  const data = await del<{ rules: EscalationRule[] }>(`/api/guilds/${guildId}/escalations/${index}`);
  return data || { rules: [] };
}

export async function reorderEscalationRules(guildId: string, order: number[]): Promise<{ rules: EscalationRule[] }> {
  return post(`/api/guilds/${guildId}/escalations/reorder`, { order });
}

// ==================== Moderation Logs ====================

export interface ModerationCase {
  _id: string;
  caseID: string;
  guildID: string;
  userID: string;
  moderatorID: string;
  type: 'warn' | 'mute' | 'kick' | 'ban' | 'unban' | 'timeout';
  reason: string;
  duration?: number;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  evidence?: string[];
}

export async function getModLogs(
  guildId: string,
  options?: { action?: string; moderatorId?: string; targetUserId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }
): Promise<{ logs: ModerationCase[]; meta: { page: number; limit: number; total: number; pages: number } }> {
  const params = new URLSearchParams();
  if (options?.action) params.set('action', options.action);
  if (options?.moderatorId) params.set('moderatorId', options.moderatorId);
  if (options?.targetUserId) params.set('targetUserId', options.targetUserId);
  if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
  if (options?.dateTo) params.set('dateTo', options.dateTo);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return get(`/api/guilds/${guildId}/modlogs${query}`);
}

export async function getModLogCase(guildId: string, caseId: string): Promise<ModerationCase> {
  const data = await get<{ log: ModerationCase }>(`/api/guilds/${guildId}/modlogs/${caseId}`);
  return data.log;
}

export interface ModLogConfig {
  guildID: string;
  channelID?: string;
  auditLog: { enabled: boolean; channelID?: string; events: string[] };
  autoModLog: { enabled: boolean; channelID?: string };
  joinLeaveLog: { enabled: boolean; channelID?: string };
}

export async function getModLogConfig(guildId: string): Promise<ModLogConfig | null> {
  const data = await get<{ config: ModLogConfig | null }>(`/api/guilds/${guildId}/modlogs/config`);
  return data.config;
}

export async function updateModLogConfig(guildId: string, config: Partial<ModLogConfig>): Promise<ModLogConfig> {
  const data = await put<{ config: ModLogConfig }>(`/api/guilds/${guildId}/modlogs/config`, config);
  return data.config;
}

// ==================== Developer ====================

export interface BotStats {
  moderation: { totalCases: number; activeWarnings: number };
  features: {
    welcomeSystems: number;
    stickyMessages: number;
    autoReactions: number;
    autoResponders: number;
    suggestionChannels: number;
    autoModConfigs: number;
    escalationConfigs: number;
  };
  uptime: number;
  memory: Record<string, number>;
  timestamp: string;
}

export async function getBotStats(): Promise<BotStats> {
  const data = await get<{ stats: BotStats }>('/api/dev/stats');
  return data.stats;
}

export interface ServiceHealth {
  name: string;
  status: string;
  uptime?: number;
}

export async function getHealthStatus(): Promise<ServiceHealth[]> {
  const data = await get<{ services: ServiceHealth[] }>('/api/dev/health');
  return data.services;
}

// ==================== Guild Overview ====================

export interface GuildOverview {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  channelCount: number;
  roleCount: number;
  botPermissions: string;
  features: string[];
}

/**
 * Get overview info for a specific guild.
 */
export async function getGuildOverview(guildId: string): Promise<GuildOverview | null> {
  const channels = await getGuildChannels(guildId);
  const roles = await getGuildRoles(guildId);
  return {
    id: guildId,
    name: '',
    icon: null,
    memberCount: 0,
    channelCount: channels.length,
    roleCount: roles.length,
    botPermissions: '0',
    features: [],
  };
}
