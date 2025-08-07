/*
 * ############################################################################### *
 * Created Date: Th Jul 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Thu Aug 07 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { IEnvironment } from '@/common';

export const ENVIRONMENT: IEnvironment = {
  APP: {
    ENV: process.env.NODE_ENV,
    NAME: process.env.APP_NAME,
    CLIENT: process.env.CLIENT as string,
    PORT: parseInt(process.env.PORT || process.env.APP_PORT || '3000'),
  },
  DB: {
    URL: process.env.DATABASE_URL as string,
  },
  CACHE_REDIS: {
    URL: process.env.CACHE_REDIS_URL as string,
  },
  REDIS: {
    URL: process.env.REDIS_URL as string,
    PORT: parseInt(process.env.REDIS_PORT || '6379'),
    PASSWORD: process.env.REDIS_PASSWORD as string,
  },
  JWT: {
    REFRESH_KEY: process.env.REFRESH_JWT_KEY!,
    ACCESS_KEY: process.env.ACCESS_JWT_KEY!,
  },
  JWT_EXPIRES_IN: {
    REFRESH: process.env.REFRESH_JWT_EXPIRES_IN!,
    ACCESS: process.env.ACCESS_JWT_EXPIRES_IN!,
  },
  FRONTEND_URL: process.env.FRONTEND_URL!,
  EMAIL: {
    API_KEY: process.env.RESEND_API_KEY!,
  },
};
