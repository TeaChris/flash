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
import { Request, Response, NextFunction } from 'express';

import { catchAsync } from './catch.async';
import AppError from '@/common/utils/app.error';
import { authenticate, setCookie } from '@/common';

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //   get the cookie from the request headers
  const { flashAccessToken, flashRefreshToken } = req.cookie;

  const { currentUser, accessToken } = await authenticate({ flashAccessToken, flashRefreshToken });

  if (accessToken) {
    setCookie(res, 'flashAccessToken', accessToken, {
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  //   attach the user to the request
  req.user = currentUser;

  const reqPath = req.path;

  //   check if the user has been authenticated but has not verified their email
  if (currentUser && !currentUser.isEmailVerified) {
    if (reqPath !== '/api/v1/auth/verify-email') {
      return next(new AppError('Please verify your email to continue', 401));
    }
  }

  next();
});
