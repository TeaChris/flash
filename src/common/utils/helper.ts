/*
 * ############################################################################### *
 * Created Date: Fr Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 09 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { queueUtils } from './queue';
import { ENVIRONMENT } from '@/config';
import { User } from '@/models/user.model';
import { IUser, IHashData } from '../interface';

import bcrypt from 'bcryptjs';
import { promisify } from 'util';
import { Request } from 'express';
import { Require_id } from 'mongoose';
import type { CookieOptions, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

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

const hashData = (data: IHashData, options?: SignOptions, secret?: string) => {
  return jwt.sign({ ...data }, secret ?? ENVIRONMENT.JWT.ACCESS_KEY, options);
};

const sendVerificationEmail = async (user: Require_id<IUser>, req: Request) => {
  const emailToken = hashData({ id: user._id.toString() });

  await queueUtils.addJob(
    'email',
    {
      type: 'welcomeEmail',
      data: {
        to: user.email,
        username: user.username,
        email: user.email,
        verificationLink: `${getDomainReferer(req)}/verify-email?token=${emailToken}`,
      },
    },
    {
      priority: 1,
    },
  );
};

const getDomainReferer = (req: Request) => {
  try {
    const referer = req.get('x-referer');

    if (!referer) {
      return `${ENVIRONMENT.FRONTEND_URL}`;
    }

    return referer;
  } catch (error) {
    return null;
  }
};

const decodeData = async (token: string, secret?: string) => {
  const verifyAsync: (arg1: string, arg2: string) => jwt.JwtPayload = promisify(jwt.verify);
  console.log(secret);

  const verify = await verifyAsync(token, secret ? secret : ENVIRONMENT.JWT.ACCESS_KEY!);
  return verify;
};

const setCookie = (res: Response, name: string, value: string, options: CookieOptions = {}) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: ENVIRONMENT.APP.ENV === 'production',
    path: '/',
    sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
    partitioned: ENVIRONMENT.APP.ENV === 'production',
    ...options,
  });
};

export {
  toJSON,
  hashData,
  setCookie,
  decodeData,
  hashedPassword,
  dateFromString,
  findUserByEmail,
  getDomainReferer,
  findUserByUsername,
  sendVerificationEmail,
};
