import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Unit from '@/database/models/Unit';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updatedUnit = await Unit.findByIdAndUpdate(id, body, { new: true });
    if (!updatedUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUnit, { status: 200 });
  } catch (error: any) {
    console.error('PUT Unit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedUnit = await Unit.findByIdAndDelete(id);
    if (!deletedUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unit deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE Unit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
