import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import GRN from '@/database/models/GRN';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { grnId, amount, method, date, notes } = body;
    
    if (!grnId || !amount || !method || !date) {
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
    }
    
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return NextResponse.json({ error: 'GRN Not Found' }, { status: 404 });
    }
    
    grn.payments.push({
      date: new Date(date),
      amount: Number(amount),
      method,
      notes
    });
    
    grn.paidAmount += Number(amount);
    
    if (grn.paidAmount >= grn.totalAmount) {
      grn.paymentStatus = 'Fully Paid';
    } else if (grn.paidAmount > 0) {
      grn.paymentStatus = 'Partially Paid';
    }
    
    await grn.save();
    
    return NextResponse.json(grn, { status: 200 });
  } catch (error: any) {
    console.error('POST GRN Payment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
