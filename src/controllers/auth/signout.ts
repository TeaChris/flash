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

import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

import { AppResponse } from '@/common';
import { catchAsync } from '@/middlewares';
import { ENVIRONMENT, redis } from '@/config';

export const signoutController = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.flashRefreshToken;

  if (token) {
    try {
      // Verify refresh token and extract jti
      const payload = jwt.verify(token, ENVIRONMENT.JWT.REFRESH_KEY) as { jti: string };

      // Delete refresh token from Redis
      await redis.del(`refresh:${payload.jti}`);
    } catch (error) {
      // Token is invalid/expired, but we still want to clear cookies
      console.log('Invalid refresh token during logout:', error);
    }
  }

  // Clear auth cookies with same options as when they were set
  res.clearCookie('flashAccessToken', {
    httpOnly: true,
    secure: ENVIRONMENT.APP.ENV === 'production',
    sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.clearCookie('flashRefreshToken', {
    httpOnly: true,
    secure: ENVIRONMENT.APP.ENV === 'production',
    sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  // Clear CSRF token cookie
  res.clearCookie('csrfToken', {
    httpOnly: false,
    secure: ENVIRONMENT.APP.ENV === 'production',
    sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  AppResponse(res, 200, 'Signed out successfully', null);
});
