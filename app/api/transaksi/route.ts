import { NextResponse } from 'next/server';
import { db } from '@/db';
import { transaksi } from '@/db/schema';
import {
  guard,
  handleRouteError,
  readBody,
} from '@/lib/api';
import { transaksiPayload } from '@/lib/payloads';
import { listTransaksi } from '@/lib/queries/keuangan';
import { ValidationError } from '@/lib/validation';

function assertCategory(jenis: string, kategori: string) {
  if (jenis === 'pemasukan' && ['modal', 'operasional'].includes(kategori)) {
    throw new ValidationError(
      'Transaksi pemasukan memakai kategori penjualan atau lainnya.',
    );
  }
  if (jenis === 'pengeluaran' && kategori === 'penjualan') {
    throw new ValidationError(
      'Transaksi pengeluaran memakai kategori modal, operasional, atau lainnya.',
    );
  }
}

export async function GET(request: Request) {
  const access = await guard('cashflow', 'view');
  if ('error' in access) return access.error;

  try {
    const url = new URL(request.url);
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    return NextResponse.json({ data: await listTransaksi({ start, end }) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const access = await guard('cashflow', 'create');
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const payload = transaksiPayload(body);
    assertCategory(String(payload.jenis), String(payload.kategori));

    const [created] = await db
      .insert(transaksi)
      .values(payload as typeof transaksi.$inferInsert)
      .$returningId();

    const rows = await listTransaksi();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
