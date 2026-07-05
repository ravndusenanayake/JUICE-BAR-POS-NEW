import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  cost: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  date: Date;
  expectedDate?: Date;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Received' | 'Closed';
  items: IPOItem[];
}

const POItemSchema = new Schema<IPOItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true },
    cost: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, default: Date.now },
    expectedDate: { type: Date },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Received', 'Closed'],
      default: 'Draft',
    },
    items: [POItemSchema],
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ poNumber: 1 });
PurchaseOrderSchema.index({ supplierId: 1 });
PurchaseOrderSchema.index({ branchId: 1 });

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
