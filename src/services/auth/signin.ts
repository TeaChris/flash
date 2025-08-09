/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 09 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import { hashData, sendVerificationEmail, setCookie, toJSON } from '@/common';
import AppError from '@/common/utils/app.error';
import { ENVIRONMENT, redis } from '@/config';
import { User } from '@/models';

export const signIn = async (
  data: { email: string; password: string },
  req: Request,
  res: Response,
) => {
  const { email, password } = data;

  // Input validation
  if (!email || !password) {
    throw new AppError('Email and password are required fields', 401);
  }

  // Find user with sensitive fields
  const user = await User.findOne({ email }).select('+password +isSuspended +isEmailVerified');
  if (!user) throw new AppError('Email or password is incorrect', 401);

  // Password verification
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new AppError('Email or password is incorrect', 401);
  }

  // Email verification check
  if (!user.isEmailVerified) {
    await sendVerificationEmail(user, req);
    throw new AppError('Your email is yet to be verified', 422, `email-unverified:${user.email}`);
  }

  // Account suspension check
  if (user.isSuspended) throw new AppError('Your account is currently suspended', 401);

  // Access token generation
  const accessToken = await hashData(
    { id: user._id.toString() },
    { expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.ACCESS },
  );
  setCookie(res, 'flashAccessToken', accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token with JTI
  const jti = uuidv4();
  const refreshToken = jwt.sign({ id: user._id.toString(), jti }, ENVIRONMENT.JWT.REFRESH_KEY, {
    expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.REFRESH,
  });

  // Store JTI in Redis
  await redis.set(
    `refresh:${jti}`,
    user._id.toString(),
    ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS,
  );

  return toJSON(user);
};
