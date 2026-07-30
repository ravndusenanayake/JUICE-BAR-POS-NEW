import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    mobile: { type: String },
    email: { type: String },
    address: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
