import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { lotJemur } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { lotPayload } from '@/lib/payloads';
import { listLot } from '@/lib/queries/operasional';
import { ValidationError } from '@/lib/validation';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('pengeringan', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(lotJemur)
      .where(eq(lotJemur.id, id))
      .limit(1);
    if (!existing) return notFound('Lot pengeringan tidak ditemukan.');

    const body = await readBody(request);
    const payload = lotPayload(body, true);
    if (payload.kode === null) delete payload.kode;

    const gabah = Number(payload.gabahKg ?? existing.gabahKg);
    const kapasitas = Number(payload.kapasitasKg ?? existing.kapasitasKg);
    if (gabah > kapasitas) {
      throw new ValidationError('Gabah di lot tidak boleh melebihi kapasitas lot.');
    }

    if (Object.keys(payload).length > 0) {
      await db
        .update(lotJemur)
        .set(payload as Partial<typeof lotJemur.$inferInsert>)
        .where(eq(lotJemur.id, id));
    }

    const rows = await listLot();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('pengeringan', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(lotJemur).where(eq(lotJemur.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
