const ok = 'ok', warn = 'warn', bad = 'bad', info = 'info';

export const D = '/dashboard';

export const NAV = [
  { href: D, icon: 'house-door-fill', label: 'Dashboard' },
  { href: `${D}/peta-lahan`, icon: 'geo-alt-fill', label: 'Peta Lahan' },
  { href: `${D}/penggarap`, icon: 'people-fill', label: 'Penggarap' },
  { href: `${D}/cashflow`, icon: 'cash-stack', label: 'Cashflow' },
  { href: `${D}/pengeringan-gabah`, icon: 'bar-chart-line-fill', label: 'Pengeringan Gabah' },
  { href: `${D}/jadwal-penggilingan`, icon: 'calendar2-check-fill', label: 'Jadwal Penggilingan' },
  { href: `${D}/panen-rating`, icon: 'award-fill', label: 'Panen & Rating' },
  { href: `${D}/pengiriman`, icon: 'truck', label: 'Pengiriman' },
  { href: `${D}/piutang`, icon: 'receipt-cutoff', label: 'Piutang' },
  {
    icon: 'file-earmark-text-fill',
    label: 'Laporan',
    children: [
      { href: `${D}/laporan/pertanian`, label: 'Laporan Pertanian' },
      { href: `${D}/laporan/peternakan`, label: 'Laporan Peternakan' },
      { href: `${D}/laporan/keuangan`, label: 'Laporan Keuangan' },
    ],
  },
  { href: `${D}/pengaturan`, icon: 'gear-fill', label: 'Pengaturan' },
];

export const PLOTS = [
  { name: 'Slamet', color: '#16a34a', coords: [[-6.1185, 106.1485], [-6.1180, 106.1502], [-6.1195, 106.1508], [-6.1200, 106.1490]] },
  { name: 'Rudi', color: '#ef4444', coords: [[-6.1180, 106.1502], [-6.1175, 106.1518], [-6.1190, 106.1522], [-6.1195, 106.1508]] },
  { name: 'Sutrisno', color: '#f59e0b', coords: [[-6.1200, 106.1480], [-6.1195, 106.1498], [-6.1210, 106.1504], [-6.1215, 106.1486]] },
  { name: 'Wahyu', color: '#2563eb', coords: [[-6.1195, 106.1498], [-6.1190, 106.1516], [-6.1206, 106.1520], [-6.1210, 106.1504]] },
  { name: 'Agus', color: '#0d9488', coords: [[-6.1215, 106.1486], [-6.1210, 106.1504], [-6.1222, 106.1509], [-6.1226, 106.1492]] },
];

export const PAGES = {
  'peta-lahan': {
    icon: 'geo-alt-fill', title: 'Peta Lahan', desc: 'Batas petak sawah per penggarap pada citra satelit.',
    kpis: [['layers-fill', 'g', 'Total Lahan', '12,5 Ha', '5 petak terpetakan'], ['people-fill', 'o', 'Penggarap', '8 orang', '3 belum dipetakan'], ['droplet-fill', 'a', 'Fase Dominan', 'Vegetatif', 'Padi sawah']],
    map: true,
    table: { title: 'Petak Terpetakan', avatar: true, cols: ['Penggarap', 'Luas', 'Fase tanam', 'Status'], rows: [
      ['Slamet', '2,8 Ha', 'Vegetatif', ['Terpetakan', ok]], ['Rudi', '2,4 Ha', 'Generatif', ['Terpetakan', ok]], ['Sutrisno', '2,2 Ha', 'Vegetatif', ['Terpetakan', ok]],
      ['Wahyu', '2,1 Ha', 'Pembibitan', ['Terpetakan', ok]], ['Agus', '1,6 Ha', 'Generatif', ['Terpetakan', ok]], ['Lainnya (3)', '1,4 Ha', 'Campuran', ['Belum dipetakan', warn]]] },
  },
  penggarap: {
    icon: 'people-fill', title: 'Penggarap', desc: 'Daftar penggarap sawah mitra beserta lahan yang dikelola.',
    kpis: [['people-fill', 'g', 'Total Penggarap', '8 orang', '6 aktif musim ini'], ['layers-fill', 'd', 'Total Lahan', '12,5 Ha', 'Rata-rata 1,6 Ha'], ['award-fill', 'o', 'Rating Tertinggi', 'Slamet', '4,8 dari 5']],
    table: { title: 'Data Penggarap', avatar: true, cols: ['Nama', 'Luas lahan', 'Fase tanam', 'Rating', 'Status'], rows: [
      ['Slamet', '2,8 Ha', 'Vegetatif', 'r:4.8', ['Aktif', ok]], ['Rudi', '2,4 Ha', 'Generatif', 'r:4.2', ['Aktif', ok]], ['Sutrisno', '2,2 Ha', 'Vegetatif', 'r:4.0', ['Aktif', ok]],
      ['Wahyu', '2,1 Ha', 'Pembibitan', 'r:3.9', ['Aktif', ok]], ['Agus', '1,6 Ha', 'Generatif', 'r:4.5', ['Aktif', ok]], ['Lainnya (3)', '1,4 Ha', 'Campuran', 'r:3.5', ['Perlu verifikasi', warn]]] },
  },
  cashflow: {
    icon: 'cash-stack', title: 'Cashflow', desc: 'Pemasukan, pengeluaran, dan margin laba dari hasil panen.',
    cf: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'],
      modal: [52, 53, 55, 54, 56, 57, 58, 58, 59, 60],
      peng: [30, 31, 31, 32, 33, 34, 35, 36, 37, 37.5],
      penj: [98, 104, 110, 108, 116, 122, 127, 134, 138, 142.5],
      laba: [17.6, 18.7, 19.8, 19.4, 20.9, 22, 22.9, 24.1, 24.8, 26.25],
    },
    table: { title: 'Transaksi Terakhir', cols: ['Tanggal', 'Keterangan', 'Jenis', 'Nominal'], rows: [
      ['24 Okt 2025', 'Penjualan beras ke Toko Makmur', ['Pemasukan', ok], 'Rp 18.400.000'], ['22 Okt 2025', 'Pembelian pupuk organik', ['Pengeluaran', warn], 'Rp 3.200.000'],
      ['20 Okt 2025', 'Penjualan beras ke Toko Sentosa', ['Pemasukan', ok], 'Rp 12.750.000'], ['18 Okt 2025', 'Biaya penggilingan batch 14', ['Pengeluaran', warn], 'Rp 2.100.000']] },
  },
  'pengeringan-gabah': {
    icon: 'bar-chart-line-fill', title: 'Pengeringan Gabah', desc: 'Pemakaian lot jemur dan kadar air gabah.',
    kpis: [['house-gear-fill', 'd', 'Lot Tersedia', '3 lot', 'Dari 6 lot'], ['droplet-half', 'a', 'Kadar Air Rata-rata', '16,4%', 'Target 14%'], ['archive-fill', 'g', 'Gabah di Lot', '9.800 Kg', 'Sedang dijemur']],
    table: { title: 'Status Lot Jemur', cols: ['Lot', 'Penggarap', 'Gabah', 'Kadar air', 'Status'], rows: [
      ['Lot 1', 'Slamet', '3.200 Kg', '15,1%', ['Hampir kering', warn]], ['Lot 2', 'Rudi', '2.900 Kg', '17,8%', ['Dijemur', info]], ['Lot 3', 'Agus', '3.700 Kg', '14,0%', ['Siap giling', ok]],
      ['Lot 4', '-', '0 Kg', '-', ['Kosong', ok]], ['Lot 5', '-', '0 Kg', '-', ['Kosong', ok]], ['Lot 6', '-', '0 Kg', '-', ['Kosong', ok]]] },
  },
  'jadwal-penggilingan': {
    icon: 'calendar2-check-fill', title: 'Jadwal Penggilingan', desc: 'Antrean batch giling gabah menjadi beras.',
    kpis: [['calendar2-week-fill', 'g', 'Hari Ini', '2 batch', 'Mulai 08.00'], ['hourglass-split', 'a', 'Antrean', '3 batch', '9.800 Kg gabah'], ['check-circle-fill', 'd', 'Selesai Bulan Ini', '14 batch', 'Rendemen rata-rata 62%']],
    table: { title: 'Antrean Batch', cols: ['Batch', 'Tanggal', 'Penggarap', 'Gabah', 'Status'], rows: [
      ['Batch 15', '25 Okt 2025', 'Agus', '3.700 Kg', ['Berjalan', info]], ['Batch 16', '25 Okt 2025', 'Slamet', '3.200 Kg', ['Menunggu', warn]], ['Batch 17', '27 Okt 2025', 'Rudi', '2.900 Kg', ['Terjadwal', warn]], ['Batch 14', '22 Okt 2025', 'Wahyu', '2.600 Kg', ['Selesai', ok]]] },
  },
  'panen-rating': {
    icon: 'award-fill', title: 'Panen & Rating', desc: 'Hasil panen per hektar dan peringkat penggarap.',
    kpis: [['trophy-fill', 'o', 'Panen Tertinggi', '8,2 ton/ha', 'Kuartal III'], ['star-fill', 'a', 'Rating Rata-rata', '4,2 / 5', '8 penggarap'], ['archive-fill', 'g', 'Total Produksi', '28.540 Kg', 'Gabah dan beras']],
    table: { title: 'Peringkat Penggarap', avatar: true, cols: ['Penggarap', 'Hasil panen', 'Rating'], rows: [
      ['Slamet', '8,2 ton/ha', 'r:4.8'], ['Agus', '7,9 ton/ha', 'r:4.5'], ['Rudi', '7,4 ton/ha', 'r:4.2'], ['Sutrisno', '7,1 ton/ha', 'r:4.0'], ['Wahyu', '6,8 ton/ha', 'r:3.9']] },
  },
  pengiriman: {
    icon: 'truck', title: 'Pengiriman', desc: 'Pengiriman beras ke toko mitra.',
    kpis: [['truck', 't', 'Dalam Proses', '3 pengiriman', 'Armada berjalan'], ['shop', 'g', 'Terkirim Bulan Ini', '21.200 Kg', 'Beras'], ['geo-alt-fill', 'd', 'Toko Tujuan', '4 toko', 'Mitra ritel']],
    table: { title: 'Daftar Pengiriman', cols: ['No. Kirim', 'Toko tujuan', 'Beras', 'Armada', 'Status'], rows: [
      ['KRM-0231', 'Toko Makmur', '2.000 Kg', 'Pickup 1', ['Dalam perjalanan', info]], ['KRM-0232', 'Toko Sentosa', '1.500 Kg', 'Pickup 2', ['Dalam perjalanan', info]], ['KRM-0233', 'Toko Jaya Tani', '2.500 Kg', 'Truk 1', ['Dimuat', warn]], ['KRM-0230', 'Toko Makmur', '1.800 Kg', 'Pickup 1', ['Diterima', ok]]] },
  },
  piutang: {
    icon: 'receipt-cutoff', title: 'Piutang', desc: 'Tagihan toko mitra yang belum dibayar.',
    kpis: [['receipt-cutoff', 'a', 'Total Piutang', 'Rp 26.300.000', '3 toko'], ['alarm-fill', 'o', 'Jatuh Tempo 7 Hari', 'Rp 12.750.000', '1 tagihan'], ['check2-circle', 'd', 'Lunas Bulan Ini', 'Rp 61.900.000', '9 tagihan']],
    table: { title: 'Daftar Tagihan', cols: ['Toko', 'Nilai', 'Jatuh tempo', 'Status'], rows: [
      ['Toko Sentosa', 'Rp 12.750.000', '30 Okt 2025', ['Segera jatuh tempo', warn]], ['Toko Jaya Tani', 'Rp 8.400.000', '10 Nov 2025', ['Belum jatuh tempo', info]], ['Toko Makmur', 'Rp 5.150.000', '18 Okt 2025', ['Terlambat', bad]], ['Toko Subur', 'Rp 9.800.000', '12 Okt 2025', ['Lunas', ok]]] },
  },
  'laporan/pertanian': {
    icon: 'file-earmark-text-fill', title: 'Laporan Pertanian', desc: 'Rekap produksi padi per bulan.',
    kpis: [['layers-fill', 'g', 'Luas Panen', '12,5 Ha', 'Musim ini'], ['archive-fill', 'a', 'Produksi', '28.540 Kg', 'Gabah dan beras'], ['graph-up-arrow', 'd', 'Produktivitas', '8,2 ton/ha', 'Rata-rata']],
    table: { title: 'Produksi per Bulan', cols: ['Bulan', 'Gabah panen', 'Beras giling', 'Rendemen'], rows: [['Agu 2025', '5.100 Kg', '3.160 Kg', '62%'], ['Sep 2025', '6.400 Kg', '3.970 Kg', '62%'], ['Okt 2025', '7.800 Kg', '4.840 Kg', '62%']] },
  },
  'laporan/peternakan': {
    icon: 'file-earmark-text-fill', title: 'Laporan Peternakan', desc: 'Rekap populasi ternak dan kandang mitra.',
    kpis: [['box-seam-fill', 'a', 'Populasi', '420 ekor', 'Sapi, kambing, unggas'], ['house-fill', 'd', 'Kandang', '14 kandang', 'Terpantau'], ['heart-pulse-fill', 'g', 'Vaksinasi', 'Terjadwal', 'Per kandang']],
    table: { title: 'Populasi per Jenis', cols: ['Jenis', 'Jumlah', 'Kandang', 'Kondisi'], rows: [['Sapi potong', '60 ekor', '4', ['Sehat', ok]], ['Kambing', '110 ekor', '5', ['Sehat', ok]], ['Unggas', '250 ekor', '5', ['Perlu vaksin', warn]]] },
  },
  'laporan/keuangan': {
    icon: 'file-earmark-text-fill', title: 'Laporan Keuangan', desc: 'Neraca ringkas penjualan, modal, dan laba.',
    kpis: [['cash-coin', 'g', 'Penjualan', 'Rp 142.500.000', 'Okt 2025'], ['wallet2', 'a', 'Modal dan Biaya', 'Rp 97.500.000', '68% dari penjualan'], ['pie-chart-fill', 'd', 'Laba Bersih', 'Rp 26.250.000', 'Margin 18,4%']],
    table: { title: 'Ringkasan Neraca', cols: ['Pos', 'Nilai', 'Porsi'], rows: [['Modal', 'Rp 60.000.000', '42%'], ['Pengeluaran', 'Rp 37.500.000', '26%'], ['Penjualan', 'Rp 142.500.000', '100%'], ['Laba', 'Rp 26.250.000', '18,4%']] },
  },
  pengaturan: {
    icon: 'gear-fill', title: 'Pengaturan', desc: 'Profil petugas dan preferensi tampilan.',
    form: { title: 'Profil Petugas', fields: [['nama', 'Nama petugas', 'Admin'], ['org', 'Nama organisasi', 'SRI TANI'], ['periode', 'Periode default', 'Oktober 2025']] },
  },
};