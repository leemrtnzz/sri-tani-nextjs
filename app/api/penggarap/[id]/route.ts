import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { penggarap } from '@/db/schema';
import {
  guard,
  handleRouteError,
  notFound,
  parseId,
  readBody,
} from '@/lib/api';
import { accountPayload, penggarapPayload } from '@/lib/payloads';
import { listPenggarap } from '@/lib/queries/penggarap';
import { createPetugasAccount, updatePetugasAccount } from '@/lib/user-account';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const access = await guard('penggarap', 'update');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const [existing] = await db
      .select()
      .from(penggarap)
      .where(eq(penggarap.id, id))
      .limit(1);
    if (!existing) return notFound('Penggarap tidak ditemukan.');

    const body = await readBody(request);
    const payload = penggarapPayload(body, true);
    const account = accountPayload(body);

    const finalName = String(payload.nama ?? existing.nama);

    if (existing.userId && (payload.nama || account.username || account.email || account.password)) {
      await updatePetugasAccount(existing.userId, {
        nama: finalName,
        username: account.username,
        email: account.email,
        password: account.password,
      });
    } else if (!existing.userId && account.buatAkun) {
      const userId = await createPetugasAccount({
        nama: finalName,
        username: account.username,
        email: account.email,
        password: account.password,
      });
      payload.userId = userId;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({
        data: (await listPenggarap()).find((row) => row.id === id),
      });
    }

    await db
      .update(penggarap)
      .set(payload as Partial<typeof penggarap.$inferInsert>)
      .where(eq(penggarap.id, id));

    const rows = await listPenggarap();
    return NextResponse.json({ data: rows.find((row) => row.id === id) ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const access = await guard('penggarap', 'delete');
  if ('error' in access) return access.error;

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    await db.delete(penggarap).where(eq(penggarap.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
