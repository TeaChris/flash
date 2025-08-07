/*
 * ############################################################################### *
 * Created Date: Sa Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Thu Aug 07 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

/**
 * This file provides a simplified interface for working with BullMQ queues.
 * It abstracts away the complexity of BullMQ and provides a simple API for adding jobs to queues
 * and processing jobs from queues.
 */

import { Job } from 'bullmq';
import { logger } from '@/common';
import { addJob, createWorker, getJobStatus, clearQueue, closeQueueConnections } from '@/config';

// Queue utility functions
export const queueUtils = {
  /**
   * Add a job to a queue
   * @param queueName - The name of the queue
   * @param jobData - The job data
   * @param options - Job options (optional)
   */
  async addJob(
    queueName: string,
    jobData: any,
    options?: { delay?: number; priority?: number; attempts?: number },
  ): Promise<string> {
    return addJob(queueName, jobData, options);
  },

  /**
   * Process jobs from a queue
   * @param queueName - The name of the queue
   * @param processor - The function to process jobs
   * @param concurrency - The number of jobs to process concurrently (default: 1)
   */
  async processQueue(
    queueName: string,
    processor: (jobData: any) => Promise<void>,
    concurrency = 1,
  ): Promise<void> {
    // Create a worker to process jobs
    // We wrap the processor function to extract the job data
    createWorker(
      queueName,
      async (job: Job) => {
        return processor(job.data);
      },
      concurrency,
    );
  },

  /**
   * Get job status
   * @param queueName - The name of the queue
   * @param jobId - The job ID
   */
  async getJobStatus(queueName: string, jobId: string): Promise<any> {
    return getJobStatus(queueName, jobId);
  },

  /**
   * Clear a queue
   * @param queueName - The name of the queue
   */
  async clearQueue(queueName: string): Promise<void> {
    return clearQueue(queueName);
  },
};

/**
 * Start queue workers for the application
 * This function should be called when the server starts
 */
export const startQueueWorkers = async (): Promise<void> => {
  try {
    // Define job processors for different queues
    const emailProcessor = async (jobData: any) => {
      logger.info(`Processing email job: ${JSON.stringify(jobData)}`);
      // Implement email sending logic here
    };

    const notificationProcessor = async (jobData: any) => {
      logger.info(`Processing notification job: ${JSON.stringify(jobData)}`);
      // Implement notification sending logic here
    };

    // Start queue workers
    await queueUtils.processQueue('email', emailProcessor, 2); // Process 2 jobs concurrently
    await queueUtils.processQueue('notification', notificationProcessor);

    logger.info('Queue workers started');
  } catch (error) {
    logger.error('Error starting queue workers:', error);
  }
};

/**
 * Stop all queue workers and close connections
 * This function should be called when the server shuts down
 */
export const stopQueueWorkers = async (): Promise<void> => {
  try {
    await closeQueueConnections();
    logger.info('Queue workers stopped');
  } catch (error) {
    logger.error('Error stopping queue workers:', error);
  }
};
