import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IServiceCategory extends Document {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: Date;
}

const ServiceCategorySchema = new Schema<IServiceCategory>(
  {
    id: { type: String, default: () => crypto.randomUUID(), unique: true, index: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String },
    createdAt: { type: Date, default: Date.now },
  }
);

export const ServiceCategory = mongoose.model<IServiceCategory>('ServiceCategory', ServiceCategorySchema);
