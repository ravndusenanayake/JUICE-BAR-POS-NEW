import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'SUPER_SECRET_JUICE_BAR_KEY_2026_VERY_SECURE',
  trustHost: true,
  providers: [], // Empty for edge runtime compatibility, added in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.branch = (user as any).branch;
        token.id = user.id;
        token.permissions = (user as any).permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).branch = token.branch;
        (session.user as any).id = token.id;
        (session.user as any).permissions = token.permissions || [];
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
