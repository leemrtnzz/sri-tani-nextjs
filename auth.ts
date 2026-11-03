import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username atau Email', type: 'text' },
        password: { label: 'Kata Sandi', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const usernameOrEmail = String(credentials.username).trim().toLowerCase();
        const password = String(credentials.password);

        try {
          const user = await db.query.users.findFirst({
            where: or(
              eq(users.username, usernameOrEmail),
              eq(users.email, usernameOrEmail)
            ),
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.nama,
            email: user.email,
            username: user.username,
            nama: user.nama,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],
});
