/**
 * Chibi Bot Dashboard - Error Handler Middleware
 * Centralized error handling for all API routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { DiscordApiError } from '../services/discord';

/**
 * Global error handler — must be registered last in the middleware chain.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  console.error('[Server Error]', err);

  // Handle known error types
  if (err instanceof DiscordApiError) {
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      success: false,
      error: 'DiscordApiError',
      message: err.message,
    });
    return;
  }

  // Handle session errors
  if (err.name === 'SessionError') {
    res.status(500).json({
      success: false,
      error: 'SessionError',
      message: 'Session management error',
    });
    return;
  }

  // Generic server error — don't leak details in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message: isDev ? err.message : 'An unexpected error occurred',
    ...(isDev && { stack: err.stack }),
  });
}

/**
 * 404 handler for unmatched API routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
