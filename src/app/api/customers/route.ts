import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Customer from '@/database/models/Customer';

export async function GET() {
  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 });
    return NextResponse.json(customers, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.customerCode) {
      const count = await Customer.countDocuments();
      body.customerCode = `CUST-${(count + 1).toString().padStart(3, '0')}`;
    }

    const customer = new Customer(body);
    await customer.save();
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
