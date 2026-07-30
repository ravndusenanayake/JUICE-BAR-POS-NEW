import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  cashierName: string;
  branch: string;
  startTime: Date;
  endTime?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedClosingBalance?: number;
  status: 'Open' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    cashierName: { type: String, required: true },
    branch: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    openingBalance: { type: Number, required: true, default: 0 },
    closingBalance: { type: Number },
    expectedClosingBalance: { type: Number },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' }
  },
  { timestamps: true }
);

const Shift = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);

export default Shift;
