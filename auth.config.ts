import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to /login
      } else if (isLoggedIn) {
        // If user is already logged in and navigates to /login or /register, redirect to /dashboard
        if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const extended = user as typeof user & {
          role?: string;
          username?: string;
          nama?: string;
          email?: string | null;
        };
        token.id = user.id;
        token.role = extended.role;
        token.username = extended.username;
        token.nama = extended.nama || user.name;
        token.email = extended.email || user.email;
        token.name = extended.nama || user.name;
      }
      if (trigger === 'update' && session?.user) {
        token = { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const extended = session.user as typeof session.user & {
          role?: unknown;
          username?: unknown;
          nama?: unknown;
        };
        session.user.id = (token.id as string) || (token.sub as string);
        extended.role = token.role;
        extended.username = token.username;
        extended.nama = token.nama;
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
