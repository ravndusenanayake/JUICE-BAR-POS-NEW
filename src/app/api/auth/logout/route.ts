import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('userRole'); // Delete legacy cookie as well
  
  return NextResponse.json({ success: true });
}
