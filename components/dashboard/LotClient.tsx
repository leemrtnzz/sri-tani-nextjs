'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import StatCard from '@/components/ui/StatCard';
import { formatKg, formatNumber, label } from '@/lib/format';
import { statusLotOptions } from '@/lib/options';
import type { LotRow, Option } from '@/lib/types';

export default function LotClient({
  rows,
  penggarap,
}: {
  rows: LotRow[];
  penggarap: Option[];
}) {
  const totalKapasitas = rows.reduce((sum, row) => sum + row.kapasitasKg, 0);
  const totalGabah = rows.reduce((sum, row) => sum + row.gabahKg, 0);
  const tersedia = rows.filter((row) => row.status === 'kosong').length;
  const terisi = rows.filter((row) => row.gabahKg > 0).length;
  const utilisasi =
    totalKapasitas > 0 ? Math.round((totalGabah / totalKapasitas) * 1000) / 10 : 0;

  const columns: ColumnDef<LotRow>[] = [
    {
      key: 'kode',
      label: 'Lot',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.kode}</div>
          <div className="text-xs text-slate-600">{row.catatan ?? 'Tanpa catatan'}</div>
        </div>
      ),
    },
    {
      key: 'penggarapNama',
      label: 'Penggarap',
      render: (row) => row.penggarapNama ?? <span className="text-slate-500">Kosong</span>,
    },
    {
      key: 'kapasitasKg',
      label: 'Kapasitas',
      render: (row) => formatKg(row.kapasitasKg),
    },
    {
      key: 'gabahKg',
      label: 'Terisi',
      render: (row) => {
        const ratio = row.kapasitasKg > 0 ? (row.gabahKg / row.kapasitasKg) * 100 : 0;
        return (
          <div className="min-w-[130px]">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800">{formatKg(row.gabahKg)}</span>
              <span className="text-slate-500">{formatNumber(ratio, 0)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  ratio >= 90 ? 'bg-amber-500' : 'bg-sri-green'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'kadarAir',
      label: 'Kadar air',
      render: (row) =>
        row.kadarAir === null ? (
          <span className="text-slate-500">-</span>
        ) : (
          `${formatNumber(row.kadarAir, 1)}%`
        ),
    },
    { key: 'status', label: 'Status' },
  ];

  const fields: FieldDef[] = [
    {
      name: 'kode',
      label: 'Kode lot',
      placeholder: 'Kosongkan untuk dibuat otomatis',
      help: 'Contoh: LOT-07',
    },
    {
      name: 'penggarapId',
      label: 'Penggarap',
      type: 'select',
      options: penggarap,
      placeholder: 'Tanpa penggarap',
    },
    {
      name: 'kapasitasKg',
      label: 'Kapasitas (kg)',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 5000,
    },
    {
      name: 'gabahKg',
      label: 'Gabah di lot (kg)',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'kadarAir',
      label: 'Kadar air (%)',
      type: 'number',
      step: '0.1',
      min: 0,
      max: 100,
    },
    {
      name: 'status',
      label: 'Status lot',
      type: 'select',
      options: statusLotOptions,
      required: true,
      defaultValue: 'kosong',
    },
    {
      name: 'catatan',
      label: 'Catatan',
      type: 'textarea',
      span: 2,
    },
  ];

  return (
    <CrudPage<LotRow>
      title="Lot Pengeringan Gabah"
      description="Pantau kapasitas, isi lot, kadar air, dan kesiapan gabah sebelum masuk penggilingan."
      icon="house-gear-fill"
      endpoint="/api/lot-jemur"
      rows={rows}
      columns={columns}
      fields={fields}
      addLabel="Tambah lot"
      searchFields={['kode', 'penggarapNama', 'status', 'catatan']}
      searchPlaceholder="Cari kode lot, penggarap, atau status..."
      emptyTitle="Belum ada lot pengeringan"
      emptyDescription="Tambahkan lot, lalu isi kapasitas dan penggarap yang memakainya."
      toForm={(row) => ({
        kode: row.kode,
        penggarapId: row.penggarapId ?? '',
        kapasitasKg: row.kapasitasKg,
        gabahKg: row.gabahKg,
        kadarAir: row.kadarAir ?? '',
        status: row.status,
        catatan: row.catatan ?? '',
      })}
      extraTop={
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="check2-circle"
              label="Lot tersedia"
              value={`${tersedia} lot`}
              hint={`Dari ${rows.length} lot terdaftar`}
              tone="green"
            />
            <StatCard
              icon="archive-fill"
              label="Lot terisi"
              value={`${terisi} lot`}
              hint={`${formatKg(totalGabah)} gabah sedang dikeringkan`}
              tone="amber"
            />
            <StatCard
              icon="speedometer2"
              label="Kapasitas total"
              value={formatKg(totalKapasitas)}
              hint={`Utilisasi ${utilisasi}%`}
              tone="blue"
            />
            <StatCard
              icon="droplet-half"
              label="Rata-rata kadar air"
              value={`${formatNumber(
                rows.filter((row) => row.kadarAir !== null).length
                  ? rows.reduce((sum, row) => sum + (row.kadarAir ?? 0), 0) /
                      rows.filter((row) => row.kadarAir !== null).length
                  : 0,
                1,
              )}%`}
              hint="Dari lot yang sedang terisi"
              tone="dark"
            />
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-2 text-sm">
              <span className="font-semibold text-slate-800">Utilisasi kapasitas</span>
              <span className="text-slate-600">
                {formatKg(totalGabah)} dari {formatKg(totalKapasitas)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sri-green"
                style={{ width: `${Math.min(100, Math.max(0, utilisasi))}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {tersedia} lot kosong siap dipakai, {terisi} lot sedang berisi gabah.
              Status ditampilkan sebagai {label('kosong').toLowerCase()} sampai siap giling.
            </p>
          </div>
        </div>
      }
    />
  );
}
