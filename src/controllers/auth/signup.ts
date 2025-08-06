/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Wed Aug 06 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { Request, Response } from 'express';
import { signupService } from '@/services';
import { catchAsync } from '@/middlewares';
import { AppResponse } from '@/common';

export const signupController = catchAsync(async (req: Request, res: Response) => {
  const user = await signupService(req.body, req);

  AppResponse(res, 201, 'Account created successfully', user);
});
