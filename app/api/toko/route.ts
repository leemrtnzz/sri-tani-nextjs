import { NextResponse } from 'next/server';
import { db } from '@/db';
import { toko } from '@/db/schema';
import {
  guard,
  handleRouteError,
  readBody,
} from '@/lib/api';
import { tokoPayload } from '@/lib/payloads';
import { listToko } from '@/lib/queries/keuangan';

export async function GET() {
  const access = await guard('toko', 'view');
  if ('error' in access) return access.error;

  try {
    return NextResponse.json({ data: await listToko() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const access = await guard('toko', 'create');
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const payload = tokoPayload(body);
    const [created] = await db
      .insert(toko)
      .values(payload as typeof toko.$inferInsert)
      .$returningId();

    const rows = await listToko();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
