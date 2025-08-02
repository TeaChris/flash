/*
 * ############################################################################### *
 * Created Date: Th Jul 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 02 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { IEnvironment } from '@/common'

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
}
