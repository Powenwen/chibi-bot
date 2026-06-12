/**
 * Chibi Bot Dashboard - Auto-Responder Routes
 * CRUD operations for guild auto-responder configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import AutoResponderModel from '../../models/AutoResponderModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/autoresponders
 * List all auto-responder rules for a guild.
 */
router.get(
  '/api/guilds/:guildId/autoresponders',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rules = await AutoResponderModel.find({
        guildID: req.params.guildId,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { rules },
      });
    } catch (err) {
      console.error('[AutoResponders List Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchRules',
        message: 'Could not fetch auto-responder rules',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/autoresponders
 * Create a new auto-responder rule.
 */
router.post(
  '/api/guilds/:guildId/autoresponders',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const rule = new AutoResponderModel({
        guildID: req.params.guildId,
        channelID: body.channelID || body.channelId || '',
        trigger: body.trigger || '',
        response: body.response || body.responseText || '',
        authorID: body.authorID || 'unknown',
        caseSensitive: body.caseSensitive ?? false,
        exactMatch: body.exactMatch ?? true,
        useRegex: body.useRegex ?? false,
        useEmbed: body.useEmbed ?? false,
        embedTitle: body.embedTitle || '',
        embedColor: body.embedColor || '#5865F2',
        cooldown: body.cooldown ?? 0,
        responseDelay: body.responseDelay ?? 0,
        suppressMentions: body.suppressMentions ?? false,
      });

      await rule.save();

      res.status(201).json({
        success: true,
        data: { rule },
        message: 'Auto-responder rule created',
      });
    } catch (err) {
      console.error('[AutoResponders Create Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToCreateRule',
        message: 'Could not create auto-responder rule',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/autoresponders/:id
 * Update an auto-responder rule.
 */
router.put(
  '/api/guilds/:guildId/autoresponders/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rule = await AutoResponderModel.findOneAndUpdate(
        { _id: req.params.id, guildID: req.params.guildId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Auto-responder rule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { rule },
        message: 'Auto-responder rule updated',
      });
    } catch (err) {
      console.error('[AutoResponders Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateRule',
        message: 'Could not update auto-responder rule',
      });
    }
  }
);

/**
 * DELETE /api/guilds/:guildId/autoresponders/:id
 * Delete an auto-responder rule.
 */
router.delete(
  '/api/guilds/:guildId/autoresponders/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const rule = await AutoResponderModel.findOneAndDelete({
        _id: req.params.id,
        guildID: req.params.guildId,
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Auto-responder rule not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Auto-responder rule deleted',
      });
    } catch (err) {
      console.error('[AutoResponders Delete Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToDeleteRule',
        message: 'Could not delete auto-responder rule',
      });
    }
  }
);

export default router;
