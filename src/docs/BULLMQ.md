# BullMQ Queue System

This directory contains utilities for working with BullMQ, a Redis-based queue system for Node.js.

## Overview

BullMQ is a Redis-based queue system for Node.js that provides a robust, battle-tested solution for job queuing. It offers features like:

- Job prioritization
- Delayed jobs
- Rate limiting
- Retries with backoff
- Job events
- Concurrency control
- Job completion acknowledgement

## Configuration

The BullMQ configuration is defined in `bullmq.ts`. It creates queues and workers as needed, and provides utility functions for working with them.

## Required Environment Variables

Make sure your `.env` file includes the following variables:

```
REDIS_URL=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Or for Upstash Redis:

```
REDIS_URL=https://your-upstash-redis-url.upstash.io
REDIS_PASSWORD=your-upstash-redis-password
```

## Queue Utilities

The `queueUtils` object in `src/common/utils/queue.ts` provides methods for working with job queues:

### Adding Jobs to a Queue

```typescript
import { queueUtils } from '@/common/utils'

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

// Add a job with priority (lower number = higher priority)
const priorityJobId = await queueUtils.addJob(
  'email',
  {
    to: 'user@example.com',
    subject: 'Important',
    body: 'Your account needs attention',
  },
  { priority: 1 }
)
```

### Processing Jobs from a Queue

```typescript
import { queueUtils } from '@/common/utils'

// Define a job processor function
const processEmailJob = async (jobData: any) => {
  console.log(`Processing email job: ${JSON.stringify(jobData)}`)
  // Implement email sending logic here
}

// Process jobs from the queue (creates a worker that runs continuously)
await queueUtils.processQueue('email', processEmailJob, 2) // Process 2 jobs concurrently
```

### Other Queue Operations

```typescript
// Get job status
const jobStatus = await queueUtils.getJobStatus('email', jobId)

// Clear a queue (use with caution)
await queueUtils.clearQueue('email')
```

## Starting and Stopping Queue Workers

The `startQueueWorkers` and `stopQueueWorkers` functions are provided to start and stop queue workers. These functions are already integrated into the application's startup and shutdown handlers in `server.ts` and `app.ts`.

```typescript
import { startQueueWorkers, stopQueueWorkers } from '@/common/utils'

// Start queue workers
await startQueueWorkers()

// Stop queue workers
await stopQueueWorkers()
```

## Advantages Over Custom Implementation

BullMQ offers several advantages over a custom Redis-based queue implementation:

1. **Reliability**: BullMQ is battle-tested in production environments and handles edge cases gracefully.
2. **Features**: Provides advanced features like prioritization, rate limiting, and backoff strategies.
3. **Monitoring**: Offers built-in events and metrics for monitoring queue health.
4. **Scalability**: Designed to scale with your application's needs.
5. **Maintenance**: Actively maintained by the community, ensuring bug fixes and improvements.

## Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [BullMQ GitHub Repository](https://github.com/taskforcesh/bullmq)