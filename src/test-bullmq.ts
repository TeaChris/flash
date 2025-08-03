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
 * This is a simple test script to verify the BullMQ implementation.
 * Run it with: npx ts-node src/test-bullmq.ts
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { queueUtils, logger, stopQueueWorkers } from './common/utils'

const testBullMQ = async () => {
  try {
    logger.info('Starting BullMQ test...')

    // Define a job processor function
    const processTestJob = async (jobData: any) => {
      logger.info(`Processing test job: ${JSON.stringify(jobData)}`)
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 1000))
      logger.info(`Test job processed: ${jobData.message}`)
      return { processed: true, result: `Processed: ${jobData.message}` }
    }

    // Set up the queue processor
    logger.info('Setting up test queue processor...')
    await queueUtils.processQueue('test', processTestJob, 2)

    // Add some jobs to the queue
    logger.info('Adding jobs to test queue...')
    const jobId1 = await queueUtils.addJob('test', { message: 'Hello, BullMQ!', index: 1 })
    const jobId2 = await queueUtils.addJob('test', { message: 'This is job #2', index: 2 })
    const jobId3 = await queueUtils.addJob('test', { message: 'Priority job', index: 3 }, { priority: 1 })
    const jobId4 = await queueUtils.addJob('test', { message: 'Delayed job', index: 4 }, { delay: 3000 })

    logger.info(`Added jobs with IDs: ${jobId1}, ${jobId2}, ${jobId3}, ${jobId4}`)

    // Wait for jobs to be processed
    logger.info('Waiting for jobs to be processed...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // Check job statuses
    logger.info('Checking job statuses...')
    const status1 = await queueUtils.getJobStatus('test', jobId1)
    const status2 = await queueUtils.getJobStatus('test', jobId2)
    const status3 = await queueUtils.getJobStatus('test', jobId3)
    const status4 = await queueUtils.getJobStatus('test', jobId4)

    logger.info(`Job ${jobId1} status: ${JSON.stringify(status1)}`)
    logger.info(`Job ${jobId2} status: ${JSON.stringify(status2)}`)
    logger.info(`Job ${jobId3} status: ${JSON.stringify(status3)}`)
    logger.info(`Job ${jobId4} status: ${JSON.stringify(status4)}`)

    // Clean up
    logger.info('Cleaning up...')
    await queueUtils.clearQueue('test')
    await stopQueueWorkers()

    logger.info('BullMQ test completed successfully!')
    process.exit(0)
  } catch (error) {
    logger.error('Error in BullMQ test:', error)
    await stopQueueWorkers()
    process.exit(1)
  }
}

// Run the test
testBullMQ()