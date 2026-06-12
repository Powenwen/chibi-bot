/**
 * Chibi Bot Dashboard - Warning Escalation Routes
 * CRUD operations for guild warning escalation rules.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import WarningEscalationModel from '../../models/WarningEscalationModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/escalations
 * List warning escalation rules for a guild.
 */
router.get(
  '/api/guilds/:guildId/escalations',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await WarningEscalationModel.findOne({
        guildID: req.params.guildId,
      });

      res.json({
        success: true,
        data: {
          rules: config?.escalationRules || [],
          enabled: config?.enabled ?? false,
        },
      });
    } catch (err) {
      console.error('[Escalations Get Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchRules',
        message: 'Could not fetch escalation rules',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/escalations
 * Add a new escalation rule.
 */
router.post(
  '/api/guilds/:guildId/escalations',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const config = await WarningEscalationModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        {
          $push: { escalationRules: req.body },
          $setOnInsert: { guildID: req.params.guildId, enabled: true },
        },
        { upsert: true, new: true }
      );

      res.status(201).json({
        success: true,
        data: { rules: config?.escalationRules || [] },
        message: 'Escalation rule added',
      });
    } catch (err) {
      console.error('[Escalations Create Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToAddRule',
        message: 'Could not add escalation rule',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/escalations/:id
 * Update an escalation rule by index.
 */
router.put(
  '/api/guilds/:guildId/escalations/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const index = parseInt(req.params.id as string, 10);

      const config = await WarningEscalationModel.findOne({
        guildID: req.params.guildId,
      });

      if (!config || !config.escalationRules[index]) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Escalation rule not found',
        });
        return;
      }

      // Update the specific rule in the array
      const updatePath = `escalationRules.${index}`;
      const updateObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.body)) {
        updateObj[`escalationRules.${index}.${key}`] = value;
      }

      const updated = await WarningEscalationModel.findOneAndUpdate(
        { guildID: req.params.guildId },
        { $set: updateObj },
        { new: true }
      );

      res.json({
        success: true,
        data: { rules: updated?.escalationRules || [] },
        message: 'Escalation rule updated',
      });
    } catch (err) {
      console.error('[Escalations Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateRule',
        message: 'Could not update escalation rule',
      });
    }
  }
);

/**
 * DELETE /api/guilds/:guildId/escalations/:id
 * Delete an escalation rule by index.
 */
router.delete(
  '/api/guilds/:guildId/escalations/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const index = parseInt(req.params.id as string, 10);

      const config = await WarningEscalationModel.findOne({
        guildID: req.params.guildId,
      });

      if (!config || !config.escalationRules[index]) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Escalation rule not found',
        });
        return;
      }

      // Remove the rule at the specified index
      config.escalationRules.splice(index, 1);
      await config.save();

      res.json({
        success: true,
        data: { rules: config.escalationRules },
        message: 'Escalation rule deleted',
      });
    } catch (err) {
      console.error('[Escalations Delete Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToDeleteRule',
        message: 'Could not delete escalation rule',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/escalations/reorder
 * Reorder escalation rules.
 */
router.post(
  '/api/guilds/:guildId/escalations/reorder',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const { order } = req.body as { order: number[] };

      const config = await WarningEscalationModel.findOne({
        guildID: req.params.guildId,
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Escalation config not found',
        });
        return;
      }

      // Reorder rules based on the provided index order
      const reordered = order.map((i) => config.escalationRules[i]).filter(Boolean);
      config.escalationRules = reordered;
      await config.save();

      res.json({
        success: true,
        data: { rules: config.escalationRules },
        message: 'Escalation rules reordered',
      });
    } catch (err) {
      console.error('[Escalations Reorder Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToReorder',
        message: 'Could not reorder escalation rules',
      });
    }
  }
);

export default router;
