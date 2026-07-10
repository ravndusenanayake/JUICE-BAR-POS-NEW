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
