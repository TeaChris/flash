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

import { EmailJobData, logger } from '@/common';
import { welcomeEmail } from '../templates';

import { Resend } from 'resend';
import { ENVIRONMENT } from '../environment';

const resend = new Resend(ENVIRONMENT.EMAIL.API_KEY);

const TEMPLATES = {
  welcomeEmail: {
    subject: 'Welcome to Flash',
    template: welcomeEmail,
    from: 'Flash <no-reply@flash.com>',
  },
};

export const sendEmail = async (job: EmailJobData) => {
  const { data, type } = job as EmailJobData;

  const opts = TEMPLATES[type];

  logger.info('job send email', job);
  logger.info(opts.template(data));
  logger.info('options', opts);

  try {
    const dispatch = await resend.emails.send({
      to: data.to,
      from: opts.from,
      subject: opts.subject,
      html: opts.template(data),
    });
    logger.info(dispatch);
    logger.info(`Resend api successfully delivered ${type} email to ${data.to}`);
  } catch (error) {
    logger.error(error);
    logger.error(`Resend api failed to deliver ${type} email to ${data.to}` + error);
  }
};
