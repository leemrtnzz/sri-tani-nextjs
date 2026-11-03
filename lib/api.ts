import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ValidationError } from './validation';

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function unauthorized() {
  return apiError('Sesi login tidak ditemukan. Silakan masuk kembali.', 401);
}

export function forbidden() {
  return apiError('Akun ini tidak memiliki izin untuk mengubah data.', 403);
}

export function notFound(message = 'Data tidak ditemukan.') {
  return apiError(message, 404);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return apiError(error.message, 400);
  }

  const databaseError = error as {
    code?: string;
    errno?: number;
    message?: string;
  };

  if (databaseError?.code === 'ER_NO_REFERENCED_ROW_2' || databaseError?.errno === 1452) {
    return apiError('Data relasi yang dipilih tidak ditemukan. Pilih data yang tersedia.', 400);
  }

  if (databaseError?.code === 'ER_ROW_IS_REFERENCED_2' || databaseError?.errno === 1451) {
    return apiError(
      'Data tidak bisa dihapus karena masih dipakai pada catatan lain. Ubah atau hapus catatan terkait lebih dulu.',
      409,
    );
  }

  if (databaseError?.code === 'ER_DUP_ENTRY' || databaseError?.errno === 1062) {
    return apiError('Data dengan kode atau identitas yang sama sudah ada.', 409);
  }

  console.error('API error:', error);
  return apiError(
    'Terjadi kesalahan pada server. Periksa kembali data lalu coba lagi.',
    500,
  );
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new ValidationError('Body permintaan harus berupa JSON yang valid.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError('Body permintaan harus berupa objek.');
  }

  return parsed as Record<string, unknown>;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError('ID tidak valid.');
  }
  return id;
}

export function requireEditor(role: string | undefined) {
  return role === 'admin' || role === 'petugas';
}
