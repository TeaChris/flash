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
import { IUser } from '../interface';

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

const toJSON = (obj: IUser, fields?: string[]): Partial<IUser> => {
  const user = JSON.parse(JSON.stringify(obj));

  if (fields && fields.length === 0) {
    return user;
  }

  const results = { ...user };

  if (fields && fields.length > 0) {
    for (const field of fields) {
      if (field in results) {
        delete results[field as keyof IUser];
      }
    }
    return results;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refreshToken, loginRetries, lastLogin, password, updatedAt, ...rest } = user;

  return rest;
};

export { dateFromString, findUserByEmail, findUserByUsername, hashedPassword, toJSON };
