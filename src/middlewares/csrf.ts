/*
 * ############################################################################### *
 * Created Date: Tue Aug 12 2025                                               *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 12 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { catchAsync } from './catch.async';
import AppError from '@/common/utils/app.error';
import { ENVIRONMENT } from '@/config';

// State-changing HTTP methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Allowed origins for CORS and CSRF protection
const ALLOWED_ORIGINS = [
  ENVIRONMENT.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Add production domains here
];

export const csrfProtection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Only apply CSRF protection to state-changing methods
    if (!CSRF_PROTECTED_METHODS.includes(req.method)) {
      return next();
    }

    // Skip CSRF for auth endpoints (they handle their own security)
    if (req.path.startsWith('/api/v1/auth/')) {
      return next();
    }

    // 1. Origin/Referer Check
    const origin = req.get('Origin');
    const referer = req.get('Referer');

    let originValid = false;

    if (origin) {
      originValid = ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin));
    } else if (referer) {
      originValid = ALLOWED_ORIGINS.some((allowedOrigin) => referer.startsWith(allowedOrigin));
    }

    if (!originValid) {
      throw new AppError('Invalid origin', 403);
    }

    // 2. Double-Submit CSRF Token Check
    const csrfHeader = req.get('x-csrf-token');
    const csrfCookie = req.cookies?.csrfToken;

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      throw new AppError('CSRF token invalid', 403);
    }

    next();
  },
);

// Middleware to set CSRF token cookie
export const setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  // Generate CSRF token if not present
  if (!req.cookies?.csrfToken) {
    const csrfToken = uuidv4();
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: ENVIRONMENT.APP.ENV === 'production',
      sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
  }
  next();
};
