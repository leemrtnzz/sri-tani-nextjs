import { NextResponse } from 'next/server';
import { db } from '@/db';
import { petakLahan } from '@/db/schema';
import {
  guard,
  handleRouteError,
  readBody,
} from '@/lib/api';
import { petakPayload } from '@/lib/payloads';
import { listPetak, syncPenggarapLuas } from '@/lib/queries/lahan';

export async function GET() {
  const access = await guard('lahan', 'view');
  if ('error' in access) return access.error;

  try {
    return NextResponse.json({ data: await listPetak() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const access = await guard('lahan', 'create');
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const payload = petakPayload(body);
    const [created] = await db
      .insert(petakLahan)
      .values(payload as typeof petakLahan.$inferInsert)
      .$returningId();

    await syncPenggarapLuas(Number(payload.penggarapId));

    const rows = await listPetak();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
