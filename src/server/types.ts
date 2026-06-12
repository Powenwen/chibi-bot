/**
 * Chibi Bot Dashboard - Server Types
 * Type definitions for the backend server, including session data
 * and Express request extensions.
 */

import type { Session } from 'express-session';

// ==================== Discord API Types ====================

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// ==================== Session Types ====================

export interface DashboardSessionData {
  userId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  isDeveloper: boolean;
}

export interface DashboardSession extends Session {
  data?: DashboardSessionData;
}

// ==================== API Response Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  retryAfter?: number;
}

// ==================== Express Request Extensions ====================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DashboardSessionData;
    }
  }
}
