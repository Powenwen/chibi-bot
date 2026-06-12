/**
 * Chibi Bot Dashboard - Feature Toggle Routes
 * Enable/disable guild features (welcome, sticky, autoReactions, autoResponder, suggestions, automod).
 * Each feature is stored in its own MongoDB collection — toggling updates the `enabled` field.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import WelcomeSystemModel from '../../models/WelcomeSystemModel';
import StickyMessageModel from '../../models/StickyMessageModel';
import AutoReactionModel from '../../models/AutoReactionModel';
import AutoResponderModel from '../../models/AutoResponderModel';
import SuggestionChannelModel from '../../models/SuggestionChannelModel';
import AutoModerationModel from '../../models/AutoModerationModel';

const router = Router();

/**
 * Feature -> collection mapping
 * Each feature uses its own model's `enabled` (or equivalent) field.
 */
const FEATURE_MODELS: Record<string, { model: any; field: string; hasEnabled: boolean }> = {
  welcome: { model: WelcomeSystemModel, field: 'enabled', hasEnabled: true },
  sticky: { model: StickyMessageModel, field: 'enabled', hasEnabled: true },
  autoreactions: { model: AutoReactionModel, field: 'enabled', hasEnabled: false },
  autoresponder: { model: AutoResponderModel, field: 'enabled', hasEnabled: false },
  suggestions: { model: SuggestionChannelModel, field: 'enabled', hasEnabled: true },
  automod: { model: AutoModerationModel, field: 'enabled', hasEnabled: true },
};

/**
 * GET /api/guilds/:guildId/features
 * Returns enabled status for all known features in a guild.
 */
router.get(
  '/api/guilds/:guildId/features',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const guildId = req.params.guildId;
      const result: Record<string, boolean> = {};

      for (const [key, { model, field, hasEnabled }] of Object.entries(FEATURE_MODELS)) {
        try {
          const doc = await model.findOne({ guildID: guildId });
          if (hasEnabled) {
            result[key] = doc ? !!doc[field] : false;
          } else {
            // Models without `enabled` field (e.g. autoreactions) are "enabled" if they have any rules
            result[key] = !!doc;
          }
        } catch {
          result[key] = false;
        }
      }

      res.json({ success: true, data: { features: result } });
    } catch (err) {
      console.error('[Features Get Error]', err);
      res.status(500).json({ success: false, error: 'FailedToFetchFeatures' });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/features/:feature
 * Toggle a specific feature on/off for a guild.
 */
router.put(
  '/api/guilds/:guildId/features/:feature',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const { guildId, feature } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        res.status(400).json({ success: false, error: 'InvalidValue', message: 'enabled must be a boolean' });
        return;
      }

      const featureConfig = FEATURE_MODELS[feature as string];
      if (!featureConfig) {
        res.status(400).json({ success: false, error: 'UnknownFeature', message: `Unknown feature: ${feature}` });
        return;
      }

      const { model, field, hasEnabled } = featureConfig;

      if (hasEnabled) {
        // Upsert the feature document with the new enabled state
        await model.findOneAndUpdate(
          { guildID: guildId },
          { $set: { [field]: enabled, guildID: guildId } },
          { upsert: true, new: true, runValidators: false }
        );
      } else {
        // For models without `enabled` field (e.g. autoreactions), toggle is a no-op
        // The feature is considered "enabled" if any rules exist
        console.log(`[Features] Feature "${feature}" does not support enable/disable toggle`);
      }

      res.json({
        success: true,
        data: { feature, enabled },
        message: `${feature} ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (err) {
      console.error('[Feature Toggle Error]', err);
      res.status(500).json({ success: false, error: 'FailedToToggleFeature' });
    }
  }
);

export default router;
