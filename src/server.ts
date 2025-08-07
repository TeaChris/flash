/*
 * ############################################################################### *
 * Created Date: Th Jul 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Thu Aug 07 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import http from 'http';

import app from '@/server/app';
import { db } from './database';
import { ENVIRONMENT, stopRedisConnections } from '@/config';
import { logger, startQueueWorkers, stopQueueWorkers } from '@/common';

const port = ENVIRONMENT.APP.PORT;
const appName = ENVIRONMENT.APP.NAME;

const server = http.createServer(app);

const appServer = server.listen(port, async () => {
  await db();
  // Initialize Redis queue workers
  await startQueueWorkers();
  logger.info(`🚀 ${appName} is listening on port ${port}`);
});

/**
 * unhandledRejection  handler
 */

process.on('unhandledRejection', async (error: Error) => {
  console.log('UNHANDLED REJECTION! 💥 Server Shutting down...');
  console.log(error.name, error.message);
  logger.error(`UNHANDLED REJECTION! 💥 Server Shutting down... [${new Date().toISOString()}]`, {
    error,
  });

  // Close Redis connections
  await stopRedisConnections();

  // Stop queue workers
  await stopQueueWorkers();

  appServer.close(() => {
    process.exit(1);
  });
});

/**
 * Handle SIGTERM signal
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');

  // Close Redis connections
  await stopRedisConnections();

  appServer.close(() => {
    logger.info('Process terminated!');
    process.exit(0);
  });
});
