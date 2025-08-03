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

import Redis from 'ioredis'
import { logger } from '@/common'
import { ENVIRONMENT } from './environment'

// Redis client for general purpose
const createRedisClient = () => {
  try {
    // Check if Redis URL is defined
    const redisUrl = ENVIRONMENT.REDIS.URL
    const redisPassword = ENVIRONMENT.REDIS.PASSWORD

    if (!redisUrl) {
      logger.warn(
        'Redis URL not configured. Redis functionality will be disabled.'
      )
      return null
    }

    let client: Redis

    // Handle Upstash Redis URLs (which use HTTPS)
    if (redisUrl.startsWith('https://')) {
      logger.info('Using Upstash Redis connection string')
      // For Upstash, we need to create a connection string with the password
      const connectionString = `redis://:${redisPassword}@${redisUrl.replace(
        'https://',
        ''
      )}`
      client = new Redis(connectionString, {
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })
    } else {
      // Standard Redis connection
      const redisPort = ENVIRONMENT.REDIS.PORT || 6379
      client = new Redis({
        host: redisUrl,
        port: redisPort,
        password: redisPassword,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      })
    }

    client.on('connect', () => {
      logger.info('Redis client connected')
    })

    client.on('error', (err) => {
      logger.error('Redis client error', err)
    })

    return client
  } catch (error) {
    logger.error('Failed to create Redis client:', error)
    return null
  }
}

// Redis client for caching
const createCacheClient = () => {
  try {
    // Check if Cache Redis URL is defined
    const cacheRedisUrl = ENVIRONMENT.CACHE_REDIS.URL
    const cacheRedisPassword = ENVIRONMENT.REDIS.PASSWORD

    if (!cacheRedisUrl) {
      logger.warn(
        'Cache Redis URL not configured. Cache functionality will be disabled.'
      )
      return null
    }

    let client: Redis

    // If URL starts with https://, it's likely Upstash or similar service
    if (cacheRedisUrl.startsWith('https://')) {
      logger.info('Using Upstash Redis connection string for cache')
      // For Upstash, we need to create a connection string with the password
      const connectionString = `redis://:${cacheRedisPassword}@${cacheRedisUrl.replace(
        'https://',
        ''
      )}`
      client = new Redis(connectionString, {
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })
    } else {
      // Standard Redis connection
      client = new Redis(cacheRedisUrl, {
        password: cacheRedisPassword,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })
    }

    client.on('connect', () => {
      logger.info('Redis cache client connected')
    })

    client.on('error', (err) => {
      logger.error('Redis cache client error', err)
    })

    return client
  } catch (error) {
    logger.error('Failed to create Redis cache client:', error)
    return null
  }
}

// Create Redis clients
export const redisClient = createRedisClient()
export const cacheClient = createCacheClient()

// Cache utility functions
export const cacheUtils = {
  /**
   * Set a value in the cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping set operation for key ${key}`)
      return
    }

    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value)
      if (ttl) {
        await cacheClient.set(key, stringValue, 'EX', ttl)
      } else {
        await cacheClient.set(key, stringValue)
      }
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error)
    }
  },

  /**
   * Get a value from the cache
   * @param key - The cache key
   * @param parse - Whether to parse the result as JSON (default: true)
   */
  async get(key: string, parse = true): Promise<any> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping get operation for key ${key}`)
      return null
    }

    try {
      const value = await cacheClient.get(key)
      if (!value) return null
      return parse ? JSON.parse(value) : value
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error)
      return null
    }
  },

  /**
   * Delete a value from the cache
   * @param key - The cache key
   */
  async del(key: string): Promise<void> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping delete operation for key ${key}`)
      return
    }

    try {
      await cacheClient.del(key)
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error)
    }
  },

  /**
   * Clear all values from the cache
   */
  async clear(): Promise<void> {
    if (!cacheClient) {
      logger.debug('Cache disabled: skipping clear operation')
      return
    }

    try {
      await cacheClient.flushall()
    } catch (error) {
      logger.error('Error clearing cache:', error)
    }
  },
}

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
    options?: { delay?: number }
  ): Promise<string> {
    if (!redisClient) {
      logger.warn(`Queue disabled: cannot add job to queue ${queueName}`)
      // Return a fake job ID when Redis is not available
      return `local:${queueName}:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 10)}`
    }

    try {
      const jobId = `${queueName}:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 10)}`
      const job = {
        id: jobId,
        data: jobData,
        timestamp: Date.now(),
        status: 'pending',
        ...options,
      }

      // Add job to the queue
      await redisClient.lpush(`queue:${queueName}`, JSON.stringify(job))

      // If there's a delay, add to the delayed queue
      if (options?.delay) {
        const processAt = Date.now() + options.delay
        await redisClient.zadd(`delayed:${queueName}`, processAt, jobId)
      }

      logger.info(`Job ${jobId} added to queue ${queueName}`)
      return jobId
    } catch (error) {
      logger.error(`Error adding job to queue ${queueName}:`, error)
      // Return a fake job ID when there's an error
      return `error:${queueName}:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 10)}`
    }
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
    concurrency = 1
  ): Promise<void> {
    if (!redisClient) {
      logger.warn(`Queue disabled: cannot process queue ${queueName}`)
      return
    }

    try {
      // Process delayed jobs first
      const now = Date.now()
      const delayedJobs = await redisClient.zrangebyscore(
        `delayed:${queueName}`,
        0,
        now
      )

      for (const jobId of delayedJobs) {
        // Move from delayed set to main queue
        await redisClient.zrem(`delayed:${queueName}`, jobId)
        // Get the job data
        const jobData = await redisClient.get(`job:${jobId}`)
        if (jobData) {
          await redisClient.lpush(`queue:${queueName}`, jobData)
        }
      }

      // Process jobs from the queue
      for (let i = 0; i < concurrency; i++) {
        const jobJson = await redisClient.rpop(`queue:${queueName}`)
        if (!jobJson) continue

        try {
          const job = JSON.parse(jobJson)
          // Update job status
          job.status = 'processing'
          await redisClient.set(`job:${job.id}`, JSON.stringify(job))

          // Process the job
          await processor(job.data)

          // Update job status to completed
          job.status = 'completed'
          job.completedAt = Date.now()
          await redisClient.set(`job:${job.id}`, JSON.stringify(job))
          logger.info(`Job ${job.id} processed successfully`)
        } catch (error) {
          logger.error(`Error processing job from queue ${queueName}:`, error)
          // Put the job back in the queue for retry
          await redisClient.lpush(`queue:${queueName}`, jobJson)
        }
      }
    } catch (error) {
      logger.error(`Error processing queue ${queueName}:`, error)
    }
  },

  /**
   * Get job status
   * @param jobId - The job ID
   */
  async getJobStatus(jobId: string): Promise<any> {
    if (!redisClient) {
      logger.warn(`Queue disabled: cannot get job status for ${jobId}`)
      return null
    }

    try {
      const jobData = await redisClient.get(`job:${jobId}`)
      if (!jobData) return null
      return JSON.parse(jobData)
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error)
      return null
    }
  },

  /**
   * Clear a queue
   * @param queueName - The name of the queue
   */
  async clearQueue(queueName: string): Promise<void> {
    if (!redisClient) {
      logger.warn(`Queue disabled: cannot clear queue ${queueName}`)
      return
    }

    try {
      await redisClient.del(`queue:${queueName}`)
      await redisClient.del(`delayed:${queueName}`)
      logger.info(`Queue ${queueName} cleared`)
    } catch (error) {
      logger.error(`Error clearing queue ${queueName}:`, error)
    }
  },
}

// Function to gracefully shut down Redis connections
export const stopRedisConnections = async (): Promise<void> => {
  try {
    // Close Redis client if it exists
    if (redisClient) {
      await redisClient.quit()
      logger.info('Redis client connection closed')
    }

    // Close Cache client if it exists
    if (cacheClient) {
      await cacheClient.quit()
      logger.info('Redis cache client connection closed')
    }

    if (!redisClient && !cacheClient) {
      logger.info('No Redis connections to close')
    }
  } catch (error) {
    logger.error('Error closing Redis connections:', error)
  }
}
