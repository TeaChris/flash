/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 05 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { Request, Response } from 'express';
import { signupService } from '@/services';
import { catchAsync } from '@/middlewares/catch.async';
import { AppResponse } from '@/common/utils/app.response';

export const signupController = catchAsync(async (req: Request, res: Response) => {
  const user = await signupService(req.body, req);

  AppResponse(res, 201, 'Account created successfully', user);
});
