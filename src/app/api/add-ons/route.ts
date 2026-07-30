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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    if (data.status !== undefined) {
       data.status = (data.status === true || data.status === 'Active') ? 'Active' : 'Inactive';
    }

    const updatedAddOn = await addonService.updateAddOn(id, data);
    return NextResponse.json(updatedAddOn);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await addonService.deleteAddOn(id);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
