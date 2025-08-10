/*
 * ############################################################################### *
 * Created Date: We Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sun Aug 10 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { signInController, signupController, refreshTokenHandler } from '@/controllers';

import { Router } from 'express';

const router = Router();

router.post('/signup', signupController);
router.post('/signin', signInController);
router.post('/refresh-token', refreshTokenHandler);

export { router as authRouter };
