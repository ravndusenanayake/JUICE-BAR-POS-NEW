import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Expense from '@/database/models/Expense';

import Branch from '@/database/models/Branch';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query: any = {};
    if (branch && branch !== 'All Branches') {
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        query.branchId = branchDoc._id;
      }
    }

    const expenses = await Expense.find(query)
      .populate('branchId', 'name')
      .sort({ expenseDate: -1 });

    const mapped = expenses.map(e => ({
      id: e._id,
      branch: e.branchId ? (e.branchId as any).name : 'Unknown',
      date: e.expenseDate,
      category: e.category,
      amount: e.amount,
      note: e.note,
      attachment: e.attachment
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error('GET Expense Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const { branch, branchId, shiftId, date, expenseDate, category, amount, note, attachment } = body;
    
    if ((!branch && !branchId) || !category || !amount) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let finalBranchId = branchId;
    if (!finalBranchId && branch) {
      const branchDoc = await Branch.findOne({ name: branch });
      if (!branchDoc) {
         return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }
      finalBranchId = branchDoc._id;
    }
    
    const expense = new Expense({
      branchId: finalBranchId,
      shiftId: shiftId || undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : (date ? new Date(date) : new Date()),
      category,
      amount,
      note,
      attachment
    });
    
    await expense.save();
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('POST Expense Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (updateData.branch) {
      const branchDoc = await Branch.findOne({ name: updateData.branch });
      if (branchDoc) updateData.branchId = branchDoc._id;
      delete updateData.branch;
    }
    
    if (updateData.date) {
      updateData.expenseDate = new Date(updateData.date);
      delete updateData.date;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error: any) {
    console.error('PUT Expense Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Expense deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE Expense Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
