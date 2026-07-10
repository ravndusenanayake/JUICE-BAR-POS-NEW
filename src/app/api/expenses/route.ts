import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Expense from '@/database/models/Expense';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    return NextResponse.json(expenses, { status: 200 });
  } catch (error: any) {
    console.error('GET Expense Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
