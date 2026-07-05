import mongoose, { Schema, Document } from 'mongoose';

export interface IAddOn extends Document {
  name: string;
  price: number;
  status: 'Active' | 'Inactive';
}

const AddOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const AddOn = mongoose.models.AddOn || mongoose.model<IAddOn>('AddOn', AddOnSchema);

export default AddOn;
