import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNItem {
  itemName: string;
  unit: string;
  orderedQty: number;
  receivedGoodQty: number;
  damagedQty: number;
  unitPrice: number;
  totalPrice: number;
  expiryDate?: Date;
}

export interface IGRNPayment {
  date: Date;
  amount: number;
  method: string;
  notes?: string;
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
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  payments: IGRNPayment[];
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    itemName: { type: String, required: true },
    unit: { type: String, required: true },
    orderedQty: { type: Number, required: true },
    receivedGoodQty: { type: Number, required: true, default: 0 },
    damagedQty: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date }
  },
  { _id: false }
);

const GRNPaymentSchema = new Schema<IGRNPayment>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    notes: { type: String }
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
    items: [GRNItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['Unpaid', 'Partially Paid', 'Fully Paid'], default: 'Unpaid' },
    payments: [GRNPaymentSchema]
  },
  { timestamps: true }
);

delete mongoose.models.GRN;
const GRN = mongoose.model<IGRN>('GRN', GRNSchema);

export default GRN;
