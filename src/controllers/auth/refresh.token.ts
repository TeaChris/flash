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
import { refreshTokenService } from '@/services';

export const refreshTokenHandler = catchAsync(async (req, res) => {
  const data = await refreshTokenService(req, res);
  AppResponse(res, 200, data.message, data);
});
