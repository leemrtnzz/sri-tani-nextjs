import { relations } from 'drizzle-orm';
import {
  bigint,
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

/* ───────────── Enum Values & Helpers ───────────── */

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
export const jenisTernakValues = ['sapi_potong', 'kambing', 'unggas'] as const;
export const kondisiTernakValues = ['sehat', 'perlu_vaksin', 'sakit'] as const;
export const roleValues = ['admin', 'user'] as const;

export const fasePlantEnum = (name: string) => mysqlEnum(name, fasePlantValues);
export const statusPenggarapEnum = (name: string) => mysqlEnum(name, statusPenggarapValues);
export const statusPetakEnum = (name: string) => mysqlEnum(name, statusPetakValues);
export const statusLotEnum = (name: string) => mysqlEnum(name, statusLotValues);
export const statusBatchEnum = (name: string) => mysqlEnum(name, statusBatchValues);
export const statusPengirimanEnum = (name: string) => mysqlEnum(name, statusPengirimanValues);
export const statusTagihanEnum = (name: string) => mysqlEnum(name, statusTagihanValues);
export const jenisTransaksiEnum = (name: string) => mysqlEnum(name, jenisTransaksiValues);
export const jenisTernakEnum = (name: string) => mysqlEnum(name, jenisTernakValues);
export const kondisiTernakEnum = (name: string) => mysqlEnum(name, kondisiTernakValues);
export const roleEnum = (name: string) => mysqlEnum(name, roleValues);

/* ───────────── Helpers ───────────── */

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .onUpdateNow()
    .notNull(),
};

// Rupiah disimpan sebagai bilangan bulat (tanpa desimal)
const rupiah = (name: string) => bigint(name, { mode: 'number' });

/* ───────────── Auth / Pengaturan ───────────── */

export const users = mysqlTable(
  'users',
  {
    id: int('id').autoincrement().primaryKey(),
    nama: varchar('nama', { length: 120 }).notNull(),
    email: varchar('email', { length: 190 }).notNull(),
    username: varchar('username', { length: 60 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: roleEnum('role').default('user').notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    uniqueIndex('users_username_uq').on(t.username),
  ],
);

// Halaman Pengaturan: nama organisasi, periode default, dll (satu baris)
export const pengaturan = mysqlTable('pengaturan', {
  id: int('id').autoincrement().primaryKey(),
  namaOrganisasi: varchar('nama_organisasi', { length: 150 }).default('SRI TANI').notNull(),
  periodeDefault: varchar('periode_default', { length: 40 }),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
});

/* ───────────── Penggarap & Peta Lahan ───────────── */

export const penggarap = mysqlTable(
  'penggarap',
  {
    id: int('id').autoincrement().primaryKey(),
    nama: varchar('nama', { length: 120 }).notNull(),
    luasLahanHa: decimal('luas_lahan_ha', { precision: 8, scale: 2 }).default('0.00').notNull(),
    fase: fasePlantEnum('fase').default('pembibitan').notNull(),
    rating: decimal('rating', { precision: 2, scale: 1 }),
    status: statusPenggarapEnum('status').default('aktif').notNull(),
    ...timestamps,
  },
  (t) => [index('penggarap_nama_idx').on(t.nama)],
);

export const petakLahan = mysqlTable('petak_lahan', {
  id: int('id').autoincrement().primaryKey(),
  penggarapId: int('penggarap_id')
    .references(() => penggarap.id, { onDelete: 'cascade' })
    .notNull(),
  color: varchar('color', { length: 9 }).default('#16a34a').notNull(),
  // Poligon: [[lat, lng], ...]
  coords: json('coords').$type<[number, number][]>().notNull(),
  luasHa: decimal('luas_ha', { precision: 8, scale: 2 }),
  status: statusPetakEnum('status').default('terpetakan').notNull(),
  ...timestamps,
});

/* ───────────── Pengeringan Gabah ───────────── */

export const lotJemur = mysqlTable(
  'lot_jemur',
  {
    id: int('id').autoincrement().primaryKey(),
    kode: varchar('kode', { length: 20 }).notNull(), // "Lot 1"
    penggarapId: int('penggarap_id').references(() => penggarap.id, { onDelete: 'set null' }),
    gabahKg: int('gabah_kg').default(0).notNull(),
    kadarAir: decimal('kadar_air', { precision: 4, scale: 1 }), // persen
    status: statusLotEnum('status').default('kosong').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('lot_jemur_kode_uq').on(t.kode)],
);

/* ───────────── Penggilingan ───────────── */

export const batchGiling = mysqlTable(
  'batch_giling',
  {
    id: int('id').autoincrement().primaryKey(),
    kode: varchar('kode', { length: 20 }).notNull(), // "Batch 15"
    tanggal: date('tanggal', { mode: 'string' }).notNull(),
    penggarapId: int('penggarap_id').references(() => penggarap.id, { onDelete: 'set null' }),
    lotId: int('lot_id').references(() => lotJemur.id, { onDelete: 'set null' }),
    gabahKg: int('gabah_kg').notNull(),
    berasKg: int('beras_kg'),
    rendemen: decimal('rendemen', { precision: 5, scale: 2 }), // persen
    status: statusBatchEnum('status').default('terjadwal').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('batch_giling_kode_uq').on(t.kode), index('batch_giling_tanggal_idx').on(t.tanggal)],
);

/* ───────────── Panen & Rating ───────────── */

export const panen = mysqlTable(
  'panen',
  {
    id: int('id').autoincrement().primaryKey(),
    penggarapId: int('penggarap_id')
      .references(() => penggarap.id, { onDelete: 'cascade' })
      .notNull(),
    tanggalPanen: date('tanggal_panen', { mode: 'string' }).notNull(),
    musim: varchar('musim', { length: 40 }), // "Kuartal III"
    hasilTonPerHa: decimal('hasil_ton_per_ha', { precision: 5, scale: 2 }).notNull(),
    totalGabahKg: int('total_gabah_kg'),
    rating: decimal('rating', { precision: 2, scale: 1 }),
    ...timestamps,
  },
  (t) => [index('panen_penggarap_idx').on(t.penggarapId)],
);

/* ───────────── Toko, Pengiriman, Piutang ───────────── */

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
    noKirim: varchar('no_kirim', { length: 20 }).notNull(), // "KRM-0231"
    tokoId: int('toko_id')
      .references(() => toko.id, { onDelete: 'restrict' })
      .notNull(),
    berasKg: int('beras_kg').notNull(),
    armada: varchar('armada', { length: 50 }), // "Pickup 1"
    tanggalKirim: date('tanggal_kirim', { mode: 'string' }),
    status: statusPengirimanEnum('status').default('dimuat').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('pengiriman_no_kirim_uq').on(t.noKirim)],
);

export const piutang = mysqlTable(
  'piutang',
  {
    id: int('id').autoincrement().primaryKey(),
    tokoId: int('toko_id')
      .references(() => toko.id, { onDelete: 'restrict' })
      .notNull(),
    pengirimanId: int('pengiriman_id').references(() => pengiriman.id, { onDelete: 'set null' }),
    nilai: rupiah('nilai').notNull(),
    jatuhTempo: date('jatuh_tempo', { mode: 'string' }).notNull(),
    tanggalLunas: date('tanggal_lunas', { mode: 'string' }),
    status: statusTagihanEnum('status').default('belum_jatuh_tempo').notNull(),
    ...timestamps,
  },
  (t) => [index('piutang_jatuh_tempo_idx').on(t.jatuhTempo)],
);

/* ───────────── Cashflow ───────────── */

export const transaksi = mysqlTable(
  'transaksi',
  {
    id: int('id').autoincrement().primaryKey(),
    tanggal: date('tanggal', { mode: 'string' }).notNull(),
    keterangan: varchar('keterangan', { length: 255 }).notNull(),
    jenis: jenisTransaksiEnum('jenis').notNull(),
    nominal: rupiah('nominal').notNull(),
    tokoId: int('toko_id').references(() => toko.id, { onDelete: 'set null' }),
    batchId: int('batch_id').references(() => batchGiling.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('transaksi_tanggal_idx').on(t.tanggal)],
);

// Rekap bulanan (satuan: juta rupiah) untuk grafik cashflow & laporan keuangan
export const cashflowBulanan = mysqlTable(
  'cashflow_bulanan',
  {
    id: int('id').autoincrement().primaryKey(),
    tahun: int('tahun').notNull(),
    bulan: int('bulan').notNull(), // 1-12
    modal: decimal('modal', { precision: 10, scale: 2 }).default('0.00').notNull(),
    pengeluaran: decimal('pengeluaran', { precision: 10, scale: 2 }).default('0.00').notNull(),
    penjualan: decimal('penjualan', { precision: 10, scale: 2 }).default('0.00').notNull(),
    laba: decimal('laba', { precision: 10, scale: 2 }).default('0.00').notNull(),
  },
  (t) => [uniqueIndex('cashflow_bulanan_uq').on(t.tahun, t.bulan)],
);

/* ───────────── Peternakan ───────────── */

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

/* ───────────── Relations ───────────── */

export const penggarapRelations = relations(penggarap, ({ many }) => ({
  petak: many(petakLahan),
  lot: many(lotJemur),
  batch: many(batchGiling),
  panen: many(panen),
}));

export const petakLahanRelations = relations(petakLahan, ({ one }) => ({
  penggarap: one(penggarap, { fields: [petakLahan.penggarapId], references: [penggarap.id] }),
}));

export const lotJemurRelations = relations(lotJemur, ({ one, many }) => ({
  penggarap: one(penggarap, { fields: [lotJemur.penggarapId], references: [penggarap.id] }),
  batch: many(batchGiling),
}));

export const batchGilingRelations = relations(batchGiling, ({ one }) => ({
  penggarap: one(penggarap, { fields: [batchGiling.penggarapId], references: [penggarap.id] }),
  lot: one(lotJemur, { fields: [batchGiling.lotId], references: [lotJemur.id] }),
}));

export const panenRelations = relations(panen, ({ one }) => ({
  penggarap: one(penggarap, { fields: [panen.penggarapId], references: [penggarap.id] }),
}));

export const tokoRelations = relations(toko, ({ many }) => ({
  pengiriman: many(pengiriman),
  piutang: many(piutang),
  transaksi: many(transaksi),
}));

export const pengirimanRelations = relations(pengiriman, ({ one, many }) => ({
  toko: one(toko, { fields: [pengiriman.tokoId], references: [toko.id] }),
  piutang: many(piutang),
}));

export const piutangRelations = relations(piutang, ({ one }) => ({
  toko: one(toko, { fields: [piutang.tokoId], references: [toko.id] }),
  pengiriman: one(pengiriman, { fields: [piutang.pengirimanId], references: [pengiriman.id] }),
}));

export const transaksiRelations = relations(transaksi, ({ one }) => ({
  toko: one(toko, { fields: [transaksi.tokoId], references: [toko.id] }),
  batch: one(batchGiling, { fields: [transaksi.batchId], references: [batchGiling.id] }),
}));

export const kandangRelations = relations(kandang, ({ many }) => ({
  ternak: many(ternak),
}));

export const ternakRelations = relations(ternak, ({ one }) => ({
  kandang: one(kandang, { fields: [ternak.kandangId], references: [kandang.id] }),
}));

/* ───────────── Types ───────────── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Pengaturan = typeof pengaturan.$inferSelect;
export type NewPengaturan = typeof pengaturan.$inferInsert;
export type Penggarap = typeof penggarap.$inferSelect;
export type NewPenggarap = typeof penggarap.$inferInsert;
export type PetakLahan = typeof petakLahan.$inferSelect;
export type LotJemur = typeof lotJemur.$inferSelect;
export type BatchGiling = typeof batchGiling.$inferSelect;
export type Pengiriman = typeof pengiriman.$inferSelect;
export type Piutang = typeof piutang.$inferSelect;
export type Transaksi = typeof transaksi.$inferSelect;
export type Kandang = typeof kandang.$inferSelect;
export type Ternak = typeof ternak.$inferSelect;
