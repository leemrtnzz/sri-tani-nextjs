import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { petakLahan } from '@/db/schema';
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
import { petakPayload } from '@/lib/payloads';
import { listPetak, syncPenggarapLuas } from '@/lib/queries/lahan';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(petakLahan)
      .where(eq(petakLahan.id, id))
      .limit(1);
    if (!existing) return notFound('Petak lahan tidak ditemukan.');

    const body = await readBody(request);
    const payload = petakPayload(body, true);

    if (Object.keys(payload).length > 0) {
      await db
        .update(petakLahan)
        .set(payload as Partial<typeof petakLahan.$inferInsert>)
        .where(eq(petakLahan.id, id));
    }

    const affected = new Set<number>([existing.penggarapId]);
    if (payload.penggarapId) affected.add(Number(payload.penggarapId));
    for (const penggarapId of affected) {
      await syncPenggarapLuas(penggarapId);
    }

    const rows = await listPetak();
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
    const [existing] = await db
      .select({ penggarapId: petakLahan.penggarapId })
      .from(petakLahan)
      .where(eq(petakLahan.id, id))
      .limit(1);
    if (!existing) return notFound('Petak lahan tidak ditemukan.');

    await db.delete(petakLahan).where(eq(petakLahan.id, id));
    await syncPenggarapLuas(existing.penggarapId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
