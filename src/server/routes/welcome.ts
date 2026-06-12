/**
 * Chibi Bot Dashboard - Welcome System Routes
 * CRUD operations for guild welcome message configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import WelcomeSystemModel from '../../models/WelcomeSystemModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/welcome
 * Read welcome system configuration.
 */
router.get(
  '/api/guilds/:guildId/welcome',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await WelcomeSystemModel.findOne({
        guildID: req.params.guildId,
      });

      res.json({
        success: true,
        data: { config },
      });
    } catch (err) {
      console.error('[Welcome Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchConfig',
        message: 'Could not fetch welcome configuration',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/welcome
 * Update welcome system configuration.
 */
router.put(
  '/api/guilds/:guildId/welcome',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const channelID = body.channelID || body.channelId || '';

      // Build update data with proper field mapping
      const updateData: Record<string, unknown> = {
        guildID: req.params.guildId,
        channelID,
        enabled: body.enabled ?? true,
        message: body.message || body.messageTemplate || 'Welcome {user} to {server}!',
        type: ['embed', 'text', 'both'].includes(body.type) ? body.type : 'embed',
        dmEnabled: body.dmEnabled ?? false,
        dmMessage: body.dmMessage || '',
        roleEnabled: body.roleEnabled ?? false,
        roleIDs: body.roleIDs || [],
      };

      // Only include embed data if provided
      if (body.embed) {
        updateData.embed = {
          title: body.embed.title || '',
          description: body.embed.description || '',
          color: body.embed.color || '#5865F2',
          thumbnail: body.embed.thumbnail ?? false,
          thumbnailUrl: body.embed.thumbnailUrl || '',
          image: body.embed.image ?? false,
          imageUrl: body.embed.imageUrl || '',
          author: body.embed.author || { enabled: false, name: '', iconUrl: '', url: '' },
          footer: body.embed.footer || { enabled: false, text: '', iconUrl: '', timestamp: false },
          fields: body.embed.fields || [],
          timestamp: body.embed.timestamp ?? false,
        };
      }

      const config = await WelcomeSystemModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        { $set: updateData },
        { upsert: true, new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: { config },
        message: 'Welcome configuration updated',
      });
    } catch (err) {
      console.error('[Welcome Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateConfig',
        message: 'Could not update welcome configuration',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/welcome/test
 * Send a test welcome message (placeholder — requires bot integration).
 */
router.post(
  '/api/guilds/:guildId/welcome/test',
  requireAuth,
  requireGuildAccess,
  async (_req: Request, res: Response) => {
    // TODO: Integrate with bot to send test welcome message
    res.json({
      success: true,
      message: 'Test welcome feature coming soon',
    });
  }
);

export default router;
