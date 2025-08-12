/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 12 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import AppError from '@/common/utils/app.error';
import { decodeData, IUser, toJSON } from '@/common';
import { redis } from '@/config';
import { User } from '@/models';

import { Request } from 'express';

export const verifyEmailService = async (data: { token: string }, req: Request) => {
  const { token } = data;

  if (!token) {
    throw new AppError('Token is required', 400);
  }

  const decryptedToken = await decodeData(token);

  if (!decryptedToken) {
    throw new AppError('Invalid verification token', 400);
  }

  const cachedUser = (await redis.get(decryptedToken.id.toString())) as IUser;

  if (cachedUser && cachedUser.isEmailVerified) {
    throw new AppError('Email already verified', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    decryptedToken.id,
    {
      isEmailVerified: true,
    },
    {
      new: true,
    },
  );

  if (!updatedUser) {
    throw new AppError('User not found', 400);
  }

  await redis.del(decryptedToken.id.toString());
  return {
    user: toJSON(updatedUser),
    message: 'Email verified successfully',
  };
};
