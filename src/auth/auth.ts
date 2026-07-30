import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/database/mongoose';
import User from '@/database/models/User';
import Role from '@/database/models/Role';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectToDatabase();
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() }).lean();

        if (!user || !user.password || user.status !== 'Active') {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) {
          return null;
        }

        const roleDoc = await Role.findOne({ name: (user as any).role }).lean();
        const permissions = (roleDoc as any)?.permissions || [];

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: (user as any).role,
          branch: (user as any).branch,
          permissions: permissions,
        };
      },
    }),
  ],
});
