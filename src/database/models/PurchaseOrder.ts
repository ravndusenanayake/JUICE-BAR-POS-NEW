import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  id: string; // SKU or internal item ID
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierName: string;
  branch: string;
  orderDate: Date;
  expectedDate: Date;
  status: 'Pending' | 'Partially Received' | 'Fully Received' | 'Cancelled';
  totalAmount: number;
  items: IPOItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 }
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierName: { type: String, required: true },
    branch: { type: String, required: true },
    orderDate: { type: Date, required: true },
    expectedDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Partially Received', 'Fully Received', 'Cancelled'], default: 'Pending' },
    totalAmount: { type: Number, required: true },
    items: [POItemSchema],
    notes: { type: String }
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
