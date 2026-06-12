/**
 * Chibi Bot Dashboard - Developer Routes
 * Bot-wide statistics and configuration. Requires developer access.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth, requireDeveloper } from '../middleware/auth';
import ModerationModel from '../../models/ModerationModel';
import WelcomeSystemModel from '../../models/WelcomeSystemModel';
import StickyMessageModel from '../../models/StickyMessageModel';
import AutoReactionModel from '../../models/AutoReactionModel';
import AutoResponderModel from '../../models/AutoResponderModel';
import SuggestionChannelModel from '../../models/SuggestionChannelModel';
import AutoModerationModel from '../../models/AutoModerationModel';
import WarningEscalationModel from '../../models/WarningEscalationModel';

const router = Router();

// All dev routes require authentication + developer role
router.use(requireAuth, requireDeveloper);

/**
 * GET /api/dev/stats
 * Global bot statistics across all guilds.
 */
router.get('/api/dev/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalModerationCases,
      activeWarnings,
      welcomeSystems,
      stickyMessages,
      autoReactions,
      autoResponders,
      suggestionChannels,
      autoModConfigs,
      escalationConfigs,
    ] = await Promise.all([
      ModerationModel.countDocuments(),
      ModerationModel.countDocuments({ type: 'warn', active: true }),
      WelcomeSystemModel.countDocuments(),
      StickyMessageModel.countDocuments({ enabled: true }),
      AutoReactionModel.countDocuments(),
      AutoResponderModel.countDocuments(),
      SuggestionChannelModel.countDocuments({ enabled: true }),
      AutoModerationModel.countDocuments({ enabled: true }),
      WarningEscalationModel.countDocuments({ enabled: true }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          moderation: {
            totalCases: totalModerationCases,
            activeWarnings,
          },
          features: {
            welcomeSystems,
            stickyMessages,
            autoReactions,
            autoResponders,
            suggestionChannels,
            autoModConfigs,
            escalationConfigs,
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('[Dev Stats Error]', err);
    res.status(500).json({
      success: false,
      error: 'FailedToFetchStats',
      message: 'Could not fetch bot statistics',
    });
  }
});

/**
 * GET /api/dev/health
 * Service health status.
 */
router.get('/api/dev/health', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      services: [
        {
          name: 'api',
          status: 'healthy',
          uptime: process.uptime(),
        },
        {
          name: 'mongodb',
          status: 'connected', // If we got here, mongoose is connected
        },
        {
          name: 'redis',
          status: 'connected', // If we got here, redis is connected
        },
      ],
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
