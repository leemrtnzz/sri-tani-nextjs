'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import PeriodFilter from '@/components/dashboard/PeriodFilter';
import StatCard from '@/components/ui/StatCard';
import { formatDateId, formatKg, label, statusBadgeClass } from '@/lib/format';
import { statusPengirimanOptions } from '@/lib/options';
import { todayISO } from '@/lib/period';
import type { BatchRow, PengirimanRow, TokoRow } from '@/lib/types';

const STATUS_FLOW = ['dimuat', 'dalam_perjalanan', 'diterima'];

function DeliveryTimeline({ status }: { status: string }) {
  const activeIndex = Math.max(0, STATUS_FLOW.indexOf(status));
  return (
    <div className="flex items-center gap-1.5" aria-label={`Status ${label(status)}`}>
      {STATUS_FLOW.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                done ? 'bg-sri-green' : 'bg-slate-200'
              }`}
              title={label(step)}
            />
            {index < STATUS_FLOW.length - 1 && (
              <span
                className={`w-4 h-0.5 ${
                  index < activeIndex ? 'bg-sri-green' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PengirimanClient({
  rows,
  toko,
  batch,
  period,
}: {
  rows: PengirimanRow[];
  toko: TokoRow[];
  batch: BatchRow[];
  period: { bulan: number; tahun: number; label: string; start: string; end: string };
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('semua');
  const [quickNotice, setQuickNotice] = useState('');
  const [quickPending, setQuickPending] = useState<number | null>(null);

  const periodRows = useMemo(
    () =>
      rows.filter(
        (row) => row.tanggalKirim >= period.start && row.tanggalKirim <= period.end,
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

  const active = periodRows.filter((row) => row.status !== 'diterima');
  const received = periodRows.filter((row) => row.status === 'diterima');
  const totalBeras = periodRows.reduce((sum, row) => sum + row.berasKg, 0);

  const markReceived = async (row: PengirimanRow) => {
    setQuickPending(row.id);
    setQuickNotice('');
    try {
      const response = await fetch(`/api/pengiriman/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'diterima',
          tanggalDiterima: todayISO(),
          penerima: row.penerima || 'Diterima toko',
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Gagal memperbarui status pengiriman.');
      }
      setQuickNotice(`Pengiriman ${row.noKirim} ditandai diterima toko.`);
      router.refresh();
    } catch (error) {
      setQuickNotice(
        error instanceof Error ? error.message : 'Gagal memperbarui status pengiriman.',
      );
    } finally {
      setQuickPending(null);
    }
  };

  const columns: ColumnDef<PengirimanRow>[] = [
    {
      key: 'noKirim',
      label: 'Surat jalan',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.noKirim}</div>
          <div className="text-xs text-slate-600">
            {formatDateId(row.tanggalKirim)} , {row.armada ?? 'Armada belum diisi'}
          </div>
        </div>
      ),
    },
    {
      key: 'tokoNama',
      label: 'Toko tujuan',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.tokoNama}</div>
          <div className="text-xs text-slate-600">{row.gudang}</div>
        </div>
      ),
    },
    {
      key: 'berasKg',
      label: 'Beras',
      render: (row) => (
        <div>
          <div className="font-semibold">{formatKg(row.berasKg)}</div>
          <div className="text-xs text-slate-600">
            {row.batchKode ? `Batch ${row.batchKode}` : 'Tanpa batch'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
          >
            {label(row.status)}
          </span>
          <DeliveryTimeline status={row.status} />
        </div>
      ),
    },
    {
      key: 'tanggalDiterima',
      label: 'Penerimaan',
      render: (row) =>
        row.status === 'diterima' ? (
          <div>
            <div className="text-sm font-medium text-slate-800">
              {row.penerima ?? 'Diterima'}
            </div>
            <div className="text-xs text-slate-600">
              {formatDateId(row.tanggalDiterima)}
            </div>
          </div>
        ) : (
          <span className="text-slate-500">Belum diterima</span>
        ),
    },
  ];

  const fields: FieldDef[] = [
    {
      name: 'noKirim',
      label: 'Nomor kirim',
      placeholder: 'Kosongkan untuk dibuat otomatis',
    },
    {
      name: 'tokoId',
      label: 'Toko tujuan',
      type: 'select',
      options: toko.map((item) => ({ value: item.id, label: item.nama })),
      required: true,
      placeholder: 'Pilih toko',
    },
    {
      name: 'batchId',
      label: 'Batch giling',
      type: 'select',
      options: batch.map((item) => ({
        value: item.id,
        label: `${item.kode} (${item.tanggal})`,
      })),
      placeholder: 'Tanpa batch',
    },
    {
      name: 'gudang',
      label: 'Gudang asal',
      defaultValue: 'Gudang SRI TANI',
    },
    {
      name: 'berasKg',
      label: 'Beras dikirim (kg)',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'armada',
      label: 'Armada',
      placeholder: 'Contoh: Pickup 1',
    },
    {
      name: 'tanggalKirim',
      label: 'Tanggal kirim',
      type: 'date',
      required: true,
      defaultValue: todayISO(),
    },
    {
      name: 'status',
      label: 'Status pengiriman',
      type: 'select',
      options: statusPengirimanOptions,
      required: true,
      defaultValue: 'dimuat',
    },
    {
      name: 'tanggalDiterima',
      label: 'Tanggal diterima',
      type: 'date',
    },
    {
      name: 'penerima',
      label: 'Nama penerima di toko',
      placeholder: 'Contoh: Bu Rina',
    },
    {
      name: 'catatan',
      label: 'Catatan',
      type: 'textarea',
      span: 2,
    },
  ];

  return (
    <CrudPage<PengirimanRow>
      title="Pengiriman Beras ke Toko"
      description="Lacak perjalanan beras dari gudang sampai diterima toko, termasuk armada dan penerima."
      icon="truck"
      endpoint="/api/pengiriman"
      rows={filtered}
      columns={columns}
      fields={fields}
      addLabel="Buat pengiriman"
      searchFields={['noKirim', 'tokoNama', 'armada', 'status', 'penerima']}
      searchPlaceholder="Cari surat jalan, toko, armada, atau penerima..."
      emptyTitle="Belum ada pengiriman pada periode ini"
      emptyDescription="Buat pengiriman baru atau ganti periode untuk melihat catatan lain."
      toForm={(row) => ({
        noKirim: row.noKirim,
        tokoId: row.tokoId,
        batchId: row.batchId ?? '',
        gudang: row.gudang,
        berasKg: row.berasKg,
        armada: row.armada ?? '',
        tanggalKirim: row.tanggalKirim,
        status: row.status,
        tanggalDiterima: row.tanggalDiterima ?? '',
        penerima: row.penerima ?? '',
        catatan: row.catatan ?? '',
      })}
      rowActions={(row) =>
        row.status !== 'diterima' ? (
          <button
            type="button"
            onClick={() => markReceived(row)}
            disabled={quickPending === row.id}
            className="mr-1 min-h-9 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {quickPending === row.id ? (
              <i className="bi bi-arrow-repeat animate-spin" />
            ) : (
              'Terima'
            )}
          </button>
        ) : null
      }
      extraHeader={
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PeriodFilter
            basePath="/dashboard/pengiriman"
            bulan={period.bulan}
            tahun={period.tahun}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="filter-status-kirim" className="block text-xs text-slate-600 mb-1">
                Status
              </label>
              <select
                id="filter-status-kirim"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
              >
                <option value="semua">Semua status</option>
                {statusPengirimanOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/dashboard/toko"
              className="min-h-10 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <i className="bi bi-shop" />
              Kelola toko
            </Link>
          </div>
        </div>
      }
      extraTop={
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <span>
              Toko tujuan diambil langsung dari menu Data Toko. Tambahkan toko baru
              lewat tombol Kelola toko.
            </span>
            <Link
              href="/dashboard/toko"
              className="font-semibold text-sri-green hover:underline"
            >
              Buka Data Toko
            </Link>
          </div>

          {quickNotice && (
            <div
              role="status"
              className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm text-sky-900 flex items-start gap-2"
            >
              <i className="bi bi-info-circle-fill mt-0.5" />
              <span className="flex-1">{quickNotice}</span>
              <button
                type="button"
                onClick={() => setQuickNotice('')}
                aria-label="Tutup notifikasi"
                className="text-sky-900/70 hover:text-sky-900"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              icon="truck"
              label="Pengiriman periode ini"
              value={`${periodRows.length} kiriman`}
              hint={period.label}
              tone="green"
            />
            <StatCard
              icon="hourglass-split"
              label="Masih berjalan"
              value={`${active.length} kiriman`}
              hint={`${formatKg(active.reduce((sum, row) => sum + row.berasKg, 0))} menuju toko`}
              tone="amber"
            />
            <StatCard
              icon="check2-circle"
              label="Diterima toko"
              value={`${received.length} kiriman`}
              hint={`${formatKg(received.reduce((sum, row) => sum + row.berasKg, 0))} sudah diterima`}
              tone="blue"
            />
            <StatCard
              icon="box-seam"
              label="Total beras dikirim"
              value={formatKg(totalBeras)}
              hint={`Nilai rata-rata ${formatKg(totalBeras / Math.max(1, periodRows.length))} per kiriman`}
              tone="dark"
            />
          </div>

          <p className="text-xs text-slate-600">
            Tombol Terima mencatat tanggal diterima hari ini dan mengubah status menjadi
            diterima toko. Gunakan Ubah untuk melengkapi nama penerima atau tanggal lain.
          </p>
        </div>
      }
    />
  );
}
