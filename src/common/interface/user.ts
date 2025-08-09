/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Sat Aug 09 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import { Model } from 'mongoose';
import type { SignOptions } from 'jsonwebtoken';

import { Role } from '../constants';

export interface IUser {
  role: Role;
  email: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  password: string;
  ipAddress: string;
  verificationToken;
  isDeleted: boolean;
  isSuspended: boolean;
  // refreshToken: string;
  isEmailVerified: boolean;
  isTermAndConditionAccepted: boolean;
}

export interface UserMethods extends Omit<IUser, 'toJSON'> {
  generateAccessToken(options?: SignOptions): string;
  generateRefreshToken(options?: SignOptions): string;
  verifyPassword(enteredPassword: string): Promise<boolean>;
  toJSON(excludedFields?: Array<keyof IUser>): object;
}

export type UserModel = Model<IUser, UserMethods>;
