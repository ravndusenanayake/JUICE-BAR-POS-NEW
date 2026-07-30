import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Shift from '@/database/models/Shift';
import Sale from '@/database/models/Sale';
import Expense from '@/database/models/Expense';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const shiftId = searchParams.get('shiftId');

    if (!shiftId || !mongoose.Types.ObjectId.isValid(shiftId)) {
      return NextResponse.json({ error: 'Valid Shift ID required' }, { status: 400 });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Since older sales/expenses might not have shiftId, we will query by time window as a fallback,
    // or rely on shiftId if we enforce it. 
    // To be safe and fully backward-compatible, we query by time:
    const startTime = shift.startTime;
    const endTime = shift.endTime || new Date(); // if open, up to now

    // 1. Calculate Sales (Cash vs Card)
    const sales = await Sale.find({
      branch: shift.branch,
      cashier: shift.cashierName,
      saleDate: { $gte: startTime, $lte: endTime },
      status: { $in: ['Completed', 'Partially Refunded'] }
    });

    let cashSales = 0;
    let cardSales = 0;
    let otherSales = 0;

    sales.forEach(sale => {
      if (sale.paymentMethod === 'Cash') cashSales += sale.total;
      else if (sale.paymentMethod === 'Card') cardSales += sale.total;
      else otherSales += sale.total;
    });

    // 2. Calculate Refunds (Returns)
    const refunds = await Sale.find({
      branch: shift.branch,
      cashier: shift.cashierName,
      saleDate: { $gte: startTime, $lte: endTime },
      status: 'Refunded'
    });

    let totalRefunds = 0;
    refunds.forEach(sale => totalRefunds += sale.total);
    
    // Also include partially refunded items
    sales.forEach(sale => {
      if (sale.returnedItems && sale.returnedItems.length > 0) {
        sale.returnedItems.forEach((item: any) => {
           totalRefunds += item.refundAmount;
        });
      }
    });

    // 3. Calculate Expenses (Petty Cash during shift)
    // We assume expenses have shiftId since they are new from POS, or we check branch and time
    const expenses = await Expense.find({
      $or: [
        { shiftId: shift._id },
        { branchId: (await mongoose.model('Branch').findOne({ name: shift.branch }))?._id, expenseDate: { $gte: startTime, $lte: endTime } }
      ]
    });

    let totalExpenses = 0;
    expenses.forEach(exp => totalExpenses += exp.amount);

    // 4. Calculate Expected Cash
    const expectedCash = shift.openingBalance + cashSales - totalRefunds - totalExpenses;

    return NextResponse.json({
      shiftId: shift._id,
      cashierName: shift.cashierName,
      branch: shift.branch,
      openingBalance: shift.openingBalance,
      cashSales,
      cardSales,
      otherSales,
      totalSales: cashSales + cardSales + otherSales,
      totalRefunds,
      totalExpenses,
      expectedCash
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET Shift Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
