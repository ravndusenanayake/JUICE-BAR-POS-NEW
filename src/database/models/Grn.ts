import mongoose, { Schema, Document } from 'mongoose';

export interface IGrnItem {
  productId: mongoose.Types.ObjectId;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
}

export interface IGrn extends Document {
  grnNumber: string;
  poId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  receivedDate: Date;
  items: IGrnItem[];
}

const GrnItemSchema = new Schema<IGrnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    orderedQty: { type: Number, required: true },
    receivedQty: { type: Number, required: true },
    damagedQty: { type: Number, default: 0 },
  },
  { _id: false }
);

const GrnSchema = new Schema<IGrn>(
  {
    grnNumber: { type: String, required: true, unique: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    receivedDate: { type: Date, default: Date.now },
    items: [GrnItemSchema],
  },
  { timestamps: true }
);

GrnSchema.index({ grnNumber: 1 });
GrnSchema.index({ poId: 1 });

const Grn = mongoose.models.Grn || mongoose.model<IGrn>('Grn', GrnSchema);

export default Grn;
