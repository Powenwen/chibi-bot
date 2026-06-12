/**
 * Chibi Bot Dashboard - Guild Routes
 * Returns guild information from the bot's perspective.
 * Requires the user to have MANAGE_GUILD permission.
 */

import { Router, type Request, type Response } from 'express';
import {
  fetchGuildChannels,
  fetchGuildRoles,
  fetchBotMemberInGuild,
  fetchBotApplicationInfo,
} from '../services/discord';
import { requireAuth } from '../middleware/auth';

const router = Router();

const BOT_TOKEN = process.env.TOKEN || '';

/**
 * GET /api/guilds/:guildId/channels
 * Returns text channels for a guild.
 */
router.get(
  '/api/guilds/:guildId/channels',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const channels = await fetchGuildChannels(req.params.guildId as string, BOT_TOKEN);

      // Filter to text channels only (type 0 = GUILD_TEXT)
      const textChannels = channels
        .filter((ch) => ch.type === 0)
        .map((ch) => ({
          id: ch.id,
          name: ch.name || '',
          position: ch.position ?? 0,
          topic: ch.topic,
          nsfw: ch.nsfw ?? false,
          parentId: ch.parent_id,
        }));

      res.json({
        success: true,
        data: { channels: textChannels },
      });
    } catch (err) {
      console.error('[Channels Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchChannels',
        message: 'Could not fetch guild channels',
      });
    }
  }
);

/**
 * GET /api/guilds/:guildId/roles
 * Returns roles for a guild.
 */
router.get(
  '/api/guilds/:guildId/roles',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const roles = await fetchGuildRoles(req.params.guildId as string, BOT_TOKEN);

      const formattedRoles = roles.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        position: r.position,
        permissions: r.permissions,
        managed: r.managed,
        mentionable: r.mentionable,
      }));

      res.json({
        success: true,
        data: { roles: formattedRoles },
      });
    } catch (err) {
      console.error('[Roles Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchRoles',
        message: 'Could not fetch guild roles',
      });
    }
  }
);

/**
 * GET /api/guilds/:guildId/bot-permissions
 * Returns the bot's actual permissions in the guild (from member object + roles),
 * plus the bot's application info (invite scopes, flags).
 */
router.get(
  '/api/guilds/:guildId/bot-permissions',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const guildId = req.params.guildId as string;
      const botInfo = await fetchBotMemberInGuild(guildId, BOT_TOKEN);

      if (!botInfo) {
        res.json({
          success: true,
          data: {
            botInGuild: false,
            botPermissions: '0',
            botRoles: [],
            missingPermissions: [],
            requiredPermissions: [],
          },
        });
        return;
      }

      // Calculate effective permissions from role IDs
      // Fetch guild roles to resolve role permissions
      let effectivePerms = BigInt(botInfo.botMember.permissions || '0');

      try {
        const guildRoles = await fetchGuildRoles(guildId, BOT_TOKEN);
        const botRoleIds = new Set(botInfo.botMember.roles);
        for (const role of guildRoles) {
          if (botRoleIds.has(role.id)) {
            effectivePerms |= BigInt(role.permissions);
          }
        }
      } catch {
        // If we can't fetch roles, use the member-level permissions as-is
      }

      // Check key permissions
      const ADMINISTRATOR = BigInt(0x8);
      const MANAGE_GUILD = BigInt(0x20);
      const MANAGE_MESSAGES = BigInt(0x8000);
      const MANAGE_ROLES = BigInt(0x10000000);
      const KICK_MEMBERS = BigInt(0x2);
      const BAN_MEMBERS = BigInt(0x4);
      const MANAGE_CHANNELS = BigInt(0x10);
      const VIEW_AUDIT_LOG = BigInt(0x80);
      const MODERATE_MEMBERS = BigInt(0x100000);

      const hasAdmin = (effectivePerms & ADMINISTRATOR) === ADMINISTRATOR;

      const requiredPerms = [
        { name: 'Manage Server', flag: MANAGE_GUILD },
        { name: 'Manage Messages', flag: MANAGE_MESSAGES },
        { name: 'Manage Roles', flag: MANAGE_ROLES },
        { name: 'Kick Members', flag: KICK_MEMBERS },
        { name: 'Ban Members', flag: BAN_MEMBERS },
        { name: 'Manage Channels', flag: MANAGE_CHANNELS },
        { name: 'View Audit Log', flag: VIEW_AUDIT_LOG },
        { name: 'Moderate Members', flag: MODERATE_MEMBERS },
      ];

      const missingPermissions = hasAdmin
        ? []
        : requiredPerms
            .filter((p) => (effectivePerms & p.flag) !== p.flag)
            .map((p) => p.name);

      res.json({
        success: true,
        data: {
          botInGuild: true,
          botPermissions: effectivePerms.toString(),
          botRoles: botInfo.botMember.roles,
          guildOwnerId: botInfo.guildOwnerId,
          guildName: botInfo.guildName,
          hasAdministrator: hasAdmin,
          missingPermissions,
          requiredPermissions: requiredPerms.map((p) => p.name),
        },
      });
    } catch (err) {
      console.error('[Bot Permissions Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchBotPermissions',
        message: 'Could not fetch bot permissions',
      });
    }
  }
);

export default router;
