import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { batchGiling, lotJemur, pengiriman } from '@/db/schema';

function dateCode(date: string): string {
  return date.replace(/-/g, '');
}

export async function nextLotKode(): Promise<string> {
  const rows = await db.select({ kode: lotJemur.kode }).from(lotJemur);
  const numbers = rows
    .map((row) => Number(row.kode.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `LOT-${String(next).padStart(2, '0')}`;
}

export async function nextBatchKode(tanggal: string): Promise<string> {
  const rows = await db
    .select({ id: batchGiling.id })
    .from(batchGiling)
    .where(eq(batchGiling.tanggal, tanggal));
  return `BATCH-${dateCode(tanggal)}-${String(rows.length + 1).padStart(2, '0')}`;
}

export async function nextNoKirim(tanggal: string): Promise<string> {
  const rows = await db
    .select({ id: pengiriman.id })
    .from(pengiriman)
    .where(eq(pengiriman.tanggalKirim, tanggal));
  return `KRM-${dateCode(tanggal)}-${String(rows.length + 1).padStart(2, '0')}`;
}
