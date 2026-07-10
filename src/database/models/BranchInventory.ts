import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchInventory extends Document {
  branch: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStockLevel: number;
  lastRestocked: Date;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  createdAt: Date;
  updatedAt: Date;
}

const BranchInventorySchema = new Schema<IBranchInventory>(
  {
    branch: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, required: true, default: 10 },
    lastRestocked: { type: Date, default: Date.now },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  },
  { timestamps: true }
);

BranchInventorySchema.index({ branch: 1, sku: 1 }, { unique: true });

const BranchInventory = mongoose.models.BranchInventory || mongoose.model<IBranchInventory>('BranchInventory', BranchInventorySchema);

export default BranchInventory;
