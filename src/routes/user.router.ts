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
import { getMeController } from '@/controllers';
import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/v1/users/me
 * @description Get current user
 * @access Private
 */
import { protect } from '@/middlewares';

router.use(protect); // Protect all routes after this middleware
router.get('/me', getMeController);

export { router as userRouter };
