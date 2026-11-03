import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { batchGiling, penggarap, pengiriman, piutang, toko, transaksi } from '@/db/schema';
import { toNumber } from '@/lib/format';
import {
  MONTH_SHORT,
  daysBetween,
  parseDateString,
  todayISO,
  yearRange,
} from '@/lib/period';
import { resolvePiutangStatus } from '@/lib/piutang';
import type {
  CashflowSummary,
  MonthlyFinancePoint,
  Option,
  PengirimanRow,
  PiutangRow,
  TokoRow,
  TransaksiRow,
} from '@/lib/types';

type DateRange = { start?: string; end?: string };

export async function listToko(): Promise<TokoRow[]> {
  const rows = await db.query.toko.findMany({
    with: { pengiriman: { columns: { id: true } } },
    orderBy: [asc(toko.nama)],
  });

  return rows.map((row) => ({
    id: row.id,
    nama: row.nama,
    alamat: row.alamat,
    telepon: row.telepon,
    jumlahPengiriman: row.pengiriman.length,
  }));
}

export async function tokoOptions(): Promise<Option[]> {
  const rows = await db.query.toko.findMany({
    columns: { id: true, nama: true, alamat: true },
    orderBy: [asc(toko.nama)],
  });
  return rows.map((row) => ({
    value: row.id,
    label: row.nama,
    meta: row.alamat ?? undefined,
  }));
}

export async function listPengiriman(
  status?: string,
  range: DateRange = {},
): Promise<PengirimanRow[]> {
  const conditions = [];
  if (status) conditions.push(eq(pengiriman.status, status as never));
  if (range.start) conditions.push(gte(pengiriman.tanggalKirim, range.start));
  if (range.end) conditions.push(lte(pengiriman.tanggalKirim, range.end));

  const rows = await db
    .select({
      id: pengiriman.id,
      noKirim: pengiriman.noKirim,
      tokoId: pengiriman.tokoId,
      tokoNama: toko.nama,
      batchId: pengiriman.batchId,
      batchKode: batchGiling.kode,
      gudang: pengiriman.gudang,
      berasKg: pengiriman.berasKg,
      armada: pengiriman.armada,
      tanggalKirim: pengiriman.tanggalKirim,
      tanggalDiterima: pengiriman.tanggalDiterima,
      penerima: pengiriman.penerima,
      status: pengiriman.status,
      catatan: pengiriman.catatan,
    })
    .from(pengiriman)
    .innerJoin(toko, eq(pengiriman.tokoId, toko.id))
    .leftJoin(batchGiling, eq(pengiriman.batchId, batchGiling.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(pengiriman.tanggalKirim), desc(pengiriman.id));

  return rows.map((row) => ({
    ...row,
    berasKg: toNumber(row.berasKg),
  }));
}

export async function listPiutang(range: DateRange = {}): Promise<PiutangRow[]> {
  const conditions = [];
  if (range.start) conditions.push(gte(piutang.jatuhTempo, range.start));
  if (range.end) conditions.push(lte(piutang.jatuhTempo, range.end));

  const rows = await db
    .select({
      id: piutang.id,
      penggarapId: piutang.penggarapId,
      penggarapNama: penggarap.nama,
      nilai: piutang.nilai,
      dibayar: piutang.dibayar,
      jatuhTempo: piutang.jatuhTempo,
      tanggalBayar: piutang.tanggalBayar,
      keterangan: piutang.keterangan,
    })
    .from(piutang)
    .innerJoin(penggarap, eq(piutang.penggarapId, penggarap.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(piutang.jatuhTempo), asc(piutang.id));

  const today = todayISO();

  return rows.map((row) => {
    const nilai = toNumber(row.nilai);
    const dibayar = toNumber(row.dibayar);
    const sisa = Math.max(0, nilai - dibayar);
    const status = resolvePiutangStatus(nilai, dibayar, row.jatuhTempo);

    return {
      ...row,
      nilai,
      dibayar,
      sisa,
      status,
      hariTerlambat:
        sisa > 0 && row.jatuhTempo < today ? daysBetween(row.jatuhTempo, today) : 0,
    };
  });
}

export async function listTransaksi(range: DateRange = {}): Promise<TransaksiRow[]> {
  const conditions = [];
  if (range.start) conditions.push(gte(transaksi.tanggal, range.start));
  if (range.end) conditions.push(lte(transaksi.tanggal, range.end));

  const rows = await db
    .select({
      id: transaksi.id,
      tanggal: transaksi.tanggal,
      keterangan: transaksi.keterangan,
      jenis: transaksi.jenis,
      kategori: transaksi.kategori,
      nominal: transaksi.nominal,
      tokoId: transaksi.tokoId,
      tokoNama: toko.nama,
      batchId: transaksi.batchId,
      batchKode: batchGiling.kode,
      penggarapId: transaksi.penggarapId,
      penggarapNama: penggarap.nama,
    })
    .from(transaksi)
    .leftJoin(toko, eq(transaksi.tokoId, toko.id))
    .leftJoin(batchGiling, eq(transaksi.batchId, batchGiling.id))
    .leftJoin(penggarap, eq(transaksi.penggarapId, penggarap.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transaksi.tanggal), desc(transaksi.id));

  return rows.map((row) => ({
    ...row,
    nominal: toNumber(row.nominal),
  }));
}

export function summarizeCashflow(rows: TransaksiRow[]): CashflowSummary {
  let modal = 0;
  let pengeluaran = 0;
  let penjualan = 0;

  for (const row of rows) {
    if (row.jenis === 'pemasukan') {
      penjualan += row.nominal;
      continue;
    }
    if (row.kategori === 'modal') {
      modal += row.nominal;
    } else {
      pengeluaran += row.nominal;
    }
  }

  const laba = penjualan - modal - pengeluaran;
  const ratio = (value: number) => (penjualan > 0 ? (value / penjualan) * 100 : 0);

  return {
    modal,
    pengeluaran,
    penjualan,
    laba,
    marginLaba: penjualan > 0 ? Math.round((laba / penjualan) * 1000) / 10 : 0,
    persenModal: Math.round(ratio(modal) * 10) / 10,
    persenPengeluaran: Math.round(ratio(pengeluaran) * 10) / 10,
    persenLaba: Math.round(ratio(laba) * 10) / 10,
    jumlahTransaksi: rows.length,
  };
}

export async function monthlySeries(tahun: number): Promise<MonthlyFinancePoint[]> {
  const range = yearRange(tahun);
  const rows = await listTransaksi(range);
  const points: MonthlyFinancePoint[] = MONTH_SHORT.map((label, index) => ({
    bulan: index + 1,
    label,
    penjualan: 0,
    modal: 0,
    pengeluaran: 0,
    laba: 0,
  }));

  for (const row of rows) {
    const date = parseDateString(row.tanggal);
    if (!date) continue;
    const point = points[date.getMonth()];
    if (row.jenis === 'pemasukan') {
      point.penjualan += row.nominal;
    } else if (row.kategori === 'modal') {
      point.modal += row.nominal;
    } else {
      point.pengeluaran += row.nominal;
    }
  }

  return points.map((point) => ({
    ...point,
    laba: point.penjualan - point.modal - point.pengeluaran,
  }));
}
