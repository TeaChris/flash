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

/**
 * This file contains examples of how to use the Redis queue and cache utilities.
 * It is not meant to be used in production, but rather as a reference for how to use the utilities.
 */

import { cacheUtils, queueUtils } from '@/config/redis';
import { logger } from '@/common';

/**
 * Example of how to use the cache utilities
 */
export const cacheExamples = async () => {
  // Set a value in the cache
  await cacheUtils.set('user:123', { id: 123, name: 'John Doe' });
  
  // Set a value with a TTL (time to live) of 60 seconds
  await cacheUtils.set('session:456', { userId: 123, token: 'abc123' }, 60);
  
  // Get a value from the cache
  const user = await cacheUtils.get('user:123');
  logger.info('Cached user:', user);
  
  // Delete a value from the cache
  await cacheUtils.del('user:123');
  
  // Clear all values from the cache (use with caution)
  // await cacheUtils.clear();
};

/**
 * Example of how to use the queue utilities
 */
export const queueExamples = async () => {
  // Define a job processor function
  const processEmailJob = async (jobData: any) => {
    logger.info(`Processing email job: ${JSON.stringify(jobData)}`);
    // Simulate sending an email
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info(`Email sent to ${jobData.to}`);
  };
  
  // Add a job to the queue
  const jobId = await queueUtils.addJob('email', {
    to: 'user@example.com',
    subject: 'Welcome to our platform',
    body: 'Thank you for signing up!'
  });
  
  // Add a delayed job to the queue (will be processed after 5 seconds)
  const delayedJobId = await queueUtils.addJob('email', {
    to: 'user@example.com',
    subject: 'Reminder',
    body: 'Don\'t forget to complete your profile!'
  }, { delay: 5000 });
  
  // Process jobs from the queue
  await queueUtils.processQueue('email', processEmailJob);
  
  // Get job status
  const jobStatus = await queueUtils.getJobStatus(jobId);
  logger.info(`Job status: ${JSON.stringify(jobStatus)}`);
  
  // Clear a queue (use with caution)
  // await queueUtils.clearQueue('email');
};

/**
 * Example of how to start queue workers when the server starts
 */
export const startQueueWorkers = async () => {
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
  // These would typically be started when the server starts
  setInterval(() => {
    queueUtils.processQueue('email', emailProcessor, 2); // Process 2 jobs concurrently
    queueUtils.processQueue('notification', notificationProcessor);
  }, 5000); // Check for new jobs every 5 seconds
  
  logger.info('Queue workers started');
};

/**
 * Example of how to use the cache for API response caching
 */
export const apiCacheExample = async (req: any, res: any, next: any) => {
  const cacheKey = `api:${req.originalUrl}`;
  
  // Try to get the response from cache
  const cachedResponse = await cacheUtils.get(cacheKey);
  
  if (cachedResponse) {
    // Return the cached response
    return res.status(200).json({
      ...cachedResponse,
      fromCache: true
    });
  }
  
  // If not in cache, continue with the request
  // This is where you would modify the res.json method to cache the response
  const originalJson = res.json;
  res.json = function(data: any) {
    // Cache the response for 5 minutes (300 seconds)
    cacheUtils.set(cacheKey, data, 300);
    return originalJson.call(this, data);
  };
  
  next();
};