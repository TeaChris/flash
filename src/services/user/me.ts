/*
 * ############################################################################### *
 * Created Date: Mo Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Mon Aug 11 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import AppError from '@/common/utils/app.error';
import { ENVIRONMENT, redis } from '@/config';
import { toJSON } from '@/common';
import { User } from '@/models';

export const getMeService = async (userId: string) => {
  const cachedUser = await redis.get(userId);

  if (cachedUser) {
    return toJSON(cachedUser, ['password', '__v', 'refreshToken']);
  }

  // If not in cache, fetch from database
  const user = await User.findById(userId).select('-password -refreshToken -__v').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Convert to plain object and remove sensitive fields
  const userData = toJSON(user, ['password', '__v']);

  await redis.set(userId, JSON.stringify(userData), ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS);

  return userData;
};
