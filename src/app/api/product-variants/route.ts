import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import ProductVariant from '@/database/models/ProductVariant';
import Product from '@/database/models/Product';

export async function GET() {
  try {
    await connectToDatabase();
    // Populate productId to get the product name
    const variants = await ProductVariant.find().populate('productId', 'name sku category').sort({ createdAt: -1 });
    return NextResponse.json(variants, { status: 200 });
  } catch (error: any) {
    console.error('GET ProductVariants Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.productId || !body.name || body.sellingPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newVariant = new ProductVariant({
      productId: body.productId,
      name: body.name,
      sellingPrice: body.sellingPrice,
      status: body.status === false || body.status === 'Inactive' ? 'Inactive' : 'Active',
    });

    await newVariant.save();
    
    // Return populated
    const populated = await ProductVariant.findById(newVariant._id).populate('productId', 'name');
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    console.error('POST ProductVariant Error:', error);
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

    const updatedVariant = await ProductVariant.findByIdAndUpdate(id, updateData, { new: true }).populate('productId', 'name');
    return NextResponse.json(updatedVariant, { status: 200 });
  } catch (error: any) {
    console.error('PUT ProductVariant Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await ProductVariant.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Product variant deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE ProductVariant Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
