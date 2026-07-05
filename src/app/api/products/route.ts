import { NextResponse } from 'next/server';
import { productService } from '@/services/product.service';

export async function GET() {
  try {
    const products = await productService.getAllProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, validate 'body' here using Zod
    const { sku, name, categoryId, sellingPrice, variantName } = body;
    
    if (!sku || !name || !sellingPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = await productService.createProductWithVariant(
      { sku, name, categoryId },
      { name: variantName || 'Regular', sellingPrice: Number(sellingPrice) }
    );
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
