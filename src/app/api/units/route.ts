import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Unit from '@/database/models/Unit';

export async function GET() {
  try {
    await connectToDatabase();
    const units = await Unit.find({}).sort({ createdAt: -1 });
    return NextResponse.json(units, { status: 200 });
  } catch (error: any) {
    console.error('GET Units Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const existingCode = await Unit.findOne({ code: { $regex: new RegExp(`^${body.code}$`, 'i') } });
    if (existingCode) {
      return NextResponse.json({ error: 'Unit with this code already exists' }, { status: 400 });
    }

    const newUnit = await Unit.create(body);
    return NextResponse.json(newUnit, { status: 201 });
  } catch (error: any) {
    console.error('POST Unit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
