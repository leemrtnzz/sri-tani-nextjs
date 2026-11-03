import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { transaksi } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  notFound,
  parseId,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { transaksiPayload } from '@/lib/payloads';
import { listTransaksi } from '@/lib/queries/keuangan';
import { ValidationError } from '@/lib/validation';

type RouteParams = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, context: RouteParams) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(transaksi)
      .where(eq(transaksi.id, id))
      .limit(1);
    if (!existing) return notFound('Transaksi tidak ditemukan.');

    const body = await readBody(request);
    const payload = transaksiPayload(body, true);

    assertCategory(
      String(payload.jenis ?? existing.jenis),
      String(payload.kategori ?? existing.kategori),
    );

    if (Object.keys(payload).length > 0) {
      await db
        .update(transaksi)
        .set(payload as Partial<typeof transaksi.$inferInsert>)
        .where(eq(transaksi.id, id));
    }

    const rows = await listTransaksi();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(transaksi).where(eq(transaksi.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
