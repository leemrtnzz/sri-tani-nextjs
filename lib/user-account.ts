import bcrypt from 'bcryptjs';
import { and, eq, ne, or } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ValidationError } from './validation';

export function slugifyUsername(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return base || `petugas${Date.now().toString().slice(-5)}`;
}

export function defaultEmail(username: string): string {
  return `${username}@sritani.local`;
}

type AccountInput = {
  nama: string;
  username?: string;
  email?: string;
  password?: string;
};

export async function createPetugasAccount(input: AccountInput): Promise<number> {
  const username = (input.username || slugifyUsername(input.nama)).toLowerCase();
  const email = (input.email || defaultEmail(username)).toLowerCase();
  const password = input.password || 'password123';

  if (password.length < 6) {
    throw new ValidationError('Kata sandi akun minimal 6 karakter.');
  }

  const existing = await db.query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });

  if (existing) {
    throw new ValidationError('Username atau email akun penggarap sudah dipakai.');
  }

  const hashed = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({
      nama: input.nama,
      email,
      username,
      password: hashed,
      role: 'petugas',
    })
    .$returningId();

  return created.id;
}

export async function updatePetugasAccount(
  userId: number,
  input: AccountInput,
): Promise<void> {
  const updates: Record<string, unknown> = { nama: input.nama };
  const username = input.username?.toLowerCase();
  const email = input.email?.toLowerCase();

  if (username) updates.username = username;
  if (email) updates.email = email;
  if (input.password) {
    if (input.password.length < 6) {
      throw new ValidationError('Kata sandi akun minimal 6 karakter.');
    }
    updates.password = await bcrypt.hash(input.password, 10);
  }

  if (username || email) {
    const existing = await db.query.users.findFirst({
      where: and(
        ne(users.id, userId),
        or(
          username ? eq(users.username, username) : undefined,
          email ? eq(users.email, email) : undefined,
        ),
      ),
    });
    if (existing) {
      throw new ValidationError('Username atau email akun penggarap sudah dipakai.');
    }
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
}
