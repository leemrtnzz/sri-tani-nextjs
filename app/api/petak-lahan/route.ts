import { NextResponse } from 'next/server';
import { db } from '@/db';
import { petakLahan } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { petakPayload } from '@/lib/payloads';
import { listPetak, syncPenggarapLuas } from '@/lib/queries/lahan';

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({ data: await listPetak() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!requireEditor((user as { role?: string }).role)) return forbidden();

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
