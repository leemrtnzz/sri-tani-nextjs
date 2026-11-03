import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lotJemur } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  requireEditor,
  unauthorized,
} from '@/lib/api';
import { nextLotKode } from '@/lib/kodes';
import { lotPayload } from '@/lib/payloads';
import { listLot } from '@/lib/queries/operasional';
import { ValidationError } from '@/lib/validation';

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({ data: await listLot() });
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
    const payload = lotPayload(body);
    if (!payload.kode) payload.kode = await nextLotKode();

    if (Number(payload.gabahKg) > Number(payload.kapasitasKg)) {
      throw new ValidationError('Gabah di lot tidak boleh melebihi kapasitas lot.');
    }

    const [created] = await db
      .insert(lotJemur)
      .values(payload as typeof lotJemur.$inferInsert)
      .$returningId();

    const rows = await listLot();
    return NextResponse.json(
      { data: rows.find((row) => row.id === created.id) ?? null },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
