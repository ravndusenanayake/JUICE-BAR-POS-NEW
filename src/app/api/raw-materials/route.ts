import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import RawMaterial from '@/database/models/RawMaterial';

export async function GET() {
  try {
    await connectToDatabase();
    const rawMaterials = await RawMaterial.find().sort({ createdAt: -1 });
    return NextResponse.json(rawMaterials, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const rawMaterial = new RawMaterial(body);
    await rawMaterial.save();
    return NextResponse.json(rawMaterial, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing raw material ID' }, { status: 400 });
    }

    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMaterial) {
      return NextResponse.json({ error: 'Raw material not found' }, { status: 404 });
    }

    return NextResponse.json(updatedMaterial, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
