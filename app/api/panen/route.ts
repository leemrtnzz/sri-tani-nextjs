import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { panen, penggarap } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { toNumber } from '@/lib/format';
import { panenPayload } from '@/lib/payloads';
import { quarterLabel, quarterOfDate } from '@/lib/period';
import { listPanen } from '@/lib/queries/operasional';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    const url = new URL(request.url);
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    return NextResponse.json({ data: await listPanen(start, end) });
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
    const payload = panenPayload(body);
    const tanggalPanen = String(payload.tanggalPanen);

    if (!payload.musim) {
      payload.musim = quarterLabel(
        Number(tanggalPanen.slice(0, 4)),
        quarterOfDate(tanggalPanen),
      );
    }

    if (payload.totalGabahKg === undefined) {
      const [owner] = await db
        .select({ luasLahanHa: penggarap.luasLahanHa })
        .from(penggarap)
        .where(eq(penggarap.id, Number(payload.penggarapId)))
        .limit(1);
      if (owner) {
        payload.totalGabahKg = Math.round(
          Number(payload.hasilTonPerHa) * toNumber(owner.luasLahanHa) * 1000,
        );
      }
    }

    const [created] = await db
      .insert(panen)
      .values(payload as typeof panen.$inferInsert)
      .$returningId();

    const rows = await listPanen();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
