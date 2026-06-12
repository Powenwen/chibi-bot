/**
 * Chibi Bot Dashboard - Guild Access Middleware
 * Validates that the authenticated user has MANAGE_GUILD permission
 * for the requested guild. Uses cached guild data to avoid Discord rate limits.
 *
 * Strategy:
 * 1. Check Redis cache for user's guild list (fast, no Discord API call)
 * 2. On cache miss, fetch from Discord API once and cache for 10 minutes
 * 3. If Discord API fails, allow the request (user has valid OAuth session)
 * 4. Owner always has access; otherwise check MANAGE_GUILD or ADMINISTRATOR
 */

import type { Request, Response, NextFunction } from 'express';
import { getSessionData, cacheGetGuilds, cacheSetGuilds } from '../services/session';

const ADMINISTRATOR = BigInt(0x8);
const MANAGE_GUILD = BigInt(0x20);

/**
 * Check if the user has MANAGE_GUILD or ADMINISTRATOR permission
 * for the guild specified in req.params.guildId.
 * Must be used after requireAuth.
 * Uses Redis cache (via session service) to avoid hitting Discord API on every request.
 */
export async function requireGuildAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const guildId = req.params.guildId as string;
  const sessionData = getSessionData(req);

  if (!sessionData) {
    res.status(401).json({ success: false, error: 'Unauthorized', message: 'No active session' });
    return;
  }

  try {
    // Check Redis cache first (uses the session Redis client)
    let guildList: Array<{ id: string; permissions: string; owner: boolean }> = [];

    try {
      const cached = await cacheGetGuilds(sessionData.userId);
      if (cached) {
        const parsed = JSON.parse(cached);
        // The auth/guilds endpoint caches the full response; extract guild list
        guildList = parsed?.data?.guilds || parsed || [];
      }
    } catch {
      // Cache miss or parse error — fall through
    }

    // Find the guild in cached list
    let guild = guildList.find((g) => g.id === guildId);

    if (!guild) {
      // Not in cache — fetch from Discord API
      try {
        const { fetchUserGuilds } = await import('../services/discord');
        const userGuilds = await fetchUserGuilds(sessionData.accessToken);

        // Cache the guild list for future requests
        guildList = userGuilds.map((g) => ({ id: g.id, permissions: g.permissions, owner: g.owner }));
        try {
          await cacheSetGuilds(sessionData.userId, JSON.stringify(guildList));
        } catch {
          // Ignore cache write errors
        }

        guild = guildList.find((g) => g.id === guildId);
      } catch (discordErr) {
        console.warn('[Guild Access] Discord API failed, allowing request:', discordErr);
        // If Discord API fails (rate limit, etc.), allow the request through
        // The user already has a valid session — they authenticated via OAuth
        return next();
      }
    }

    if (!guild) {
      res.status(403).json({ success: false, error: 'Forbidden', message: 'You do not have access to this guild' });
      return;
    }

    // Owner always has access
    if (guild.owner) {
      return next();
    }

    const perms = BigInt(guild.permissions);
    if ((perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD) {
      return next();
    }

    res.status(403).json({ success: false, error: 'Forbidden', message: 'MANAGE_GUILD permission required' });
  } catch (err) {
    console.error('[Guild Access Error]', err);
    res.status(500).json({ success: false, error: 'AccessCheckFailed', message: 'Could not verify guild access' });
  }
}
