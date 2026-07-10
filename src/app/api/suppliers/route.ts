import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Supplier from '@/database/models/Supplier';

export async function GET() {
  try {
    await connectToDatabase();
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    return NextResponse.json(suppliers, { status: 200 });
  } catch (error: any) {
    console.error('GET Suppliers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const newSupplier = new Supplier(body);
    await newSupplier.save();
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    console.error('POST Supplier Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updatedSupplier = await Supplier.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedSupplier, { status: 200 });
  } catch (error: any) {
    console.error('PUT Supplier Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await Supplier.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Supplier deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE Supplier Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
