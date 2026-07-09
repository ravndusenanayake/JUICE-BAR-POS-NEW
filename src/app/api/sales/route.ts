import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Sale from '@/database/models/Sale';

// GET all sales
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // We can filter by branch using URL params if needed
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query = branch && branch !== "All Branches" ? { branch } : {};

    const sales = await Sale.find(query).sort({ createdAt: -1 }).limit(100);
    
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    console.error('GET Sales Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST new sale
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

    const newSale = new Sale({
      receiptNumber: body.receiptNumber || `REC-${Date.now()}`,
      branch: body.branch || 'Colombo 07',
      cashier: body.cashier || 'Unknown',
      customer: body.customer || 'Walk-In',
      subTotal: body.subTotal,
      discount: body.discount || 0,
      total: body.total,
      paymentMethod: body.paymentMethod || 'Cash',
      items: body.items, // Array of items
      status: 'Completed'
    });

    await newSale.save();

    // In a real robust system, we would also deduct from BranchInventory here.
    // For Phase 2 transition, we'll implement that in the next step, 
    // or rely on a background job, but usually it's done synchronously.

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error('POST Sale Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
