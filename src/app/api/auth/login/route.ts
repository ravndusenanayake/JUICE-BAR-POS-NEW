import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import User from '@/database/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // In our mock frontend, they just click a button to login as a role.
    // In a real API, they would pass username/password.
    // For Phase 1 transition, we will accept a role and mock the password check, 
    // or if they pass a real email/password, we verify it.
    
    const body = await req.json();
    const { email, password, role } = body;
    
    let user;

    if (email && password) {
       // Real login path (Future)
       user = await User.findOne({ email });
       if (!user) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
       }
       // We would check password here. (e.g. bcrypt.compare)
       if (password !== 'password123') { // Mock check for now
           return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
       }
    } else if (role) {
       // Transition path for our current UI mock buttons
       user = await User.findOne({ role });
       
       // If no user exists in DB for this role, we create a dummy one on the fly for testing
       if (!user) {
         user = new User({
           name: `${role} User`,
           email: `${role.replace(/\s+/g, '').toLowerCase()}@juicebar.com`,
           password: 'hashed_password', // Mock
           role: role,
           branch: 'Colombo 07',
           status: 'Active'
         });
         await user.save();
       }
    } else {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        branch: user.branch,
        email: user.email
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
