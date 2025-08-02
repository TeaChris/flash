/*
 * ############################################################################### *
 * Created Date: Th Jul 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 02 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import http from 'http'
import app from './server/app'
import { logger } from '@/common'
import { ENVIRONMENT } from './config'
import { errorHandler } from '@/controllers'
import { timeoutMiddleware } from './middlewares'
import { db } from './database'

const port = ENVIRONMENT.APP.PORT
const appName = ENVIRONMENT.APP.NAME

const server = http.createServer(app)

const appServer = server.listen(port, async () => {
  await db()
  logger.info(`🚀 ${appName} is listening on port ${port}`)
  //   put queue workers here
})

/**
 * unhandledRejection  handler
 */

process.on('unhandledRejection', async (error: Error) => {
  console.log('UNHANDLED REJECTION! 💥 Server Shutting down...')
  console.log(error.name, error.message)
  logger.error(
    `UNHANDLED REJECTION! 💥 Server Shutting down... [${new Date().toISOString()}]`,
    { error }
  )

  // await stopAllQueuesAndWorkers();
  appServer.close(() => {
    process.exit(1)
  })
})
