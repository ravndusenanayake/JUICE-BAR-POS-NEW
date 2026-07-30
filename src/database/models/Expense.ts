import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  branchId: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  expenseDate: Date;
  category: 'Rent' | 'Electricity' | 'Water' | 'Internet' | 'Marketing' | 'Transportation' | 'Petty Cash';
  amount: number;
  note?: string;
  attachment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    expenseDate: { type: Date, required: true, default: Date.now },
    category: {
      type: String,
      enum: ['Rent', 'Electricity', 'Water', 'Internet', 'Marketing', 'Transportation', 'Petty Cash'],
      required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String },
    attachment: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ branchId: 1 });
ExpenseSchema.index({ expenseDate: 1 });

const Expense = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
