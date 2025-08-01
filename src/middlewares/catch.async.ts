/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Fri Aug 01 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { NextFunction, Request, Response } from 'express'

type CatchAsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void>

export const catchAsync = (fn: CatchAsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(res, req, next).catch(next)
  }
}
