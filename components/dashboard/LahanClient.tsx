'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { formatHa, label, statusBadgeClass } from '@/lib/format';
import { PLOT_COLORS, polygonAreaHa, type Coordinate } from '@/lib/geo';
import { statusPetakOptions } from '@/lib/options';
import type { Option, PetakRow } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
const MapEditor = dynamic(() => import('@/components/dashboard/MapEditor'), {
  ssr: false,
});

type LahanClientProps = {
  rows: PetakRow[];
  penggarap: Option[];
};

type FormState = {
  penggarapId: string;
  nama: string;
  color: string;
  status: string;
  catatan: string;
  coords: Coordinate[];
  luasHa: number;
};

const emptyForm = (): FormState => ({
  penggarapId: '',
  nama: '',
  color: PLOT_COLORS[0],
  status: 'terpetakan',
  catatan: '',
  coords: [],
  luasHa: 0,
});

export default function LahanClient({ rows, penggarap }: LahanClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PetakRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<PetakRow | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.nama} ${row.penggarapNama} ${row.status} ${row.fase}`
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, query]);

  const totalLuas = rows.reduce((sum, row) => sum + row.luasHa, 0);
  const totalPenggarap = new Set(rows.map((row) => row.penggarapId)).size;
  const avgLuas = rows.length ? totalLuas / rows.length : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setOpen(true);
  };

  const openEdit = (row: PetakRow) => {
    setEditing(row);
    setForm({
      penggarapId: String(row.penggarapId),
      nama: row.nama,
      color: row.color,
      status: row.status,
      catatan: row.catatan ?? '',
      coords: row.coords,
      luasHa: row.luasHa,
    });
    setError('');
    setOpen(true);
  };

  const handleMapChange = (coords: Coordinate[], areaHa: number) => {
    setForm((current) => ({ ...current, coords, luasHa: areaHa }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.coords.length < 3) {
      setError('Gambar batas lahan dengan minimal 3 titik pada peta.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        editing ? `/api/petak-lahan/${editing.id}` : '/api/petak-lahan',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            penggarapId: Number(form.penggarapId),
            nama: form.nama,
            color: form.color,
            status: form.status,
            catatan: form.catatan,
            coords: form.coords,
          }),
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || 'Penyimpanan petak lahan gagal.');
      }

      if (!result?.data) {
        throw new Error('Server tidak mengembalikan data petak yang disimpan.');
      }

      setOpen(false);
      setNotice(editing ? 'Perubahan petak lahan disimpan.' : 'Petak lahan baru ditambahkan.');
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Penyimpanan petak lahan gagal.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/petak-lahan/${deleting.id}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Penghapusan petak gagal.');
      }
      setDeleting(null);
      setNotice('Petak lahan dihapus.');
      router.refresh();
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : 'Penghapusan petak gagal.',
      );
    } finally {
      setDeletePending(false);
    }
  };

  const mapPlots = rows.map((row) => ({
    id: row.id,
    name: row.nama,
    penggarapName: row.penggarapNama,
    color: row.color,
    coords: row.coords,
    luasHa: row.luasHa,
    status: row.status,
    fase: row.fase,
  }));

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-emerald-100 text-sri-sidebar flex items-center justify-center text-xl">
              <i className="bi bi-map-fill" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Peta Lahan Sawah</h1>
              <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">
                Gambar batas petak pada peta, luas dihitung otomatis, lalu lengkapi
                nama penggarap dan status tanam.
              </p>
            </div>
          </div>

          {penggarap.length > 0 ? (
            <button
              type="button"
              onClick={openCreate}
              className="min-h-11 inline-flex items-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active"
            >
              <i className="bi bi-plus-lg" />
              Tambah petak
            </button>
          ) : (
            <Link
              href="/dashboard/penggarap"
              className="min-h-11 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              <i className="bi bi-person-plus" />
              Tambah penggarap dulu
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon="bounding-box"
          label="Jumlah petak"
          value={rows.length}
          hint="Petak yang sudah tercatat"
          tone="green"
        />
        <StatCard
          icon="map-fill"
          label="Total luas"
          value={formatHa(totalLuas)}
          hint="Dihitung dari poligon peta"
          tone="dark"
        />
        <StatCard
          icon="people-fill"
          label="Penggarap terpetakan"
          value={totalPenggarap}
          hint={`Dari ${penggarap.length} penggarap terdaftar`}
          tone="blue"
        />
        <StatCard
          icon="rulers"
          label="Rata-rata petak"
          value={formatHa(avgLuas)}
          hint="Luas rata-rata per petak"
          tone="amber"
        />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-900">Sebaran lahan</h2>
          <span className="text-xs text-slate-600">
            {rows.length} petak, {formatHa(totalLuas)}
          </span>
        </div>
        <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
          <MapView plots={mapPlots} />
          {rows.length === 0 && (
            <div className="absolute inset-0 z-[800] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="text-center px-4">
                <i className="bi bi-geo-alt text-2xl text-slate-500" />
                <p className="text-sm font-semibold text-slate-800 mt-2">
                  Belum ada petak dipetakan
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Tambahkan petak lalu gambar batas lahan pada peta.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="cari-petak" className="sr-only">
              Cari petak atau penggarap
            </label>
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              id="cari-petak"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari petak, penggarap, atau status..."
              className="w-full min-h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
            />
          </div>
          <span className="text-xs text-slate-600">
            {filtered.length} dari {rows.length} petak
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3">Petak</th>
                <th className="px-4 py-3">Penggarap</th>
                <th className="px-4 py-3">Luas</th>
                <th className="px-4 py-3">Status tanam</th>
                <th className="px-4 py-3">Status petak</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl mx-auto mb-3">
                        <i className="bi bi-map" />
                      </div>
                      <p className="font-semibold text-slate-800">
                        {rows.length === 0 ? 'Belum ada petak lahan' : 'Tidak ada hasil pencarian'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {rows.length === 0
                          ? 'Tambahkan petak, lalu gambar batas lahan pada peta.'
                          : 'Ubah kata kunci atau kosongkan kolom pencarian.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} data-row className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{row.nama}</div>
                          <div className="text-xs text-slate-500">
                            {row.coords.length} titik batas
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.penggarapNama}</td>
                    <td className="px-4 py-3 font-semibold">{formatHa(row.luasHa)}</td>
                    <td className="px-4 py-3">{label(row.fase)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                      >
                        {label(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        aria-label={`Ubah petak ${row.nama}`}
                        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(row);
                          setDeleteError('');
                        }}
                        aria-label={`Hapus petak ${row.nama}`}
                        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) setOpen(false);
        }}
        title={editing ? 'Ubah petak lahan' : 'Tambah petak lahan'}
        description="Gambar poligon batas lahan pada peta. Luas dihitung otomatis dari koordinat."
        size="xl"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              form="petak-form"
              disabled={submitting}
              className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active disabled:opacity-70"
            >
              {submitting && <i className="bi bi-arrow-repeat animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan petak'}
            </button>
          </div>
        }
      >
        <form id="petak-form" onSubmit={submit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 flex items-start gap-2"
            >
              <i className="bi bi-exclamation-triangle-fill mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="petak-penggarap" className="block text-sm font-medium text-slate-800 mb-1.5">
                Penggarap <span className="text-red-600">*</span>
              </label>
              <select
                id="petak-penggarap"
                required
                value={form.penggarapId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, penggarapId: event.target.value }))
                }
                className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Pilih penggarap</option>
                {penggarap.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.meta ? `(${option.meta})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="petak-nama" className="block text-sm font-medium text-slate-800 mb-1.5">
                Nama petak <span className="text-red-600">*</span>
              </label>
              <input
                id="petak-nama"
                required
                value={form.nama}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nama: event.target.value }))
                }
                placeholder="Contoh: Sawah Utara 1"
                className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="petak-warna" className="block text-sm font-medium text-slate-800 mb-1.5">
                Warna peta
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="petak-warna"
                  type="color"
                  value={form.color}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, color: event.target.value }))
                  }
                  className="h-11 w-14 rounded-lg border border-slate-300 bg-white p-1"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PLOT_COLORS.slice(0, 5).map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Pilih warna ${color}`}
                      onClick={() => setForm((current) => ({ ...current, color }))}
                      className={`h-7 w-7 rounded-full border-2 ${
                        form.color === color ? 'border-slate-900' : 'border-white'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="petak-status" className="block text-sm font-medium text-slate-800 mb-1.5">
                Status petak
              </label>
              <select
                id="petak-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {statusPetakOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="petak-catatan" className="block text-sm font-medium text-slate-800 mb-1.5">
                Catatan
              </label>
              <textarea
                id="petak-catatan"
                rows={2}
                value={form.catatan}
                onChange={(event) =>
                  setForm((current) => ({ ...current, catatan: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-slate-800">Batas lahan</span>
              <span className="text-xs text-slate-600">
                {form.coords.length} titik, {formatHa(form.luasHa || polygonAreaHa(form.coords))}
              </span>
            </div>
            <MapEditor
              value={form.coords}
              color={form.color}
              existingPlots={rows}
              onChange={handleMapChange}
              heightClass="h-[380px]"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (!deletePending) setDeleting(null);
        }}
        title="Hapus petak lahan"
        description="Tindakan ini tidak bisa dibatalkan."
        size="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deletePending}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deletePending}
              className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
            >
              {deletePending && <i className="bi bi-arrow-repeat animate-spin" />}
              {deletePending ? 'Menghapus...' : 'Hapus petak'}
            </button>
          </div>
        }
      >
        {deleteError && (
          <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
            {deleteError}
          </div>
        )}
        <p className="text-sm text-slate-700">
          Petak {deleting?.nama} milik {deleting?.penggarapNama} akan dihapus.
          Luas lahan penggarap akan dihitung ulang otomatis.
        </p>
      </Modal>

      {notice && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-[1300] max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg flex items-start gap-2.5"
        >
          <i className="bi bi-check-circle-fill mt-0.5" />
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Tutup notifikasi"
            className="text-emerald-900/70 hover:text-emerald-900"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}
    </div>
  );
}
