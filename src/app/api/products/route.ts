import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Product from '@/database/models/Product';

// GET all products
export async function GET() {
  try {
    await connectToDatabase();
    
    // We populate category if it was an ObjectId, but our mock used strings.
    // So we just fetch all.
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
    
    // Simple validation
    if (!body.name || !body.category || !body.basePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = new Product({
      name: body.name,
      category: body.category,
      basePrice: body.basePrice,
      status: body.status || 'Active',
      image: body.image || ''
    });

    await newProduct.save();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('POST Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
