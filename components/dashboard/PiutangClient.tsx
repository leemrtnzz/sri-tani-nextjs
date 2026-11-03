'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import PeriodFilter from '@/components/dashboard/PeriodFilter';
import StatCard from '@/components/ui/StatCard';
import { formatDateId, formatRupiah } from '@/lib/format';
import { statusTagihanOptions } from '@/lib/options';
import { todayISO } from '@/lib/period';
import type { ResourcePermissions } from '@/lib/permissions';
import type { Option, PiutangRow } from '@/lib/types';

export default function PiutangClient({
  rows,
  penggarap,
  period,
  permissions,
}: {
  rows: PiutangRow[];
  penggarap: Option[];
  period: { bulan: number; tahun: number; label: string; start: string; end: string };
  permissions: ResourcePermissions;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('semua');
  const [quickNotice, setQuickNotice] = useState('');
  const [quickPending, setQuickPending] = useState<number | null>(null);

  const periodRows = useMemo(
    () =>
      rows.filter(
        (row) => row.jatuhTempo >= period.start && row.jatuhTempo <= period.end,
      ),
    [rows, period.start, period.end],
  );

  const filtered = useMemo(
    () =>
      statusFilter === 'semua'
        ? periodRows
        : periodRows.filter((row) => row.status === statusFilter),
    [periodRows, statusFilter],
  );

  const totalNilai = periodRows.reduce((sum, row) => sum + row.nilai, 0);
  const totalDibayar = periodRows.reduce((sum, row) => sum + row.dibayar, 0);
  const totalSisa = periodRows.reduce((sum, row) => sum + row.sisa, 0);
  const jumlahTerlambat = periodRows.filter((row) => row.status === 'terlambat').length;
  const jumlahSegera = periodRows.filter(
    (row) => row.status === 'segera_jatuh_tempo',
  ).length;

  const markPaid = async (row: PiutangRow) => {
    setQuickPending(row.id);
    setQuickNotice('');
    try {
      const response = await fetch(`/api/piutang/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'lunas',
          dibayar: row.nilai,
          tanggalBayar: todayISO(),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Gagal menandai piutang lunas.');
      }
      setQuickNotice(`Piutang ${row.penggarapNama} ditandai lunas.`);
      router.refresh();
    } catch (error) {
      setQuickNotice(
        error instanceof Error ? error.message : 'Gagal menandai piutang lunas.',
      );
    } finally {
      setQuickPending(null);
    }
  };

  const columns: ColumnDef<PiutangRow>[] = [
    {
      key: 'penggarapNama',
      label: 'Penggarap',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.penggarapNama}</div>
          <div className="text-xs text-slate-600">{row.keterangan ?? 'Tanpa keterangan'}</div>
        </div>
      ),
    },
    {
      key: 'nilai',
      label: 'Nilai',
      render: (row) => (
        <div>
          <div className="font-semibold">{formatRupiah(row.nilai)}</div>
          <div className="text-xs text-slate-600">
            Dibayar {formatRupiah(row.dibayar)}
          </div>
        </div>
      ),
    },
    {
      key: 'sisa',
      label: 'Sisa',
      render: (row) =>
        row.sisa > 0 ? (
          <span className="font-semibold text-amber-800">{formatRupiah(row.sisa)}</span>
        ) : (
          <span className="text-emerald-700 font-medium">Lunas</span>
        ),
    },
    {
      key: 'jatuhTempo',
      label: 'Jatuh tempo',
      render: (row) => (
        <div>
          <div>{formatDateId(row.jatuhTempo)}</div>
          {row.hariTerlambat > 0 && (
            <div className="text-xs text-red-700">
              Terlambat {row.hariTerlambat} hari
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
    },
    {
      key: 'tanggalBayar',
      label: 'Tanggal bayar',
      render: (row) => formatDateId(row.tanggalBayar),
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
      name: 'nilai',
      label: 'Nilai piutang (Rp)',
      type: 'number',
      required: true,
      min: 1,
      step: '1',
    },
    {
      name: 'dibayar',
      label: 'Sudah dibayar (Rp)',
      type: 'number',
      min: 0,
      step: '1',
      defaultValue: 0,
    },
    {
      name: 'jatuhTempo',
      label: 'Jatuh tempo',
      type: 'date',
      required: true,
    },
    {
      name: 'tanggalBayar',
      label: 'Tanggal bayar',
      type: 'date',
      help: 'Isi jika sudah dibayar penuh.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: statusTagihanOptions,
      placeholder: 'Hitung otomatis',
      help: 'Pilih lunas untuk menandai pembayaran penuh. Kosongkan agar status dihitung dari tanggal.',
    },
    {
      name: 'keterangan',
      label: 'Keterangan',
      type: 'textarea',
      span: 2,
      placeholder: 'Contoh: Bagi hasil panen kuartal berjalan',
    },
  ];

  return (
    <CrudPage<PiutangRow>
      title="Piutang Penggarap"
      description="Catat kewajiban usaha kepada penggarap, pantau jatuh tempo, dan tandai pembayaran."
      icon="file-earmark-text-fill"
      endpoint="/api/piutang"
      rows={filtered}
      permissions={permissions}
      columns={columns}
      fields={fields}
      addLabel="Tambah piutang"
      searchFields={['penggarapNama', 'keterangan', 'status', 'jatuhTempo']}
      searchPlaceholder="Cari penggarap, keterangan, atau status..."
      emptyTitle="Belum ada piutang pada periode ini"
      emptyDescription="Tambahkan catatan piutang atau ganti periode untuk melihat data lain."
      toForm={(row) => ({
        penggarapId: row.penggarapId,
        nilai: row.nilai,
        dibayar: row.dibayar,
        jatuhTempo: row.jatuhTempo,
        tanggalBayar: row.tanggalBayar ?? '',
        status: row.status,
        keterangan: row.keterangan ?? '',
      })}
      rowActions={
        permissions.update
          ? (row) =>
              row.sisa > 0 ? (
                <button
                  type="button"
                  onClick={() => markPaid(row)}
                  disabled={quickPending === row.id}
                  className="mr-1 min-h-9 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {quickPending === row.id ? (
                    <i className="bi bi-arrow-repeat animate-spin" />
                  ) : (
                    'Lunasi'
                  )}
                </button>
              ) : null
          : undefined
      }
      extraHeader={
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PeriodFilter
            basePath="/dashboard/piutang"
            bulan={period.bulan}
            tahun={period.tahun}
            label="Jatuh tempo"
          />
          <div>
            <label htmlFor="filter-status-piutang" className="block text-xs text-slate-600 mb-1">
              Status
            </label>
            <select
              id="filter-status-piutang"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
            >
              <option value="semua">Semua status</option>
              {statusTagihanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
      extraTop={
        <div className="space-y-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm text-sky-900 flex items-start gap-2">
            <i className="bi bi-info-circle-fill mt-0.5" />
            <span>
              Piutang penggarap adalah kewajiban usaha kepada penggarap, misalnya bagi
              hasil panen yang belum dibayarkan.
            </span>
          </div>

          {quickNotice && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900 flex items-start gap-2"
            >
              <i className="bi bi-check-circle-fill mt-0.5" />
              <span className="flex-1">{quickNotice}</span>
              <button
                type="button"
                onClick={() => setQuickNotice('')}
                aria-label="Tutup notifikasi"
                className="text-emerald-900/70 hover:text-emerald-900"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="cash-stack"
              label="Total piutang"
              value={formatRupiah(totalNilai)}
              hint={`${periodRows.length} catatan pada ${period.label}`}
              tone="green"
            />
            <StatCard
              icon="check2-circle"
              label="Sudah dibayar"
              value={formatRupiah(totalDibayar)}
              hint="Akumulasi pembayaran"
              tone="blue"
            />
            <StatCard
              icon="exclamation-circle"
              label="Sisa kewajiban"
              value={formatRupiah(totalSisa)}
              hint={`${jumlahSegera} catatan segera jatuh tempo`}
              tone="amber"
            />
            <StatCard
              icon="calendar2-x"
              label="Terlambat"
              value={`${jumlahTerlambat} catatan`}
              hint="Perlu pembayaran segera"
              tone={jumlahTerlambat > 0 ? 'red' : 'dark'}
            />
          </div>

          <p className="text-xs text-slate-600">
            Status dihitung otomatis dari sisa nilai dan tanggal jatuh tempo. Status
            terlambat muncul setelah tanggal jatuh tempo terlewati.
          </p>
        </div>
      }
    />
  );
}
