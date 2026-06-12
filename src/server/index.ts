/**
 * Chibi Bot Dashboard - Server Entry Point
 * Express HTTP server that provides the REST API for the web dashboard.
 * Shares MongoDB and Redis with the bot.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Redis } from 'ioredis';

import { createSessionMiddleware } from './services/session';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { DashboardWSServer } from './websocket';
import authRoutes from './routes/auth';
import guildRoutes from './routes/guilds';
import welcomeRoutes from './routes/welcome';
import stickyRoutes from './routes/sticky';
import autoReactionRoutes from './routes/autoReactions';
import autoResponderRoutes from './routes/autoResponder';
import suggestionRoutes from './routes/suggestions';
import automodRoutes from './routes/automod';
import escalationRoutes from './routes/escalations';
import modLogRoutes from './routes/modLogs';
import devRoutes from './routes/dev';
import featureRoutes from './routes/features';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000', 10);

/**
 * Create and configure the Express application.
 */
export function createServer(redisClient: Redis) {
  const app = express();

  // ==================== Security ====================

  // Helmet for security headers (relaxed for API usage)
  app.use(
    helmet({
      contentSecurityPolicy: false, // API doesn't need CSP
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS — allow the dashboard origin
  app.use(
    cors({
      origin: DASHBOARD_URL,
      credentials: true, // Allow session cookies
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // ==================== Parsing ====================

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ==================== Session ====================
  // Uses its own Redis client to avoid double-prefixing with the bot's chibi: key prefix

  app.use(createSessionMiddleware());

  // ==================== Rate Limiting ====================

  app.use(rateLimit);

  // ==================== Health Check ====================

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ==================== Routes ====================

  app.use(authRoutes);
  app.use(guildRoutes);
  app.use(welcomeRoutes);
  app.use(stickyRoutes);
  app.use(autoReactionRoutes);
  app.use(autoResponderRoutes);
  app.use(suggestionRoutes);
  app.use(automodRoutes);
  app.use(escalationRoutes);
  app.use(modLogRoutes);
  app.use(devRoutes);
  app.use(featureRoutes);

  // ==================== Error Handling ====================

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server and listen on the configured port.
 */
export function startServer(redisClient: Redis) {
  const app = createServer(redisClient);

  const server = app.listen(SERVER_PORT, () => {
    console.log(`[Dashboard Server] Running on http://localhost:${SERVER_PORT}`);
    console.log(`[Dashboard Server] CORS origin: ${DASHBOARD_URL}`);
    console.log(`[Dashboard Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ==================== WebSocket Server ====================

  const wsServer = new DashboardWSServer(server);

  // Subscribe to Redis pub/sub for real-time event forwarding
  wsServer.setupRedisSubscription(redisClient).catch((err) => {
    console.error('[Dashboard Server] Failed to setup Redis subscription:', err);
  });

  // Start periodic stats broadcast to developer clients
  wsServer.startStatsBroadcast(() => ({
    connections: wsServer.getConnectionCount(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }));

  console.log(`[Dashboard Server] WebSocket server ready on ws://localhost:${SERVER_PORT}/ws`);

  // ==================== Graceful Shutdown ====================

  const shutdown = () => {
    console.log('[Dashboard Server] Shutting down...');
    wsServer.stop();
    server.close(() => {
      console.log('[Dashboard Server] Closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}
