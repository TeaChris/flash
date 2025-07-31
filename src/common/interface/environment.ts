/*
 * ############################################################################### *
 * Created Date: Th Jul 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Thu Jul 31 2025                                              *
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
  //   DB: {
  //     URL: string
  //   }
  //   REDIS: {
  //     URL: string
  //     PORT: number
  //     PASSWORD: string
  //   }
  //   CACHE_REDIS: {
  //     URL: string
  //   }
}
