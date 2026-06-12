/**
 * Chibi Bot Dashboard - Suggestion System Routes
 * CRUD operations for guild suggestion system configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import SuggestionChannelModel from '../../models/SuggestionChannelModel';
import SuggestionModel from '../../models/SuggestionModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/suggestions/config
 * Get suggestion system configuration.
 */
router.get(
  '/api/guilds/:guildId/suggestions/config',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await SuggestionChannelModel.findOne({
        guildID: req.params.guildId,
      });

      res.json({
        success: true,
        data: { config },
      });
    } catch (err) {
      console.error('[Suggestions Config Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchConfig',
        message: 'Could not fetch suggestion configuration',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/suggestions/config
 * Update suggestion system configuration.
 */
router.put(
  '/api/guilds/:guildId/suggestions/config',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await SuggestionChannelModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        { $set: { guildID: req.params.guildId, ...req.body } },
        { upsert: true, new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: { config },
        message: 'Suggestion configuration updated',
      });
    } catch (err) {
      console.error('[Suggestions Config Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateConfig',
        message: 'Could not update suggestion configuration',
      });
    }
  }
);

/**
 * GET /api/guilds/:guildId/suggestions
 * List suggestions with optional filters.
 */
router.get(
  '/api/guilds/:guildId/suggestions',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { guildID: req.params.guildId };

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const [suggestions, total] = await Promise.all([
        SuggestionModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        SuggestionModel.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          suggestions,
          meta: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      console.error('[Suggestions List Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchSuggestions',
        message: 'Could not fetch suggestions',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/suggestions/:id/approve
 * Approve a suggestion.
 */
router.post(
  '/api/guilds/:guildId/suggestions/:id/approve',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const suggestion = await SuggestionModel.findOneAndUpdate(
        { _id: req.params.id, guildID: req.params.guildId },
        {
          $set: {
            status: 'Approved',
            response: req.body.reason || '',
          },
        },
        { new: true }
      );

      if (!suggestion) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Suggestion not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { suggestion },
        message: 'Suggestion approved',
      });
    } catch (err) {
      console.error('[Suggestions Approve Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToApprove',
        message: 'Could not approve suggestion',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/suggestions/:id/deny
 * Deny a suggestion.
 */
router.post(
  '/api/guilds/:guildId/suggestions/:id/deny',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const suggestion = await SuggestionModel.findOneAndUpdate(
        { _id: req.params.id, guildID: req.params.guildId },
        {
          $set: {
            status: 'Denied',
            response: req.body.reason || '',
          },
        },
        { new: true }
      );

      if (!suggestion) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Suggestion not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { suggestion },
        message: 'Suggestion denied',
      });
    } catch (err) {
      console.error('[Suggestions Deny Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToDeny',
        message: 'Could not deny suggestion',
      });
    }
  }
);

export default router;
