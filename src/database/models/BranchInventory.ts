import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchInventory extends Document {
  branchId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId; // References RawMaterial / InventoryItem
  currentStock: number;
  minimumStock: number;
  createdAt: Date;
  updatedAt: Date;
}

const BranchInventorySchema = new Schema<IBranchInventory>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minimumStock: { type: Number, required: true, default: 10 },
  },
  { timestamps: true }
);

// Compound index to ensure one record per item per branch
BranchInventorySchema.index({ branchId: 1, inventoryItemId: 1 }, { unique: true });

const BranchInventory = mongoose.models.BranchInventory || mongoose.model<IBranchInventory>('BranchInventory', BranchInventorySchema);

export default BranchInventory;
