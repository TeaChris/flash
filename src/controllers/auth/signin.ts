/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sun Aug 10 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { AppResponse } from '@/common';
import { catchAsync } from '@/middlewares';
import { signInService } from '@/services';

export const signInController = catchAsync(async (req, res) => {
  const data = await signInService(req, res);

  AppResponse(res, 200, data.message, data);
});
