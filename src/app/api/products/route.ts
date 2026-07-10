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
    
    if (!body.name || !body.sku || !body.outletPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = new Product({
      sku: body.sku,
      name: body.name,
      category: body.category || 'General',
      type: body.type || 'Product',
      unit: body.unit || 'Nos',
      cost: body.cost || 0,
      outletPrice: body.outletPrice,
      pickmePrice: body.pickmePrice || body.outletPrice,
      uberPrice: body.uberPrice || body.outletPrice,
      status: body.status ? 'Active' : 'Inactive',
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
       updateData.status = updateData.status ? 'Active' : 'Inactive';
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
