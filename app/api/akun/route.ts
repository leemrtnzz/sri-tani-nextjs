import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { and, eq, ne, or } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  currentUser,
  handleRouteError,
  notFound,
  readBody,
  unauthorized,
} from '@/lib/api';
import { text, ValidationError } from '@/lib/validation';

function safeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

async function findCurrentUser() {
  const sessionUser = await currentUser();
  if (!sessionUser?.id) return null;
  const id = Number(sessionUser.id);
  if (!Number.isInteger(id)) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function GET() {
  const user = await findCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json({ data: safeUser(user) });
}

export async function PATCH(request: Request) {
  try {
    const user = await findCurrentUser();
    if (!user) return unauthorized();

    const body = await readBody(request);
    const nama = text(body.nama, 'Nama lengkap', {
      required: true,
      min: 2,
      max: 120,
    });
    const username = text(body.username, 'Username', {
      required: true,
      min: 3,
      max: 60,
    });
    const email = text(body.email, 'Email', {
      required: true,
      max: 190,
    });
    const password = text(body.password, 'Kata sandi baru', {
      min: 6,
      max: 100,
    });
    const confirmPassword = text(body.confirmPassword, 'Konfirmasi kata sandi', {
      max: 100,
    });

    if (!nama || !username || !email) {
      throw new ValidationError('Nama, username, dan email wajib diisi.');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError(
        'Username hanya boleh huruf, angka, dan garis bawah.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Format email tidak valid.');
    }

    if (password && password !== confirmPassword) {
      throw new ValidationError('Konfirmasi kata sandi tidak sama.');
    }

    const duplicate = await db.query.users.findFirst({
      where: and(
        ne(users.id, user.id),
        or(eq(users.username, username.toLowerCase()), eq(users.email, email.toLowerCase())),
      ),
    });

    if (duplicate) {
      throw new ValidationError('Username atau email sudah dipakai akun lain.');
    }

    const updates: Partial<typeof users.$inferInsert> = {
      nama,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
    };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updates).where(eq(users.id, user.id));

    const [updated] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!updated) return notFound('Akun tidak ditemukan.');

    return NextResponse.json({ data: safeUser(updated) });
  } catch (error) {
    return handleRouteError(error);
  }
}
