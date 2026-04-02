import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IWorkerProfile extends Document {
  workerId: string;
  userId: string;
  serviceCategory: string;
  skills?: string;
  pricing?: string;
  serviceArea?: string;
  availability?: string;
  portfolio?: string;
  ratingAverage: number;
}

const WorkerProfileSchema = new Schema<IWorkerProfile>(
  {
    workerId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    userId: { type: String, required: true, unique: true, index: true },
    serviceCategory: { type: String, required: true },
    skills: { type: String },
    pricing: { type: String },
    serviceArea: { type: String },
    availability: { type: String },
    portfolio: { type: String },
    ratingAverage: { type: Number, default: 0.0 },
  }
);

export const WorkerProfile = mongoose.model<IWorkerProfile>('WorkerProfile', WorkerProfileSchema);
