/*
 * ############################################################################### *
 * Created Date: Tu Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Wed Aug 06 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */
import { findUserByEmail, findUserByUsername, hashedPassword, toJSON } from '@/common';
import AppError from '@/common/utils/app.error';
import { AppResponse } from '@/common/utils/app.response';
import { User } from '@/models';
import { Request } from 'express';

export const signupService = async (
  data: { email: string; username: string; password: string; isTermAndConditionAccepted: boolean },
  req: Request,
) => {
  const { email, username, password, isTermAndConditionAccepted } = data;

  console.log(req.body);

  if (!email || !username || !password) {
    throw new AppError('Incomplete signup data', 400);
  }

  if (!isTermAndConditionAccepted) {
    throw new AppError('You must accept the terms and conditions', 400);
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    throw new AppError('Username already exists', 400);
  }

  const hashedUserPassword = await hashedPassword(password);

  const user = await User.create({
    email,
    username,
    isTermAndConditionAccepted,
    password: hashedUserPassword,
  });

  //   send verification to email here

  //   set cache also

  return toJSON(user);
};
