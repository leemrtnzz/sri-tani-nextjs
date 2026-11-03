import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { panen } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { panenPayload } from '@/lib/payloads';
import { quarterLabel, quarterOfDate } from '@/lib/period';
import { listPanen } from '@/lib/queries/operasional';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('panen', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(panen)
      .where(eq(panen.id, id))
      .limit(1);
    if (!existing) return notFound('Data panen tidak ditemukan.');

    const body = await readBody(request);
    const payload = panenPayload(body, true);

    if (payload.tanggalPanen && !payload.musim) {
      const tanggal = String(payload.tanggalPanen);
      payload.musim = quarterLabel(
        Number(tanggal.slice(0, 4)),
        quarterOfDate(tanggal),
      );
    }

    if (Object.keys(payload).length > 0) {
      await db
        .update(panen)
        .set(payload as Partial<typeof panen.$inferInsert>)
        .where(eq(panen.id, id));
    }

    const rows = await listPanen();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('panen', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(panen).where(eq(panen.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
