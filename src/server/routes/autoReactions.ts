/**
 * Chibi Bot Dashboard - Auto-Reaction Routes
 * CRUD operations for guild auto-reaction configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import AutoReactionModel from '../../models/AutoReactionModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/autoreactions
 * List all auto-reaction rules for a guild.
 */
router.get(
  '/api/guilds/:guildId/autoreactions',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rules = await AutoReactionModel.find({
        guildID: req.params.guildId,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { rules },
      });
    } catch (err) {
      console.error('[AutoReactions List Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchRules',
        message: 'Could not fetch auto-reaction rules',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/autoreactions
 * Create a new auto-reaction rule.
 */
router.post(
  '/api/guilds/:guildId/autoreactions',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rule = new AutoReactionModel({
        guildID: req.params.guildId,
        ...req.body,
      });

      await rule.save();

      res.status(201).json({
        success: true,
        data: { rule },
        message: 'Auto-reaction rule created',
      });
    } catch (err) {
      console.error('[AutoReactions Create Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToCreateRule',
        message: 'Could not create auto-reaction rule',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/autoreactions/:id
 * Update an auto-reaction rule.
 */
router.put(
  '/api/guilds/:guildId/autoreactions/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rule = await AutoReactionModel.findOneAndUpdate(
        { _id: req.params.id, guildID: req.params.guildId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Auto-reaction rule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { rule },
        message: 'Auto-reaction rule updated',
      });
    } catch (err) {
      console.error('[AutoReactions Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateRule',
        message: 'Could not update auto-reaction rule',
      });
    }
  }
);

/**
 * DELETE /api/guilds/:guildId/autoreactions/:id
 * Delete an auto-reaction rule.
 */
router.delete(
  '/api/guilds/:guildId/autoreactions/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rule = await AutoReactionModel.findOneAndDelete({
        _id: req.params.id,
        guildID: req.params.guildId,
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Auto-reaction rule not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Auto-reaction rule deleted',
      });
    } catch (err) {
      console.error('[AutoReactions Delete Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToDeleteRule',
        message: 'Could not delete auto-reaction rule',
      });
    }
  }
);

export default router;
