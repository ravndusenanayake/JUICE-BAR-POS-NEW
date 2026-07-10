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
       const mockEmail = `${role.replace(/\s+/g, '').toLowerCase()}@juicebar.com`;
       user = await User.findOne({ email: mockEmail });
       
       // If no user exists in DB for this role, we create a dummy one on the fly for testing
       if (!user) {
         try {
           user = new User({
             name: `${role} User`,
             email: mockEmail,
             password: 'hashed_password', // Mock
             role: role,
             branch: 'Colombo 07',
             status: 'Active'
           });
           await user.save();
         } catch (err: any) {
           if (err.code === 11000) {
             // Duplicate key error: another request might have created it concurrently
             user = await User.findOne({ email: mockEmail });
           } else {
             throw err;
           }
         }
       } else if (!user.role) {
         // Fix legacy users that had roleId instead of role string
         user.role = role;
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
