'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import StatCard from '@/components/ui/StatCard';
import {
  formatHa,
  formatNumber,
  formatRupiah,
  initials,
  label,
} from '@/lib/format';
import {
  faseOptions,
  statusPenggarapOptions,
} from '@/lib/options';
import type { ResourcePermissions } from '@/lib/permissions';
import type { PenggarapRow } from '@/lib/types';

export default function PenggarapClient({
  rows,
  permissions,
}: {
  rows: PenggarapRow[];
  permissions: ResourcePermissions;
}) {
  const columns: ColumnDef<PenggarapRow>[] = [
    {
      key: 'nama',
      label: 'Penggarap',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-emerald-100 text-sri-sidebar text-xs font-bold flex items-center justify-center shrink-0">
            {initials(row.nama)}
          </span>
          <div>
            <div className="font-semibold text-slate-900">{row.nama}</div>
            <div className="text-xs text-slate-600">
              {row.username ? `@${row.username}` : 'Belum punya akun'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'telepon',
      label: 'Kontak',
      render: (row) => (
        <div>
          <div>{row.telepon ?? '-'}</div>
          <div className="text-xs text-slate-500 max-w-[220px] truncate">
            {row.alamat ?? 'Alamat belum diisi'}
          </div>
        </div>
      ),
    },
    {
      key: 'luasLahanHa',
      label: 'Lahan',
      render: (row) => (
        <div>
          <div className="font-semibold">{formatHa(row.totalLuasPetak)}</div>
          <div className="text-xs text-slate-500">{row.jumlahPetak} petak</div>
        </div>
      ),
    },
    {
      key: 'fase',
      label: 'Fase tanam',
      render: (row) => (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          {label(row.fase)}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) =>
        row.rating === null ? (
          <span className="text-slate-500">Belum ada</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <i className="bi bi-star-fill text-amber-500" />
            {formatNumber(row.rating, 1)}
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
    },
    {
      key: 'sisaPiutang',
      label: 'Sisa piutang',
      render: (row) =>
        row.sisaPiutang > 0 ? (
          <span className="font-semibold text-amber-800">
            {formatRupiah(row.sisaPiutang)}
          </span>
        ) : (
          <span className="text-slate-500">Tidak ada</span>
        ),
    },
  ];

  const fields: FieldDef[] = [
    {
      name: 'nama',
      label: 'Nama lengkap',
      required: true,
      placeholder: 'Contoh: Slamet Riyadi',
      span: 2,
    },
    { name: 'telepon', label: 'Nomor telepon', placeholder: '0812...' },
    {
      name: 'luasLahanHa',
      label: 'Luas lahan (Ha)',
      type: 'number',
      step: '0.01',
      min: 0,
      defaultValue: 0,
      help: 'Nilai ini disinkronkan otomatis saat petak lahan ditambah atau diubah.',
    },
    {
      name: 'fase',
      label: 'Fase tanam',
      type: 'select',
      options: faseOptions,
      required: true,
      defaultValue: 'pembibitan',
    },
    {
      name: 'rating',
      label: 'Rating manual',
      type: 'number',
      step: '0.1',
      min: 0,
      max: 5,
      help: 'Rating kuartalan dihitung dari data panen. Isian ini bersifat catatan.',
    },
    {
      name: 'status',
      label: 'Status penggarap',
      type: 'select',
      options: statusPenggarapOptions,
      required: true,
      defaultValue: 'aktif',
    },
    {
      name: 'alamat',
      label: 'Alamat',
      type: 'textarea',
      span: 2,
      placeholder: 'Blok sawah, desa, kecamatan',
    },
    {
      name: 'catatan',
      label: 'Catatan',
      type: 'textarea',
      span: 2,
    },
    {
      name: 'username',
      label: 'Username akun penggarap',
      placeholder: 'contoh: slamet',
      help: 'Isi untuk membuat akun penggarap. Kosongkan jika penggarap belum perlu akun.',
    },
    {
      name: 'email',
      label: 'Email akun',
      type: 'email',
      placeholder: 'contoh: slamet@sritani.local',
    },
    {
      name: 'password',
      label: 'Kata sandi akun',
      type: 'password',
      placeholder: 'Kosongkan untuk memakai password123',
      help: 'Saat mengubah data, kosongkan jika kata sandi tidak diubah.',
      span: 2,
    },
  ];

  const totalLahan = rows.reduce((sum, row) => sum + row.totalLuasPetak, 0);
  const totalPiutang = rows.reduce((sum, row) => sum + row.sisaPiutang, 0);
  const aktif = rows.filter((row) => row.status === 'aktif').length;

  return (
    <CrudPage<PenggarapRow>
      title="Data Penggarap"
      description="Kelola profil penggarap, status tanam, luas lahan, dan akun penggarap."
      icon="people-fill"
      endpoint="/api/penggarap"
      rows={rows}
      permissions={permissions}
      columns={columns}
      fields={fields}
      addLabel="Tambah penggarap"
      searchFields={['nama', 'username', 'telepon', 'alamat', 'fase', 'status']}
      searchPlaceholder="Cari nama, username, atau alamat penggarap..."
      emptyTitle="Belum ada penggarap"
      emptyDescription="Tambahkan penggarap pertama, lalu petakan lahan dan catat hasil panennya."
      toForm={(row) => ({
        nama: row.nama,
        telepon: row.telepon ?? '',
        luasLahanHa: row.luasLahanHa,
        fase: row.fase,
        rating: row.rating ?? '',
        status: row.status,
        alamat: row.alamat ?? '',
        catatan: row.catatan ?? '',
        username: row.username ?? '',
        email: row.email ?? '',
        password: '',
      })}
      extraTop={
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            icon="people-fill"
            label="Total penggarap"
            value={rows.length}
            hint={`${aktif} berstatus aktif`}
            tone="green"
          />
          <StatCard
            icon="map-fill"
            label="Luas terpetakan"
            value={formatHa(totalLahan)}
            hint="Akumulasi seluruh petak lahan"
            tone="dark"
          />
          <StatCard
            icon="person-badge-fill"
            label="Punya akun penggarap"
            value={rows.filter((row) => row.userId).length}
            hint="Dapat masuk ke dashboard"
            tone="blue"
          />
          <StatCard
            icon="file-earmark-text-fill"
            label="Sisa piutang"
            value={formatRupiah(totalPiutang)}
            hint="Kewajiban usaha kepada penggarap"
            tone="amber"
          />
        </div>
      }
    />
  );
}
