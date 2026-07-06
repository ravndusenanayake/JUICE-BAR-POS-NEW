import { NextResponse } from 'next/server';
import { roleService } from '@/services/role.service';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedRole = await roleService.updateRole(id, body);
    return NextResponse.json(updatedRole);
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
    await roleService.deleteRole(id);
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('cannot be deleted')) {
      return NextResponse.json({ error: error.message }, { status: 403 }); // Forbidden
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
