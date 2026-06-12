/**
 * Chibi Bot Dashboard - Auto-Moderation Routes
 * CRUD operations for guild auto-moderation configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import AutoModerationModel from '../../models/AutoModerationModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/automod
 * Read auto-moderation configuration.
 */
router.get(
  '/api/guilds/:guildId/automod',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await AutoModerationModel.findOne({
        guildID: req.params.guildId,
      });

      res.json({
        success: true,
        data: { config },
      });
    } catch (err) {
      console.error('[AutoMod Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchConfig',
        message: 'Could not fetch auto-moderation configuration',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/automod
 * Update auto-moderation configuration.
 */
router.put(
  '/api/guilds/:guildId/automod',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await AutoModerationModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        { $set: { guildID: req.params.guildId, ...req.body } },
        { upsert: true, new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: { config },
        message: 'Auto-moderation configuration updated',
      });
    } catch (err) {
      console.error('[AutoMod Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateConfig',
        message: 'Could not update auto-moderation configuration',
      });
    }
  }
);

export default router;
