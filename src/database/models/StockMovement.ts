import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  branchId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  type: 'GRN' | 'SALE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'WASTAGE' | 'ADJUSTMENT';
  referenceId: mongoose.Types.ObjectId;
  qtyBefore: number;
  qtyChanged: number;
  qtyAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: {
      type: String,
      enum: ['GRN', 'SALE', 'TRANSFER_OUT', 'TRANSFER_IN', 'WASTAGE', 'ADJUSTMENT'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    qtyBefore: { type: Number, required: true },
    qtyChanged: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

StockMovementSchema.index({ branchId: 1 });
StockMovementSchema.index({ itemId: 1 });
StockMovementSchema.index({ createdAt: -1 });

const StockMovement = mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);

export default StockMovement;
