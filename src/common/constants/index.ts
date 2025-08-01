/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Fri Aug 01 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

export enum twoFactorTypeEnum {
  EMAIL = 'EMAIL',
  APP = 'APP',
}

export enum Country {
  NIGERIA = 'NIGERIA',
  GHANA = 'GHANA',
  MALI = 'MALI',
  LIBERIA = 'LIBERIA',
  GAMBIA = 'GAMBIA',
  CAMEROON = 'CAMEROON',
}

export enum VerifyTimeBased2faTypeEnum {
  CODE = 'CODE',
  EMAIL_CODE = 'EMAIL_CODE',
  DISABLE_2FA = 'DISABLE_2FA',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  NONE = 'none',
}
