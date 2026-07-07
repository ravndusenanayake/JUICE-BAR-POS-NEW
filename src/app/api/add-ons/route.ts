import { NextResponse } from 'next/server';
import { addonService } from '@/services/addon.service';

export async function GET() {
  try {
    const addons = await addonService.getAllAddOns();
    return NextResponse.json(addons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ error: 'Add-On name and price are required' }, { status: 400 });
    }

    const newAddOn = await addonService.createAddOn(body);
    return NextResponse.json(newAddOn, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
