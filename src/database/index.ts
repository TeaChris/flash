/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 02 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import mongoose from 'mongoose'
import { ConnectOptions } from 'mongoose'

import { ENVIRONMENT } from '@/config'
import { logger } from '@/common'

interface CustomConnectOptions extends ConnectOptions {
  maxPoolSize?: number
  minPoolSize?: number
}

export const db = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENVIRONMENT.DB.URL, {
      maxPoolSize: 10,
      minPoolSize: 2,
    } as CustomConnectOptions)
    logger.info('Database connection successful', conn.connection.name)
  } catch (error) {
    logger.error('Database connection failed', (error as Error).message)
    process.exit(1)
  }
}
