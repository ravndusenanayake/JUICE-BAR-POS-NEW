import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/database/mongoose';
import User from '@/database/models/User';
import Role from '@/database/models/Role';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Since we used email field as username in seed
    const user = await User.findOne({ email: username }).populate('roleId');

    if (!user || user.status !== 'Active') {
      return NextResponse.json({ error: 'Invalid credentials or inactive user' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const roleName = user.roleId ? (user.roleId as any).name : 'Cashier'; // Fallback

    const tokenPayload = {
      userId: user._id.toString(),
      name: user.name,
      role: roleName,
      branch: user.branchId?.toString() || 'All Branches'
    };

    const token = await signToken(tokenPayload);

    if (!token) {
      return NextResponse.json({ error: 'Failed to sign token' }, { status: 500 });
    }

    // Set HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 1 day
    });
    
    // Legacy cookie for simple middleware if needed, but we will update middleware to read auth_token
    cookieStore.set('userRole', roleName, { path: '/' }); 

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name,
        role: roleName,
        branch: tokenPayload.branch
      } 
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
