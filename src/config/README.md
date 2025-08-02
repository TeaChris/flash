# Redis Queue and Cache Utilities

This directory contains utilities for working with Redis, including a job queue system and a caching mechanism.

## Redis Configuration

The Redis configuration is defined in `redis.ts`. It creates two Redis clients:

1. **redisClient**: Used for general-purpose Redis operations and job queuing
2. **cacheClient**: Used specifically for caching operations

Both clients are configured using environment variables defined in `.env`.

## Required Environment Variables

Make sure your `.env` file includes the following variables:

```
REDIS_URL=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_REDIS_URL=redis://localhost:6379
```

## Queue Utilities

The `queueUtils` object provides methods for working with job queues:

### Adding Jobs to a Queue

```typescript
import { queueUtils } from '@/config'

// Add a job to the queue
const jobId = await queueUtils.addJob('email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Thank you for signing up!',
})

// Add a delayed job (will be processed after 5 seconds)
const delayedJobId = await queueUtils.addJob(
  'email',
  {
    to: 'user@example.com',
    subject: 'Reminder',
    body: 'Complete your profile',
  },
  { delay: 5000 }
)
```

### Processing Jobs from a Queue

```typescript
import { queueUtils } from '@/config/redis'

// Define a job processor function
const processEmailJob = async (jobData: any) => {
  console.log(`Processing email job: ${JSON.stringify(jobData)}`)
  // Implement email sending logic here
}

// Process jobs from the queue (can be called in a loop or interval)
await queueUtils.processQueue('email', processEmailJob, 2) // Process 2 jobs concurrently
```

### Other Queue Operations

```typescript
// Get job status
const jobStatus = await queueUtils.getJobStatus(jobId)

// Clear a queue (use with caution)
await queueUtils.clearQueue('email')
```

## Cache Utilities

The `cacheUtils` object provides methods for working with the cache:

### Setting and Getting Cache Values

```typescript
import { cacheUtils } from '@/config'

// Set a value in the cache
await cacheUtils.set('user:123', { id: 123, name: 'John Doe' })

// Set a value with a TTL (time to live) of 60 seconds
await cacheUtils.set('session:456', { userId: 123, token: 'abc123' }, 60)

// Get a value from the cache
const user = await cacheUtils.get('user:123')
console.log('Cached user:', user)
```

### Other Cache Operations

```typescript
// Delete a value from the cache
await cacheUtils.del('user:123')

// Clear all values from the cache (use with caution)
await cacheUtils.clear()
```

## API Response Caching Example

Here's an example of how to use the cache for API response caching:

```typescript
import { cacheUtils } from '@/config'
import { Request, Response, NextFunction } from 'express'

export const apiCacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cacheKey = `api:${req.originalUrl}`

  // Try to get the response from cache
  const cachedResponse = await cacheUtils.get(cacheKey)

  if (cachedResponse) {
    // Return the cached response
    return res.status(200).json({
      ...cachedResponse,
      fromCache: true,
    })
  }

  // If not in cache, continue with the request
  const originalJson = res.json
  res.json = function (data: any) {
    // Cache the response for 5 minutes (300 seconds)
    cacheUtils.set(cacheKey, data, 300)
    return originalJson.call(this, data)
  }

  next()
}
```

## Graceful Shutdown

The `stopRedisConnections` function is provided to gracefully close Redis connections when the application is shutting down. This function is already integrated into the application's shutdown handlers in `server.ts` and `app.ts`.

```typescript
import { stopRedisConnections } from '@/config/redis'

// Close Redis connections
await stopRedisConnections()
```

## Example Usage

For more detailed examples, see the `src/common/utils/redis-example.ts` file.
