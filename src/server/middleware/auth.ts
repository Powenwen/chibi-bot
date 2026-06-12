/**
 * Chibi Bot Dashboard - Authentication Middleware
 * Validates session data and attaches user info to requests.
 */

import type { Request, Response, NextFunction } from 'express';
import type { DashboardSessionData } from '../types';

/**
 * Require a valid authenticated session.
 * Attaches session data to req.user for downstream handlers.
 * Returns 401 if no valid session exists.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const sessionData = (req.session as { data?: DashboardSessionData })?.data;

  if (!sessionData || !sessionData.userId) {
    console.log('[Auth] requireAuth failed: no session data, sid:', req.sessionID);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Please log in to access this resource',
    });
    return;
  }

  console.log('[Auth] requireAuth ok:', sessionData.userId, sessionData.username);

  // Check if token is expired
  if (sessionData.tokenExpiresAt && Date.now() > sessionData.tokenExpiresAt) {
    res.status(401).json({
      success: false,
      error: 'TokenExpired',
      message: 'Session expired, please log in again',
    });
    return;
  }

  // Attach user data to request
  req.user = sessionData;
  next();
}

/**
 * Optional auth — attaches user data if available,
 * but does not block the request.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const sessionData = (req.session as { data?: DashboardSessionData })?.data;

  if (sessionData?.userId) {
    req.user = sessionData;
  }

  next();
}

/**
 * Require developer access (bot owner).
 * Must be used after requireAuth.
 */
export function requireDeveloper(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isDeveloper) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Developer access required',
    });
    return;
  }

  next();
}
