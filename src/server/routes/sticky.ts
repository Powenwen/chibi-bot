/**
 * Chibi Bot Dashboard - Sticky Message Routes
 * CRUD operations for guild sticky message configuration.
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireGuildAccess } from '../middleware/guildAccess';
import { getSessionData } from '../services/session';
import StickyMessageModel from '../../models/StickyMessageModel';

const router = Router();

/**
 * GET /api/guilds/:guildId/sticky
 * List all sticky messages for a guild.
 */
router.get(
  '/api/guilds/:guildId/sticky',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const messages = await StickyMessageModel.find({
        guildID: req.params.guildId,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { messages },
      });
    } catch (err) {
      console.error('[Sticky List Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToFetchMessages',
        message: 'Could not fetch sticky messages',
      });
    }
  }
);

/**
 * POST /api/guilds/:guildId/sticky
 * Create a new sticky message.
 */
router.post(
  '/api/guilds/:guildId/sticky',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const sessionData = getSessionData(req);
      const userId = sessionData?.userId || 'unknown';
      const body = req.body;

      // Generate required unique IDs if not provided
      const uniqueID = body.uniqueID || `${req.params.guildId}-${body.channelId}-${Date.now()}`;
      const messageID = body.messageID || `sticky-${Date.now()}`;

      const message = new StickyMessageModel({
        guildID: req.params.guildId,
        channelID: body.channelId || body.channelID || '',
        content: body.content || body.description || '',
        title: body.title || '',
        description: body.description || body.content || '',
        color: body.color || '#38BDF8',
        enabled: body.enabled ?? true,
        authorID: userId,
        messageID,
        messageChannelID: body.messageChannelID || body.channelId || body.channelId || '',
        uniqueID,
        maxMessageCount: body.maxMessageCount || 0,
        mode: body.mode || 'message-count',
        intervalSeconds: body.intervalSeconds || 0,
        mentionRoleID: body.mentionRoleID || '',
        thumbnailUrl: body.thumbnailUrl || '',
        imageUrl: body.imageUrl || '',
        footer: body.footer || { text: '', iconUrl: '' },
        author: body.author || { name: '', iconUrl: '', url: '' },
        fields: body.fields || [],
        timestamp: body.timestamp ?? false,
        embedID: body.embedID || '',
      });

      await message.save();

      res.status(201).json({
        success: true,
        data: { message },
        message: 'Sticky message created',
      });
    } catch (err) {
      console.error('[Sticky Create Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToCreateMessage',
        message: 'Could not create sticky message',
      });
    }
  }
);

/**
 * PUT /api/guilds/:guildId/sticky/:id
 * Update a sticky message.
 */
router.put(
  '/api/guilds/:guildId/sticky/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const message = await StickyMessageModel.findOneAndUpdate(
        { _id: req.params.id, guildID: req.params.guildId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!message) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Sticky message not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { message },
        message: 'Sticky message updated',
      });
    } catch (err) {
      console.error('[Sticky Update Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToUpdateMessage',
        message: 'Could not update sticky message',
      });
    }
  }
);

/**
 * DELETE /api/guilds/:guildId/sticky/:id
 * Delete a sticky message.
 */
router.delete(
  '/api/guilds/:guildId/sticky/:id',
  requireAuth,
  requireGuildAccess,
  async (req: Request, res: Response) => {
    try {
      const message = await StickyMessageModel.findOneAndDelete({
        _id: req.params.id,
        guildID: req.params.guildId,
      });

      if (!message) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Sticky message not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Sticky message deleted',
      });
    } catch (err) {
      console.error('[Sticky Delete Error]', err);
      res.status(500).json({
        success: false,
        error: 'FailedToDeleteMessage',
        message: 'Could not delete sticky message',
      });
    }
  }
);

export default router;
