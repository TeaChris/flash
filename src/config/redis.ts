/*
 * ############################################################################### *
 * Created Date: Th Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Fri Aug 08 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import Redis from 'ioredis';
import { logger } from '@/common';
import { ENVIRONMENT } from './environment';

// Redis client for general purpose
// const createRedisClient = () => {
//   try {
//     // Check if Redis URL is defined
//     const redisUrl = ENVIRONMENT.REDIS.URL;
//     const redisPassword = ENVIRONMENT.REDIS.PASSWORD;

//     if (!redisUrl) {
//       logger.warn('Redis URL not configured. Redis functionality will be disabled.');
//       return null;
//     }

//     let client: Redis;

//     // Handle Upstash Redis URLs (which use HTTPS)
//     if (redisUrl.startsWith('https://')) {
//       logger.info('Using Upstash Redis connection string');
//       // For Upstash, we need to create a connection string with the password
//       const connectionString = `redis://:${redisPassword}@${redisUrl.replace('https://', '')}`;
//       client = new Redis(connectionString, {
//         tls: { rejectUnauthorized: false },
//         maxRetriesPerRequest: 3,
//         enableOfflineQueue: false,
//         retryStrategy: (times) => {
//           // Retry connection with exponential backoff
//           const delay = Math.min(times * 50, 2000);
//           return delay;
//         },
//       });
//     } else {
//       // Standard Redis connection
//       const redisPort = ENVIRONMENT.REDIS.PORT || 6379;
//       client = new Redis({
//         host: redisUrl,
//         port: redisPort,
//         password: redisPassword,
//         retryStrategy: (times) => {
//           // Retry connection with exponential backoff
//           const delay = Math.min(times * 50, 2000);
//           return delay;
//         },
//         maxRetriesPerRequest: 3,
//         enableOfflineQueue: false,
//       });
//     }

//     client.on('connect', () => {
//       logger.info('Redis client connected');
//     });

//     client.on('error', (err) => {
//       logger.error('Redis client error', err);
//     });

//     return client;
//   } catch (error) {
//     logger.error('Failed to create Redis client:', error);
//     return null;
//   }
// };

const createRedisClient = () => {
  try {
    const redisUrl = ENVIRONMENT.REDIS.URL; // Paste full Upstash URL here (from dashboard)

    if (!redisUrl) {
      logger.warn('Redis URL not configured. Redis functionality will be disabled.');
      return null;
    }

    const client = new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false, // Needed for Upstash TLS
      },
      maxRetriesPerRequest: null, // Prevents 'max retries' crash
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000); // exponential backoff
        return delay;
      },
    });

    client.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    client.on('error', (err) => {
      logger.error('❌ Redis client error:', err);
    });

    return client;
  } catch (error) {
    logger.error('❌ Failed to create Redis client:', error);
    return null;
  }
};

// Redis client for caching
const createCacheClient = () => {
  try {
    // Check if Cache Redis URL is defined
    const cacheRedisUrl = ENVIRONMENT.CACHE_REDIS.URL;
    const cacheRedisPassword = ENVIRONMENT.REDIS.PASSWORD;

    if (!cacheRedisUrl) {
      logger.warn('Cache Redis URL not configured. Cache functionality will be disabled.');
      return null;
    }

    let client: Redis;

    // If URL starts with https://, it's likely Upstash or similar service
    if (cacheRedisUrl.startsWith('https://')) {
      logger.info('Using Upstash Redis connection string for cache');
      // For Upstash, we need to create a connection string with the password
      const connectionString = `redis://:${cacheRedisPassword}@${cacheRedisUrl.replace(
        'https://',
        '',
      )}`;
      client = new Redis(connectionString, {
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });
    } else {
      // Standard Redis connection
      client = new Redis(cacheRedisUrl, {
        password: cacheRedisPassword,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          // Retry connection with exponential backoff
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });
    }

    client.on('connect', () => {
      logger.info('Redis cache client connected');
    });

    client.on('error', (err) => {
      logger.error('Redis cache client error', err);
    });

    return client;
  } catch (error) {
    logger.error('Failed to create Redis cache client:', error);
    return null;
  }
};

// Create Redis clients
export const redisClient = createRedisClient();
export const cacheClient = createCacheClient();

// Cache utility functions
export const redis = {
  /**
   * Set a value in the cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping set operation for key ${key}`);
      return;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await cacheClient.set(key, stringValue, 'EX', ttl);
      } else {
        await cacheClient.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
    }
  },

  /**
   * Get a value from the cache
   * @param key - The cache key
   * @param parse - Whether to parse the result as JSON (default: true)
   */
  async get(key: string, parse = true): Promise<any> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping get operation for key ${key}`);
      return null;
    }

    try {
      const value = await cacheClient.get(key);
      if (!value) return null;
      return parse ? JSON.parse(value) : value;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a value from the cache
   * @param key - The cache key
   */
  async del(key: string): Promise<void> {
    if (!cacheClient) {
      logger.debug(`Cache disabled: skipping delete operation for key ${key}`);
      return;
    }

    try {
      await cacheClient.del(key);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
    }
  },

  /**
   * Clear all values from the cache
   */
  async clear(): Promise<void> {
    if (!cacheClient) {
      logger.debug('Cache disabled: skipping clear operation');
      return;
    }

    try {
      await cacheClient.flushall();
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  },
};

// Function to gracefully shut down Redis connections
export const stopRedisConnections = async (): Promise<void> => {
  try {
    // Close Redis client if it exists
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client connection closed');
    }

    // Close Cache client if it exists
    if (cacheClient) {
      await cacheClient.quit();
      logger.info('Redis cache client connection closed');
    }

    if (!redisClient && !cacheClient) {
      logger.info('No Redis connections to close');
    }
  } catch (error) {
    logger.error('Error closing Redis connections:', error);
  }
};
