import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { batchGiling, lotJemur, panen, penggarap } from '@/db/schema';
import { toNumber } from '@/lib/format';
import { quarterOfDate, quarterRange } from '@/lib/period';
import type {
  BatchRow,
  HarvestRankRow,
  LotRow,
  Option,
  PanenRow,
} from '@/lib/types';

export async function listLot(): Promise<LotRow[]> {
  const rows = await db
    .select({
      id: lotJemur.id,
      kode: lotJemur.kode,
      penggarapId: lotJemur.penggarapId,
      penggarapNama: penggarap.nama,
      kapasitasKg: lotJemur.kapasitasKg,
      gabahKg: lotJemur.gabahKg,
      kadarAir: lotJemur.kadarAir,
      status: lotJemur.status,
      catatan: lotJemur.catatan,
    })
    .from(lotJemur)
    .leftJoin(penggarap, eq(lotJemur.penggarapId, penggarap.id))
    .orderBy(asc(lotJemur.kode));

  return rows.map((row) => ({
    ...row,
    kapasitasKg: toNumber(row.kapasitasKg),
    gabahKg: toNumber(row.gabahKg),
    kadarAir: row.kadarAir === null ? null : toNumber(row.kadarAir),
  }));
}

export async function lotOptions(): Promise<Option[]> {
  const rows = await listLot();
  return rows.map((row) => ({
    value: row.id,
    label: row.kode,
    meta:
      row.penggarapNama
        ? `${row.penggarapNama} - ${row.gabahKg} kg`
        : `Kosong - ${row.kapasitasKg} kg`,
  }));
}

export async function listBatch(): Promise<BatchRow[]> {
  const rows = await db
    .select({
      id: batchGiling.id,
      kode: batchGiling.kode,
      tanggal: batchGiling.tanggal,
      jam: batchGiling.jam,
      penggarapId: batchGiling.penggarapId,
      penggarapNama: penggarap.nama,
      lotId: batchGiling.lotId,
      lotKode: lotJemur.kode,
      kapasitasKg: batchGiling.kapasitasKg,
      gabahKg: batchGiling.gabahKg,
      berasKg: batchGiling.berasKg,
      rendemen: batchGiling.rendemen,
      status: batchGiling.status,
      catatan: batchGiling.catatan,
    })
    .from(batchGiling)
    .leftJoin(penggarap, eq(batchGiling.penggarapId, penggarap.id))
    .leftJoin(lotJemur, eq(batchGiling.lotId, lotJemur.id))
    .orderBy(asc(batchGiling.tanggal), asc(batchGiling.jam), asc(batchGiling.kode));

  return rows.map((row) => ({
    ...row,
    kapasitasKg: toNumber(row.kapasitasKg),
    gabahKg: toNumber(row.gabahKg),
    berasKg: row.berasKg === null ? null : toNumber(row.berasKg),
    rendemen: row.rendemen === null ? null : toNumber(row.rendemen),
  }));
}

export async function batchOptions(): Promise<Option[]> {
  const rows = await db.query.batchGiling.findMany({
    columns: { id: true, kode: true, tanggal: true, status: true },
    orderBy: [desc(batchGiling.tanggal)],
  });
  return rows.map((row) => ({
    value: row.id,
    label: `${row.kode} (${row.tanggal})`,
    meta: row.status,
  }));
}

export async function listPanen(start?: string, end?: string): Promise<PanenRow[]> {
  const conditions = [];
  if (start) conditions.push(gte(panen.tanggalPanen, start));
  if (end) conditions.push(lte(panen.tanggalPanen, end));

  const rows = await db
    .select({
      id: panen.id,
      penggarapId: panen.penggarapId,
      penggarapNama: penggarap.nama,
      tanggalPanen: panen.tanggalPanen,
      musim: panen.musim,
      hasilTonPerHa: panen.hasilTonPerHa,
      totalGabahKg: panen.totalGabahKg,
      rating: panen.rating,
      catatan: panen.catatan,
    })
    .from(panen)
    .innerJoin(penggarap, eq(panen.penggarapId, penggarap.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(panen.tanggalPanen));

  return rows.map((row) => ({
    ...row,
    hasilTonPerHa: toNumber(row.hasilTonPerHa),
    totalGabahKg: row.totalGabahKg === null ? null : toNumber(row.totalGabahKg),
    rating: row.rating === null ? null : toNumber(row.rating),
    kuartal: quarterOfDate(row.tanggalPanen),
    tahun: Number(row.tanggalPanen.slice(0, 4)),
  }));
}

export async function harvestRanking(
  tahun: number,
  kuartal: number,
): Promise<HarvestRankRow[]> {
  const range = quarterRange(tahun, kuartal);
  const rows = await listPanen(range.start, range.end);

  const grouped = new Map<
    number,
    {
      penggarapId: number;
      penggarapNama: string;
      totalGabahKg: number;
      totalHasil: number;
      totalRating: number;
      ratingCount: number;
      jumlahPanen: number;
    }
  >();

  for (const row of rows) {
    const current =
      grouped.get(row.penggarapId) ?? {
        penggarapId: row.penggarapId,
        penggarapNama: row.penggarapNama,
        totalGabahKg: 0,
        totalHasil: 0,
        totalRating: 0,
        ratingCount: 0,
        jumlahPanen: 0,
      };

    current.jumlahPanen += 1;
    current.totalGabahKg += row.totalGabahKg ?? 0;
    current.totalHasil += row.hasilTonPerHa;
    if (row.rating !== null) {
      current.totalRating += row.rating;
      current.ratingCount += 1;
    }
    grouped.set(row.penggarapId, current);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      peringkat: 0,
      penggarapId: item.penggarapId,
      penggarapNama: item.penggarapNama,
      kuartal,
      tahun,
      jumlahPanen: item.jumlahPanen,
      totalGabahKg: item.totalGabahKg,
      rataHasilTonPerHa:
        Math.round((item.totalHasil / Math.max(1, item.jumlahPanen)) * 100) / 100,
      ratingRata:
        item.ratingCount === 0
          ? null
          : Math.round((item.totalRating / item.ratingCount) * 10) / 10,
    }))
    .sort((a, b) => b.rataHasilTonPerHa - a.rataHasilTonPerHa)
    .map((item, index) => ({ ...item, peringkat: index + 1 }));
}
