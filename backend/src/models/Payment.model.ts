import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IPayment extends Document {
  paymentId: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  timestamp: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    bookingId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], 
      default: 'PENDING' 
    },
    transactionId: { type: String, unique: true, sparse: true },
    timestamp: { type: Date, default: Date.now },
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
