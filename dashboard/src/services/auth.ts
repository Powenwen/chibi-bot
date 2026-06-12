/**
 * Chibi Bot Dashboard - Authentication Service
 * Handles Discord OAuth2 flow and session management.
 *
 * OAuth Flow:
 *   1. User clicks login → redirect to backend GET /auth/discord
 *   2. Backend redirects to Discord OAuth
 *   3. Discord redirects to backend GET /auth/discord/callback
 *   4. Backend creates session, redirects to dashboard
 *   5. Dashboard calls GET /auth/me to get user info
 */

import type { DashboardUser, DiscordGuild } from '../types/api';
import { apiClient } from './api';

/**
 * Redirect to the backend's Discord OAuth2 login endpoint.
 * The backend handles the full OAuth flow server-side.
 */
export function loginWithDiscord(): void {
  sessionStorage.setItem('auth_redirect', window.location.pathname);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  window.location.href = `${baseUrl}/auth/discord`;
}

/**
 * Get current authenticated user from the backend session.
 */
export async function getCurrentUser(): Promise<DashboardUser | null> {
  try {
    console.log('[Auth] Calling /auth/me...');
    const response = await apiClient.get('/auth/me');
    console.log('[Auth] /auth/me response:', response.status, response.data);
    return response.data.data;
  } catch (err: any) {
    console.error('[Auth] getCurrentUser failed:', err.response?.status, err.response?.data || err.message);
    return null;
  }
}

/**
 * Get the list of guilds the user can manage.
 */
export async function getUserGuilds(): Promise<DiscordGuild[]> {
  try {
    console.log('[Auth] Calling /auth/guilds...');
    const response = await apiClient.get('/auth/guilds');
    console.log('[Auth] /auth/guilds response:', response.status, 'guilds:', response.data.data?.guilds?.length);
    return response.data.data?.guilds || [];
  } catch (err: any) {
    console.error('[Auth] getUserGuilds failed:', err.response?.status, err.response?.data || err.message);
    return [];
  }
}

/**
 * Session status check
 */
export async function checkSession(): Promise<boolean> {
  try {
    console.log('[Auth] Checking session...');
    const response = await apiClient.get('/auth/me', { timeout: 5000 });
    console.log('[Auth] Session check result:', response.status, response.data?.success);
    return response.status === 200 && response.data.success;
  } catch (err: any) {
    console.log('[Auth] Session check failed:', err.response?.status || err.message);
    return false;
  }
}

/**
 * Logout — destroy the server session.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    sessionStorage.removeItem('auth_redirect');
  }
}

/**
 * Refresh the Discord access token.
 */
export async function refreshToken(): Promise<void> {
  await apiClient.post('/auth/refresh');
}

/**
 * Check if user has permission to manage a guild.
 */
export function hasManageGuildPermission(permissions: number): boolean {
  const ADMINISTRATOR = 0x8;
  const MANAGE_GUILD = 0x20;
  return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}

/**
 * Filter guilds to only those the user can manage.
 */
export function filterManageableGuilds(guilds: DiscordGuild[]): DiscordGuild[] {
  return guilds.filter((guild) => hasManageGuildPermission(guild.permissions));
}

/**
 * Permission bitfield helpers
 */
export const Permissions = {
  ADMINISTRATOR: 0x00000008,
  MANAGE_GUILD: 0x00000020,
  MANAGE_CHANNELS: 0x00000010,
  MANAGE_MESSAGES: 0x00002000,
  MANAGE_ROLES: 0x10000000,
  KICK_MEMBERS: 0x00000002,
  BAN_MEMBERS: 0x00000004,
  MODERATE_MEMBERS: 0x00000100,
  VIEW_AUDIT_LOG: 0x00000080,
} as const;

/**
 * Check specific permission
 */
export function hasPermission(permissions: number, permission: number): boolean {
  return (permissions & permission) === permission;
}

/**
 * Get Discord avatar URL
 */
export function getDiscordAvatarUrl(userId: string, avatar: string | null, discriminator?: string): string {
  if (avatar) {
    const format = avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${format}?size=256`;
  }
  const defaultIndex = discriminator ? parseInt(discriminator) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

/**
 * Get Discord guild icon URL
 */
export function getGuildIconUrl(guildId: string, icon: string | null): string {
  if (icon) {
    return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=256`;
  }
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}
