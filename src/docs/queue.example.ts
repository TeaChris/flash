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
 * This file contains examples of how to use the BullMQ queue utilities.
 * It is not meant to be used in production, but rather as a reference for how to use the utilities.
 */

import { logger, queueUtils } from '@/common';

/**
 * Example of how to use the queue utilities
 */
export const queueExamples = async () => {
  // Define a job processor function
  const processEmailJob = async (jobData: any) => {
    logger.info(`Processing email job: ${JSON.stringify(jobData)}`);
    // Simulate sending an email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info(`Email sent to ${jobData.to}`);
  };

  // Add a job to the queue
  const jobId = await queueUtils.addJob('email', {
    to: 'user@example.com',
    subject: 'Welcome to our platform',
    body: 'Thank you for signing up!',
  });

  // Add a delayed job to the queue (will be processed after 5 seconds)
  const delayedJobId = await queueUtils.addJob(
    'email',
    {
      to: 'user@example.com',
      subject: 'Reminder',
      body: "Don't forget to complete your profile!",
    },
    { delay: 5000 },
  );

  // Add a job with priority (lower number = higher priority)
  const priorityJobId = await queueUtils.addJob(
    'email',
    {
      to: 'admin@example.com',
      subject: 'URGENT: System Alert',
      body: 'The system has detected unusual activity.',
    },
    { priority: 1 },
  );

  // Process jobs from the queue
  await queueUtils.processQueue('email', processEmailJob, 2); // Process 2 jobs concurrently

  // Get job status
  setTimeout(async () => {
    const jobStatus = await queueUtils.getJobStatus('email', jobId);
    logger.info(`Job status: ${JSON.stringify(jobStatus)}`);
  }, 2000);

  // Clear a queue (use with caution)
  // await queueUtils.clearQueue('email');
};

/**
 * Example of how to implement a real-world email queue
 */
export const implementEmailQueue = async () => {
  // Define the email processor
  const processEmailJob = async (jobData: any) => {
    const { to, subject, body, attachments } = jobData;

    try {
      logger.info(`Sending email to ${to} with subject "${subject}"`);

      // Here you would integrate with your email service provider
      // For example, using nodemailer, SendGrid, Mailgun, etc.

      // Simulate sending an email
      await new Promise((resolve) => setTimeout(resolve, 500));

      logger.info(`Email sent successfully to ${to}`);
      return { success: true, recipient: to };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error; // Rethrow to trigger retry mechanism
    }
  };

  // Set up the email queue processor
  // @ts-ignore
  await queueUtils.processQueue('email', processEmailJob, 5); // Process 5 emails concurrently

  logger.info('Email queue processor initialized');
};

/**
 * Example of how to implement a real-world notification queue
 */
export const implementNotificationQueue = async () => {
  // Define the notification processor
  const processNotificationJob = async (jobData: any) => {
    const { userId, type, message, data } = jobData;

    try {
      logger.info(`Sending ${type} notification to user ${userId}`);

      // Here you would implement your notification logic
      // For example, push notifications, in-app notifications, etc.

      // Simulate sending a notification
      await new Promise((resolve) => setTimeout(resolve, 300));

      logger.info(`Notification sent successfully to user ${userId}`);
      return { success: true, userId };
    } catch (error) {
      logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error; // Rethrow to trigger retry mechanism
    }
  };

  // Set up the notification queue processor
  // @ts-ignore
  await queueUtils.processQueue('notification', processNotificationJob, 10); // Process 10 notifications concurrently

  logger.info('Notification queue processor initialized');
};

/**
 * Example of how to start all queue workers when the server starts
 */
export const startAllQueueWorkers = async () => {
  try {
    // Initialize email queue
    await implementEmailQueue();

    // Initialize notification queue
    await implementNotificationQueue();

    // Add more queue initializations as needed

    logger.info('All queue workers started successfully');
  } catch (error) {
    logger.error('Failed to start queue workers:', error);
  }
};
