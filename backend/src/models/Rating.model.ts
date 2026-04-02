import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IRating extends Document {
  ratingId: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  ratingScore: number;
  reviewText?: string;
  timestamp: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    ratingId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    bookingId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    workerId: { type: String, required: true, index: true },
    ratingScore: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String },
    timestamp: { type: Date, default: Date.now },
  }
);

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
