import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  employeeId: string;
  name: string;
  phone?: string;
  address?: string;
  branchId: mongoose.Types.ObjectId;
  position?: string;
  salary?: number;
  status: 'Active' | 'Inactive';
}

const StaffSchema = new Schema<IStaff>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    position: { type: String },
    salary: { type: Number },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

StaffSchema.index({ branchId: 1 });

const Staff = mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);

export default Staff;
