import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { penggarap, petakLahan } from '@/db/schema';
import type { Coordinate } from '@/lib/geo';
import { toNumber } from '@/lib/format';
import type { PetakRow } from '@/lib/types';

export async function syncPenggarapLuas(penggarapId: number): Promise<void> {
  const rows = await db
    .select({ luasHa: petakLahan.luasHa })
    .from(petakLahan)
    .where(eq(petakLahan.penggarapId, penggarapId));
  const total = rows.reduce((sum, row) => sum + toNumber(row.luasHa), 0);
  await db
    .update(penggarap)
    .set({ luasLahanHa: total.toFixed(2) })
    .where(eq(penggarap.id, penggarapId));
}

export async function listPetak(): Promise<PetakRow[]> {
  const rows = await db
    .select({
      id: petakLahan.id,
      penggarapId: petakLahan.penggarapId,
      penggarapNama: penggarap.nama,
      fase: penggarap.fase,
      nama: petakLahan.nama,
      color: petakLahan.color,
      coords: petakLahan.coords,
      luasHa: petakLahan.luasHa,
      pusatLat: petakLahan.pusatLat,
      pusatLng: petakLahan.pusatLng,
      status: petakLahan.status,
      catatan: petakLahan.catatan,
    })
    .from(petakLahan)
    .innerJoin(penggarap, eq(petakLahan.penggarapId, penggarap.id))
    .orderBy(asc(penggarap.nama), asc(petakLahan.nama));

  return rows.map((row) => ({
    ...row,
    coords: (row.coords ?? []) as Coordinate[],
    luasHa: toNumber(row.luasHa),
    pusatLat: row.pusatLat === null ? null : toNumber(row.pusatLat),
    pusatLng: row.pusatLng === null ? null : toNumber(row.pusatLng),
  }));
}
