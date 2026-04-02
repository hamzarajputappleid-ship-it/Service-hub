import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['CUSTOMER', 'WORKER', 'ADMIN'], default: 'CUSTOMER' },
    status: { type: String, default: 'ACTIVE' },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { 
    timestamps: true 
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
