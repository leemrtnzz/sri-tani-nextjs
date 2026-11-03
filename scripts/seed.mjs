import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function seed() {
  const connectionUri =
    process.env.DATABASE_URL_UTAMA ||
    process.env.DATABASE_URL ||
    'mysql://root@127.0.0.1:3306/db_sri_tani';

  console.log('--- SEEDING DATABASE SRI TANI ---');
  console.log('Connecting to:', connectionUri);

  const conn = await mysql.createConnection(connectionUri);

  try {
    // Nonaktifkan pemeriksaan FK sementara agar bisa membersihkan data lama
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Mengosongkan tabel lama...');
    const tables = [
      'ternak',
      'kandang',
      'cashflow_bulanan',
      'transaksi',
      'piutang',
      'pengiriman',
      'toko',
      'panen',
      'batch_giling',
      'lot_jemur',
      'petak_lahan',
      'penggarap',
      'pengaturan',
      'users',
    ];

    for (const t of tables) {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }

    console.log('1. Menambahkan data Users (admin, petugas, user)...');
    const pwdAdmin = await bcrypt.hash('password123', 10);
    const pwdPetugas = await bcrypt.hash('password123', 10);
    const pwdUser = await bcrypt.hash('password123', 10);

    const [userAdminRes] = await conn.query(
      `INSERT INTO users (nama, email, username, password, role) VALUES 
      ('Administrator Sistem', 'admin@sritani.com', 'admin', ?, 'admin'),
      ('Budi Santoso', 'petugas@sritani.com', 'petugas', ?, 'petugas'),
      ('Slamet Riyadi', 'user@sritani.com', 'user', ?, 'user')`,
      [pwdAdmin, pwdPetugas, pwdUser]
    );

    const adminId = userAdminRes.insertId;

    console.log('2. Menambahkan data Pengaturan...');
    await conn.query(
      `INSERT INTO pengaturan (nama_organisasi, periode_default, user_id) VALUES 
      ('SRI TANI', 'Oktober 2025', ?)`,
      [adminId]
    );

    console.log('3. Menambahkan data Penggarap...');
    const [pRes1] = await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Slamet', 2.80, 'vegetatif', 4.8, 'aktif')`
    );
    const slametId = pRes1.insertId;

    const [pRes2] = await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Rudi', 2.40, 'generatif', 4.2, 'aktif')`
    );
    const rudiId = pRes2.insertId;

    const [pRes3] = await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Sutrisno', 2.20, 'vegetatif', 4.0, 'aktif')`
    );
    const sutrisnoId = pRes3.insertId;

    const [pRes4] = await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Wahyu', 2.10, 'pembibitan', 3.9, 'aktif')`
    );
    const wahyuId = pRes4.insertId;

    const [pRes5] = await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Agus', 1.60, 'generatif', 4.5, 'aktif')`
    );
    const agusId = pRes5.insertId;

    await conn.query(
      `INSERT INTO penggarap (nama, luas_lahan_ha, fase, rating, status) VALUES ('Lainnya (3)', 1.40, 'campuran', 3.5, 'perlu_verifikasi')`
    );

    console.log('4. Menambahkan data Petak Lahan (Poligon Koordinat)...');
    const petakData = [
      {
        penggarapId: slametId,
        color: '#16a34a',
        coords: JSON.stringify([[-6.1185, 106.1485], [-6.1180, 106.1502], [-6.1195, 106.1508], [-6.1200, 106.1490]]),
        luasHa: 2.80,
        status: 'terpetakan',
      },
      {
        penggarapId: rudiId,
        color: '#ef4444',
        coords: JSON.stringify([[-6.1180, 106.1502], [-6.1175, 106.1518], [-6.1190, 106.1522], [-6.1195, 106.1508]]),
        luasHa: 2.40,
        status: 'terpetakan',
      },
      {
        penggarapId: sutrisnoId,
        color: '#f59e0b',
        coords: JSON.stringify([[-6.1200, 106.1480], [-6.1195, 106.1498], [-6.1210, 106.1504], [-6.1215, 106.1486]]),
        luasHa: 2.20,
        status: 'terpetakan',
      },
      {
        penggarapId: wahyuId,
        color: '#2563eb',
        coords: JSON.stringify([[-6.1195, 106.1498], [-6.1190, 106.1516], [-6.1206, 106.1520], [-6.1210, 106.1504]]),
        luasHa: 2.10,
        status: 'terpetakan',
      },
      {
        penggarapId: agusId,
        color: '#0d9488',
        coords: JSON.stringify([[-6.1215, 106.1486], [-6.1210, 106.1504], [-6.1222, 106.1509], [-6.1226, 106.1492]]),
        luasHa: 1.60,
        status: 'terpetakan',
      },
    ];

    for (const p of petakData) {
      await conn.query(
        `INSERT INTO petak_lahan (penggarap_id, color, coords, luas_ha, status) VALUES (?, ?, ?, ?, ?)`,
        [p.penggarapId, p.color, p.coords, p.luasHa, p.status]
      );
    }

    console.log('5. Menambahkan data Lot Jemur...');
    const [lRes1] = await conn.query(
      `INSERT INTO lot_jemur (kode, penggarap_id, gabah_kg, kadar_air, status) VALUES ('Lot 1', ?, 3200, 15.1, 'hampir_kering')`,
      [slametId]
    );
    const lot1Id = lRes1.insertId;

    const [lRes2] = await conn.query(
      `INSERT INTO lot_jemur (kode, penggarap_id, gabah_kg, kadar_air, status) VALUES ('Lot 2', ?, 2900, 17.8, 'dijemur')`,
      [rudiId]
    );
    const lot2Id = lRes2.insertId;

    const [lRes3] = await conn.query(
      `INSERT INTO lot_jemur (kode, penggarap_id, gabah_kg, kadar_air, status) VALUES ('Lot 3', ?, 3700, 14.0, 'siap_giling')`,
      [agusId]
    );
    const lot3Id = lRes3.insertId;

    const [lRes4] = await conn.query(
      `INSERT INTO lot_jemur (kode, penggarap_id, gabah_kg, kadar_air, status) VALUES ('Lot 4', NULL, 0, NULL, 'kosong')`
    );
    const lot4Id = lRes4.insertId;

    await conn.query(
      `INSERT INTO lot_jemur (kode, penggarap_id, gabah_kg, kadar_air, status) VALUES 
      ('Lot 5', NULL, 0, NULL, 'kosong'),
      ('Lot 6', NULL, 0, NULL, 'kosong')`
    );

    console.log('6. Menambahkan data Batch Giling...');
    await conn.query(
      `INSERT INTO batch_giling (kode, tanggal, penggarap_id, lot_id, gabah_kg, beras_kg, rendemen, status) VALUES 
      ('Batch 14', '2025-10-22', ?, ?, 2600, 1612, 62.00, 'selesai'),
      ('Batch 15', '2025-10-25', ?, ?, 3700, 2294, 62.00, 'berjalan'),
      ('Batch 16', '2025-10-25', ?, ?, 3200, NULL, NULL, 'menunggu'),
      ('Batch 17', '2025-10-27', ?, ?, 2900, NULL, NULL, 'terjadwal')`,
      [wahyuId, lot4Id, agusId, lot3Id, slametId, lot1Id, rudiId, lot2Id]
    );

    console.log('7. Menambahkan data Panen...');
    await conn.query(
      `INSERT INTO panen (penggarap_id, tanggal_panen, musim, hasil_ton_per_ha, total_gabah_kg, rating) VALUES 
      (?, '2025-10-15', 'Kuartal III', 8.20, 8200, 4.8),
      (?, '2025-10-16', 'Kuartal III', 7.90, 7900, 4.5),
      (?, '2025-10-18', 'Kuartal III', 7.40, 6800, 4.2),
      (?, '2025-10-19', 'Kuartal III', 7.10, 5640, 4.0)`,
      [slametId, agusId, rudiId, sutrisnoId]
    );

    console.log('8. Menambahkan data Toko...');
    const [tRes1] = await conn.query(
      `INSERT INTO toko (nama, alamat, telepon) VALUES ('Toko Makmur', 'Jl. Raya Pertanian No. 12', '081234567890')`
    );
    const tokoMakmurId = tRes1.insertId;

    const [tRes2] = await conn.query(
      `INSERT INTO toko (nama, alamat, telepon) VALUES ('Toko Sentosa', 'Jl. Pasar Induk Blok A3', '081398765432')`
    );
    const tokoSentosaId = tRes2.insertId;

    const [tRes3] = await conn.query(
      `INSERT INTO toko (nama, alamat, telepon) VALUES ('Toko Jaya Tani', 'Jl. Padi Mas No. 5', '085711223344')`
    );
    const tokoJayaTaniId = tRes3.insertId;

    const [tRes4] = await conn.query(
      `INSERT INTO toko (nama, alamat, telepon) VALUES ('Toko Subur', 'Jl. Sukatani No. 88', '081900112233')`
    );
    const tokoSuburId = tRes4.insertId;

    console.log('9. Menambahkan data Pengiriman...');
    const [kRes1] = await conn.query(
      `INSERT INTO pengiriman (no_kirim, toko_id, beras_kg, armada, tanggal_kirim, status) VALUES 
      ('KRM-0230', ?, 1800, 'Pickup 1', '2025-10-20', 'diterima')`,
      [tokoMakmurId]
    );
    const krm230Id = kRes1.insertId;

    const [kRes2] = await conn.query(
      `INSERT INTO pengiriman (no_kirim, toko_id, beras_kg, armada, tanggal_kirim, status) VALUES 
      ('KRM-0231', ?, 2000, 'Pickup 1', '2025-10-24', 'dalam_perjalanan')`,
      [tokoMakmurId]
    );
    const krm231Id = kRes2.insertId;

    const [kRes3] = await conn.query(
      `INSERT INTO pengiriman (no_kirim, toko_id, beras_kg, armada, tanggal_kirim, status) VALUES 
      ('KRM-0232', ?, 1500, 'Pickup 2', '2025-10-24', 'dalam_perjalanan')`,
      [tokoSentosaId]
    );
    const krm232Id = kRes3.insertId;

    const [kRes4] = await conn.query(
      `INSERT INTO pengiriman (no_kirim, toko_id, beras_kg, armada, tanggal_kirim, status) VALUES 
      ('KRM-0233', ?, 2500, 'Truk 1', '2025-10-25', 'dimuat')`,
      [tokoJayaTaniId]
    );
    const krm233Id = kRes4.insertId;

    console.log('10. Menambahkan data Piutang...');
    await conn.query(
      `INSERT INTO piutang (toko_id, pengiriman_id, nilai, jatuh_tempo, tanggal_lunas, status) VALUES 
      (?, ?, 12750000, '2025-10-30', NULL, 'segera_jatuh_tempo'),
      (?, ?, 8400000, '2025-11-10', NULL, 'belum_jatuh_tempo'),
      (?, ?, 5150000, '2025-10-18', NULL, 'terlambat'),
      (?, ?, 9800000, '2025-10-12', '2025-10-12', 'lunas')`,
      [tokoSentosaId, krm232Id, tokoJayaTaniId, krm233Id, tokoMakmurId, krm231Id, tokoSuburId, krm230Id]
    );

    console.log('11. Menambahkan data Transaksi Kas...');
    await conn.query(
      `INSERT INTO transaksi (tanggal, keterangan, jenis, nominal, toko_id) VALUES 
      ('2025-10-24', 'Penjualan beras ke Toko Makmur', 'pemasukan', 18400000, ?),
      ('2025-10-22', 'Pembelian pupuk organik', 'pengeluaran', 3200000, NULL),
      ('2025-10-20', 'Penjualan beras ke Toko Sentosa', 'pemasukan', 12750000, ?),
      ('2025-10-18', 'Biaya penggilingan batch 14', 'pengeluaran', 2100000, NULL)`,
      [tokoMakmurId, tokoSentosaId]
    );

    console.log('12. Menambahkan data Rekap Cashflow Bulanan...');
    const cfMonthly = [
      [2025, 1, 52.00, 30.00, 98.00, 17.60],
      [2025, 2, 53.00, 31.00, 104.00, 18.70],
      [2025, 3, 55.00, 31.00, 110.00, 19.80],
      [2025, 4, 54.00, 32.00, 108.00, 19.40],
      [2025, 5, 56.00, 33.00, 116.00, 20.90],
      [2025, 6, 57.00, 34.00, 122.00, 22.00],
      [2025, 7, 58.00, 35.00, 127.00, 22.90],
      [2025, 8, 58.00, 36.00, 134.00, 24.10],
      [2025, 9, 59.00, 37.00, 138.00, 24.80],
      [2025, 10, 60.00, 37.50, 142.50, 26.25],
    ];

    for (const c of cfMonthly) {
      await conn.query(
        `INSERT INTO cashflow_bulanan (tahun, bulan, modal, pengeluaran, penjualan, laba) VALUES (?, ?, ?, ?, ?, ?)`,
        c
      );
    }

    console.log('13. Menambahkan data Kandang...');
    const [kd1] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Sapi Utama', 'sapi_potong')`
    );
    const kandangSapiId = kd1.insertId;

    const [kd2] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Kambing Mitra', 'kambing')`
    );
    const kandangKambingId = kd2.insertId;

    const [kd3] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Unggas Terpadu', 'unggas')`
    );
    const kandangUnggasId = kd3.insertId;

    console.log('14. Menambahkan data Ternak...');
    await conn.query(
      `INSERT INTO ternak (kandang_id, jenis, jumlah, kondisi, jadwal_vaksin) VALUES 
      (?, 'sapi_potong', 60, 'sehat', '2025-11-15'),
      (?, 'kambing', 110, 'sehat', '2025-11-20'),
      (?, 'unggas', 250, 'perlu_vaksin', '2025-10-28')`,
      [kandangSapiId, kandangKambingId, kandangUnggasId]
    );

    // Aktifkan kembali FK checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n--- SEEDER BERHASIL DIJALANKAN DENGAN SUKSES! ---');
    console.log('Daftar Akun Pengguna:');
    console.log('1. Admin   : admin / password123 (admin@sritani.com)');
    console.log('2. Petugas : petugas / password123 (petugas@sritani.com)');
    console.log('3. User    : user / password123 (user@sritani.com)');
  } catch (err) {
    console.error('Error saat seeding:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
