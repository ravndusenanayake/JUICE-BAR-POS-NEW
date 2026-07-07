import mongoose, { Schema, Document } from 'mongoose';

export interface IUnit extends Document {
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const Unit = mongoose.models.Unit || mongoose.model<IUnit>('Unit', UnitSchema);

export default Unit;
