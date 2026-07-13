import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import PurchaseOrder from '@/database/models/PurchaseOrder';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }
    
    const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 });
    return NextResponse.json(pos, { status: 200 });
  } catch (error: any) {
    console.error('GET PurchaseOrders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Auto-generate PO Number if missing
    if (!body.poNumber) {
      body.poNumber = `PO-${Date.now()}`;
    }

    const po = new PurchaseOrder(body);
    await po.save();
    
    return NextResponse.json(po, { status: 201 });
  } catch (error: any) {
    console.error('POST PurchaseOrder Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, items, status } = body;
    
    if (!id) return NextResponse.json({ error: 'Missing PO ID' }, { status: 400 });
    
    const po = await PurchaseOrder.findById(id);
    if (!po) return NextResponse.json({ error: 'PO Not Found' }, { status: 404 });
    
    if (items) po.items = items;
    if (status) po.status = status;
    
    await po.save();
    return NextResponse.json(po, { status: 200 });
  } catch (error: any) {
    console.error('PUT PurchaseOrder Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
