import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLedger extends Document {
  branch: string;
  sku: string;
  type: string;
  quantity: number;
  reference?: string;
  remarks?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockLedgerSchema = new Schema<IStockLedger>(
  {
    branch: { type: String, required: true },
    sku: { type: String, required: true },
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    reference: { type: String },
    remarks: { type: String },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const StockLedger = mongoose.models.StockLedger || mongoose.model<IStockLedger>('StockLedger', StockLedgerSchema);

export default StockLedger;
