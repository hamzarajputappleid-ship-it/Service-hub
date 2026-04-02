import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IMessage extends Document {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  status: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    messageId: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    messageText: { type: String, required: true },
    status: { type: String, default: 'SENT' },
    timestamp: { type: Date, default: Date.now },
  }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
