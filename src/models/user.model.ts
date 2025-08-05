/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 05 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import mongoose, { Model } from 'mongoose';

import { IUser } from '@/common';
import { Role } from '@/common/constants';

type UserModel = Model<IUser, unknown>;

const userSchema = new mongoose.Schema<IUser, unknown>(
  {
    username: {
      type: String,
      unique: true,
      required: [true, 'Username is required'],
      min: [3, 'Username must be at least 3 characters'],
      max: [30, 'Username must be at most 30 characters'],
    },
    email: {
      trim: true,
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'Email field is required'],
    },
    password: {
      type: String,
      select: false,
      required: [true, 'Password field is required'],
      min: [8, 'Password must be at least 8 characters long'],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    ipAddress: {
      type: String,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    isTermAndConditionAccepted: {
      type: Boolean,
      default: false,
      required: [true, 'Term and condition is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre(/^find/, function (this: Model<IUser>, next) {
  if (Object.keys(this['_conditions']).includes('isDeleted')) {
    this.find({ isSuspended: { $ne: true } });
    return next();
  }

  this.find({ $or: [{ isDeleted: { $ne: true } }, { isSuspended: { $ne: true } }] });
  next();
});

export const User: UserModel = mongoose.model<IUser, UserModel>('User', userSchema);
