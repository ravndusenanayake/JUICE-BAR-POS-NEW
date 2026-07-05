import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  invoiceNo: string;
  branchId: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Split Payment';
  status: 'Completed' | 'Voided';
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    invoiceNo: { type: String, required: true, unique: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Bank Transfer', 'Split Payment'],
      required: true,
    },
    status: { type: String, enum: ['Completed', 'Voided'], default: 'Completed' },
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SaleSchema.index({ invoiceNo: 1 });
SaleSchema.index({ branchId: 1 });
SaleSchema.index({ saleDate: 1 });

const Sale = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
