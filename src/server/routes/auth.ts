/**
 * Chibi Bot Dashboard - Authentication Routes
 * Handles Discord OAuth2 login, callback, session management, and logout.
 */

import { Router, type Request, type Response } from 'express';
import {
  exchangeCode,
  refreshAccessToken,
  fetchDiscordUser,
  fetchUserGuilds,
  fetchBotGuilds,
} from '../services/discord';
import {
  setSessionData,
  getSessionData,
  saveSession,
  destroySession,
  cacheGetGuilds,
  cacheSetGuilds,
} from '../services/session';
import { authRateLimit } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';
import type { DashboardSessionData } from '../types';

const router = Router();

const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const BOT_TOKEN = process.env.TOKEN || '';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const OWNER_IDS: string[] = process.env.OWNER_IDS
  ? JSON.parse(process.env.OWNER_IDS)
  : [];

/**
 * GET /auth/discord
 * Redirects to Discord OAuth2 authorization page.
 */
router.get('/auth/discord', authRateLimit, (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${SERVER_URL}/auth/discord/callback`,
    response_type: 'code',
    scope: 'identify guilds guilds.members.read',
    prompt: 'consent',
  });

  res.redirect(`https://discord.com/api/v10/oauth2/authorize?${params.toString()}`);
});

/**
 * GET /auth/discord/callback
 * Handles the OAuth2 callback from Discord.
 * Exchanges code for tokens, creates session, redirects to dashboard.
 */
router.get(
  '/auth/discord/callback',
  authRateLimit,
  async (req: Request, res: Response) => {
    const { code, error } = req.query;

    if (error) {
      console.log('[Auth] callback error:', error);
      res.redirect(`${DASHBOARD_URL}/?auth_error=${error}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      console.log('[Auth] callback: missing code');
      res.redirect(`${DASHBOARD_URL}/?auth_error=missing_code`);
      return;
    }

    try {
      console.log('[Auth] callback: exchanging code...');
      const tokenData = await exchangeCode(
        code,
        CLIENT_ID,
        CLIENT_SECRET,
        `${SERVER_URL}/auth/discord/callback`
      );
      console.log('[Auth] callback: token exchange ok');

      const discordUser = await fetchDiscordUser(tokenData.access_token);
      console.log('[Auth] callback: user =', discordUser.username, discordUser.id);

      const sessionData: DashboardSessionData = {
        userId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: Date.now() + tokenData.expires_in * 1000,
        isDeveloper: OWNER_IDS.includes(discordUser.id),
      };

      setSessionData(req, sessionData);
      console.log('[Auth] callback: session data set, saving...');

      await saveSession(req);
      console.log('[Auth] callback: session saved, redirecting to dashboard');

      res.redirect(`${DASHBOARD_URL}/#/dashboard`);
    } catch (err) {
      console.error('[Auth] callback error:', err);
      res.redirect(`${DASHBOARD_URL}/?auth_error=server_error`);
    }
  }
);

/**
 * GET /auth/me
 * Returns the current authenticated user's profile.
 */
router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const sessionData = getSessionData(req);

  if (!sessionData) {
    console.log('[Auth] /auth/me: no session data found');
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No active session',
    });
    return;
  }

  console.log('[Auth] /auth/me: returning user', sessionData.userId, sessionData.username);
  res.json({
    success: true,
    data: {
      id: sessionData.userId,
      username: sessionData.username,
      discriminator: sessionData.discriminator,
      avatar: sessionData.avatar,
      avatarUrl: sessionData.avatar
        ? `https://cdn.discordapp.com/avatars/${sessionData.userId}/${sessionData.avatar}.${sessionData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${(parseInt(sessionData.userId) % 5)}.png`,
      role: sessionData.isDeveloper ? 'developer' : 'user',
    },
  });
});

/**
 * POST /auth/logout
 * Destroys the current session.
 */
router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    await destroySession(req);
  } catch (err) {
    console.error('[Logout Error]', err);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /auth/refresh
 * Refreshes the Discord access token using the stored refresh token.
 */
router.post('/auth/refresh', requireAuth, async (req: Request, res: Response) => {
  const sessionData = getSessionData(req);

  if (!sessionData) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No active session',
    });
    return;
  }

  try {
    const tokenData = await refreshAccessToken(
      sessionData.refreshToken,
      CLIENT_ID,
      CLIENT_SECRET
    );

    // Update session with new tokens
    const updatedData: DashboardSessionData = {
      ...sessionData,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    setSessionData(req, updatedData);

    res.json({
      success: true,
      message: 'Token refreshed',
    });
  } catch (err) {
    console.error('[Token Refresh Error]', err);
    res.status(401).json({
      success: false,
      error: 'RefreshFailed',
      message: 'Failed to refresh token. Please log in again.',
    });
  }
});

/**
 * GET /auth/guilds
 * Returns mutual guilds (user + bot) with permission info.
 */
router.get('/auth/guilds', requireAuth, async (req: Request, res: Response) => {
  const sessionData = getSessionData(req);

  if (!sessionData) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  try {
    console.log('[Auth] /auth/guilds: fetching for user', sessionData.userId);

    // Check cache first to avoid Discord rate limits
    const cached = await cacheGetGuilds(sessionData.userId);
    if (cached) {
      console.log('[Auth] /auth/guilds: cache hit');
      res.json(JSON.parse(cached));
      return;
    }
    console.log('[Auth] /auth/guilds: cache miss, fetching from Discord...');

    // Fetch user's guilds from Discord
    const userGuilds = await fetchUserGuilds(sessionData.accessToken);
    console.log('[Auth] /auth/guilds: fetched', userGuilds.length, 'user guilds');

    // Fetch bot's guilds to cross-reference
    const botGuildIds = await fetchBotGuilds(BOT_TOKEN);
    console.log('[Auth] /auth/guilds: bot is in', botGuildIds.size, 'guilds');

    // Filter to guilds where user has MANAGE_GUILD or ADMINISTRATOR
    // Use BigInt because Discord permission integers can exceed 32-bit range
    const ADMINISTRATOR = BigInt(0x8);
    const MANAGE_GUILD = BigInt(0x20);

    const manageableGuilds = userGuilds.filter((guild) => {
      // Owner always has full permissions
      if (guild.owner) {
        console.log(`[Auth] guild ${guild.name}: owner=true (auto-include)`);
        return true;
      }
      const perms = BigInt(guild.permissions);
      const isAdmin = (perms & ADMINISTRATOR) === ADMINISTRATOR;
      const isManage = (perms & MANAGE_GUILD) === MANAGE_GUILD;
      console.log(`[Auth] guild ${guild.name} (${guild.id}): perms=${guild.permissions}, admin=${isAdmin}, manage=${isManage}`);
      return isAdmin || isManage;
    });

    console.log('[Auth] /auth/guilds:', manageableGuilds.length, 'manageable guilds');

    const responseData = {
      success: true,
      data: {
        guilds: manageableGuilds.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          permissions: g.permissions,
          botInGuild: botGuildIds.has(g.id),
        })),
      },
    };

    // Cache the response for 5 minutes
    await cacheSetGuilds(sessionData.userId, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err) {
    console.error('[Auth] /auth/guilds error:', err);
    res.status(500).json({
      success: false,
      error: 'FailedToFetchGuilds',
      message: 'Could not fetch guild list from Discord',
    });
  }
});

export default router;
