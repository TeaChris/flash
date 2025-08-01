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

import { CustomError } from 'ts-custom-error'

export default class AppError extends CustomError {
  statusCode: number
  status: string
  isOperational: boolean
  data?: unknown

  constructor(message: string, statusCode: number = 400, data?: unknown) {
    super(message)
    // Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('5') ? 'Failed' : 'Error'
    this.isOperational = true
    this.data = data

    Error.captureStackTrace(this, this.constructor)
  }
}
