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

export interface IReturnedItem {
  productId: string;
  name: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  action: 'Wastage' | 'Restock';
}

export interface ISale extends Document {
  invoiceNo: string;
  branch: string;
  cashier: string;
  customer: string;
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Completed' | 'Voided' | 'Refunded' | 'Partially Refunded';
  shiftId?: mongoose.Types.ObjectId;
  items: ISaleItem[];
  returnedItems?: IReturnedItem[];
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

const ReturnedItemSchema = new Schema<IReturnedItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  reason: { type: String },
  action: { type: String, enum: ['Wastage', 'Restock'], required: true },
}, { _id: false });

const SaleSchema = new Schema<ISale>(
  {
    invoiceNo: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    cashier: { type: String, required: true },
    customer: { type: String, default: 'Walk-In Customer' },
    orderType: { type: String, enum: ['Dine-In', 'Takeaway', 'Delivery'], default: 'Takeaway' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['Completed', 'Voided', 'Refunded', 'Partially Refunded'], default: 'Completed' },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    items: [SaleItemSchema],
    returnedItems: [ReturnedItemSchema],
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SaleSchema.index({ invoiceNo: 1 });
SaleSchema.index({ branch: 1 });
SaleSchema.index({ saleDate: 1 });

const Sale = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
