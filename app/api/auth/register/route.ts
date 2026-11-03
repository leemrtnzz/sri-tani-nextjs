import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, email, username, password, role } = body;

    // Validasi kelengkapan data
    if (!nama || !email || !username || !password) {
      return NextResponse.json(
        { message: 'Semua kolom wajib diisi (nama, email, username, kata sandi).' },
        { status: 400 }
      );
    }

    const cleanNama = String(nama).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password);
    const chosenRole: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';

    if (cleanNama.length < 2) {
      return NextResponse.json(
        { message: 'Nama lengkap minimal 2 karakter.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { message: 'Format alamat email tidak valid.' },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { message: 'Username minimal 3 karakter.' },
        { status: 400 }
      );
    }

    // Username format: alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { message: 'Username hanya boleh mengandung huruf, angka, dan garis bawah (_).' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { message: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Cek duplikasi email atau username
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.email, cleanEmail),
        eq(users.username, cleanUsername)
      ),
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' },
          { status: 409 }
        );
      }
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { message: 'Username sudah digunakan. Silakan pilih username lain.' },
          { status: 409 }
        );
      }
    }

    // Hash kata sandi
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // Simpan user baru
    await db.insert(users).values({
      nama: cleanNama,
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      role: chosenRole,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registrasi berhasil! Silakan masuk dengan akun Anda.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Register Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat memproses registrasi.' },
      { status: 500 }
    );
  }
}

