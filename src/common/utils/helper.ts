/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 05 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { User } from '@/models/user.model';

import bcrypt from 'bcryptjs';

const dateFromString = async (value: string) => {
  const date = new Date(value);

  if (isNaN(date?.getTime())) {
    return false;
  }

  return date;
};

const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

const findUserByUsername = async (username: string) => {
  return User.findOne({ username });
};

const hashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export { dateFromString, findUserByEmail, findUserByUsername, hashedPassword };
