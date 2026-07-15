import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import GRN from '@/database/models/Grn';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }
    
    const grns = await GRN.find(query).sort({ receivedDate: -1 });
    return NextResponse.json(grns, { status: 200 });
  } catch (error: any) {
    console.error('GET GRN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Always generate a unique GRN Number server-side to prevent duplicate keys
    body.grnNumber = `GRN-${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 100)}`;
    
    // Default payment status
    body.paidAmount = 0;
    body.paymentStatus = 'Unpaid';
    
    const grn = new GRN(body);
    await grn.save();
    
    return NextResponse.json(grn, { status: 201 });
  } catch (error: any) {
    console.error('POST GRN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
