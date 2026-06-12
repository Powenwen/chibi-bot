/**
 * Chibi Bot Dashboard - Bot Internal API Client
 * Communicates with the bot's exposed REST API
 * 
 * All routes require X-Dashboard-Secret header
 * This API should NEVER be called from the browser directly
 */

import axios, { AxiosInstance } from 'axios';
import type { BotStats, GuildInfo, GuildChannel, GuildRole } from '../types/api';

// Bot internal API configuration
const BOT_API_BASE_URL = process.env.BOT_API_BASE_URL || 'http://localhost:3001';
const BOT_API_SECRET = process.env.BOT_API_SECRET || '';

/**
 * Create bot API client with shared secret authentication
 */
function createBotApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BOT_API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Dashboard-Secret': BOT_API_SECRET,
    },
  });

  // Response interceptor for bot API specific errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Bot API authentication failed - check BOT_API_SECRET');
      }
      if (error.response?.status === 503) {
        console.error('Bot process is offline or unreachable');
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const botApiClient = createBotApiClient();

// ==================== BOT STATS ====================

/**
 * GET /api/stats
 * Returns bot runtime statistics
 */
export async function getBotStats(): Promise<BotStats> {
  const response = await botApiClient.get('/api/stats');
  return response.data;
}

// ==================== GUILD INFO ====================

/**
 * GET /api/guilds/:guildId
 * Returns guild information from Discord
 */
export async function getGuildInfo(guildId: string): Promise<GuildInfo> {
  const response = await botApiClient.get(`/api/guilds/${guildId}`);
  return response.data;
}

/**
 * GET /api/guilds/:guildId/channels
 * Returns guild channels list
 */
export async function getGuildChannels(guildId: string): Promise<GuildChannel[]> {
  const response = await botApiClient.get(`/api/guilds/${guildId}/channels`);
  return response.data;
}

/**
 * GET /api/guilds/:guildId/roles
 * Returns guild roles list
 */
export async function getGuildRoles(guildId: string): Promise<GuildRole[]> {
  const response = await botApiClient.get(`/api/guilds/${guildId}/roles`);
  return response.data;
}

/**
 * POST /api/guilds/:guildId/reload
 * Hot-reload config for a guild
 */
export async function reloadGuildConfig(guildId: string): Promise<{ success: boolean }> {
  const response = await botApiClient.post(`/api/guilds/${guildId}/reload`);
  return response.data;
}

// ==================== WELCOME SYSTEM ====================

/**
 * POST /api/guilds/:guildId/welcome/test
 * Send a test welcome message
 */
export async function sendTestWelcome(
  guildId: string,
  channelId: string,
  config: {
    messageTemplate: string;
    useEmbed: boolean;
    embedTitle?: string;
    embedDescription?: string;
    embedColor?: string;
    embedThumbnail?: boolean;
    embedFooter?: string;
  }
): Promise<{ success: boolean; messageId?: string }> {
  const response = await botApiClient.post(`/api/guilds/${guildId}/welcome/test`, {
    channelId,
    ...config,
  });
  return response.data;
}

// ==================== UTILITY ====================

/**
 * Check bot API health
 */
export async function checkBotApiHealth(): Promise<{ status: string; ping: number }> {
  const start = Date.now();
  const response = await botApiClient.get('/health', { timeout: 5000 });
  return {
    status: response.data.status,
    ping: Date.now() - start,
  };
}

/**
 * Get bot process info
 */
export async function getBotProcessInfo(): Promise<{
  pid: number;
  uptime: number;
  version: string;
  nodeVersion: string;
  platform: string;
}> {
  const response = await botApiClient.get('/api/process');
  return response.data;
}

// ==================== DISCORD API PROXY ====================

/**
 * Proxy Discord API calls through the bot
 * Used for operations the dashboard backend can't do directly
 */
export async function proxyDiscordApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await botApiClient.request({
    method,
    url: `/proxy/discord${endpoint}`,
    data: body,
  });
  return response.data;
}

// ==================== WEBHOOK MANAGEMENT ====================

/**
 * Send alert via Discord webhook
 */
export async function sendWebhookAlert(
  webhookUrl: string,
  payload: {
    content?: string;
    embeds?: Array<{
      title: string;
      description: string;
      color: number;
      timestamp?: string;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    }>;
  }
): Promise<{ success: boolean }> {
  const response = await botApiClient.post('/api/webhook/send', {
    url: webhookUrl,
    payload,
  });
  return response.data;
}

// ==================== EXPORT ====================

export { botApiClient };
