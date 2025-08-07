/*
 * ############################################################################### *
 * Created Date: Th Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Thu Aug 07 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { cacheUtils } from '@/config';
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
      fromCache: true,
    });
  }

  // If not in cache, continue with the request
  // This is where you would modify the res.json method to cache the response
  const originalJson = res.json;
  res.json = function (data: any) {
    // Cache the response for 5 minutes (300 seconds)
    cacheUtils.set(cacheKey, data, 300);
    return originalJson.call(this, data);
  };

  next();
};
