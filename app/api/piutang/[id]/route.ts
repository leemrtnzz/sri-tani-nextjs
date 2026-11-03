import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { piutang } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { piutangPayload } from '@/lib/payloads';
import { todayISO } from '@/lib/period';
import { resolvePiutangStatus } from '@/lib/piutang';
import { listPiutang } from '@/lib/queries/keuangan';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('piutang', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(piutang)
      .where(eq(piutang.id, id))
      .limit(1);
    if (!existing) return notFound('Piutang tidak ditemukan.');

    const body = await readBody(request);
    const payload = piutangPayload(body, true);

    const nilai = Number(payload.nilai ?? existing.nilai);
    let dibayar = Number(payload.dibayar ?? existing.dibayar);
    const jatuhTempo = String(payload.jatuhTempo ?? existing.jatuhTempo);
    const tanggalBayar =
      payload.tanggalBayar === undefined
        ? existing.tanggalBayar
        : (payload.tanggalBayar as string | null);

    if (payload.status === 'lunas') {
      dibayar = nilai;
      payload.dibayar = dibayar;
      if (!tanggalBayar) payload.tanggalBayar = todayISO();
    }

    payload.status = resolvePiutangStatus(nilai, dibayar, jatuhTempo);

    await db
      .update(piutang)
      .set(payload as Partial<typeof piutang.$inferInsert>)
      .where(eq(piutang.id, id));

    const rows = await listPiutang();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('piutang', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(piutang).where(eq(piutang.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
