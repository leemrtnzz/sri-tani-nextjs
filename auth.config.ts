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
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.nama = (user as any).nama || user.name;
      }
      if (trigger === 'update' && session?.user) {
        token = { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).nama = token.nama;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
