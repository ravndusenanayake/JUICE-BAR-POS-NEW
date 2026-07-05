import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchStock extends Document {
  branchId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  quantity: number;
}

const BranchStockSchema = new Schema<IBranchStock>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

BranchStockSchema.index({ branchId: 1, inventoryItemId: 1 }, { unique: true });

const BranchStock = mongoose.models.BranchStock || mongoose.model<IBranchStock>('BranchStock', BranchStockSchema);

export default BranchStock;
