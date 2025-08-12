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
import { Require_id } from 'mongoose';

import { User } from '@/models';
import AppError from './app.error';
import { ENVIRONMENT, redis } from '@/config';
import { decodeData, hashData, IUser, logger, toJSON } from '@/common';

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
  if (flashAccessToken) {
    //     const { currentUser } = await verifyAccessToken(flashAccessToken);
    //     return {
    //       currentUser,
    //       accessToken: flashAccessToken,
    //     };
    const decoded = jwt.verify(flashAccessToken, ENVIRONMENT.JWT.ACCESS_KEY) as { id: string };
    const user = await User.findById(decoded.id).select('+isSuspended +isEmailVerified');
    if (!user || user.isSuspended) throw new AppError('Unauthorized', 401);
    if (!user.isEmailVerified)
      throw new AppError('Your email is yet to be verified', 422, `email-unverified:${user.email}`);
    return { currentUser: user };
    // throw new AppError('Unauthorized', 401);
  }

  //   if (flashRefreshToken) {
  //     const { currentUser } = await verifyRefreshToken(flashRefreshToken);
  //     return {
  //       currentUser,
  //       accessToken: flashAccessToken,
  //     };
  //   }

  if (!flashRefreshToken) throw new AppError('Refresh token is required', 401);
  const payload = jwt.verify(flashRefreshToken, ENVIRONMENT.JWT.REFRESH_KEY) as {
    id: string;
    jti: string;
  };
  const exists = await redis.get(`refresh:${payload.jti}`);
  if (!exists) throw new AppError('Invalid or expired refresh token', 401);

  const handleUserVerification = async (decoded) => {
    // fetch user from redis cache or db
    const cachedUser = await redis.get(decoded.id);

    const user = cachedUser
      ? cachedUser
      : ((await User.findOne({ _id: decoded.id }).select(
          'refreshToken isSuspended isEmailVerified',
        )) as Require_id<IUser>);

    if (!cachedUser && user) await redis.set(decoded.id, user);

    // check if refresh token matches the stored refresh token in db
    // in case the user has logged out and the token is still valid
    // or the user has re authenticated and the token is still valid etc

    if (user.refreshToken !== flashRefreshToken)
      throw new AppError('invalid token. Please log in again!', 401);

    if (user.isSuspended) throw new AppError('Your account is currently suspended', 401);

    if (!user.isEmailVerified)
      throw new AppError('Your email is yet to be verified', 422, `email-unverified:${user.email}`);

    // csrf protection
    // browser client fingerprinting
    if (decoded.fingerprint !== user.fingerprint) {
      throw new AppError('Session expired, please log in again!', 401);
    }

    const userToCache = { ...user, _id: user._id.toString() };
    await redis.set(
      decoded.id,
      toJSON(userToCache, ['password', '__v', 'refreshToken']),
      ENVIRONMENT.JWT_EXPIRES_IN.REFRESH_SECONDS,
    );

    return user;
  };

  const handleTokenRefresh = async () => {
    try {
      if (!flashRefreshToken) {
        throw new AppError('Refresh token is required', 401);
      }
      const decodedRefreshToken = await decodeData(flashRefreshToken, ENVIRONMENT.JWT.REFRESH_KEY!);

      const currentUser = await handleUserVerification(decodedRefreshToken);

      // generate access token
      const accessToken = await hashData(
        { id: currentUser._id.toString() },
        { expiresIn: ENVIRONMENT.JWT_EXPIRES_IN },
      );

      return { accessToken, currentUser };
    } catch (error) {
      logger.error('Error refreshing token', error);
      throw new AppError('Session expired, please log in again!', 401);
    }
  };

  try {
    if (!flashAccessToken) {
      // if access token is not present, verify the refresh token and generate a new access token
      return await handleTokenRefresh();
    } else {
      const decodeAccessToken = await decodeData(flashAccessToken, ENVIRONMENT.JWT.ACCESS_KEY!);
      const currentUser = await handleUserVerification(decodeAccessToken);

      // attach user to the request object
      return { currentUser };
    }
  } catch (error) {
    if (
      (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) &&
      flashRefreshToken
    ) {
      //   verify the refresh token and generate a new access token
      return await handleTokenRefresh();
    } else {
      throw new AppError('An Error occurred, please log in again!', 401);
    }
  }
};
