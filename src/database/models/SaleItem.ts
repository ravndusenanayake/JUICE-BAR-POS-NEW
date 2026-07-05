import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleAddOn {
  addOnId: mongoose.Types.ObjectId;
  price: number;
}

export interface ISaleItem extends Document {
  saleId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  total: number;
  addOns: ISaleAddOn[];
}

const SaleAddOnSchema = new Schema<ISaleAddOn>(
  {
    addOnId: { type: Schema.Types.ObjectId, ref: 'AddOn', required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const SaleItemSchema = new Schema<ISaleItem>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    addOns: [SaleAddOnSchema],
  },
  { timestamps: false }
);

SaleItemSchema.index({ saleId: 1 });

const SaleItem = mongoose.models.SaleItem || mongoose.model<ISaleItem>('SaleItem', SaleItemSchema);

export default SaleItem;
