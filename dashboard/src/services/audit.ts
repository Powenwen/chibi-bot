/**
 * Chibi Bot Dashboard - Audit Logging Service
 * Logs all dashboard write operations for security and compliance
 * 
 * Every write operation from the dashboard is logged to the
 * 'dashboardaudit' MongoDB collection
 */

import type { DashboardAuditLog } from '../types/api';
import { apiClient } from './api';

// ==================== AUDIT ACTIONS ====================

export const AuditActions = {
  // Welcome system
  WELCOME_CONFIG_UPDATE: 'welcome.config.update',
  WELCOME_TEST_SENT: 'welcome.test.sent',
  
  // Sticky messages
  STICKY_CREATED: 'sticky.create',
  STICKY_UPDATED: 'sticky.update',
  STICKY_DELETED: 'sticky.delete',
  
  // Auto-reactions
  AUTOREACTION_CREATED: 'autoreaction.create',
  AUTOREACTION_UPDATED: 'autoreaction.update',
  AUTOREACTION_DELETED: 'autoreaction.delete',
  
  // Auto-responder
  AUTORESPONDER_CREATED: 'autoresponder.create',
  AUTORESPONDER_UPDATED: 'autoresponder.update',
  AUTORESPONDER_DELETED: 'autoresponder.delete',
  
  // Suggestions
  SUGGESTION_CONFIG_UPDATE: 'suggestion.config.update',
  SUGGESTION_APPROVED: 'suggestion.approve',
  SUGGESTION_DENIED: 'suggestion.deny',
  SUGGESTION_IMPLEMENTED: 'suggestion.implement',
  
  // Moderation
  AUTOMOD_CONFIG_UPDATE: 'automod.config.update',
  ESCALATION_CREATED: 'escalation.create',
  ESCALATION_UPDATED: 'escalation.update',
  ESCALATION_DELETED: 'escalation.delete',
  ESCALATION_REORDERED: 'escalation.reorder',
  
  // Server settings
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_RESET: 'settings.reset',
  AUTHUSER_ADDED: 'authuser.add',
  AUTHUSER_REMOVED: 'authuser.remove',
  
  // Developer actions
  DEV_GUILD_LEFT: 'dev.guild.leave',
  DEV_GUILD_RELOAD: 'dev.guild.reload',
  DEV_COMMANDS_REREGISTER: 'dev.commands.reregister',
  DEV_CACHE_CLEARED: 'dev.cache.clear',
  DEV_CONFIG_UPDATE: 'dev.config.update',
  DEV_USER_PROMOTED: 'dev.user.promote',
  DEV_USER_DEMOTED: 'dev.user.demote',
  DEV_USER_REVOKED: 'dev.user.revoke',
  DEV_ALERT_CREATED: 'dev.alert.create',
  DEV_ALERT_UPDATED: 'dev.alert.update',
  DEV_ALERT_DELETED: 'dev.alert.delete',
  DEV_MAINTENANCE_TOGGLE: 'dev.maintenance.toggle',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

// ==================== AUDIT RESOURCES ====================

export const AuditResources = {
  WELCOME_CONFIG: 'welcome_config',
  STICKY_MESSAGE: 'sticky_message',
  AUTO_REACTION: 'auto_reaction',
  AUTO_RESPONDER: 'auto_responder',
  SUGGESTION: 'suggestion',
  SUGGESTION_CONFIG: 'suggestion_config',
  AUTOMOD_CONFIG: 'automod_config',
  ESCALATION_RULE: 'escalation_rule',
  GUILD_SETTINGS: 'guild_settings',
  AUTHORIZED_USER: 'authorized_user',
  GUILD: 'guild',
  GLOBAL_CONFIG: 'global_config',
  ALERT_RULE: 'alert_rule',
  CACHE: 'cache',
  USER_ROLE: 'user_role',
} as const;

export type AuditResource = typeof AuditResources[keyof typeof AuditResources];

// ==================== AUDIT LOGGER ====================

export interface AuditLogEntry {
  action: AuditAction;
  resource: AuditResource;
  guildId?: string;
  resourceId?: string;
  payload: Record<string, unknown>;
  previousValue?: Record<string, unknown>;
}

/**
 * Log an audit event
 * In production, this sends to the backend which writes to MongoDB
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await apiClient.post('/api/audit/log', {
      action: entry.action,
      resource: entry.resource,
      guildId: entry.guildId,
      resourceId: entry.resourceId,
      payload: sanitizePayload(entry.payload),
      previousValue: entry.previousValue ? sanitizePayload(entry.previousValue) : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Sanitize payload to remove sensitive data before logging
 */
function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'webhookUrl', 'accessToken', 'refreshToken'];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  guildId?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{ logs: DashboardAuditLog[]; total: number }> {
  const response = await apiClient.get('/api/audit/logs', { params: filters });
  return response.data.data;
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(guildId?: string): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Array<{ userId: string; username: string; count: number }>;
  recentActivity: DashboardAuditLog[];
}> {
  const response = await apiClient.get('/api/audit/stats', { params: { guildId } });
  return response.data.data;
}


