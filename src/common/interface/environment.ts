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

export interface IEnvironment {
  APP: {
    NAME?: string
    PORT: number
    ENV?: string
    CLIENT: string
  }
  DB: {
    URL: string
  }
  REDIS: {
    URL: string
    PORT: number
    PASSWORD: string
  }
  CACHE_REDIS: {
    URL: string
  }
}
