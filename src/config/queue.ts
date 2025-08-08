/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Fri Aug 08 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { Queue, Worker, QueueEvents, Job, ConnectionOptions } from 'bullmq';

import { ENVIRONMENT } from './environment';
import { logger } from '@/common';

// Define connection options for Redis
// const getRedisConnectionOptions = (): ConnectionOptions | null => {
//   try {
//     // Check if Redis URL is defined
//     const redisUrl = ENVIRONMENT.REDIS.URL;
//     const redisPassword = ENVIRONMENT.REDIS.PASSWORD;

//     if (!redisUrl) {
//       logger.warn('Redis URL not configured. BullMQ functionality will be disabled.');
//       return null;
//     }

//     // Handle Upstash Redis URLs (which use HTTPS)
//     if (redisUrl.startsWith('https://')) {
//       logger.info('Using Upstash Redis connection string for BullMQ');
//       // For Upstash, we need to extract host and create connection options
//       const host = redisUrl.replace('https://', '');
//       return {
//         host,
//         password: redisPassword,
//         tls: { rejectUnauthorized: false },
//         maxRetriesPerRequest: 3,
//         enableOfflineQueue: false,
//       };
//     } else {
//       // Standard Redis connection
//       const redisPort = ENVIRONMENT.REDIS.PORT || 6379;
//       return {
//         host: redisUrl,
//         port: redisPort,
//         password: redisPassword || undefined,
//         maxRetriesPerRequest: 3,
//         enableOfflineQueue: false,
//       };
//     }
//   } catch (error) {
//     logger.error('Failed to create Redis connection options:', error);
//     return null;
//   }
// };

const getRedisConnectionOptions = (): ConnectionOptions | null => {
  try {
    const redisUrl = ENVIRONMENT.REDIS.URL; // Full URL e.g. rediss://default:password@host:6379

    if (!redisUrl) {
      logger.warn('Redis URL not configured. BullMQ functionality will be disabled.');
      return null;
    }

    // Pass the full URL directly so BullMQ/ioredis handles credentials & TLS
    return {
      url: redisUrl,
      tls: {
        rejectUnauthorized: false, // Required for Upstash TLS
      },
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    } as unknown as ConnectionOptions;
  } catch (error) {
    logger.error('Failed to create Redis connection options:', error);
    return null;
  }
};

// Map to store queues by name
const queues = new Map<string, Queue>();

// Map to store workers by queue name
const workers = new Map<string, Worker>();

// Map to store queue events by queue name
const queueEvents = new Map<string, QueueEvents>();

/**
 * Get or create a queue
 * @param queueName - The name of the queue
 * @returns The queue instance or null if Redis is not configured
 */
export const getQueue = (queueName: string): Queue | null => {
  // Check if queue already exists
  if (queues.has(queueName)) {
    return queues.get(queueName) || null;
  }

  // Get Redis connection options
  const connectionOptions = getRedisConnectionOptions();
  if (!connectionOptions) {
    return null;
  }

  try {
    // Create a new queue
    const queue = new Queue(queueName, {
      connection: connectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100, // Keep only 100 completed jobs
        removeOnFail: 200, // Keep only 200 failed jobs
      },
    });

    // Store the queue
    queues.set(queueName, queue);

    // Create queue events
    const events = new QueueEvents(queueName, { connection: connectionOptions });
    queueEvents.set(queueName, events);

    // Set up event listeners
    events.on('completed', ({ jobId }) => {
      logger.info(`Job ${jobId} completed in queue ${queueName}`);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed in queue ${queueName}: ${failedReason}`);
    });

    events.on('error', (error) => {
      logger.error(`Queue events error in ${queueName}:`, error);
    });

    return queue;
  } catch (error) {
    logger.error(`Error creating queue ${queueName}:`, error);
    return null;
  }
};

/**
 * Add a job to a queue
 * @param queueName - The name of the queue
 * @param jobData - The job data
 * @param options - Job options (optional)
 * @returns The job ID or a fake job ID if Redis is not configured
 */

export const addJob = async (
  queueName: string,
  jobData: any,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
    jobId?: string;
  },
): Promise<string> => {
  // Get the queue
  const queue = getQueue(queueName);
  if (!queue) {
    logger.warn(`Queue disabled: cannot add job to queue ${queueName}`);
    // Return a fake job ID when Redis is not available
    return `local:${queueName}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
  }

  try {
    // Add job to the queue
    const job = await queue.add(
      queueName, // Use queue name as job name for consistency
      jobData,
      {
        delay: options?.delay,
        priority: options?.priority,
        attempts: options?.attempts,
        jobId: options?.jobId || undefined,
      },
    );

    logger.info(`Job ${job.id} added to queue ${queueName}`);
    return (
      job.id?.toString() ??
      `error:${queueName}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`
    );
  } catch (error) {
    logger.error(`Error adding job to queue ${queueName}:`, error);
    // Return a fake job ID when there's an error
    return `error:${queueName}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
  }
};

/**
 * Create a worker to process jobs from a queue
 * @param queueName - The name of the queue
 * @param processor - The function to process jobs
 * @param concurrency - The number of jobs to process concurrently (default: 1)
 * @returns The worker instance or null if Redis is not configured
 */
export const createWorker = (
  queueName: string,
  processor: (job: Job) => Promise<any>,
  concurrency = 1,
): Worker | null => {
  // Check if worker already exists
  if (workers.has(queueName)) {
    return workers.get(queueName) || null;
  }

  // Get Redis connection options
  const connectionOptions = getRedisConnectionOptions();
  if (!connectionOptions) {
    logger.warn(`Queue disabled: cannot create worker for queue ${queueName}`);
    return null;
  }

  try {
    // Create a new worker
    const worker = new Worker(
      queueName,
      async (job) => {
        logger.info(`Processing job ${job.id} from queue ${queueName}`);
        try {
          return await processor(job);
        } catch (error) {
          logger.error(`Error processing job ${job.id} from queue ${queueName}:`, error);
          throw error; // Rethrow to let BullMQ handle retries
        }
      },
      {
        connection: connectionOptions,
        concurrency,
        autorun: true,
      },
    );

    // Set up event listeners
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed in queue ${queueName}:`, error);
    });

    worker.on('error', (error) => {
      logger.error(`Worker error in queue ${queueName}:`, error);
    });

    // Store the worker
    workers.set(queueName, worker);

    logger.info(`Worker created for queue ${queueName} with concurrency ${concurrency}`);
    return worker;
  } catch (error) {
    logger.error(`Error creating worker for queue ${queueName}:`, error);
    return null;
  }
};

/**
 * Get job status
 * @param queueName - The name of the queue
 * @param jobId - The job ID
 * @returns The job data or null if the job is not found
 */
export const getJobStatus = async (queueName: string, jobId: string): Promise<any> => {
  // Get the queue
  const queue = getQueue(queueName);
  if (!queue) {
    logger.warn(`Queue disabled: cannot get job status for ${jobId}`);
    return null;
  }

  try {
    // Get the job
    const job = await queue.getJob(jobId);
    if (!job) return null;

    // Get job state
    const state = await job.getState();

    return {
      id: job.id,
      data: job.data,
      status: state,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attemptsMade: job.attemptsMade,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  } catch (error) {
    logger.error(`Error getting job status for ${jobId}:`, error);
    return null;
  }
};

/**
 * Clear a queue
 * @param queueName - The name of the queue
 */
export const clearQueue = async (queueName: string): Promise<void> => {
  // Get the queue
  const queue = getQueue(queueName);
  if (!queue) {
    logger.warn(`Queue disabled: cannot clear queue ${queueName}`);
    return;
  }

  try {
    // Empty the queue
    await queue.obliterate({ force: true });
    logger.info(`Queue ${queueName} cleared`);
  } catch (error) {
    logger.error(`Error clearing queue ${queueName}:`, error);
  }
};

/**
 * Close all queues, workers, and queue events
 */
export const closeQueueConnections = async (): Promise<void> => {
  try {
    // Close all workers
    for (const [queueName, worker] of workers.entries()) {
      await worker.close();
      logger.info(`Worker for queue ${queueName} closed`);
    }
    workers.clear();

    // Close all queue events
    for (const [queueName, events] of queueEvents.entries()) {
      await events.close();
      logger.info(`Queue events for queue ${queueName} closed`);
    }
    queueEvents.clear();

    // Close all queues
    for (const [queueName, queue] of queues.entries()) {
      await queue.close();
      logger.info(`Queue ${queueName} closed`);
    }
    queues.clear();

    logger.info('All BullMQ connections closed');
  } catch (error) {
    logger.error('Error closing BullMQ connections:', error);
  }
};
