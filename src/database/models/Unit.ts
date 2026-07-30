import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
  name: string;
  code: string;
  type: 'Weight' | 'Volume' | 'Count' | 'Other';
  isBaseUnit: boolean;
  baseUnitCode?: string;
  conversionFactor: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Weight', 'Volume', 'Count', 'Other'], default: 'Other' },
    isBaseUnit: { type: Boolean, default: true },
    baseUnitCode: { type: String },
    conversionFactor: { type: Number, default: 1 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const Unit = mongoose.models.Unit || mongoose.model<IUnit>('Unit', UnitSchema);

export default Unit;
