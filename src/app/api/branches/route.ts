import { NextResponse } from 'next/server';
import { branchService } from '@/services/branch.service';

export async function GET() {
  try {
    const branches = await branchService.getAllBranches();
    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Branch code and name are required' }, { status: 400 });
    }

    const newBranch = await branchService.createBranch(body);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
