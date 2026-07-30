import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  mobile: string;
  email?: string;
  birthday?: Date;
  loyaltyPoints: number;
  totalSpend: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, unique: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String },
    birthday: { type: Date },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
  },
  { timestamps: true }
);

CustomerSchema.index({ mobile: 1 });

const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
