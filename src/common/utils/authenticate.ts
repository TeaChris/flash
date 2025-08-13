/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
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
import { v4 as uuidv4 } from 'uuid';
import { Require_id } from 'mongoose';

import { User } from '@/models';
import AppError from './app.error';
import { ENVIRONMENT, redis } from '@/config';
import { hashData, IUser, logger, toJSON, setCookie } from '@/common';

type AuthenticateResult = {
  currentUser: Require_id<IUser>;
  accessToken?: string;
};

export const authenticate = async ({
  flashAccessToken,
  flashRefreshToken,
}: {
  flashAccessToken?: string;
  flashRefreshToken?: string;
}): Promise<AuthenticateResult> => {
  // Helper function to verify and fetch user
  const verifyAndFetchUser = async (userId: string): Promise<Require_id<IUser>> => {
    // Try to get user from cache first
    const cachedUser = await redis.get(`user:${userId}`);

    let user: Require_id<IUser>;
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      // Fetch from database if not in cache
      user = (await User.findById(userId).select(
        '+isSuspended +isEmailVerified',
      )) as Require_id<IUser>;
      if (!user) {
        // user not found ---- but to not expose too mush info i decided to use
        throw new AppError('Authentication failed', 401);
      }

      // Cache user data (without sensitive fields)
      const userToCache = toJSON(user, ['password', '__v']);
      await redis.set(
        `user:${userId}`,
        JSON.stringify(userToCache),
        ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS,
      );
    }

    // Check user status
    if (user.isSuspended) {
      throw new AppError('Your account is currently suspended', 401);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Your email is yet to be verified', 422, `email-unverified:${user.email}`);
    }

    return user;
  };

  // Helper function to handle refresh token rotation
  const handleTokenRefresh = async (): Promise<AuthenticateResult> => {
    if (!flashRefreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    try {
      // Verify refresh token
      const payload = jwt.verify(flashRefreshToken, ENVIRONMENT.JWT.REFRESH_KEY) as {
        id: string;
        jti: string;
      };

      // Check if refresh token exists in Redis
      const exists = await redis.get(`refresh:${payload.jti}`);
      if (!exists) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Verify and fetch user
      const currentUser = await verifyAndFetchUser(payload.id);

      // Check for token reuse (security measure)
      const tokenUsed = await redis.get(`used:${payload.jti}`);
      if (tokenUsed) {
        // Token has been used before - potential replay attack
        await redis.del(`refresh:${payload.jti}`);
        throw new AppError('Token reuse detected', 401);
      }

      // Mark token as used and delete it
      await redis.set(`used:${payload.jti}`, '1', 60); // Keep for 1 minute
      await redis.del(`refresh:${payload.jti}`);

      const newJti = uuidv4();
      const newRefreshToken = jwt.sign(
        { id: payload.id, jti: newJti },
        ENVIRONMENT.JWT.REFRESH_KEY,
        { expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.REFRESH },
      );

      // Store new refresh token in Redis
      await redis.set(`refresh:${newJti}`, payload.id, ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS);

      // Generate new access token
      const newAccessToken = jwt.sign({ id: payload.id }, ENVIRONMENT.JWT.ACCESS_KEY, {
        expiresIn: ENVIRONMENT.JWT_EXPIRES_IN.ACCESS,
      });

      return { currentUser, accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      throw error;
    }
  };

  try {
    // If access token is present, try to verify it first
    if (flashAccessToken) {
      try {
        const decoded = jwt.verify(flashAccessToken, ENVIRONMENT.JWT.ACCESS_KEY) as { id: string };
        const currentUser = await verifyAndFetchUser(decoded.id);
        return { currentUser };
      } catch (error) {
        // If access token is invalid/expired and we have refresh token, try refresh
        if (
          (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) &&
          flashRefreshToken
        ) {
          return await handleTokenRefresh();
        }
        throw error;
      }
    }

    // If no access token, try refresh token
    if (flashRefreshToken) {
      return await handleTokenRefresh();
    }

    // No tokens provided
    throw new AppError('Authentication required', 401);
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Authentication failed', 401);
  }
};
