import mongoose, { Schema, Document } from 'mongoose';

export interface IRawMaterial extends Document {
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStockLevel: number;
  currentStock: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    unit: { type: String, required: true }, // e.g. g, ml, Nos
    minStockLevel: { type: Number, required: true, default: 10 },
    currentStock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const RawMaterial = mongoose.models.RawMaterial || mongoose.model<IRawMaterial>('RawMaterial', RawMaterialSchema);

export default RawMaterial;
