import { NextResponse } from 'next/server';
import { db } from '@/db';
import { batchGiling } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { nextBatchKode } from '@/lib/kodes';
import { batchPayload } from '@/lib/payloads';
import { listBatch } from '@/lib/queries/operasional';
import { ValidationError } from '@/lib/validation';

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({ data: await listBatch() });
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
    const payload = batchPayload(body);
    const tanggal = String(payload.tanggal);
    if (!payload.kode) payload.kode = await nextBatchKode(tanggal);

    const gabah = Number(payload.gabahKg);
    const kapasitas = Number(payload.kapasitasKg);
    if (gabah > kapasitas) {
      throw new ValidationError('Gabah masuk tidak boleh melebihi kapasitas giling.');
    }
    if (payload.berasKg !== undefined) {
      payload.rendemen = ((Number(payload.berasKg) / gabah) * 100).toFixed(2);
    }

    const [created] = await db
      .insert(batchGiling)
      .values(payload as typeof batchGiling.$inferInsert)
      .$returningId();

    const rows = await listBatch();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
