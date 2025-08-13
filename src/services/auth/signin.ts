/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Wed Aug 13 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';

import { hashData, IUser, sendVerificationEmail, setCookie, toJSON } from '@/common';
import AppError from '@/common/utils/app.error';
import { ENVIRONMENT, redis } from '@/config';
import { User } from '@/models';

export async function signInService(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) throw new AppError('Email and password are required', 401);

  const user = await User.findOne({ email }).select(
    '+isSuspended +isEmailVerified +password +loginRetries +lastLogin',
  );
  if (!user) throw new AppError('Incorrect credentials', 401);

  // Password check
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    await User.findByIdAndUpdate(user._id, { $inc: { loginRetries: 1 } });
    throw new AppError('Incorrect credentials', 401);
  }

  if (!user.isEmailVerified) {
    await sendVerificationEmail(user, req);
    throw new AppError('Your email is yet to be verified', 422, `email-unverified:${user.email}`);
  }

  if (user.isSuspended) throw new AppError('Your account is currently suspended', 401);

  // generate tokens
  const accessToken = jwt.sign({ id: user._id.toString() }, ENVIRONMENT.JWT.ACCESS_KEY, {
    expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.ACCESS,
  });

  // generate refresh token
  const jti = uuidv4();
  const refreshToken = jwt.sign({ id: user._id.toString(), jti }, ENVIRONMENT.JWT.REFRESH_KEY, {
    expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.REFRESH,
  });

  // update user loginRetries to 0 and lastLogin to current time
  const updatedUser = (await User.findByIdAndUpdate(
    user._id,
    {
      loginRetries: 0,
      lastLogin: DateTime.now(),
    },
    { new: true },
  )) as IUser;

  await redis.set(
    `refresh:${jti}`,
    user._id.toString(),
    ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS,
  );

  // Cache user object in Redis
  const cacheDurationMinutes = 15;
  await redis.set(
    `user:${user._id.toString()}`,
    JSON.stringify({
      ...toJSON(updatedUser, ['password']),
      refreshToken,
      // expiresInMinutes: cacheDurationMinutes,
    }),
    cacheDurationMinutes * 60,
  );

  // setting cookie
  setCookie(res, 'flashAccessToken', accessToken, {
    maxAge: 15 * 60 * 1000, // 15 min
  });

  setCookie(res, 'flashRefreshToken', refreshToken, {
    maxAge: 24 * 60 * 60 * 1000, // 24 hrs
  });

  return toJSON(updatedUser);
}
