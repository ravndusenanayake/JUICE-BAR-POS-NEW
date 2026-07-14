import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Product from '@/database/models/Product';

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('GET Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const sku = body.sku || `PRD-${Date.now().toString().slice(-6)}`;

    const newProduct = new Product({
      sku: sku,
      name: body.name,
      category: body.category || 'General',
      type: body.type || 'Product',
      unit: body.unit || 'Nos',
      cost: body.cost || 0,
      outletPrice: body.outletPrice || 0,
      pickmePrice: body.pickmePrice || body.outletPrice || 0,
      uberPrice: body.uberPrice || body.outletPrice || 0,
      status: (body.status === true || body.status === 'Active') ? 'Active' : 'Inactive',
      image: body.image,
      description: body.description,
      threshold: body.threshold || 0,
      addons: body.addons || [],
    });

    await newProduct.save();
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('POST Product Error:', error);
    if (error.code === 11000) return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    if (updateData.status !== undefined) {
       updateData.status = (updateData.status === true || updateData.status === 'Active') ? 'Active' : 'Inactive';
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error('PUT Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
