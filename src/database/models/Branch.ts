import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  managerId?: mongoose.Types.ObjectId;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const Branch = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);

export default Branch;
