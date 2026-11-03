'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import PeriodFilter from '@/components/dashboard/PeriodFilter';
import StatCard from '@/components/ui/StatCard';
import {
  FinanceDonut,
  MonthlyFinanceChart,
} from '@/components/dashboard/FinanceCharts';
import {
  formatDateId,
  formatRupiah,
  formatRupiahShort,
  label,
  statusBadgeClass,
} from '@/lib/format';
import {
  jenisTransaksiOptions,
  kategoriTransaksiOptions,
} from '@/lib/options';
import { todayISO } from '@/lib/period';
import type {
  BatchRow,
  CashflowSummary,
  MonthlyFinancePoint,
  Option,
  TokoRow,
  TransaksiRow,
} from '@/lib/types';

export default function CashflowClient({
  rows,
  summary,
  monthly,
  toko,
  penggarap,
  batch,
  period,
}: {
  rows: TransaksiRow[];
  summary: CashflowSummary;
  monthly: MonthlyFinancePoint[];
  toko: TokoRow[];
  penggarap: Option[];
  batch: BatchRow[];
  period: { bulan: number; tahun: number; label: string; start: string; end: string };
}) {
  const defaultDate =
    todayISO() >= period.start && todayISO() <= period.end ? todayISO() : period.start;
  const labaPositif = summary.laba >= 0;

  const columns: ColumnDef<TransaksiRow>[] = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{formatDateId(row.tanggal)}</div>
          <div className="text-xs text-slate-600">{row.keterangan}</div>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => (
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.jenis)}`}
          >
            {label(row.jenis)}
          </span>
          <div className="text-xs text-slate-600">{label(row.kategori)}</div>
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'Nominal',
      render: (row) => (
        <span
          className={`font-semibold ${
            row.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {row.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(row.nominal)}
        </span>
      ),
    },
    {
      key: 'tokoNama',
      label: 'Relasi',
      render: (row) => {
        const parts = [
          row.tokoNama ? `Toko ${row.tokoNama}` : null,
          row.penggarapNama ? `Penggarap ${row.penggarapNama}` : null,
          row.batchKode ? `Batch ${row.batchKode}` : null,
        ].filter(Boolean);
        return (
          <span className="text-xs text-slate-600">
            {parts.length ? parts.join(', ') : '-'}
          </span>
        );
      },
    },
  ];

  const fields: FieldDef[] = [
    {
      name: 'tanggal',
      label: 'Tanggal transaksi',
      type: 'date',
      required: true,
      defaultValue: defaultDate,
    },
    {
      name: 'keterangan',
      label: 'Keterangan',
      required: true,
      placeholder: 'Contoh: Penjualan beras ke Toko Makmur',
      span: 2,
    },
    {
      name: 'jenis',
      label: 'Jenis',
      type: 'select',
      options: jenisTransaksiOptions,
      required: true,
      defaultValue: 'pengeluaran',
    },
    {
      name: 'kategori',
      label: 'Kategori',
      type: 'select',
      options: kategoriTransaksiOptions,
      required: true,
      defaultValue: 'operasional',
      help: 'Pemasukan memakai penjualan atau lainnya. Pengeluaran memakai modal, operasional, atau lainnya.',
    },
    {
      name: 'nominal',
      label: 'Nominal (Rp)',
      type: 'number',
      required: true,
      min: 1,
      step: '1',
    },
    {
      name: 'tokoId',
      label: 'Toko terkait',
      type: 'select',
      options: toko.map((item) => ({ value: item.id, label: item.nama })),
      placeholder: 'Tanpa toko',
    },
    {
      name: 'penggarapId',
      label: 'Penggarap terkait',
      type: 'select',
      options: penggarap,
      placeholder: 'Tanpa penggarap',
    },
    {
      name: 'batchId',
      label: 'Batch terkait',
      type: 'select',
      options: batch.map((item) => ({
        value: item.id,
        label: `${item.kode} (${item.tanggal})`,
      })),
      placeholder: 'Tanpa batch',
    },
  ];

  const percentRows = [
    { label: 'Modal', value: summary.persenModal, color: 'bg-blue-600' },
    { label: 'Operasional', value: summary.persenPengeluaran, color: 'bg-sri-gold' },
    {
      label: labaPositif ? 'Laba' : 'Rugi',
      value: summary.persenLaba,
      color: labaPositif ? 'bg-sri-green' : 'bg-red-600',
    },
  ];

  return (
    <CrudPage<TransaksiRow>
      title="Cashflow dan Laba Rugi"
      description="Catat modal, pengeluaran, dan penjualan. Ringkasan serta grafik dihitung dari transaksi pada periode terpilih."
      icon="bar-chart-fill"
      endpoint="/api/transaksi"
      rows={rows}
      columns={columns}
      fields={fields}
      addLabel="Tambah transaksi"
      searchFields={['keterangan', 'jenis', 'kategori', 'tokoNama', 'penggarapNama']}
      searchPlaceholder="Cari keterangan, kategori, atau relasi..."
      emptyTitle="Belum ada transaksi pada periode ini"
      emptyDescription="Tambahkan pemasukan atau pengeluaran untuk mulai menghitung cashflow."
      toForm={(row) => ({
        tanggal: row.tanggal,
        keterangan: row.keterangan,
        jenis: row.jenis,
        kategori: row.kategori,
        nominal: row.nominal,
        tokoId: row.tokoId ?? '',
        penggarapId: row.penggarapId ?? '',
        batchId: row.batchId ?? '',
      })}
      extraHeader={
        <PeriodFilter
          basePath="/dashboard/cashflow"
          bulan={period.bulan}
          tahun={period.tahun}
        />
      }
      extraTop={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="bank"
              label="Modal"
              value={formatRupiah(summary.modal)}
              hint={`${summary.persenModal}% dari penjualan`}
              tone="blue"
            />
            <StatCard
              icon="wallet2"
              label="Pengeluaran operasional"
              value={formatRupiah(summary.pengeluaran)}
              hint={`${summary.persenPengeluaran}% dari penjualan`}
              tone="amber"
            />
            <StatCard
              icon="graph-up-arrow"
              label="Penjualan"
              value={formatRupiah(summary.penjualan)}
              hint={`${summary.jumlahTransaksi} transaksi tercatat`}
              tone="green"
            />
            <StatCard
              icon={labaPositif ? 'emoji-smile-fill' : 'emoji-frown-fill'}
              label={labaPositif ? 'Laba bersih' : 'Rugi bersih'}
              value={formatRupiah(Math.abs(summary.laba))}
              hint={`Margin ${summary.marginLaba}%`}
              tone={labaPositif ? 'dark' : 'red'}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Arus kas bulanan {period.tahun}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Nilai dalam rupiah, dikelompokkan per bulan.
                  </p>
                </div>
                <span className="text-xs text-slate-600">
                  Total penjualan tahun ini{' '}
                  {formatRupiahShort(
                    monthly.reduce((sum, point) => sum + point.penjualan, 0),
                  )}
                </span>
              </div>
              <MonthlyFinanceChart data={monthly} />
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900">Komposisi keuangan</h2>
              <p className="text-xs text-slate-600 mb-3">
                Persentase dihitung terhadap penjualan {period.label}.
              </p>
              <FinanceDonut summary={summary} />

              <div className="mt-4 space-y-2.5">
                {percentRows.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.abs(item.value)))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {summary.penjualan === 0 && (
                <p className="mt-3 text-xs text-slate-600">
                  Belum ada penjualan pada periode ini, persentase bernilai 0.
                </p>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
