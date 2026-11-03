'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import PeriodFilter from '@/components/dashboard/PeriodFilter';
import { MonthlyFinanceChart } from '@/components/dashboard/FinanceCharts';
import StatCard from '@/components/ui/StatCard';
import {
  formatDateId,
  formatHa,
  formatKg,
  formatNumber,
  formatRupiah,
  initials,
  label,
  statusBadgeClass,
} from '@/lib/format';
import type { DashboardData } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

function PanelHeader({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-sri-green hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default function DashboardHomeClient({ data }: { data: DashboardData }) {
  const mapPlots = data.plots.map((plot) => ({
    id: plot.id,
    name: plot.nama,
    penggarapName: plot.penggarapNama,
    color: plot.color,
    coords: plot.coords,
    luasHa: plot.luasHa,
    status: plot.status,
    fase: plot.fase,
  }));

  const labaPositif = data.cashflow.laba >= 0;
  const percentRows = [
    { label: 'Modal', value: data.cashflow.persenModal, color: 'bg-blue-600' },
    {
      label: 'Operasional',
      value: data.cashflow.persenPengeluaran,
      color: 'bg-sri-gold',
    },
    {
      label: labaPositif ? 'Laba' : 'Rugi',
      value: data.cashflow.persenLaba,
      color: labaPositif ? 'bg-sri-green' : 'bg-red-600',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Ringkasan lahan, produksi, penggilingan, distribusi, dan keuangan.
            </p>
          </div>
          <PeriodFilter
            basePath="/dashboard"
            bulan={data.period.bulan}
            tahun={data.period.tahun}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon="map-fill"
          label="Luas lahan terpetakan"
          value={formatHa(data.kpis.totalLahanHa)}
          hint={`${data.kpis.totalPenggarap} penggarap terdaftar`}
          tone="green"
        />
        <StatCard
          icon="archive-fill"
          label="Produksi gabah"
          value={formatKg(data.kpis.totalGabahKg)}
          hint={`Panen ${data.period.label}`}
          tone="amber"
        />
        <StatCard
          icon="truck"
          label="Beras dikirim"
          value={formatKg(data.kpis.totalBerasKg)}
          hint={`Pengiriman ${data.period.label}`}
          tone="blue"
        />
        <StatCard
          icon="cash-coin"
          label="Penjualan"
          value={formatRupiah(data.kpis.pendapatan)}
          hint={`Laba ${formatRupiah(data.cashflow.laba)} (${data.cashflow.marginLaba}%)`}
          tone={labaPositif ? 'dark' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
          <PanelHeader
            title="Peta lahan sawah"
            description={`${data.plots.length} petak terpetakan, ${formatHa(data.kpis.totalLahanHa)} total luas`}
            href="/dashboard/lahan"
            linkLabel="Kelola peta"
          />
          <div className="relative h-[380px] w-full overflow-hidden rounded-lg border border-slate-200">
            <MapView plots={mapPlots} />
            {data.plots.length === 0 && (
              <div className="absolute inset-0 z-[800] flex items-center justify-center bg-white/70">
                <div className="text-center px-4">
                  <i className="bi bi-geo-alt text-2xl text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800 mt-2">
                    Belum ada lahan terpetakan
                  </p>
                  <Link
                    href="/dashboard/lahan"
                    className="inline-block mt-2 text-xs font-semibold text-sri-green hover:underline"
                  >
                    Tambah petak lahan
                  </Link>
                </div>
              </div>
            )}
          </div>

          {data.plots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {data.plots.slice(0, 8).map((plot) => (
                <div key={plot.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: plot.color }}
                  />
                  <span className="truncate max-w-[150px]">
                    {plot.penggarapNama} , {formatHa(plot.luasHa)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
          <PanelHeader
            title="Analisa cashflow"
            description={`Komposisi keuangan ${data.period.label}`}
            href="/dashboard/cashflow"
            linkLabel="Lihat detail"
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-[180px] w-[180px] shrink-0">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-[11px] text-slate-600">Margin laba</span>
                <strong className="text-xl font-bold text-slate-900">
                  {data.cashflow.marginLaba}%
                </strong>
              </div>
              <div className="absolute inset-0">
                <FinanceDonutVisual summary={data.cashflow} />
              </div>
            </div>

            <div className="w-full space-y-2.5">
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
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-700">Laba bersih</span>
                <span
                  className={`font-bold ${
                    labaPositif ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatRupiah(data.cashflow.laba)}
                </span>
              </div>
            </div>
          </div>

          {data.cashflow.jumlahTransaksi === 0 && (
            <p className="mt-3 text-xs text-slate-600">
              Belum ada transaksi pada periode ini. Tambahkan lewat menu Cashflow.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
          <PanelHeader title="Informasi cepat" />
          <div className="space-y-2.5">
            {[
              {
                icon: 'house-gear-fill',
                tone: 'bg-sri-darkgreen',
                title: 'Lot pengeringan',
                value: `${data.quickInfo.lotTersedia} dari ${data.quickInfo.lotTotal} lot tersedia`,
                href: '/dashboard/pengeringan',
              },
              {
                icon: 'calendar2-week-fill',
                tone: 'bg-sri-green',
                title: 'Penggilingan hari ini',
                value: `${data.quickInfo.batchHariIni} batch terjadwal`,
                href: '/dashboard/penggilingan',
              },
              {
                icon: 'trophy-fill',
                tone: 'bg-sri-gold',
                title: 'Panen tertinggi kuartal',
                value:
                  data.quickInfo.panenTertinggi > 0
                    ? `${formatNumber(data.quickInfo.panenTertinggi, 2)} ton/Ha`
                    : 'Belum ada data',
                href: '/dashboard/panen',
              },
              {
                icon: 'truck',
                tone: 'bg-teal-600',
                title: 'Pengiriman aktif',
                value: `${data.quickInfo.pengirimanAktif} kiriman belum diterima`,
                href: '/dashboard/pengiriman',
              },
              {
                icon: 'file-earmark-text-fill',
                tone: 'bg-amber-600',
                title: 'Piutang jatuh tempo',
                value: `${data.quickInfo.piutangJatuhTempo} catatan perlu perhatian`,
                href: '/dashboard/piutang',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/70"
              >
                <span
                  className={`w-9 h-9 rounded-lg ${item.tone} text-white flex items-center justify-center text-sm shrink-0`}
                >
                  <i className={`bi bi-${item.icon}`} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-600">{item.value}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
          <PanelHeader
            title="Peringkat panen kuartal"
            description="Berdasarkan rata-rata hasil ton per hektar"
            href="/dashboard/panen"
            linkLabel="Lihat semua"
          />
          {data.topHarvest.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-600">
              Belum ada data panen pada kuartal ini.
            </div>
          ) : (
            <ol className="space-y-2">
              {data.topHarvest.map((item) => (
                <li key={item.penggarapId} className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.peringkat === 1
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.peringkat}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 truncate">
                      {item.penggarapNama}
                    </span>
                    <span className="block text-xs text-slate-600">
                      {formatKg(item.totalGabahKg)} gabah
                    </span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatNumber(item.rataHasilTonPerHa, 2)}
                    <span className="text-xs font-normal text-slate-600"> t/Ha</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
          <PanelHeader
            title="Piutang mendekati jatuh tempo"
            description="Kewajiban usaha kepada penggarap"
            href="/dashboard/piutang"
            linkLabel="Kelola piutang"
          />
          {data.duePiutang.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-600">
              Tidak ada piutang yang perlu perhatian.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data.duePiutang.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {initials(item.penggarapNama)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 truncate">
                      {item.penggarapNama}
                    </span>
                    <span className="block text-xs text-slate-600">
                      Jatuh tempo {formatDateId(item.jatuhTempo)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-bold text-slate-900">
                      {formatRupiah(item.sisa)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.status)}`}
                    >
                      {label(item.status)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
        <PanelHeader
          title={`Arus kas bulanan ${data.period.tahun}`}
          description="Penjualan, modal, operasional, dan laba per bulan."
          href="/dashboard/cashflow"
          linkLabel="Buka cashflow"
        />
        <MonthlyFinanceChart data={data.monthly} />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
        <PanelHeader
          title="Penggilingan hari ini"
          description="Batch yang dijadwalkan pada tanggal hari ini."
          href="/dashboard/penggilingan"
          linkLabel="Lihat jadwal"
        />
        {data.todayBatches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-600">
            Tidak ada batch penggilingan hari ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                  <th className="px-3 py-2.5">Jam</th>
                  <th className="px-3 py-2.5">Batch</th>
                  <th className="px-3 py-2.5">Penggarap</th>
                  <th className="px-3 py-2.5">Gabah</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.todayBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-3 py-2.5">{batch.jam ?? '-'}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">
                      {batch.kode}
                    </td>
                    <td className="px-3 py-2.5">{batch.penggarapNama ?? '-'}</td>
                    <td className="px-3 py-2.5">{formatKg(batch.gabahKg)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(batch.status)}`}
                      >
                        {label(batch.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceDonutVisual({
  summary,
}: {
  summary: DashboardData['cashflow'];
}) {
  const values = [
    { label: 'Modal', value: summary.modal, color: '#2563eb' },
    { label: 'Operasional', value: summary.pengeluaran, color: '#b48327' },
    { label: 'Laba', value: Math.max(0, summary.laba), color: '#22a95c' },
  ].filter((item) => item.value > 0);

  if (values.length === 0) {
    return (
      <div className="h-full w-full rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-center px-4">
        <span className="text-xs text-slate-600">Belum ada komposisi</span>
      </div>
    );
  }

  let offset = 0;
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const segments = values.map((item) => {
    const start = offset;
    const size = (item.value / total) * 100;
    offset += size;
    return `${item.color} ${start}% ${offset}%`;
  });

  return (
    <div
      className="h-full w-full rounded-full"
      style={{
        background: `conic-gradient(${segments.join(', ')})`,
        mask: 'radial-gradient(circle, transparent 58%, black 59%)',
        WebkitMask: 'radial-gradient(circle, transparent 58%, black 59%)',
      }}
      role="img"
      aria-label="Komposisi modal, operasional, dan laba"
    />
  );
}
