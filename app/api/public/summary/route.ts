import { NextResponse } from 'next/server';
import { db } from '@/db';
import { kandang, ternak } from '@/db/schema';
import { listPetak } from '@/lib/queries/lahan';
import { listPenggarap } from '@/lib/queries/penggarap';
import { listLot, listPanen } from '@/lib/queries/operasional';
import {
  listPengiriman,
  listTransaksi,
  summarizeCashflow,
} from '@/lib/queries/keuangan';

export async function GET() {
  try {
    const [petak, penggarapRows, panenRows, pengirimanRows, lots, ternakRows, kandangRows, transaksiRows] =
      await Promise.all([
        listPetak(),
        listPenggarap(),
        listPanen(),
        listPengiriman(),
        listLot(),
        db.select({ jumlah: ternak.jumlah }).from(ternak),
        db.select({ id: kandang.id }).from(kandang),
        listTransaksi(),
      ]);

    const totalLahanHa =
      Math.round(petak.reduce((sum, item) => sum + item.luasHa, 0) * 100) / 100;
    const totalGabahKg = panenRows.reduce(
      (sum, item) => sum + (item.totalGabahKg ?? 0),
      0,
    );
    const totalBerasKg = pengirimanRows.reduce((sum, item) => sum + item.berasKg, 0);
    const rataHasilTonPerHa = panenRows.length
      ? panenRows.reduce((sum, item) => sum + item.hasilTonPerHa, 0) /
        panenRows.length
      : 0;
    const cashflow = summarizeCashflow(transaksiRows);

    return NextResponse.json({
      data: {
        totalLahanHa,
        totalPenggarap: penggarapRows.length,
        totalGabahKg,
        totalBerasKg,
        totalTernak: ternakRows.reduce((sum, item) => sum + Number(item.jumlah), 0),
        totalKandang: kandangRows.length,
        lotAktif: lots.filter((item) => item.status !== 'kosong').length,
        rataHasilTonPerHa: Math.round(rataHasilTonPerHa * 100) / 100,
        marginLaba: cashflow.marginLaba,
        penjualan: cashflow.penjualan,
        laba: cashflow.laba,
        periode: 'Semua periode',
      },
    });
  } catch (error) {
    console.error('Public summary error:', error);
    return NextResponse.json(
      { message: 'Ringkasan data belum dapat dimuat.' },
      { status: 500 },
    );
  }
}
