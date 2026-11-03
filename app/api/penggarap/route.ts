import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { penggarap } from '@/db/schema';
import {
  guard,
  handleRouteError,
  readBody,
} from '@/lib/api';
import { accountPayload, penggarapPayload } from '@/lib/payloads';
import { listPenggarap } from '@/lib/queries/penggarap';
import { createPetugasAccount } from '@/lib/user-account';

export async function GET() {
  const access = await guard('penggarap', 'view');
  if ('error' in access) return access.error;

  try {
    return NextResponse.json({ data: await listPenggarap() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const access = await guard('penggarap', 'create');
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const payload = penggarapPayload(body);
    const account = accountPayload(body);

    const [created] = await db
      .insert(penggarap)
      .values(payload as typeof penggarap.$inferInsert)
      .$returningId();

    if (account.buatAkun) {
      try {
        const userId = await createPetugasAccount({
          nama: String(payload.nama ?? ''),
          username: account.username,
          email: account.email,
          password: account.password,
        });
        await db.update(penggarap).set({ userId }).where(eq(penggarap.id, created.id));
      } catch (error) {
        await db.delete(penggarap).where(eq(penggarap.id, created.id));
        throw error;
      }
    }

    const rows = await listPenggarap();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
