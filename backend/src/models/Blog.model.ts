import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IBlog extends Document {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    id: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    category: { type: String, required: true },
    body: { type: String, required: true },
  },
  { 
    timestamps: true 
  }
);

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
