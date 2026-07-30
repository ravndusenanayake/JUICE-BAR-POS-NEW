import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Recipe from '@/database/models/Recipe';

export async function GET() {
  try {
    await connectToDatabase();
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    return NextResponse.json(recipes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const recipe = new Recipe(body);
    await recipe.save();
    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updatedRecipe = await Recipe.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updatedRecipe);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await Recipe.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
