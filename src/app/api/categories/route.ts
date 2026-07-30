import { NextResponse } from 'next/server';
import { categoryService } from '@/services/category.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const categories = activeOnly 
      ? await categoryService.getActiveCategories()
      : await categoryService.getAllCategories();
      
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, status } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await categoryService.createCategory({ name, description, status });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
