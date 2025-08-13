/*
 * ############################################################################### *
 * Created Date: We Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 12 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import {
  signInController,
  signupController,
  signoutController,
  refreshTokenHandler,
  verifyEmailController,
} from '@/controllers';
import {
  authRateLimiter,
  refreshTokenRateLimiter,
  emailVerificationRateLimiter,
} from '@/middlewares';

import { Router } from 'express';

const router = Router();

router.post('/signup', authRateLimiter, signupController);
router.post('/signin', authRateLimiter, signInController);
router.post('/verify-email', emailVerificationRateLimiter, verifyEmailController);
router.post('/refresh-token', refreshTokenRateLimiter, refreshTokenHandler);
router.post('/signout', signoutController);

export { router as authRouter };
