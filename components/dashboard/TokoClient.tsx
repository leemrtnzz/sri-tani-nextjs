'use client';

import CrudPage, { type ColumnDef, type FieldDef } from '@/components/ui/CrudPage';
import StatCard from '@/components/ui/StatCard';
import type { ResourcePermissions } from '@/lib/permissions';
import type { TokoRow } from '@/lib/types';

export default function TokoClient({
  rows,
  permissions,
}: {
  rows: TokoRow[];
  permissions: ResourcePermissions;
}) {
  const columns: ColumnDef<TokoRow>[] = [
    {
      key: 'nama',
      label: 'Toko',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.nama}</div>
          <div className="text-xs text-slate-600">{row.telepon ?? 'Telepon belum diisi'}</div>
        </div>
      ),
    },
    {
      key: 'alamat',
      label: 'Alamat',
      render: (row) => row.alamat ?? <span className="text-slate-500">-</span>,
    },
    {
      key: 'jumlahPengiriman',
      label: 'Riwayat kiriman',
      render: (row) => `${row.jumlahPengiriman ?? 0} pengiriman`,
    },
  ];

  const fields: FieldDef[] = [
    {
      name: 'nama',
      label: 'Nama toko',
      required: true,
      placeholder: 'Contoh: Toko Makmur',
      span: 2,
    },
    {
      name: 'telepon',
      label: 'Nomor telepon',
      placeholder: '0812...',
    },
    {
      name: 'alamat',
      label: 'Alamat',
      type: 'textarea',
      span: 2,
    },
  ];

  const totalKiriman = rows.reduce(
    (sum, row) => sum + (row.jumlahPengiriman ?? 0),
    0,
  );

  return (
    <CrudPage<TokoRow>
      title="Data Toko"
      description="Kelola toko tujuan pengiriman beras beserta kontak dan alamatnya."
      icon="shop"
      endpoint="/api/toko"
      rows={rows}
      permissions={permissions}
      columns={columns}
      fields={fields}
      addLabel="Tambah toko"
      searchFields={['nama', 'alamat', 'telepon']}
      searchPlaceholder="Cari nama toko atau alamat..."
      emptyTitle="Belum ada toko"
      emptyDescription="Tambahkan toko tujuan sebelum membuat pengiriman beras."
      toForm={(row) => ({
        nama: row.nama,
        telepon: row.telepon ?? '',
        alamat: row.alamat ?? '',
      })}
      extraTop={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon="shop"
            label="Jumlah toko"
            value={rows.length}
            hint="Toko tujuan aktif"
            tone="green"
          />
          <StatCard
            icon="truck"
            label="Total pengiriman"
            value={totalKiriman}
            hint="Akumulasi seluruh toko"
            tone="blue"
          />
          <StatCard
            icon="geo-alt-fill"
            label="Toko dengan alamat"
            value={rows.filter((row) => Boolean(row.alamat)).length}
            hint="Alamat siap dipakai untuk rute"
            tone="dark"
          />
        </div>
      }
    />
  );
}
