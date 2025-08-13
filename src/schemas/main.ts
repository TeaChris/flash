/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 12 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

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
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not be more than 30 characters long')
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Username can only contain letters, numbers, hyphens, and underscores',
    })
    .refine((name) => !/^(admin|root|system|test|guest|user|demo|temp|tmp)$/i.test(name), {
      message: 'Username cannot be a reserved word',
    }),
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
