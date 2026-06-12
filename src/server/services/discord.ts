/**
 * Chibi Bot Dashboard - Discord API Service
 * Handles all Discord API interactions: OAuth2 token exchange,
 * user profile fetching, and guild listing.
 */

import type {
  DiscordUser,
  DiscordGuild,
  DiscordTokenResponse,
} from '../types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Sleep helper for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for Discord API rate limits (429).
 * Retries up to 3 times with exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      // Rate limited — check Retry-After header or use exponential backoff
      const retryAfter = response.headers.get('retry-after');
      const delayMs = retryAfter
        ? parseFloat(retryAfter) * 1000
        : Math.pow(2, attempt) * 1000 + Math.random() * 500;

      console.warn(
        `[Discord] Rate limited (429), attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${Math.round(delayMs)}ms`
      );

      if (attempt < maxRetries) {
        await sleep(delayMs);
        continue;
      }
    }

    return response;
  }

  // Should not reach here, but satisfy TypeScript
  throw new DiscordApiError('Max retries exceeded', 429);
}

/**
 * Exchange an OAuth2 authorization code for access/refresh tokens.
 * This must be done server-side to keep the client secret secure.
 */
export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new DiscordApiError(
      `Token exchange failed: ${error}`,
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordTokenResponse;
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new DiscordApiError(
      `Token refresh failed: ${error}`,
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordTokenResponse;
}

/**
 * Fetch the authenticated user's Discord profile.
 */
export async function fetchDiscordUser(
  accessToken: string
): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new DiscordApiError(
      'Failed to fetch user profile',
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordUser;
}

/**
 * Fetch the list of guilds the authenticated user belongs to.
 * Each guild object includes the user's permissions bitfield.
 */
export async function fetchUserGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  const response = await fetchWithRetry(
    `${DISCORD_API_BASE}/users/@me/guilds`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new DiscordApiError(
      'Failed to fetch user guilds',
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordGuild[];
}

/**
 * Fetch all guilds the bot is a member of.
 * Uses the bot token to get the bot's guild list.
 */
export async function fetchBotGuilds(botToken: string): Promise<Set<string>> {
  const response = await fetchWithRetry(
    `${DISCORD_API_BASE}/users/@me/guilds`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error('[Discord] Failed to fetch bot guilds:', response.status);
    return new Set();
  }

  const data = await response.json();
  return new Set((data as DiscordGuild[]).map((g) => g.id));
}

/**
 * Fetch detailed guild information from the bot's perspective.
 * Requires the bot to be a member of the guild.
 */
export async function fetchBotGuild(
  guildId: string,
  botToken: string
): Promise<DiscordGuild | null> {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new DiscordApiError(
      'Failed to fetch guild info',
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordGuild | null;
}

/**
 * Fetch text channels for a guild (bot perspective).
 */
export async function fetchGuildChannels(
  guildId: string,
  botToken: string
): Promise<DiscordGuildChannel[]> {
  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/channels`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new DiscordApiError(
      'Failed to fetch guild channels',
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordGuildChannel[];
}

/**
 * Fetch roles for a guild (bot perspective).
 */
export async function fetchGuildRoles(
  guildId: string,
  botToken: string
): Promise<DiscordRole[]> {
  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/roles`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new DiscordApiError(
      'Failed to fetch guild roles',
      response.status
    );
  }

  const data = await response.json();
  return data as DiscordRole[];
}

// ==================== Discord API Sub-types ====================

export interface DiscordGuildChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  name?: string;
  topic?: string | null;
  nsfw?: boolean;
  parent_id?: string | null;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

/**
 * Fetch the bot's member object in a guild — shows the bot's actual server-level permissions.
 * Also returns the guild's owner info for context.
 */
export async function fetchBotMemberInGuild(
  guildId: string,
  botToken: string
): Promise<{ botMember: { id: string; roles: string[]; permissions: string }; guildOwnerId: string; guildName: string } | null> {
  // Decode bot token to get bot user ID
  const botId = getBotIdFromToken(botToken);
  if (!botId) return null;

  try {
    // Fetch the bot's member object in the guild
    const memberRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${botId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );

    if (!memberRes.ok) return null;
    const member = await memberRes.json() as { id?: string; roles?: string[]; permissions?: string };

    // Fetch guild info for owner
    const guildRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );

    if (!guildRes.ok) return null;
    const guild = await guildRes.json() as { owner_id?: string; name?: string };

    return {
      botMember: {
        id: member.id || botId,
        roles: member.roles || [],
        permissions: member.permissions || '0',
      },
      guildOwnerId: guild.owner_id || '',
      guildName: guild.name || '',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the bot's application info — includes the list of OAuth2 scopes the bot was invited with.
 */
export async function fetchBotApplicationInfo(botToken: string): Promise<{
  id: string;
  name: string;
  icon: string | null;
  botPublic: boolean;
  botRequireCodeGrant: boolean;
  verifyKey: string;
  flags: number;
}> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/applications/@me`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!response.ok) {
    throw new DiscordApiError('Failed to fetch bot application info', response.status);
  }

  const data = await response.json();
  return data as unknown as {
    id: string;
    name: string;
    icon: string | null;
    botPublic: boolean;
    botRequireCodeGrant: boolean;
    verifyKey: string;
    flags: number;
  };
}

/**
 * Extract bot user ID from a bot token (first part before the first dot, base64-decoded).
 */
function getBotIdFromToken(botToken: string): string | null {
  try {
    const parts = botToken.split('.');
    if (parts.length < 1) return null;
    const decoded = Buffer.from(parts[0], 'base64').toString('utf-8');
    return decoded || null;
  } catch {
    return null;
  }
}

// ==================== Error Class ====================

export class DiscordApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DiscordApiError';
    this.status = status;
  }
}
