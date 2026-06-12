/**
 * Chibi Bot Dashboard - Rate Limiting Middleware
 * Simple in-memory rate limiter per IP address.
 * For production, consider using Redis-based rate limiting.
 */

import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Configurable via env vars
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // 100 requests per window

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware.
 * Tracks requests per IP and returns 429 when limit is exceeded.
 */
export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'TooManyRequests',
      message: `Rate limit exceeded. Retry after ${retryAfter}s`,
      retryAfter,
    });
    return;
  }

  next();
}

/**
 * Stricter rate limit for auth endpoints (login, callback).
 * Prevents brute-force attacks on OAuth flow.
 */
export function authRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const authWindow = 15 * 60 * 1000; // 15 minutes
  const authMax = 20; // 20 attempts per 15 minutes

  const key = `auth:${ip}`;
  let entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + authWindow };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  if (entry.count > authMax) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: 'TooManyRequests',
      message: `Too many auth attempts. Retry after ${retryAfter}s`,
      retryAfter,
    });
    return;
  }

  next();
}
