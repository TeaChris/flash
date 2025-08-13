/*
 * ############################################################################### *
 * Created Date: Su Aug 2025                                                   *
 * Author: Boluwatife Olasunkanmi O.                                           *
 * -----                                                                       *
 * Last Modified: Tue Aug 12 2025                                              *
 * Modified By: Boluwatife Olasunkanmi O.                                      *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date      	By	Comments                                               *
 * ############################################################################### *
 */

import mongoose, { HydratedDocument, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

import { IUser, UserMethods } from '@/common';
import { Role } from '@/common/constants';

type UserModel = Model<IUser, unknown, UserMethods>;

const userSchema = new mongoose.Schema<IUser, unknown, UserMethods>(
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
    loginRetries: {
      type: Number,
      default: 0,
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

// pick users who are not deleted/suspended
userSchema.pre(/^find/, function (this: Model<IUser>, next) {
  if (Object.keys(this['_conditions']).includes('isDeleted')) {
    this.find({ isSuspended: { $ne: true } });
    return next();
  }

  this.find({ $or: [{ isDeleted: { $ne: true } }, { isSuspended: { $ne: true } }] });
  next();
});

// verify user password
userSchema.method(
  'verifyPassword',
  async function (this: HydratedDocument<IUser>, password: string) {
    if (!this.password) return false;

    const isValid = await bcrypt.compare(password, this.password);
    return isValid;
  },
);

// hash password before saving to DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 14);
  next();
});

export const User =
  (mongoose.models.User as UserModel) || mongoose.model<IUser, UserModel>('User', userSchema);
