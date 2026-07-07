import mongoose, { Schema, Document } from 'mongoose';

export interface IRawMaterial extends Document {
  name: string;
  unit: string;
  currentStock: number;
  threshold: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>(
  {
    name: { type: String, required: true, unique: true },
    unit: { type: String, required: true }, // e.g. g, ml, Nos
    currentStock: { type: Number, required: true, default: 0 },
    threshold: { type: Number, required: true, default: 10 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const RawMaterial = mongoose.models.RawMaterial || mongoose.model<IRawMaterial>('RawMaterial', RawMaterialSchema);

export default RawMaterial;
