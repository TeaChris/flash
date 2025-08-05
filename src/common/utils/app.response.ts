/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sun Aug 03 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { Response } from 'express';

export const AppResponse = (
  res: Response,
  status: number,
  message: string,
  data: Record<string, string[]> | unknown | string | null,
) => {
  res.status(status).json({
    status: 'success',
    data: data ?? null,
    message: message ?? null,
  });
};
