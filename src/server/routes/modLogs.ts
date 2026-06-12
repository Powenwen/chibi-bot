/**
 * Chibi Bot Dashboard - Moderation Logs Routes
 * Read-only access to moderation cases and logs.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import ModerationModel from '../../models/ModerationModel';
import ModerationLogModel from '../../models/ModerationLogModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/modlogs
 * Get moderation cases with optional filters and pagination.
 */
router.get(
  '/api/guilds/:guildId/modlogs',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { guildID: req.params.guildId };

      if (req.query.action) {
        filter.type = req.query.action;
      }

      if (req.query.moderatorId) {
        filter.moderatorID = req.query.moderatorId;
      }

      if (req.query.targetUserId) {
        filter.userID = req.query.targetUserId;
      }

      if (req.query.dateFrom || req.query.dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (req.query.dateFrom) {
          dateFilter.$gte = new Date(req.query.dateFrom as string);
        }
        if (req.query.dateTo) {
          dateFilter.$lte = new Date(req.query.dateTo as string);
        }
        filter.createdAt = dateFilter;
      }

      const [cases, total] = await Promise.all([
        ModerationModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ModerationModel.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          logs: cases,
          meta: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      console.error('[ModLogs List Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchLogs',
        message: 'Could not fetch moderation logs',
      });
    }
  }
);

/**
 * GET /api/guilds/:guildId/modlogs/:caseId
 * Get a single moderation case by ID.
 */
router.get(
  '/api/guilds/:guildId/modlogs/:caseId',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const caseLog = await ModerationModel.findOne({
        _id: req.params.caseId,
        guildID: req.params.guildId,
      });

      if (!caseLog) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Moderation case not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { log: caseLog },
      });
    } catch (err) {
      console.error('[ModLogs Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchLog',
        message: 'Could not fetch moderation case',
      });
    }
  }
);

/**
 * GET /api/guilds/:guildId/modlogs/config
 * Get moderation log channel configuration.
 */
router.get(
  '/api/guilds/:guildId/modlogs/config',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await ModerationLogModel.findOne({
        guildID: req.params.guildId,
      });

      res.json({
        success: true,
        data: { config },
      });
    } catch (err) {
      console.error('[ModLogs Config Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchConfig',
        message: 'Could not fetch moderation log configuration',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/modlogs/config
 * Update moderation log channel configuration.
 */
router.put(
  '/api/guilds/:guildId/modlogs/config',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await ModerationLogModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        { $set: { guildID: req.params.guildId, ...req.body } },
        { upsert: true, new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: { config },
        message: 'Moderation log configuration updated',
      });
    } catch (err) {
      console.error('[ModLogs Config Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateConfig',
        message: 'Could not update moderation log configuration',
      });
    }
  }
);

export default router;
