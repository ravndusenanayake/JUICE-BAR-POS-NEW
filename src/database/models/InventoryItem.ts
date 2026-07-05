import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  sku: string;
  name: string;
  unit: string;
  reorderLevel?: number;
  status: 'Active' | 'Inactive';
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    reorderLevel: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const InventoryItem = mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

export default InventoryItem;
