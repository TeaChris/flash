/*
 * ############################################################################### *
 * Created Date: Th Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 09 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { EmailJobData, logger } from '@/common';
import { welcomeEmail } from '../templates';

import { Resend } from 'resend';
import { ENVIRONMENT } from '../environment';

const resend = new Resend(ENVIRONMENT.EMAIL.API_KEY);

if (!resend) logger.error('Resend Api Key Needed');

const TEMPLATES = {
  welcomeEmail: {
    template: welcomeEmail,
    subject: 'Welcome to Kraft School!',
    from: ' Kraft School <onboarding@resend.dev>',
  },
};

export const sendEmail = async (job: EmailJobData) => {
  const { type, data } = job as EmailJobData;

  const options = TEMPLATES[type];

  if (!options) {
    logger.error('Email template not found');
    return;
  }

  logger.info('options', options);
  logger.info('job send email', job);
  logger.info(options.template(data));

  try {
    const dispatch = await resend.emails.send({
      to: data.to,
      from: options.from,
      subject: options.subject,
      html: options.template(data),
    });
    logger.info('dispatch', dispatch);
    logger.info(`Resend api successfully delivered ${type} email to ${data.to}`);
  } catch (error) {
    logger.error('error', error);
    logger.error(`Resend api failed to deliver ${type} email to ${data.to}` + error);
  }
};
