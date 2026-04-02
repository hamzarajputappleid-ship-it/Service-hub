import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IUserActivity extends Document {
  id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  timestamp: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    id: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true }, // "LOGIN" or "LOGOUT"
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  }
);

export const UserActivity = mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
