'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import StatCard from '@/components/ui/StatCard';
import { formatDateId, formatKg, formatNumber, label, statusBadgeClass } from '@/lib/format';
import {
  nextWeekRange as getNextWeekRange,
  relativeLabel,
  relativeSchedule,
  todayISO,
} from '@/lib/period';
import { statusBatchOptions } from '@/lib/options';
import type { ResourcePermissions } from '@/lib/permissions';
import type { BatchRow, Option } from '@/lib/types';

function ScheduleCard({ batch }: { batch: BatchRow }) {
  const ratio =
    batch.kapasitasKg > 0 ? (batch.gabahKg / batch.kapasitasKg) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-600">
            {batch.jam ?? 'Tanpa jam'}
          </div>
          <div className="font-bold text-slate-900">{batch.kode}</div>
        </div>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(batch.status)}`}
        >
          {label(batch.status)}
        </span>
      </div>

      <div className="mt-2 text-xs text-slate-600">
        <div>{batch.penggarapNama ?? 'Tanpa penggarap'}</div>
        <div>
          {batch.lotKode ? `Lot ${batch.lotKode}` : 'Tanpa lot'} , {formatKg(batch.gabahKg)}
        </div>
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Kapasitas</span>
          <span>{formatNumber(ratio, 0)}%</span>
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
    </div>
  );
}

export default function BatchClient({
  rows,
  penggarap,
  lot,
  permissions,
}: {
  rows: BatchRow[];
  penggarap: Option[];
  lot: Option[];
  permissions: ResourcePermissions;
}) {
  const today = todayISO();
  const todays = rows.filter((row) => relativeSchedule(row.tanggal) === 'hari-ini');
  const tomorrow = rows.filter((row) => relativeSchedule(row.tanggal) === 'besok');
  const nextWeek = rows.filter(
    (row) => relativeSchedule(row.tanggal) === 'minggu-depan',
  );
  const others = rows.filter(
    (row) => relativeSchedule(row.tanggal) === 'lainnya',
  );
  const nextWeekBounds = getNextWeekRange();
  const totalGabah = rows.reduce((sum, row) => sum + row.gabahKg, 0);
  const totalKapasitas = rows.reduce((sum, row) => sum + row.kapasitasKg, 0);
  const utilisasi =
    totalKapasitas > 0 ? Math.round((totalGabah / totalKapasitas) * 1000) / 10 : 0;

  const columns: ColumnDef<BatchRow>[] = [
    {
      key: 'kode',
      label: 'Batch',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.kode}</div>
          <div className="text-xs text-slate-600">
            {formatDateId(row.tanggal)} {row.jam ? `, ${row.jam}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'penggarapNama',
      label: 'Penggarap',
      render: (row) => row.penggarapNama ?? <span className="text-slate-500">-</span>,
    },
    {
      key: 'lotKode',
      label: 'Lot',
      render: (row) => row.lotKode ?? <span className="text-slate-500">-</span>,
    },
    {
      key: 'gabahKg',
      label: 'Gabah / beras',
      render: (row) => (
        <div>
          <div className="font-semibold">{formatKg(row.gabahKg)}</div>
          <div className="text-xs text-slate-600">
            {row.berasKg === null ? 'Beras belum dicatat' : formatKg(row.berasKg)}
          </div>
        </div>
      ),
    },
    {
      key: 'kapasitasKg',
      label: 'Kapasitas',
      render: (row) => (
        <div>
          <div>{formatKg(row.kapasitasKg)}</div>
          <div className="text-xs text-slate-600">
            Rendemen {row.rendemen === null ? '-' : `${formatNumber(row.rendemen, 2)}%`}
          </div>
        </div>
      ),
    },
    { key: 'status', label: 'Status' },
  ];

  const fields: FieldDef[] = [
    {
      name: 'kode',
      label: 'Kode batch',
      placeholder: 'Kosongkan untuk dibuat otomatis',
      help: 'Contoh: BATCH-20251103-01',
    },
    {
      name: 'tanggal',
      label: 'Tanggal giling',
      type: 'date',
      required: true,
      defaultValue: todayISO(),
    },
    {
      name: 'jam',
      label: 'Jam mulai',
      placeholder: '08:00',
      help: 'Format 24 jam, contoh 08:00 atau 13:30.',
    },
    {
      name: 'penggarapId',
      label: 'Penggarap',
      type: 'select',
      options: penggarap,
      placeholder: 'Tanpa penggarap',
    },
    {
      name: 'lotId',
      label: 'Lot pengeringan',
      type: 'select',
      options: lot,
      placeholder: 'Tanpa lot',
    },
    {
      name: 'kapasitasKg',
      label: 'Kapasitas giling (kg)',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 5000,
    },
    {
      name: 'gabahKg',
      label: 'Gabah masuk (kg)',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'berasKg',
      label: 'Beras hasil (kg)',
      type: 'number',
      min: 0,
      help: 'Isi setelah proses selesai. Rendemen dihitung otomatis.',
    },
    {
      name: 'status',
      label: 'Status batch',
      type: 'select',
      options: statusBatchOptions,
      required: true,
      defaultValue: 'terjadwal',
    },
    {
      name: 'catatan',
      label: 'Catatan',
      type: 'textarea',
      span: 2,
    },
  ];

  const scheduleSections = [
    { title: relativeLabel('hari-ini'), subtitle: formatDateId(today), items: todays },
    {
      title: relativeLabel('besok'),
      subtitle: 'Antrean penggilingan besok',
      items: tomorrow,
    },
    {
      title: relativeLabel('minggu-depan'),
      subtitle: `Rentang ${formatDateId(nextWeekBounds.start)} sampai ${formatDateId(nextWeekBounds.end)}`,
      items: nextWeek,
    },
    { title: 'Jadwal lain', subtitle: 'Termasuk batch yang sudah lewat', items: others },
  ];

  return (
    <CrudPage<BatchRow>
      title="Jadwal Penggilingan Gabah"
      description="Atur antrean batch hari ini, besok, dan minggu depan. Kapasitas dan rendemen dihitung dari gabah masuk."
      icon="calendar2-week-fill"
      endpoint="/api/batch-giling"
      rows={rows}
      permissions={permissions}
      columns={columns}
      fields={fields}
      addLabel="Tambah batch"
      searchFields={['kode', 'penggarapNama', 'lotKode', 'tanggal', 'status']}
      searchPlaceholder="Cari kode batch, penggarap, atau tanggal..."
      emptyTitle="Belum ada jadwal penggilingan"
      emptyDescription="Tambahkan batch untuk menyusun antrean penggilingan."
      toForm={(row) => ({
        kode: row.kode,
        tanggal: row.tanggal,
        jam: row.jam ?? '',
        penggarapId: row.penggarapId ?? '',
        lotId: row.lotId ?? '',
        kapasitasKg: row.kapasitasKg,
        gabahKg: row.gabahKg,
        berasKg: row.berasKg ?? '',
        status: row.status,
        catatan: row.catatan ?? '',
      })}
      extraTop={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="calendar2-check-fill"
              label="Hari ini"
              value={`${todays.length} batch`}
              hint={`${formatKg(todays.reduce((sum, row) => sum + row.gabahKg, 0))} gabah`}
              tone="green"
            />
            <StatCard
              icon="calendar2-plus-fill"
              label="Besok"
              value={`${tomorrow.length} batch`}
              hint={`${formatKg(tomorrow.reduce((sum, row) => sum + row.gabahKg, 0))} gabah`}
              tone="amber"
            />
            <StatCard
              icon="calendar2-week-fill"
              label="Minggu depan"
              value={`${nextWeek.length} batch`}
              hint={`${formatDateId(nextWeekBounds.start)} sampai ${formatDateId(nextWeekBounds.end)}`}
              tone="blue"
            />
            <StatCard
              icon="speedometer2"
              label="Utilisasi kapasitas"
              value={`${utilisasi}%`}
              hint={`${formatKg(totalGabah)} dari ${formatKg(totalKapasitas)}`}
              tone="dark"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            {scheduleSections.map((section) => (
              <div
                key={section.title}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
              >
                <div className="mb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                  <p className="text-xs text-slate-600">{section.subtitle}</p>
                </div>
                <div className="space-y-2">
                  {section.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-600">
                      Tidak ada jadwal
                    </div>
                  ) : (
                    section.items.map((batch) => (
                      <ScheduleCard key={batch.id} batch={batch} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
