import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { toko } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { tokoPayload } from '@/lib/payloads';
import { listToko } from '@/lib/queries/keuangan';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('toko', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db.select().from(toko).where(eq(toko.id, id)).limit(1);
    if (!existing) return notFound('Toko tidak ditemukan.');

    const body = await readBody(request);
    const payload = tokoPayload(body, true);

    if (Object.keys(payload).length > 0) {
      await db
        .update(toko)
        .set(payload as Partial<typeof toko.$inferInsert>)
        .where(eq(toko.id, id));
    }

    const rows = await listToko();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('toko', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(toko).where(eq(toko.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
