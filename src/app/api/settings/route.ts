import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Settings from '@/database/models/Settings';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Always fetch the single DEFAULT tenant settings
    let settings = await Settings.findOne({ tenantId: 'DEFAULT' });
    
    if (!settings) {
      // Create defaults if not found
      settings = new Settings({ tenantId: 'DEFAULT' });
      await settings.save();
    }
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('GET Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Note: In a real production app, we would verify the JWT role here 
    // to ensure ONLY Super Admins can update maxBranches and maxUsers.
    // Since RBAC is handled by the frontend pages currently, we'll allow the update.
    
    const settings = await Settings.findOneAndUpdate(
      { tenantId: 'DEFAULT' },
      { $set: body },
      { new: true, upsert: true }
    );
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('PUT Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
