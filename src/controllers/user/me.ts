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

import { AppResponse } from '@/common';
import { catchAsync } from '@/middlewares';
import { getMeService } from '@/services';
import { AuthenticatedRequest } from '@/types/custom.d.';

import { Response } from 'express';

export const getMeController = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // req.user is set by your protect middleware
  const user = await getMeService(req.user._id);

  AppResponse(res, 200, 'User fetched successfully', user);
});
