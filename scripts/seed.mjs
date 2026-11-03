import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const pad = (value) => String(value).padStart(2, '0');
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const dateCode = (dateString) => dateString.replace(/-/g, '');

function areaHa(coords) {
  const meanLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersLat = 111132.92;
  const metersLng = 111320 * Math.cos((meanLat * Math.PI) / 180);
  const projected = coords.map(([lat, lng]) => [lng * metersLng, lat * metersLat]);
  let sum = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const [x1, y1] = projected[index];
    const [x2, y2] = projected[(index + 1) % projected.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.round((Math.abs(sum) / 2 / 10000) * 100) / 100;
}

function centerOf(coords) {
  const total = coords.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 },
  );
  return [
    Number((total.lat / coords.length).toFixed(6)),
    Number((total.lng / coords.length).toFixed(6)),
  ];
}

function nextWeekMonday(today) {
  const day = today.getDay();
  const days = day === 1 ? 7 : (8 - day) % 7 || 7;
  return addDays(today, days);
}

function quarterOf(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function quarterLabel(date) {
  return `Kuartal ${['I', 'II', 'III', 'IV'][quarterOf(date) - 1]} ${date.getFullYear()}`;
}

async function seed() {
  const connectionUri =
    process.env.DATABASE_URL_UTAMA ||
    process.env.DATABASE_URL ||
    'mysql://root@127.0.0.1:3306/db_sri_tani';

  console.log('--- SEEDING DATABASE SRI TANI ---');
  console.log('Connecting to:', connectionUri);

  const conn = await mysql.createConnection(connectionUri);
  const today = new Date();
  const todayString = iso(today);

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'ternak',
      'kandang',
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
      'role_permissions',
      'users',
    ];

    console.log('Mengosongkan tabel...');
    for (const table of tables) {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
    }

    console.log('1. Membuat akun master, admin, petugas, dan penggarap...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const [masterResult] = await conn.query(
      `INSERT INTO users (nama, email, username, password, role) VALUES (?, ?, ?, ?, 'master')`,
      ['Master Sistem', 'master@sritani.local', 'master', passwordHash],
    );
    const masterId = masterResult.insertId;

    await conn.query(
      `INSERT INTO users (nama, email, username, password, role) VALUES (?, ?, ?, ?, 'admin')`,
      ['Administrator Sistem', 'admin@sritani.local', 'admin', passwordHash],
    );

    await conn.query(
      `INSERT INTO users (nama, email, username, password, role) VALUES (?, ?, ?, ?, 'petugas')`,
      ['Petugas Lapangan', 'petugas@sritani.local', 'petugas', passwordHash],
    );

    const penggarapSeed = [
      {
        nama: 'Slamet Riyadi',
        username: 'slamet',
        telepon: '081234567801',
        alamat: 'Blok Sawah Utara, Desa Sukamaju',
        fase: 'vegetatif',
        rating: 4.8,
        status: 'aktif',
      },
      {
        nama: 'Rudi Hartono',
        username: 'rudi',
        telepon: '081234567802',
        alamat: 'Blok Sawah Timur, Desa Sukamaju',
        fase: 'generatif',
        rating: 4.2,
        status: 'aktif',
      },
      {
        nama: 'Sutrisno',
        username: 'sutrisno',
        telepon: '081234567803',
        alamat: 'Blok Sawah Selatan, Desa Sukamaju',
        fase: 'vegetatif',
        rating: 4.0,
        status: 'aktif',
      },
      {
        nama: 'Wahyu Prasetyo',
        username: 'wahyu',
        telepon: '081234567804',
        alamat: 'Blok Sawah Barat, Desa Sukamaju',
        fase: 'pembibitan',
        rating: 3.9,
        status: 'aktif',
      },
      {
        nama: 'Agus Setiawan',
        username: 'agus',
        telepon: '081234567805',
        alamat: 'Blok Sawah Tengah, Desa Sukamaju',
        fase: 'generatif',
        rating: 4.5,
        status: 'aktif',
      },
      {
        nama: 'Siti Aminah',
        username: 'siti',
        telepon: '081234567806',
        alamat: 'Blok Sawah Hilir, Desa Sukamaju',
        fase: 'campuran',
        rating: 4.6,
        status: 'perlu_verifikasi',
      },
    ];

    const penggarapIds = {};
    for (const person of penggarapSeed) {
      const [userResult] = await conn.query(
        `INSERT INTO users (nama, email, username, password, role) VALUES (?, ?, ?, ?, 'penggarap')`,
        [
          person.nama,
          `${person.username}@sritani.local`,
          person.username,
          passwordHash,
        ],
      );
      const [penggarapResult] = await conn.query(
        `INSERT INTO penggarap (user_id, nama, telepon, alamat, luas_lahan_ha, fase, rating, status)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          userResult.insertId,
          person.nama,
          person.telepon,
          person.alamat,
          person.fase,
          person.rating,
          person.status,
        ],
      );
      penggarapIds[person.username] = penggarapResult.insertId;
    }

    console.log('2. Menyimpan pengaturan awal...');
    await conn.query(
      `INSERT INTO pengaturan (nama_organisasi, periode_default, user_id) VALUES (?, ?, ?)`,
      [
        'SRI TANI',
        `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`,
        masterId,
      ],
    );

    console.log('3. Menambahkan petak lahan...');
    const petakSeed = [
      {
        username: 'slamet',
        nama: 'Sawah Utara 1',
        color: '#16a34a',
        coords: [
          [-6.1185, 106.1485],
          [-6.118, 106.1502],
          [-6.1195, 106.1508],
          [-6.12, 106.149],
        ],
        status: 'terpetakan',
        catatan: 'Irigasi teknis, dekat saluran utama.',
      },
      {
        username: 'slamet',
        nama: 'Sawah Utara 2',
        color: '#0d9488',
        coords: [
          [-6.1222, 106.1509],
          [-6.1218, 106.1526],
          [-6.1232, 106.153],
          [-6.1236, 106.1513],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'rudi',
        nama: 'Sawah Timur 1',
        color: '#2563eb',
        coords: [
          [-6.118, 106.1502],
          [-6.1175, 106.1518],
          [-6.119, 106.1522],
          [-6.1195, 106.1508],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'rudi',
        nama: 'Sawah Timur 2',
        color: '#b48327',
        coords: [
          [-6.1186, 106.1538],
          [-6.1182, 106.1553],
          [-6.1197, 106.1557],
          [-6.1201, 106.1542],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'sutrisno',
        nama: 'Sawah Selatan',
        color: '#dc2626',
        coords: [
          [-6.12, 106.148],
          [-6.1195, 106.1498],
          [-6.121, 106.1504],
          [-6.1215, 106.1486],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'wahyu',
        nama: 'Sawah Barat',
        color: '#7c3aed',
        coords: [
          [-6.1195, 106.1498],
          [-6.119, 106.1516],
          [-6.1206, 106.152],
          [-6.121, 106.1504],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'agus',
        nama: 'Sawah Tengah',
        color: '#ca8a04',
        coords: [
          [-6.1215, 106.1486],
          [-6.121, 106.1504],
          [-6.1222, 106.1509],
          [-6.1226, 106.1492],
        ],
        status: 'terpetakan',
        catatan: null,
      },
      {
        username: 'siti',
        nama: 'Sawah Hilir',
        color: '#0891b2',
        coords: [
          [-6.1175, 106.1518],
          [-6.117, 106.1534],
          [-6.1186, 106.1538],
          [-6.119, 106.1522],
        ],
        status: 'terpetakan',
        catatan: null,
      },
    ];

    const luasPerPenggarap = {};
    for (const petak of petakSeed) {
      const penggarapId = penggarapIds[petak.username];
      const luas = areaHa(petak.coords);
      const [lat, lng] = centerOf(petak.coords);
      luasPerPenggarap[penggarapId] = (luasPerPenggarap[penggarapId] ?? 0) + luas;

      await conn.query(
        `INSERT INTO petak_lahan
          (penggarap_id, nama, color, coords, luas_ha, pusat_lat, pusat_lng, status, catatan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          penggarapId,
          petak.nama,
          petak.color,
          JSON.stringify(petak.coords),
          luas,
          lat,
          lng,
          petak.status,
          petak.catatan,
        ],
      );
    }

    for (const [penggarapId, luas] of Object.entries(luasPerPenggarap)) {
      await conn.query(`UPDATE penggarap SET luas_lahan_ha = ? WHERE id = ?`, [
        luas.toFixed(2),
        penggarapId,
      ]);
    }

    console.log('4. Menambahkan lot pengeringan...');
    const lotSeed = [
      ['LOT-01', penggarapIds.slamet, 5000, 3200, 15.1, 'hampir_kering', 'Menunggu pengecekan kadar air akhir.'],
      ['LOT-02', penggarapIds.rudi, 5000, 2900, 17.8, 'dijemur', null],
      ['LOT-03', penggarapIds.agus, 5000, 3700, 14.0, 'siap_giling', 'Siap masuk batch penggilingan.'],
      ['LOT-04', null, 5000, 0, null, 'kosong', null],
      ['LOT-05', null, 5000, 0, null, 'kosong', null],
      ['LOT-06', penggarapIds.siti, 4000, 1500, 18.2, 'dijemur', null],
    ];

    const lotIds = {};
    for (const lot of lotSeed) {
      const [result] = await conn.query(
        `INSERT INTO lot_jemur
          (kode, penggarap_id, kapasitas_kg, gabah_kg, kadar_air, status, catatan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        lot,
      );
      lotIds[lot[0]] = result.insertId;
    }

    console.log('5. Menambahkan jadwal penggilingan hari ini, besok, dan minggu depan...');
    const tomorrow = addDays(today, 1);
    const nextMonday = nextWeekMonday(today);
    const lastWeek = addDays(today, -7);

    const batchSeed = [
      {
        kode: `BATCH-${dateCode(iso(lastWeek))}-01`,
        tanggal: iso(lastWeek),
        jam: '08:00',
        penggarapId: penggarapIds.slamet,
        lotId: lotIds['LOT-01'],
        kapasitasKg: 5000,
        gabahKg: 2600,
        berasKg: 1612,
        rendemen: '62.00',
        status: 'selesai',
        catatan: 'Batch selesai, beras sudah masuk gudang.',
      },
      {
        kode: `BATCH-${dateCode(todayString)}-01`,
        tanggal: todayString,
        jam: '08:00',
        penggarapId: penggarapIds.agus,
        lotId: lotIds['LOT-03'],
        kapasitasKg: 5000,
        gabahKg: 3700,
        berasKg: null,
        rendemen: null,
        status: 'berjalan',
        catatan: 'Mesin utama beroperasi pagi ini.',
      },
      {
        kode: `BATCH-${dateCode(todayString)}-02`,
        tanggal: todayString,
        jam: '13:00',
        penggarapId: penggarapIds.slamet,
        lotId: lotIds['LOT-01'],
        kapasitasKg: 5000,
        gabahKg: 3200,
        berasKg: null,
        rendemen: null,
        status: 'terjadwal',
        catatan: 'Lanjutan antrean sore.',
      },
      {
        kode: `BATCH-${dateCode(iso(tomorrow))}-01`,
        tanggal: iso(tomorrow),
        jam: '09:00',
        penggarapId: penggarapIds.rudi,
        lotId: lotIds['LOT-02'],
        kapasitasKg: 5000,
        gabahKg: 2900,
        berasKg: null,
        rendemen: null,
        status: 'terjadwal',
        catatan: null,
      },
      {
        kode: `BATCH-${dateCode(iso(nextMonday))}-01`,
        tanggal: iso(nextMonday),
        jam: '08:30',
        penggarapId: penggarapIds.siti,
        lotId: lotIds['LOT-06'],
        kapasitasKg: 4000,
        gabahKg: 1500,
        berasKg: null,
        rendemen: null,
        status: 'menunggu',
        catatan: 'Menunggu konfirmasi kadar air.',
      },
    ];

    const batchIds = [];
    for (const batch of batchSeed) {
      const [result] = await conn.query(
        `INSERT INTO batch_giling
          (kode, tanggal, jam, penggarap_id, lot_id, kapasitas_kg, gabah_kg, beras_kg, rendemen, status, catatan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch.kode,
          batch.tanggal,
          batch.jam,
          batch.penggarapId,
          batch.lotId,
          batch.kapasitasKg,
          batch.gabahKg,
          batch.berasKg,
          batch.rendemen,
          batch.status,
          batch.catatan,
        ],
      );
      batchIds.push(result.insertId);
    }

    console.log('6. Menambahkan hasil panen kuartal berjalan dan kuartal sebelumnya...');
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const clampToToday = (date) => (date > today ? today : date);
    const currentMonthDay = (offset) =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        Math.max(1, today.getDate() - offset),
      );
    const currentQuarterDates = [
      currentMonthDay(0),
      currentMonthDay(1),
      currentMonthDay(2),
      clampToToday(new Date(today.getFullYear(), quarterStartMonth, 10)),
      clampToToday(new Date(today.getFullYear(), quarterStartMonth, 20)),
    ];

    const previousQuarterStart = new Date(
      today.getFullYear(),
      quarterStartMonth - 3,
      1,
    );
    const previousQuarterDates = [8, 14, 22].map(
      (day) =>
        new Date(
          previousQuarterStart.getFullYear(),
          previousQuarterStart.getMonth(),
          day,
        ),
    );

    const panenSeed = [
      [penggarapIds.siti, currentQuarterDates[0], 8.5, 8500, 4.9, 'Hasil tertinggi kuartal ini.'],
      [penggarapIds.slamet, currentQuarterDates[1], 8.2, 8200, 4.8, null],
      [penggarapIds.agus, currentQuarterDates[2], 7.9, 7900, 4.5, null],
      [penggarapIds.rudi, currentQuarterDates[3], 7.4, 6800, 4.2, null],
      [penggarapIds.sutrisno, currentQuarterDates[4], 7.1, 5640, 4.0, null],
      [penggarapIds.wahyu, currentQuarterDates[2], 6.8, 5440, 3.9, 'Perlu pendampingan pemupukan.'],
      [penggarapIds.slamet, previousQuarterDates[0], 7.8, 7800, 4.6, null],
      [penggarapIds.rudi, previousQuarterDates[1], 7.2, 6480, 4.1, null],
      [penggarapIds.agus, previousQuarterDates[2], 7.6, 6840, 4.3, null],
    ];

    for (const [penggarapId, tanggal, hasil, total, rating, catatan] of panenSeed) {
      await conn.query(
        `INSERT INTO panen
          (penggarap_id, tanggal_panen, musim, hasil_ton_per_ha, total_gabah_kg, rating, catatan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          penggarapId,
          iso(tanggal),
          quarterLabel(tanggal),
          hasil,
          total,
          rating,
          catatan,
        ],
      );
    }

    console.log('7. Menambahkan data toko...');
    const tokoSeed = [
      ['Toko Makmur', 'Jl. Raya Pertanian No. 12', '081234567890'],
      ['Toko Sentosa', 'Jl. Pasar Induk Blok A3', '081398765432'],
      ['Toko Jaya Tani', 'Jl. Padi Mas No. 5', '085711223344'],
      ['Toko Subur', 'Jl. Sukatani No. 88', '081900112233'],
    ];
    const tokoIds = {};
    for (const [nama, alamat, telepon] of tokoSeed) {
      const [result] = await conn.query(
        `INSERT INTO toko (nama, alamat, telepon) VALUES (?, ?, ?)`,
        [nama, alamat, telepon],
      );
      tokoIds[nama] = result.insertId;
    }

    console.log('8. Menambahkan pengiriman beras dari gudang ke toko...');
    const pengirimanSeed = [
      {
        noKirim: `KRM-${dateCode(iso(addDays(today, -5)))}-01`,
        tokoId: tokoIds['Toko Makmur'],
        batchId: batchIds[0],
        berasKg: 1800,
        armada: 'Pickup 1',
        tanggalKirim: iso(addDays(today, -5)),
        tanggalDiterima: iso(addDays(today, -4)),
        penerima: 'Rina',
        status: 'diterima',
        catatan: 'Diterima lengkap sesuai surat jalan.',
      },
      {
        noKirim: `KRM-${dateCode(iso(addDays(today, -2)))}-01`,
        tokoId: tokoIds['Toko Sentosa'],
        batchId: batchIds[0],
        berasKg: 1500,
        armada: 'Pickup 2',
        tanggalKirim: iso(addDays(today, -2)),
        tanggalDiterima: null,
        penerima: null,
        status: 'dalam_perjalanan',
        catatan: null,
      },
      {
        noKirim: `KRM-${dateCode(todayString)}-01`,
        tokoId: tokoIds['Toko Jaya Tani'],
        batchId: null,
        berasKg: 2500,
        armada: 'Truk 1',
        tanggalKirim: todayString,
        tanggalDiterima: null,
        penerima: null,
        status: 'dimuat',
        catatan: 'Menunggu keberangkatan armada.',
      },
      {
        noKirim: `KRM-${dateCode(iso(addDays(today, -1)))}-01`,
        tokoId: tokoIds['Toko Subur'],
        batchId: batchIds[0],
        berasKg: 1200,
        armada: 'Pickup 1',
        tanggalKirim: iso(addDays(today, -1)),
        tanggalDiterima: todayString,
        penerima: 'Pak Hendra',
        status: 'diterima',
        catatan: null,
      },
    ];

    for (const kirim of pengirimanSeed) {
      await conn.query(
        `INSERT INTO pengiriman
          (no_kirim, toko_id, batch_id, gudang, beras_kg, armada, tanggal_kirim, tanggal_diterima, penerima, status, catatan)
         VALUES (?, ?, ?, 'Gudang SRI TANI', ?, ?, ?, ?, ?, ?, ?)`,
        [
          kirim.noKirim,
          kirim.tokoId,
          kirim.batchId,
          kirim.berasKg,
          kirim.armada,
          kirim.tanggalKirim,
          kirim.tanggalDiterima,
          kirim.penerima,
          kirim.status,
          kirim.catatan,
        ],
      );
    }

    console.log('9. Menambahkan piutang kepada penggarap...');
    const piutangSeed = [
      {
        username: 'slamet',
        nilai: 12750000,
        dibayar: 0,
        jatuhTempo: iso(addDays(today, 3)),
        tanggalBayar: null,
        status: 'segera_jatuh_tempo',
        keterangan: 'Bagi hasil panen kuartal berjalan.',
      },
      {
        username: 'agus',
        nilai: 8400000,
        dibayar: 2000000,
        jatuhTempo: iso(addDays(today, 14)),
        tanggalBayar: null,
        status: 'belum_jatuh_tempo',
        keterangan: 'Pembayaran bertahap hasil giling.',
      },
      {
        username: 'rudi',
        nilai: 5150000,
        dibayar: 0,
        jatuhTempo: iso(addDays(today, -5)),
        tanggalBayar: null,
        status: 'terlambat',
        keterangan: 'Sisa bagi hasil panen sebelumnya.',
      },
      {
        username: 'sutrisno',
        nilai: 9800000,
        dibayar: 9800000,
        jatuhTempo: iso(addDays(today, -10)),
        tanggalBayar: iso(addDays(today, -10)),
        status: 'lunas',
        keterangan: 'Sudah dibayar tunai.',
      },
      {
        username: 'siti',
        nilai: 6200000,
        dibayar: 0,
        jatuhTempo: iso(addDays(today, 20)),
        tanggalBayar: null,
        status: 'belum_jatuh_tempo',
        keterangan: 'Bagi hasil panen tertinggi kuartal ini.',
      },
      {
        username: 'wahyu',
        nilai: 3300000,
        dibayar: 0,
        jatuhTempo: iso(addDays(today, 6)),
        tanggalBayar: null,
        status: 'segera_jatuh_tempo',
        keterangan: 'Upah pengelolaan lahan.',
      },
    ];

    for (const item of piutangSeed) {
      await conn.query(
        `INSERT INTO piutang
          (penggarap_id, nilai, dibayar, jatuh_tempo, tanggal_bayar, status, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          penggarapIds[item.username],
          item.nilai,
          item.dibayar,
          item.jatuhTempo,
          item.tanggalBayar,
          item.status,
          item.keterangan,
        ],
      );
    }

    console.log('10. Menambahkan transaksi kas enam bulan terakhir...');
    for (let offset = 0; offset < 6; offset += 1) {
      const cursor = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const day = String(Math.min(15, today.getDate())).padStart(2, '0');
      const dateString = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${day}`;
      const penjualan = 18400000 + (5 - offset) * 1200000;
      const modal = 9500000;
      const operasional = 3200000 + (offset % 3) * 250000;

      const transactions = [
        [
          dateString,
          `Penjualan beras ke Toko Makmur`,
          'pemasukan',
          'penjualan',
          penjualan,
          tokoIds['Toko Makmur'],
          null,
          null,
        ],
        [
          dateString,
          'Pembelian benih dan pupuk awal',
          'pengeluaran',
          'modal',
          modal,
          null,
          null,
          null,
        ],
        [
          dateString,
          'Biaya operasional penggilingan',
          'pengeluaran',
          'operasional',
          operasional,
          null,
          batchIds[0],
          null,
        ],
        [
          dateString,
          'Upah tenaga kerja dan transportasi',
          'pengeluaran',
          'operasional',
          1800000 + (offset % 2) * 200000,
          null,
          null,
          penggarapIds.slamet,
        ],
      ];

      for (const transaction of transactions) {
        await conn.query(
          `INSERT INTO transaksi
            (tanggal, keterangan, jenis, kategori, nominal, toko_id, batch_id, penggarap_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          transaction,
        );
      }
    }

    console.log('11. Menambahkan data kandang dan ternak pendukung...');
    const [kandangSapi] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Sapi Utama', 'sapi_potong')`,
    );
    const [kandangKambing] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Kambing Mitra', 'kambing')`,
    );
    const [kandangUnggas] = await conn.query(
      `INSERT INTO kandang (nama, jenis) VALUES ('Kandang Unggas Terpadu', 'unggas')`,
    );

    await conn.query(
      `INSERT INTO ternak (kandang_id, jenis, jumlah, kondisi, jadwal_vaksin) VALUES
       (?, 'sapi_potong', 60, 'sehat', ?),
       (?, 'kambing', 110, 'sehat', ?),
       (?, 'unggas', 250, 'perlu_vaksin', ?)`,
      [
        kandangSapi.insertId,
        iso(addDays(today, 20)),
        kandangKambing.insertId,
        iso(addDays(today, 25)),
        kandangUnggas.insertId,
        iso(addDays(today, 7)),
      ],
    );

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n--- SEEDER BERHASIL DIJALANKAN ---');
    console.log('Akun sistem (kata sandi: password123):');
    console.log('- master (Master Sistem)');
    console.log('- admin (Administrator Sistem)');
    console.log('- petugas (Petugas Lapangan)');
    console.log('Akun penggarap (kata sandi: password123):');
    for (const person of penggarapSeed) {
      console.log(`- ${person.username} (${person.nama})`);
    }
    console.log(`Periode default: ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`);
  } catch (error) {
    console.error('Error saat seeding:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
