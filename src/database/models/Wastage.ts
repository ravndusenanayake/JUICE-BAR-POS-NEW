import mongoose, { Schema, Document } from 'mongoose';

export interface IWastage extends Document {
  branchId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  reason: 'Expired' | 'Rotten' | 'Damaged' | 'Spillage';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WastageSchema = new Schema<IWastage>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['Expired', 'Rotten', 'Damaged', 'Spillage'],
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Wastage = mongoose.models.Wastage || mongoose.model<IWastage>('Wastage', WastageSchema);

export default Wastage;
