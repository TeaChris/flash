/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sun Aug 10 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { setCookie } from '@/common';
import { ENVIRONMENT, redis } from '@/config';
import AppError from '@/common/utils/app.error';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

export async function refreshTokenService(req: Request, res: Response) {
  const token = req.cookies?.flashRefreshToken;

  if (!token) throw new AppError('Refresh token missing', 401);

  const payload = jwt.verify(token, ENVIRONMENT.JWT.REFRESH_KEY) as { id: string; jti: string };
  const exists = await redis.get(`refresh:${payload.jti}`);
  if (!exists) throw new AppError('Invalid or expired refresh token', 401);

  // Rotate
  await redis.del(`refresh:${payload.jti}`);
  const newJti = uuidv4();
  const newAccessToken = jwt.sign({ id: payload.id }, ENVIRONMENT.JWT.ACCESS_KEY, {
    expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.ACCESS,
  });
  const newRefreshToken = jwt.sign({ id: payload.id, jti: newJti }, ENVIRONMENT.JWT.REFRESH_KEY, {
    expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.REFRESH,
  });

  await redis.set(`refresh:${newJti}`, payload.id, ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS);

  setCookie(res, 'flashAccessToken', newAccessToken, {
    maxAge: 15 * 60 * 1000,
  });
  setCookie(res, 'flashRefreshToken', newRefreshToken, {
    maxAge: 24 * 60 * 60 * 1000,
  });

  return { message: 'Tokens refreshed' };
}
