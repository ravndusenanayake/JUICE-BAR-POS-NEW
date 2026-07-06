import { NextResponse } from 'next/server';
import { categoryService } from '@/services/category.service';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedCategory = await categoryService.updateCategory(id, body);
    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await categoryService.deleteCategory(id);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
