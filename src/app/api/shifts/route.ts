import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Shift from '@/database/models/Shift';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const cashierName = searchParams.get('cashierName');
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');

    const query: any = {};
    if (cashierName) query.cashierName = cashierName;
    if (status) query.status = status;
    if (branch && branch !== 'All Branches') query.branch = branch;

    const shifts = await Shift.find(query).sort({ startTime: -1 });
    
    return NextResponse.json(shifts, { status: 200 });
  } catch (error: any) {
    console.error('GET Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const newShift = new Shift(body);
    await newShift.save();
    
    return NextResponse.json(newShift, { status: 201 });
  } catch (error: any) {
    console.error('POST Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 });
    }

    const updatedShift = await Shift.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedShift, { status: 200 });
  } catch (error: any) {
    console.error('PUT Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
