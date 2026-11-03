import { toNumber } from '@/lib/format';
import { todayISO, type Period } from '@/lib/period';
import type { DashboardData } from '@/lib/types';
import { listPetak } from './lahan';
import { listPenggarap } from './penggarap';
import {
  harvestRanking,
  listBatch,
  listLot,
  listPanen,
} from './operasional';
import {
  listPengiriman,
  listPiutang,
  listTransaksi,
  monthlySeries,
  summarizeCashflow,
} from './keuangan';

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const quarter = Math.floor((period.bulan - 1) / 3) + 1;
  const today = todayISO();

  const [
    petak,
    penggarapRows,
    lots,
    batches,
    transaksiRows,
    monthly,
    topHarvest,
    piutangRows,
    allPengiriman,
    panenRows,
  ] = await Promise.all([
    listPetak(),
    listPenggarap(),
    listLot(),
    listBatch(),
    listTransaksi({ start: period.start, end: period.end }),
    monthlySeries(period.tahun),
    harvestRanking(period.tahun, quarter),
    listPiutang(),
    listPengiriman(),
    listPanen(period.start, period.end),
  ]);

  const cashflow = summarizeCashflow(transaksiRows);
  const totalLahanHa =
    Math.round(petak.reduce((sum, item) => sum + item.luasHa, 0) * 100) / 100;
  const totalGabahKg = panenRows.reduce(
    (sum, item) => sum + toNumber(item.totalGabahKg),
    0,
  );
  const pengirimanPeriod = allPengiriman.filter(
    (item) => item.tanggalKirim >= period.start && item.tanggalKirim <= period.end,
  );
  const totalBerasKg = pengirimanPeriod.reduce((sum, item) => sum + item.berasKg, 0);
  const outstandingPiutang = piutangRows.filter((item) => item.sisa > 0);
  const duePiutang = outstandingPiutang
    .filter((item) => item.status !== 'lunas')
    .slice(0, 5);

  return {
    period: { bulan: period.bulan, tahun: period.tahun, label: period.label },
    kpis: {
      totalLahanHa,
      totalPenggarap: penggarapRows.length,
      totalGabahKg,
      totalBerasKg,
      pendapatan: cashflow.penjualan,
    },
    cashflow,
    monthly,
    plots: petak,
    quickInfo: {
      lotTersedia: lots.filter((item) => item.status === 'kosong').length,
      lotTotal: lots.length,
      batchHariIni: batches.filter((item) => item.tanggal === today).length,
      panenTertinggi: topHarvest[0]?.rataHasilTonPerHa ?? 0,
      pengirimanAktif: allPengiriman.filter((item) => item.status !== 'diterima')
        .length,
      piutangJatuhTempo: outstandingPiutang.filter(
        (item) =>
          item.status === 'terlambat' || item.status === 'segera_jatuh_tempo',
      ).length,
    },
    topHarvest: topHarvest.slice(0, 5),
    duePiutang,
    todayBatches: batches.filter((item) => item.tanggal === today),
  };
}
