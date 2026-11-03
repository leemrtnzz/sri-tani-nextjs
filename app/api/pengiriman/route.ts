import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pengiriman } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { nextNoKirim } from '@/lib/kodes';
import { todayISO } from '@/lib/period';
import { pengirimanPayload } from '@/lib/payloads';
import { listPengiriman } from '@/lib/queries/keuangan';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    return NextResponse.json({
      data: await listPengiriman(status, { start, end }),
    });
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
    const payload = pengirimanPayload(body);
    const tanggalKirim = String(payload.tanggalKirim);
    if (!payload.noKirim) payload.noKirim = await nextNoKirim(tanggalKirim);

    if (payload.status === 'diterima' && !payload.tanggalDiterima) {
      payload.tanggalDiterima = todayISO();
    }

    const [created] = await db
      .insert(pengiriman)
      .values(payload as typeof pengiriman.$inferInsert)
      .$returningId();

    const rows = await listPengiriman();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
