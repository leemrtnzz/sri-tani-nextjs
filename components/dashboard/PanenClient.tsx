'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import QuarterFilter from '@/components/dashboard/QuarterFilter';
import StatCard from '@/components/ui/StatCard';
import { formatDateId, formatKg, formatNumber, initials } from '@/lib/format';
import { quarterLabel, todayISO } from '@/lib/period';
import type { HarvestRankRow, Option, PanenRow } from '@/lib/types';

export default function PanenClient({
  rows,
  ranking,
  penggarap,
  tahun,
  kuartal,
}: {
  rows: PanenRow[];
  ranking: HarvestRankRow[];
  penggarap: Option[];
  tahun: number;
  kuartal: number;
}) {
  const totalGabah = rows.reduce((sum, row) => sum + (row.totalGabahKg ?? 0), 0);
  const rataHasil = rows.length
    ? rows.reduce((sum, row) => sum + row.hasilTonPerHa, 0) / rows.length
    : 0;
  const top = ranking[0];

  const columns: ColumnDef<PanenRow>[] = [
    {
      key: 'tanggalPanen',
      label: 'Tanggal',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{formatDateId(row.tanggalPanen)}</div>
          <div className="text-xs text-slate-600">{row.musim ?? `Kuartal ${row.kuartal}`}</div>
        </div>
      ),
    },
    {
      key: 'penggarapNama',
      label: 'Penggarap',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-sri-sidebar text-[11px] font-bold flex items-center justify-center">
            {initials(row.penggarapNama)}
          </span>
          <span className="font-medium text-slate-800">{row.penggarapNama}</span>
        </div>
      ),
    },
    {
      key: 'hasilTonPerHa',
      label: 'Hasil',
      render: (row) => (
        <div>
          <div className="font-semibold">{formatNumber(row.hasilTonPerHa, 2)} ton/Ha</div>
          <div className="text-xs text-slate-600">
            {row.totalGabahKg === null ? '-' : formatKg(row.totalGabahKg)}
          </div>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) =>
        row.rating === null ? (
          <span className="text-slate-500">-</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <i className="bi bi-star-fill text-amber-500" />
            {formatNumber(row.rating, 1)}
          </span>
        ),
    },
    {
      key: 'catatan',
      label: 'Catatan',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.catatan ?? '-'}</span>
      ),
    },
  ];

  const fields: FieldDef[] = [
    {
      name: 'penggarapId',
      label: 'Penggarap',
      type: 'select',
      options: penggarap,
      required: true,
      placeholder: 'Pilih penggarap',
    },
    {
      name: 'tanggalPanen',
      label: 'Tanggal panen',
      type: 'date',
      required: true,
      defaultValue: todayISO(),
    },
    {
      name: 'hasilTonPerHa',
      label: 'Hasil (ton/Ha)',
      type: 'number',
      required: true,
      min: 0,
      step: '0.01',
    },
    {
      name: 'totalGabahKg',
      label: 'Total gabah (kg)',
      type: 'number',
      min: 0,
      help: 'Kosongkan agar dihitung dari hasil ton per hektar dan luas lahan penggarap.',
    },
    {
      name: 'rating',
      label: 'Rating (0 sampai 5)',
      type: 'number',
      min: 0,
      max: 5,
      step: '0.1',
    },
    {
      name: 'musim',
      label: 'Musim',
      placeholder: quarterLabel(tahun, kuartal),
      help: 'Kosongkan agar mengikuti tanggal panen.',
    },
    {
      name: 'catatan',
      label: 'Catatan',
      type: 'textarea',
      span: 2,
    },
  ];

  return (
    <CrudPage<PanenRow>
      title="Panen dan Rating Kuartal"
      description="Catat hasil panen, lalu lihat peringkat penggarap berdasarkan produktivitas pada kuartal terpilih."
      icon="trophy-fill"
      endpoint="/api/panen"
      rows={rows}
      columns={columns}
      fields={fields}
      addLabel="Tambah panen"
      searchFields={['penggarapNama', 'tanggalPanen', 'musim', 'catatan']}
      searchPlaceholder="Cari penggarap, tanggal, atau musim..."
      emptyTitle="Belum ada data panen"
      emptyDescription="Catat panen pertama pada kuartal ini untuk membentuk peringkat."
      toForm={(row) => ({
        penggarapId: row.penggarapId,
        tanggalPanen: row.tanggalPanen,
        hasilTonPerHa: row.hasilTonPerHa,
        totalGabahKg: row.totalGabahKg ?? '',
        rating: row.rating ?? '',
        musim: row.musim ?? '',
        catatan: row.catatan ?? '',
      })}
      extraHeader={
        <QuarterFilter
          basePath="/dashboard/panen"
          tahun={tahun}
          kuartal={kuartal}
        />
      }
      extraTop={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="basket-fill"
              label="Catatan panen"
              value={`${rows.length} catatan`}
              hint={`${quarterLabel(tahun, kuartal)}`}
              tone="green"
            />
            <StatCard
              icon="archive-fill"
              label="Total gabah"
              value={formatKg(totalGabah)}
              hint="Akumulasi kuartal terpilih"
              tone="amber"
            />
            <StatCard
              icon="graph-up-arrow"
              label="Rata-rata hasil"
              value={`${formatNumber(rataHasil, 2)} ton/Ha`}
              hint="Dari seluruh catatan kuartal"
              tone="blue"
            />
            <StatCard
              icon="trophy-fill"
              label="Peringkat 1"
              value={top ? top.penggarapNama : '-'}
              hint={
                top
                  ? `${formatNumber(top.rataHasilTonPerHa, 2)} ton/Ha rata-rata`
                  : 'Belum ada penilaian'
              }
              tone="dark"
            />
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Peringkat hasil panen
                </h2>
                <p className="text-xs text-slate-600">
                  {quarterLabel(tahun, kuartal)}, diurutkan dari rata-rata hasil tertinggi.
                </p>
              </div>
              <span className="text-xs text-slate-600">
                {ranking.length} penggarap dinilai
              </span>
            </div>

            {ranking.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <i className="bi bi-trophy text-2xl text-slate-400" />
                <p className="text-sm font-semibold text-slate-800 mt-2">
                  Belum ada peringkat pada kuartal ini
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Tambahkan data panen untuk menghitung peringkat.
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-slate-100">
                {ranking.map((item) => (
                  <li
                    key={item.penggarapId}
                    className={`px-4 py-3 flex items-center gap-3 ${
                      item.peringkat === 1 ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        item.peringkat === 1
                          ? 'bg-amber-400 text-amber-950'
                          : item.peringkat === 2
                            ? 'bg-slate-200 text-slate-800'
                            : item.peringkat === 3
                              ? 'bg-orange-200 text-orange-900'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.peringkat}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">
                        {item.penggarapNama}
                      </div>
                      <div className="text-xs text-slate-600">
                        {item.jumlahPanen} catatan, {formatKg(item.totalGabahKg)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatNumber(item.rataHasilTonPerHa, 2)} ton/Ha
                      </div>
                      <div className="text-xs text-amber-700 inline-flex items-center gap-1">
                        <i className="bi bi-star-fill text-amber-500" />
                        {item.ratingRata === null
                          ? 'Belum ada rating'
                          : formatNumber(item.ratingRata, 1)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

        </div>
      }
    />
  );
}
