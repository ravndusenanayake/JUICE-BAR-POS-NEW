import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import StockLedger from '@/database/models/StockLedger';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }

    const ledger = await StockLedger.find(query).sort({ date: -1 }).limit(200);
    
    return NextResponse.json(ledger, { status: 200 });
  } catch (error: any) {
    console.error('GET StockLedger Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
