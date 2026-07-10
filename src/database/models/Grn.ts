import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNItem {
  itemName: string;
  unit: string;
  orderedQty: number;
  receivedGoodQty: number;
  damagedQty: number;
}

export interface IGRN extends Document {
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  branch: string;
  receivedDate: Date;
  receivedBy: string;
  notes?: string;
  items: IGRNItem[];
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    itemName: { type: String, required: true },
    unit: { type: String, required: true },
    orderedQty: { type: Number, required: true },
    receivedGoodQty: { type: Number, required: true, default: 0 },
    damagedQty: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const GRNSchema = new Schema<IGRN>(
  {
    grnNumber: { type: String, required: true, unique: true },
    poNumber: { type: String, required: true },
    supplierName: { type: String, required: true },
    branch: { type: String, required: true },
    receivedDate: { type: Date, required: true },
    receivedBy: { type: String, required: true },
    notes: { type: String },
    items: [GRNItemSchema]
  },
  { timestamps: true }
);

const GRN = mongoose.models.GRN || mongoose.model<IGRN>('GRN', GRNSchema);

export default GRN;
