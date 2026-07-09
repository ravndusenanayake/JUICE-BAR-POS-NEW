import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Product from '@/database/models/Product';

// GET all products
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

// POST new product
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
    if (error.code === 11000) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
