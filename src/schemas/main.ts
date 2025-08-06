/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Wed Aug 06 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

// import {
//   Country,
//   FundraiserEnum,
//   VerifyTimeBased2faTypeEnum,
//   twoFactorTypeEnum,
// } from '@/common/constants'
import { dateFromString } from '@/common';
import { PhoneNumberUtil } from 'google-libphonenumber';
import * as z from 'zod';

const verifyPhoneNumber = (value: string) => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  if (!value.includes('234') || value.includes('+')) return false;
  const number = phoneUtil.parse(`+${value}`, 'NG');
  return phoneUtil.isValidNumber(number);
};

const passwordRegexMessage =
  'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character or symbol';

export const mainSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters long')
    .max(50, 'username must not be 50 characters long')
    .refine(
      (name) => /^(?!.*-[a-z])[A-Z][a-z'-]*(?:-[A-Z][a-z'-]*)*(?:'[A-Z][a-z'-]*)*$/g.test(name),
      {
        message:
          'Last name must be in sentence case, can include hyphen, and apostrophes (e.g., "Ali", "Ade-Bright" or "Smith\'s").',
      },
    ),
  email: z.string().email('Please enter a valid email address!'),
  password: z
    .string()
    .min(8, 'Password must have at least 8 characters!')
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
      message: passwordRegexMessage,
    }),
  confirmPassword: z
    .string()
    .min(8, 'Confirm Password must have at least 8 characters!')
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
      message: passwordRegexMessage,
    }),
  code: z.string().min(6, 'Code must be at least 6 characters long'),
  token: z.string(),
  userId: z.string().regex(/^[a-f\d]{24}$/i, {
    message: `Invalid userId`,
  }),
  isTermAndConditionAccepted: z.boolean(),
  oldPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8, 'Password must have at least 8 characters!')
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).*$/, {
      message: passwordRegexMessage,
    }),
  redirectUrl: z.string().url(),
});

// Define the partial for partial validation
export const partialMainSchema = mainSchema.partial();
