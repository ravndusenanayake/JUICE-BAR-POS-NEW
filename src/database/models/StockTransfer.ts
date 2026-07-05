import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IStockTransfer extends Document {
  transferNo: string;
  sourceBranchId: mongoose.Types.ObjectId;
  destinationBranchId: mongoose.Types.ObjectId;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Received' | 'Completed';
  items: ITransferItem[];
}

const TransferItemSchema = new Schema<ITransferItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNo: { type: String, required: true, unique: true },
    sourceBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    destinationBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Received', 'Completed'],
      default: 'Draft',
    },
    items: [TransferItemSchema],
  },
  { timestamps: true }
);

StockTransferSchema.index({ transferNo: 1 });

const StockTransfer = mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);

export default StockTransfer;
