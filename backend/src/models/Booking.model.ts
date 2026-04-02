import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IBooking extends Document {
  bookingId: string;
  customerId: string;
  workerId: string;
  serviceCategory: string;
  scheduledDateTime: Date;
  serviceAddress: string;
  specialInstructions?: string;
  estimatedCost?: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  paymentMode: 'PAY_NOW' | 'PAY_LATER';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    workerId: { type: String, required: true, index: true },
    serviceCategory: { type: String, required: true },
    scheduledDateTime: { type: Date, required: true },
    serviceAddress: { type: String, required: true },
    specialInstructions: { type: String },
    estimatedCost: { type: Number },
    status: { 
      type: String, 
      enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'], 
      default: 'PENDING' 
    },
    paymentMode: { type: String, enum: ['PAY_NOW', 'PAY_LATER'], default: 'PAY_LATER' },
  },
  { 
    timestamps: true 
  }
);

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
