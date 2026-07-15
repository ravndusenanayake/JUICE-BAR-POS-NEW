import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  tenantId: string;
  storeName: string;
  address: string;
  phone: string;
  logoUrl: string;
  taxRate: number;
  taxName: string;
  packagingCharge: number;
  receiptFooter: string;
  maxBranches: number;
  maxUsers: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    tenantId: { type: String, required: true, default: 'DEFAULT', unique: true },
    storeName: { type: String, default: 'Fresh Squeeze Juice Bar' },
    address: { type: String, default: '123 Health Ave, Wellness City' },
    phone: { type: String, default: '+1 (555) 123-4567' },
    logoUrl: { type: String, default: '' },
    taxRate: { type: Number, default: 8.0 },
    taxName: { type: String, default: 'Sales Tax' },
    packagingCharge: { type: Number, default: 0 },
    receiptFooter: { type: String, default: 'Thank you for choosing Fresh Squeeze! Stay healthy.' },
    maxBranches: { type: Number, default: 3 },
    maxUsers: { type: Number, default: 10 }
  },
  { timestamps: true }
);

delete mongoose.models.Settings;
const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
