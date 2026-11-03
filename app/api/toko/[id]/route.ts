import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { toko } from '@/db/schema';
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
import { tokoPayload } from '@/lib/payloads';
import { listToko } from '@/lib/queries/keuangan';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

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
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(toko).where(eq(toko.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
