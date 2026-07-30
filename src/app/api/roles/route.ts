import { NextResponse } from 'next/server';
import { roleService } from '@/services/role.service';

export async function GET() {
  try {
    const roles = await roleService.getAllRoles();
    return NextResponse.json(roles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, permissions } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const newRole = await roleService.createRole({ name, permissions: permissions || [] });
    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
