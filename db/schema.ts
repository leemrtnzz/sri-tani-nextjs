import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const fasePlantValues = ['pembibitan', 'vegetatif', 'generatif', 'campuran'] as const;
export const statusPenggarapValues = ['aktif', 'perlu_verifikasi', 'nonaktif'] as const;
export const statusPetakValues = ['terpetakan', 'belum_dipetakan'] as const;
export const statusLotValues = ['kosong', 'dijemur', 'hampir_kering', 'siap_giling'] as const;
export const statusBatchValues = ['menunggu', 'terjadwal', 'berjalan', 'selesai'] as const;
export const statusPengirimanValues = ['dimuat', 'dalam_perjalanan', 'diterima'] as const;
export const statusTagihanValues = [
  'belum_jatuh_tempo',
  'segera_jatuh_tempo',
  'terlambat',
  'lunas',
] as const;
export const jenisTransaksiValues = ['pemasukan', 'pengeluaran'] as const;
export const kategoriTransaksiValues = ['modal', 'operasional', 'penjualan', 'lain'] as const;
export const jenisTernakValues = ['sapi_potong', 'kambing', 'unggas'] as const;
export const kondisiTernakValues = ['sehat', 'perlu_vaksin', 'sakit'] as const;
export const roleValues = ['master', 'admin', 'petugas', 'penggarap'] as const;

export const fasePlantEnum = (name: string) => mysqlEnum(name, fasePlantValues);
export const statusPenggarapEnum = (name: string) => mysqlEnum(name, statusPenggarapValues);
export const statusPetakEnum = (name: string) => mysqlEnum(name, statusPetakValues);
export const statusLotEnum = (name: string) => mysqlEnum(name, statusLotValues);
export const statusBatchEnum = (name: string) => mysqlEnum(name, statusBatchValues);
export const statusPengirimanEnum = (name: string) => mysqlEnum(name, statusPengirimanValues);
export const statusTagihanEnum = (name: string) => mysqlEnum(name, statusTagihanValues);
export const jenisTransaksiEnum = (name: string) => mysqlEnum(name, jenisTransaksiValues);
export const kategoriTransaksiEnum = (name: string) => mysqlEnum(name, kategoriTransaksiValues);
export const jenisTernakEnum = (name: string) => mysqlEnum(name, jenisTernakValues);
export const kondisiTernakEnum = (name: string) => mysqlEnum(name, kondisiTernakValues);
export const roleEnum = (name: string) => mysqlEnum(name, roleValues);

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .onUpdateNow()
    .notNull(),
};

// Rupiah disimpan sebagai bilangan bulat (tanpa desimal)
const rupiah = (name: string) => bigint(name, { mode: 'number' });

export const users = mysqlTable(
  'users',
  {
    id: int('id').autoincrement().primaryKey(),
    nama: varchar('nama', { length: 120 }).notNull(),
    email: varchar('email', { length: 190 }).notNull(),
    username: varchar('username', { length: 60 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: roleEnum('role').default('penggarap').notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    uniqueIndex('users_username_uq').on(t.username),
  ],
);

export const pengaturan = mysqlTable('pengaturan', {
  id: int('id').autoincrement().primaryKey(),
  namaOrganisasi: varchar('nama_organisasi', { length: 150 }).default('SRI TANI').notNull(),
  periodeDefault: varchar('periode_default', { length: 40 }),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
});

export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: int('id').autoincrement().primaryKey(),
    role: roleEnum('role').notNull(),
    resource: varchar('resource', { length: 40 }).notNull(),
    canView: boolean('can_view').default(false).notNull(),
    canCreate: boolean('can_create').default(false).notNull(),
    canUpdate: boolean('can_update').default(false).notNull(),
    canDelete: boolean('can_delete').default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('role_permissions_role_resource_uq').on(t.role, t.resource),
  ],
);

export const penggarap = mysqlTable(
  'penggarap',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
    nama: varchar('nama', { length: 120 }).notNull(),
    telepon: varchar('telepon', { length: 30 }),
    alamat: text('alamat'),
    luasLahanHa: decimal('luas_lahan_ha', { precision: 8, scale: 2 }).default('0.00').notNull(),
    fase: fasePlantEnum('fase').default('pembibitan').notNull(),
    rating: decimal('rating', { precision: 2, scale: 1 }),
    status: statusPenggarapEnum('status').default('aktif').notNull(),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [
    index('penggarap_nama_idx').on(t.nama),
    uniqueIndex('penggarap_user_uq').on(t.userId),
  ],
);

export const petakLahan = mysqlTable(
  'petak_lahan',
  {
    id: int('id').autoincrement().primaryKey(),
    penggarapId: int('penggarap_id')
      .references(() => penggarap.id, { onDelete: 'cascade' })
      .notNull(),
    nama: varchar('nama', { length: 120 }).notNull(),
    color: varchar('color', { length: 9 }).default('#16a34a').notNull(),
    // Poligon: [[lat, lng], ...]
    coords: json('coords').$type<[number, number][]>().notNull(),
    luasHa: decimal('luas_ha', { precision: 8, scale: 2 }).default('0.00').notNull(),
    pusatLat: decimal('pusat_lat', { precision: 9, scale: 6 }),
    pusatLng: decimal('pusat_lng', { precision: 9, scale: 6 }),
    status: statusPetakEnum('status').default('terpetakan').notNull(),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [index('petak_penggarap_idx').on(t.penggarapId)],
);

export const lotJemur = mysqlTable(
  'lot_jemur',
  {
    id: int('id').autoincrement().primaryKey(),
    kode: varchar('kode', { length: 30 }).notNull(),
    penggarapId: int('penggarap_id').references(() => penggarap.id, { onDelete: 'set null' }),
    kapasitasKg: int('kapasitas_kg').default(5000).notNull(),
    gabahKg: int('gabah_kg').default(0).notNull(),
    kadarAir: decimal('kadar_air', { precision: 4, scale: 1 }),
    status: statusLotEnum('status').default('kosong').notNull(),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [uniqueIndex('lot_jemur_kode_uq').on(t.kode)],
);

export const batchGiling = mysqlTable(
  'batch_giling',
  {
    id: int('id').autoincrement().primaryKey(),
    kode: varchar('kode', { length: 30 }).notNull(),
    tanggal: date('tanggal', { mode: 'string' }).notNull(),
    jam: varchar('jam', { length: 5 }),
    penggarapId: int('penggarap_id').references(() => penggarap.id, { onDelete: 'set null' }),
    lotId: int('lot_id').references(() => lotJemur.id, { onDelete: 'set null' }),
    kapasitasKg: int('kapasitas_kg').default(5000).notNull(),
    gabahKg: int('gabah_kg').notNull(),
    berasKg: int('beras_kg'),
    rendemen: decimal('rendemen', { precision: 5, scale: 2 }),
    status: statusBatchEnum('status').default('terjadwal').notNull(),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('batch_giling_kode_uq').on(t.kode),
    index('batch_giling_tanggal_idx').on(t.tanggal),
  ],
);

export const panen = mysqlTable(
  'panen',
  {
    id: int('id').autoincrement().primaryKey(),
    penggarapId: int('penggarap_id')
      .references(() => penggarap.id, { onDelete: 'cascade' })
      .notNull(),
    tanggalPanen: date('tanggal_panen', { mode: 'string' }).notNull(),
    musim: varchar('musim', { length: 40 }),
    hasilTonPerHa: decimal('hasil_ton_per_ha', { precision: 5, scale: 2 }).notNull(),
    totalGabahKg: int('total_gabah_kg'),
    rating: decimal('rating', { precision: 2, scale: 1 }),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [
    index('panen_penggarap_idx').on(t.penggarapId),
    index('panen_tanggal_idx').on(t.tanggalPanen),
  ],
);

export const toko = mysqlTable('toko', {
  id: int('id').autoincrement().primaryKey(),
  nama: varchar('nama', { length: 150 }).notNull(),
  alamat: text('alamat'),
  telepon: varchar('telepon', { length: 30 }),
  ...timestamps,
});

export const pengiriman = mysqlTable(
  'pengiriman',
  {
    id: int('id').autoincrement().primaryKey(),
    noKirim: varchar('no_kirim', { length: 30 }).notNull(),
    tokoId: int('toko_id')
      .references(() => toko.id, { onDelete: 'restrict' })
      .notNull(),
    batchId: int('batch_id').references(() => batchGiling.id, { onDelete: 'set null' }),
    gudang: varchar('gudang', { length: 120 }).default('Gudang SRI TANI').notNull(),
    berasKg: int('beras_kg').notNull(),
    armada: varchar('armada', { length: 50 }),
    tanggalKirim: date('tanggal_kirim', { mode: 'string' }).notNull(),
    tanggalDiterima: date('tanggal_diterima', { mode: 'string' }),
    penerima: varchar('penerima', { length: 120 }),
    status: statusPengirimanEnum('status').default('dimuat').notNull(),
    catatan: text('catatan'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('pengiriman_no_kirim_uq').on(t.noKirim),
    index('pengiriman_tanggal_idx').on(t.tanggalKirim),
  ],
);

export const piutang = mysqlTable(
  'piutang',
  {
    id: int('id').autoincrement().primaryKey(),
    penggarapId: int('penggarap_id')
      .references(() => penggarap.id, { onDelete: 'restrict' })
      .notNull(),
    nilai: rupiah('nilai').notNull(),
    dibayar: rupiah('dibayar').default(0).notNull(),
    jatuhTempo: date('jatuh_tempo', { mode: 'string' }).notNull(),
    tanggalBayar: date('tanggal_bayar', { mode: 'string' }),
    status: statusTagihanEnum('status').default('belum_jatuh_tempo').notNull(),
    keterangan: varchar('keterangan', { length: 255 }),
    ...timestamps,
  },
  (t) => [
    index('piutang_penggarap_idx').on(t.penggarapId),
    index('piutang_jatuh_tempo_idx').on(t.jatuhTempo),
  ],
);

export const transaksi = mysqlTable(
  'transaksi',
  {
    id: int('id').autoincrement().primaryKey(),
    tanggal: date('tanggal', { mode: 'string' }).notNull(),
    keterangan: varchar('keterangan', { length: 255 }).notNull(),
    jenis: jenisTransaksiEnum('jenis').notNull(),
    kategori: kategoriTransaksiEnum('kategori').default('lain').notNull(),
    nominal: rupiah('nominal').notNull(),
    tokoId: int('toko_id').references(() => toko.id, { onDelete: 'set null' }),
    batchId: int('batch_id').references(() => batchGiling.id, { onDelete: 'set null' }),
    penggarapId: int('penggarap_id').references(() => penggarap.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    index('transaksi_tanggal_idx').on(t.tanggal),
    index('transaksi_kategori_idx').on(t.kategori),
  ],
);

export const kandang = mysqlTable('kandang', {
  id: int('id').autoincrement().primaryKey(),
  nama: varchar('nama', { length: 80 }).notNull(),
  jenis: jenisTernakEnum('jenis').notNull(),
  ...timestamps,
});

export const ternak = mysqlTable('ternak', {
  id: int('id').autoincrement().primaryKey(),
  kandangId: int('kandang_id')
    .references(() => kandang.id, { onDelete: 'cascade' })
    .notNull(),
  jenis: jenisTernakEnum('jenis').notNull(),
  jumlah: int('jumlah').default(0).notNull(),
  kondisi: kondisiTernakEnum('kondisi').default('sehat').notNull(),
  jadwalVaksin: date('jadwal_vaksin', { mode: 'string' }),
  ...timestamps,
});

export const usersRelations = relations(users, ({ one }) => ({
  penggarap: one(penggarap, { fields: [users.id], references: [penggarap.userId] }),
}));

export const penggarapRelations = relations(penggarap, ({ one, many }) => ({
  user: one(users, { fields: [penggarap.userId], references: [users.id] }),
  petak: many(petakLahan),
  lot: many(lotJemur),
  batch: many(batchGiling),
  panen: many(panen),
  piutang: many(piutang),
  transaksi: many(transaksi),
}));

export const petakLahanRelations = relations(petakLahan, ({ one }) => ({
  penggarap: one(penggarap, { fields: [petakLahan.penggarapId], references: [penggarap.id] }),
}));

export const lotJemurRelations = relations(lotJemur, ({ one, many }) => ({
  penggarap: one(penggarap, { fields: [lotJemur.penggarapId], references: [penggarap.id] }),
  batch: many(batchGiling),
}));

export const batchGilingRelations = relations(batchGiling, ({ one, many }) => ({
  penggarap: one(penggarap, { fields: [batchGiling.penggarapId], references: [penggarap.id] }),
  lot: one(lotJemur, { fields: [batchGiling.lotId], references: [lotJemur.id] }),
  transaksi: many(transaksi),
  pengiriman: many(pengiriman),
}));

export const panenRelations = relations(panen, ({ one }) => ({
  penggarap: one(penggarap, { fields: [panen.penggarapId], references: [penggarap.id] }),
}));

export const tokoRelations = relations(toko, ({ many }) => ({
  pengiriman: many(pengiriman),
  transaksi: many(transaksi),
}));

export const pengirimanRelations = relations(pengiriman, ({ one }) => ({
  toko: one(toko, { fields: [pengiriman.tokoId], references: [toko.id] }),
  batch: one(batchGiling, { fields: [pengiriman.batchId], references: [batchGiling.id] }),
}));

export const piutangRelations = relations(piutang, ({ one }) => ({
  penggarap: one(penggarap, { fields: [piutang.penggarapId], references: [penggarap.id] }),
}));

export const transaksiRelations = relations(transaksi, ({ one }) => ({
  toko: one(toko, { fields: [transaksi.tokoId], references: [toko.id] }),
  batch: one(batchGiling, { fields: [transaksi.batchId], references: [batchGiling.id] }),
  penggarap: one(penggarap, { fields: [transaksi.penggarapId], references: [penggarap.id] }),
}));

export const kandangRelations = relations(kandang, ({ many }) => ({
  ternak: many(ternak),
}));

export const ternakRelations = relations(ternak, ({ one }) => ({
  kandang: one(kandang, { fields: [ternak.kandangId], references: [kandang.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Pengaturan = typeof pengaturan.$inferSelect;
export type NewPengaturan = typeof pengaturan.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type Penggarap = typeof penggarap.$inferSelect;
export type NewPenggarap = typeof penggarap.$inferInsert;
export type PetakLahan = typeof petakLahan.$inferSelect;
export type NewPetakLahan = typeof petakLahan.$inferInsert;
export type LotJemur = typeof lotJemur.$inferSelect;
export type NewLotJemur = typeof lotJemur.$inferInsert;
export type BatchGiling = typeof batchGiling.$inferSelect;
export type NewBatchGiling = typeof batchGiling.$inferInsert;
export type Panen = typeof panen.$inferSelect;
export type NewPanen = typeof panen.$inferInsert;
export type Toko = typeof toko.$inferSelect;
export type NewToko = typeof toko.$inferInsert;
export type Pengiriman = typeof pengiriman.$inferSelect;
export type NewPengiriman = typeof pengiriman.$inferInsert;
export type Piutang = typeof piutang.$inferSelect;
export type NewPiutang = typeof piutang.$inferInsert;
export type Transaksi = typeof transaksi.$inferSelect;
export type NewTransaksi = typeof transaksi.$inferInsert;
export type Kandang = typeof kandang.$inferSelect;
export type Ternak = typeof ternak.$inferSelect;
