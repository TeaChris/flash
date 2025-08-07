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
export interface CommonDataFields {
  to: string;
  priority?: string;
  username?: string;
}

export interface WelcomeEmailData extends CommonDataFields {
  verificationLink: string;
  email: string;
}

export interface ForgotPasswordData extends CommonDataFields {
  token: string;
}

export interface ResetPasswordData extends CommonDataFields {
  // Add other specific fields for the password reset successful data
}

export interface RestoreAccountData extends CommonDataFields {
  loginLink: string;
}
export interface FallbackOTPEmailData extends CommonDataFields {
  token: string;
}

export type EmailJobData =
  | { type: 'welcomeEmail'; data: WelcomeEmailData }
  | { type: 'resetPassword'; data: ResetPasswordData }
  | { type: 'forgotPassword'; data: ForgotPasswordData }
  | { type: 'restoreAccount'; data: RestoreAccountData }
  | { type: 'fallbackOTP'; data: FallbackOTPEmailData };
