import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLedger extends Document {
  branchId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  transactionType: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  recordedBy: mongoose.Types.ObjectId; // User ID
  createdAt: Date;
  updatedAt: Date;
}

const StockLedgerSchema = new Schema<IStockLedger>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    transactionType: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const StockLedger = mongoose.models.StockLedger || mongoose.model<IStockLedger>('StockLedger', StockLedgerSchema);

export default StockLedger;
