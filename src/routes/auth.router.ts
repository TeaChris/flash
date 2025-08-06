/*
 * ############################################################################### *
 * Created Date: We Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Wed Aug 06 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { signupController } from '@/controllers';
import { Router } from 'express';

const router = Router();

router.post('/signup', signupController);

export { router as authRouter };
