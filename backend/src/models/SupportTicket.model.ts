import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface ISupportTicket extends Document {
  id: string;
  userId?: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    id: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    userId: { type: String, index: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'OPEN' },
  },
  { 
    timestamps: true 
  }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
