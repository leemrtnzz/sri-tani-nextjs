import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { penggarap } from '@/db/schema';
import { toNumber } from '@/lib/format';
import type { Option, PenggarapRow } from '@/lib/types';

export async function listPenggarap(): Promise<PenggarapRow[]> {
  const rows = await db.query.penggarap.findMany({
    with: {
      user: { columns: { username: true, email: true } },
      petak: { columns: { luasHa: true } },
      piutang: { columns: { nilai: true, dibayar: true, status: true } },
    },
    orderBy: [asc(penggarap.nama)],
  });

  return rows.map((row) => {
    const totalLuasPetak = row.petak.reduce((sum, petak) => sum + toNumber(petak.luasHa), 0);
    const sisaPiutang = row.piutang.reduce((sum, item) => {
      if (item.status === 'lunas') return sum;
      return sum + Math.max(0, toNumber(item.nilai) - toNumber(item.dibayar));
    }, 0);

    return {
      id: row.id,
      userId: row.userId,
      nama: row.nama,
      telepon: row.telepon,
      alamat: row.alamat,
      luasLahanHa: toNumber(row.luasLahanHa),
      fase: row.fase,
      rating: row.rating === null ? null : toNumber(row.rating),
      status: row.status,
      catatan: row.catatan,
      username: row.user?.username ?? null,
      email: row.user?.email ?? null,
      jumlahPetak: row.petak.length,
      totalLuasPetak: Math.round(totalLuasPetak * 100) / 100,
      sisaPiutang,
    };
  });
}

export async function penggarapOptions(): Promise<Option[]> {
  const rows = await db.query.penggarap.findMany({
    columns: { id: true, nama: true, luasLahanHa: true, status: true },
    orderBy: [asc(penggarap.nama)],
  });

  return rows.map((row) => ({
    value: row.id,
    label: row.nama,
    meta: `${toNumber(row.luasLahanHa).toFixed(2)} Ha`,
  }));
}
