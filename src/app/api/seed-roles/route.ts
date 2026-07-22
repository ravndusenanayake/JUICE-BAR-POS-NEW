import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/database/mongoose';
import { roleService } from '@/services/role.service';

export async function GET() {
  try {
    await connectToDatabase();
    await mongoose.connection.collection('roles').drop().catch(() => {});
    await roleService.seedDefaultRoles();
    return NextResponse.json({ message: 'Roles seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
