/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
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
import { verifyEmailService } from '@/services';

export const verifyEmailController = catchAsync(async (req, res) => {
  const data = await verifyEmailService({ token: req.body.token }, req);
  AppResponse(res, 200, data.message, data);
});
