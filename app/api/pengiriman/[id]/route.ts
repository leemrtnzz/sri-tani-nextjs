import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { pengiriman } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { todayISO } from '@/lib/period';
import { pengirimanPayload } from '@/lib/payloads';
import { listPengiriman } from '@/lib/queries/keuangan';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('pengiriman', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(pengiriman)
      .where(eq(pengiriman.id, id))
      .limit(1);
    if (!existing) return notFound('Pengiriman tidak ditemukan.');

    const body = await readBody(request);
    const payload = pengirimanPayload(body, true);
    if (payload.noKirim === null) delete payload.noKirim;

    if (payload.status === 'diterima' && !payload.tanggalDiterima && !existing.tanggalDiterima) {
      payload.tanggalDiterima = todayISO();
    }

    if (Object.keys(payload).length > 0) {
      await db
        .update(pengiriman)
        .set(payload as Partial<typeof pengiriman.$inferInsert>)
        .where(eq(pengiriman.id, id));
    }

    const rows = await listPengiriman();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('pengiriman', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(pengiriman).where(eq(pengiriman.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
