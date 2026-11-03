import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { batchGiling } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { batchPayload } from '@/lib/payloads';
import { listBatch } from '@/lib/queries/operasional';
import { ValidationError } from '@/lib/validation';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('penggilingan', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(batchGiling)
      .where(eq(batchGiling.id, id))
      .limit(1);
    if (!existing) return notFound('Batch penggilingan tidak ditemukan.');

    const body = await readBody(request);
    const payload = batchPayload(body, true);
    if (payload.kode === null) delete payload.kode;

    const gabah = Number(payload.gabahKg ?? existing.gabahKg);
    const kapasitas = Number(payload.kapasitasKg ?? existing.kapasitasKg);
    if (gabah > kapasitas) {
      throw new ValidationError('Gabah masuk tidak boleh melebihi kapasitas giling.');
    }

    if (payload.berasKg !== undefined || payload.gabahKg !== undefined) {
      const beras =
        payload.berasKg !== undefined
          ? Number(payload.berasKg)
          : existing.berasKg === null
            ? null
            : Number(existing.berasKg);
      payload.rendemen =
        beras === null || gabah <= 0 ? null : ((beras / gabah) * 100).toFixed(2);
    }

    if (Object.keys(payload).length > 0) {
      await db
        .update(batchGiling)
        .set(payload as Partial<typeof batchGiling.$inferInsert>)
        .where(eq(batchGiling.id, id));
    }

    const rows = await listBatch();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('penggilingan', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(batchGiling).where(eq(batchGiling.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
