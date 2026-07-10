import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  variant?: string;
  addons?: any[];
  note?: string;
}

export interface ISale extends Document {
  invoiceNo: string;
  branch: string;
  cashier: string;
  customer: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Completed' | 'Voided';
  items: ISaleItem[];
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  variant: { type: String },
  addons: { type: Schema.Types.Mixed },
  note: { type: String },
}, { _id: false });

const SaleSchema = new Schema<ISale>(
  {
    invoiceNo: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    cashier: { type: String, required: true },
    customer: { type: String, default: 'Walk-In Customer' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['Completed', 'Voided'], default: 'Completed' },
    items: [SaleItemSchema],
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SaleSchema.index({ invoiceNo: 1 });
SaleSchema.index({ branch: 1 });
SaleSchema.index({ saleDate: 1 });

const Sale = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
