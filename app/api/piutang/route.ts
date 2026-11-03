import { NextResponse } from 'next/server';
import { db } from '@/db';
import { piutang } from '@/db/schema';
import {
  guard,
  handleRouteError,
  readBody,
} from '@/lib/api';
import { piutangPayload } from '@/lib/payloads';
import { todayISO } from '@/lib/period';
import { resolvePiutangStatus } from '@/lib/piutang';
import { listPiutang } from '@/lib/queries/keuangan';

export async function GET(request: Request) {
  const access = await guard('piutang', 'view');
  if ('error' in access) return access.error;

  try {
    const url = new URL(request.url);
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    return NextResponse.json({ data: await listPiutang({ start, end }) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const access = await guard('piutang', 'create');
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const payload = piutangPayload(body);
    const nilai = Number(payload.nilai);
    let dibayar = Number(payload.dibayar ?? 0);

    if (payload.status === 'lunas') {
      dibayar = nilai;
      payload.dibayar = dibayar;
      if (!payload.tanggalBayar) payload.tanggalBayar = todayISO();
    }

    payload.status = resolvePiutangStatus(nilai, dibayar, String(payload.jatuhTempo));

    const [created] = await db
      .insert(piutang)
      .values(payload as typeof piutang.$inferInsert)
      .$returningId();

    const rows = await listPiutang();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
