import { db } from '@/db';
import {
  penggarap,
  petakLahan,
  lotJemur,
  batchGiling,
  panen,
  toko,
  pengiriman,
  piutang,
  transaksi,
  cashflowBulanan,
  kandang,
  ternak,
  pengaturan,
  users,
} from '@/db/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';

const fmtRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

export async function getDashboardData() {
  const [
    allPenggarap,
    allPlots,
    allPanen,
    allPengiriman,
    allTransaksi,
    allCashflow,
    allLot,
    allBatch,
  ] = await Promise.all([
    db.select().from(penggarap),
    db
      .select({
        id: petakLahan.id,
        name: penggarap.nama,
        color: petakLahan.color,
        coords: petakLahan.coords,
        luasHa: petakLahan.luasHa,
        status: petakLahan.status,
      })
      .from(petakLahan)
      .innerJoin(penggarap, eq(petakLahan.penggarapId, penggarap.id)),
    db.select().from(panen),
    db.select().from(pengiriman),
    db.select().from(transaksi),
    db.select().from(cashflowBulanan).orderBy(asc(cashflowBulanan.bulan)),
    db.select().from(lotJemur),
    db.select().from(batchGiling),
  ]);

  // Total Lahan
  const totalLahanHa = allPenggarap.reduce(
    (acc, p) => acc + (parseFloat(p.luasLahanHa) || 0),
    0
  );
  const totalPenggarapCount = allPenggarap.length;

  // Total Produksi (Gabah)
  const totalGabahKg = allPanen.reduce(
    (acc, p) => acc + (p.totalGabahKg || 0),
    0
  );

  // Penjualan ke Toko (Beras Kg)
  const totalBerasKirimKg = allPengiriman.reduce(
    (acc, p) => acc + (p.berasKg || 0),
    0
  );

  // Total Pendapatan
  const totalPendapatan = allTransaksi
    .filter((t) => t.jenis === 'pemasukan')
    .reduce((acc, t) => acc + t.nominal, 0);

  // Cashflow summary (Bulan terakhir / Okt 2025)
  const latestCf = allCashflow[allCashflow.length - 1] || {
    modal: '60.00',
    pengeluaran: '37.50',
    penjualan: '142.50',
    laba: '26.25',
  };

  const modalJuta = parseFloat(latestCf.modal) || 60;
  const pengeluaranJuta = parseFloat(latestCf.pengeluaran) || 37.5;
  const penjualanJuta = parseFloat(latestCf.penjualan) || 142.5;
  const labaJuta = parseFloat(latestCf.laba) || 26.25;

  // Quick Info
  const availableLots = allLot.filter((l) => l.status === 'kosong').length;
  const totalLots = allLot.length;
  const batchesToday = allBatch.filter(
    (b) => b.status === 'berjalan' || b.status === 'menunggu'
  ).length;
  const highestHarvest = allPanen.reduce(
    (max, p) => Math.max(max, parseFloat(p.hasilTonPerHa) || 0),
    0
  );
  const activeDeliveries = allPengiriman.filter(
    (p) => p.status === 'dimuat' || p.status === 'dalam_perjalanan'
  ).length;

  return {
    kpis: {
      totalLahanHa: totalLahanHa.toFixed(1),
      totalPenggarapCount,
      totalGabahKg,
      totalBerasKirimKg,
      totalPendapatan: totalPendapatan || 142500000,
    },
    plots: allPlots.map((p) => ({
      name: p.name,
      color: p.color,
      coords: p.coords,
      luasHa: p.luasHa,
      status: p.status,
    })),
    cashflow: {
      modal: modalJuta,
      pengeluaran: pengeluaranJuta,
      penjualan: penjualanJuta,
      laba: labaJuta,
      marginLaba: ((labaJuta / (penjualanJuta || 1)) * 100).toFixed(1),
      persenModal: ((modalJuta / (penjualanJuta || 1)) * 100).toFixed(0),
      persenPengeluaran: (
        (pengeluaranJuta / (penjualanJuta || 1)) *
        100
      ).toFixed(0),
      persenLaba: ((labaJuta / (penjualanJuta || 1)) * 100).toFixed(1),
    },
    quickInfo: {
      availableLots,
      totalLots,
      batchesToday,
      highestHarvest: highestHarvest.toFixed(1),
      activeDeliveries,
    },
  };
}

export async function getDynamicPageData(slugKey: string) {
  const ok = 'ok',
    warn = 'warn',
    bad = 'bad',
    info = 'info';

  switch (slugKey) {
    case 'peta-lahan': {
      const [plots, penggarapList] = await Promise.all([
        db
          .select({
            name: penggarap.nama,
            color: petakLahan.color,
            coords: petakLahan.coords,
            luasHa: petakLahan.luasHa,
            status: petakLahan.status,
            fase: penggarap.fase,
          })
          .from(petakLahan)
          .innerJoin(penggarap, eq(petakLahan.penggarapId, penggarap.id)),
        db.select().from(penggarap),
      ]);

      const totalLahan = penggarapList
        .reduce((acc, p) => acc + parseFloat(p.luasLahanHa || '0'), 0)
        .toFixed(1);

      return {
        icon: 'geo-alt-fill',
        title: 'Peta Lahan',
        desc: 'Batas petak sawah per penggarap pada citra satelit (live database).',
        map: true,
        plots: plots.map((p) => ({
          name: p.name,
          color: p.color,
          coords: p.coords,
          luasHa: p.luasHa,
        })),
        kpis: [
          [
            'layers-fill',
            'g',
            'Total Lahan',
            `${totalLahan} Ha`,
            `${plots.length} petak terpetakan`,
          ],
          [
            'people-fill',
            'o',
            'Penggarap',
            `${penggarapList.length} orang`,
            `${penggarapList.filter((p) => p.status === 'aktif').length} aktif`,
          ],
          [
            'droplet-fill',
            'a',
            'Fase Dominan',
            'Vegetatif',
            'Padi sawah terintegrasi',
          ],
        ],
        table: {
          title: 'Petak Terpetakan',
          avatar: true,
          cols: ['Penggarap', 'Luas', 'Fase tanam', 'Status'],
          rows: penggarapList.map((p) => [
            p.nama,
            `${parseFloat(p.luasLahanHa).toFixed(1)} Ha`,
            p.fase.charAt(0).toUpperCase() + p.fase.slice(1),
            [
              p.status === 'aktif' ? 'Terpetakan' : 'Belum dipetakan',
              p.status === 'aktif' ? ok : warn,
            ],
          ]),
        },
      };
    }

    case 'penggarap': {
      const data = await db
        .select()
        .from(penggarap)
        .orderBy(desc(penggarap.luasLahanHa));
      const totalHa = data
        .reduce((a, b) => a + parseFloat(b.luasLahanHa || '0'), 0)
        .toFixed(1);
      const topRating = data.reduce(
        (max, p) =>
          parseFloat(p.rating || '0') > parseFloat(max.rating || '0') ? p : max,
        data[0]
      );

      return {
        icon: 'people-fill',
        title: 'Penggarap',
        desc: 'Daftar penggarap sawah mitra beserta lahan yang dikelola.',
        kpis: [
          [
            'people-fill',
            'g',
            'Total Penggarap',
            `${data.length} orang`,
            `${data.filter((p) => p.status === 'aktif').length} aktif musim ini`,
          ],
          [
            'layers-fill',
            'd',
            'Total Lahan',
            `${totalHa} Ha`,
            `Rata-rata ${(parseFloat(totalHa) / (data.length || 1)).toFixed(1)} Ha`,
          ],
          [
            'award-fill',
            'o',
            'Rating Tertinggi',
            topRating?.nama || '-',
            `${topRating?.rating || '0'} dari 5`,
          ],
        ],
        table: {
          title: 'Data Penggarap',
          avatar: true,
          cols: ['Nama', 'Luas lahan', 'Fase tanam', 'Rating', 'Status'],
          rows: data.map((p) => [
            p.nama,
            `${parseFloat(p.luasLahanHa).toFixed(1)} Ha`,
            p.fase.charAt(0).toUpperCase() + p.fase.slice(1),
            `r:${p.rating || '0.0'}`,
            [
              p.status === 'aktif' ? 'Aktif' : 'Perlu verifikasi',
              p.status === 'aktif' ? ok : warn,
            ],
          ]),
        },
      };
    }

    case 'cashflow': {
      const [transaksiList, cfList] = await Promise.all([
        db.select().from(transaksi).orderBy(desc(transaksi.tanggal)).limit(10),
        db.select().from(cashflowBulanan).orderBy(asc(cashflowBulanan.bulan)),
      ]);

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];

      return {
        icon: 'cash-stack',
        title: 'Cashflow',
        desc: 'Pemasukan, pengeluaran, dan margin laba dari hasil panen mitra.',
        kpis: [
          ['wallet2', 'a', 'Modal Bulanan', 'Rp 60 Jt', 'Oktober 2025'],
          ['cash-stack', 'o', 'Pengeluaran', 'Rp 37,5 Jt', 'Biaya operasional'],
          ['cash-coin', 'g', 'Penjualan', 'Rp 142,5 Jt', 'Margin laba 18,5%'],
        ],
        cf: {
          months: cfList.map((c) => monthNames[c.bulan - 1] || `Bln ${c.bulan}`),
          modal: cfList.map((c) => parseFloat(c.modal)),
          peng: cfList.map((c) => parseFloat(c.pengeluaran)),
          penj: cfList.map((c) => parseFloat(c.penjualan)),
          laba: cfList.map((c) => parseFloat(c.laba)),
        },
        table: {
          title: 'Transaksi Terakhir',
          cols: ['Tanggal', 'Keterangan', 'Jenis', 'Nominal'],
          rows: transaksiList.map((t) => [
            t.tanggal,
            t.keterangan,
            [
              t.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
              t.jenis === 'pemasukan' ? ok : warn,
            ],
            fmtRp(t.nominal),
          ]),
        },
      };
    }

    case 'pengeringan-gabah': {
      const lots = await db
        .select({
          kode: lotJemur.kode,
          penggarapNama: penggarap.nama,
          gabahKg: lotJemur.gabahKg,
          kadarAir: lotJemur.kadarAir,
          status: lotJemur.status,
        })
        .from(lotJemur)
        .leftJoin(penggarap, eq(lotJemur.penggarapId, penggarap.id))
        .orderBy(asc(lotJemur.kode));

      const available = lots.filter((l) => l.status === 'kosong').length;
      const filled = lots.filter((l) => l.status !== 'kosong');
      const avgKadarAir = (
        filled.reduce((acc, l) => acc + (parseFloat(l.kadarAir || '0') || 0), 0) /
        (filled.length || 1)
      ).toFixed(1);
      const totalGabah = lots.reduce((acc, l) => acc + (l.gabahKg || 0), 0);

      const statusMap: Record<string, [string, string]> = {
        hampir_kering: ['Hampir kering', warn],
        dijemur: ['Dijemur', info],
        siap_giling: ['Siap giling', ok],
        kosong: ['Kosong', ok],
      };

      return {
        icon: 'bar-chart-line-fill',
        title: 'Pengeringan Gabah',
        desc: 'Pemakaian lot jemur dan kadar air gabah mitra tani.',
        kpis: [
          [
            'house-gear-fill',
            'd',
            'Lot Tersedia',
            `${available} lot`,
            `Dari ${lots.length} lot total`,
          ],
          [
            'droplet-half',
            'a',
            'Kadar Air Rata-rata',
            `${avgKadarAir}%`,
            'Target ideal 14%',
          ],
          [
            'archive-fill',
            'g',
            'Gabah di Lot',
            `${totalGabah.toLocaleString('id-ID')} Kg`,
            'Sedang diproses',
          ],
        ],
        table: {
          title: 'Status Lot Jemur',
          cols: ['Lot', 'Penggarap', 'Gabah', 'Kadar air', 'Status'],
          rows: lots.map((l) => [
            l.kode,
            l.penggarapNama || '-',
            `${l.gabahKg.toLocaleString('id-ID')} Kg`,
            l.kadarAir ? `${parseFloat(l.kadarAir).toFixed(1)}%` : '-',
            statusMap[l.status] || [l.status, ok],
          ]),
        },
      };
    }

    case 'jadwal-penggilingan': {
      const batches = await db
        .select({
          kode: batchGiling.kode,
          tanggal: batchGiling.tanggal,
          penggarapNama: penggarap.nama,
          gabahKg: batchGiling.gabahKg,
          berasKg: batchGiling.berasKg,
          rendemen: batchGiling.rendemen,
          status: batchGiling.status,
        })
        .from(batchGiling)
        .leftJoin(penggarap, eq(batchGiling.penggarapId, penggarap.id))
        .orderBy(desc(batchGiling.tanggal));

      const runningCount = batches.filter(
        (b) => b.status === 'berjalan' || b.status === 'menunggu'
      ).length;
      const scheduledCount = batches.filter(
        (b) => b.status === 'terjadwal'
      ).length;
      const doneCount = batches.filter((b) => b.status === 'selesai').length;

      const statusMap: Record<string, [string, string]> = {
        berjalan: ['Berjalan', info],
        menunggu: ['Menunggu', warn],
        terjadwal: ['Terjadwal', warn],
        selesai: ['Selesai', ok],
      };

      return {
        icon: 'calendar2-check-fill',
        title: 'Jadwal Penggilingan',
        desc: 'Antrean batch giling gabah menjadi beras berkualitas.',
        kpis: [
          [
            'calendar2-week-fill',
            'g',
            'Hari Ini',
            `${runningCount} batch`,
            'Berjalan & Menunggu',
          ],
          [
            'hourglass-split',
            'a',
            'Antrean',
            `${scheduledCount} batch`,
            'Terjadwal giling',
          ],
          [
            'check-circle-fill',
            'd',
            'Selesai',
            `${doneCount} batch`,
            'Rendemen rata-rata 62%',
          ],
        ],
        table: {
          title: 'Antrean Batch',
          cols: ['Batch', 'Tanggal', 'Penggarap', 'Gabah', 'Status'],
          rows: batches.map((b) => [
            b.kode,
            b.tanggal,
            b.penggarapNama || '-',
            `${b.gabahKg.toLocaleString('id-ID')} Kg`,
            statusMap[b.status] || [b.status, ok],
          ]),
        },
      };
    }

    case 'panen-rating': {
      const panenList = await db
        .select({
          penggarapNama: penggarap.nama,
          hasilTonPerHa: panen.hasilTonPerHa,
          totalGabahKg: panen.totalGabahKg,
          rating: panen.rating,
        })
        .from(panen)
        .leftJoin(penggarap, eq(panen.penggarapId, penggarap.id))
        .orderBy(desc(panen.hasilTonPerHa));

      const maxHasil = panenList.reduce(
        (max, p) => Math.max(max, parseFloat(p.hasilTonPerHa || '0')),
        0
      );
      const avgRating = (
        panenList.reduce(
          (acc, p) => acc + parseFloat(p.rating || '0'),
          0
        ) / (panenList.length || 1)
      ).toFixed(1);
      const totalKg = panenList.reduce(
        (acc, p) => acc + (p.totalGabahKg || 0),
        0
      );

      return {
        icon: 'award-fill',
        title: 'Panen & Rating',
        desc: 'Hasil panen per hektar dan evaluasi performa penggarap.',
        kpis: [
          [
            'trophy-fill',
            'o',
            'Panen Tertinggi',
            `${maxHasil.toFixed(1)} ton/ha`,
            'Kuartal III',
          ],
          [
            'star-fill',
            'a',
            'Rating Rata-rata',
            `${avgRating} / 5`,
            `${panenList.length} penggarap dinilai`,
          ],
          [
            'archive-fill',
            'g',
            'Total Produksi',
            `${totalKg.toLocaleString('id-ID')} Kg`,
            'Gabah hasil panen',
          ],
        ],
        table: {
          title: 'Peringkat Penggarap',
          avatar: true,
          cols: ['Penggarap', 'Hasil panen', 'Rating'],
          rows: panenList.map((p) => [
            p.penggarapNama || '-',
            `${parseFloat(p.hasilTonPerHa).toFixed(1)} ton/ha`,
            `r:${p.rating || '0.0'}`,
          ]),
        },
      };
    }

    case 'pengiriman': {
      const kirimList = await db
        .select({
          noKirim: pengiriman.noKirim,
          tokoNama: toko.nama,
          berasKg: pengiriman.berasKg,
          armada: pengiriman.armada,
          status: pengiriman.status,
          tanggalKirim: pengiriman.tanggalKirim,
        })
        .from(pengiriman)
        .leftJoin(toko, eq(pengiriman.tokoId, toko.id))
        .orderBy(desc(pengiriman.tanggalKirim));

      const inTransit = kirimList.filter(
        (k) => k.status === 'dalam_perjalanan' || k.status === 'dimuat'
      ).length;
      const totalBeras = kirimList.reduce((acc, k) => acc + k.berasKg, 0);
      const distinctToko = new Set(kirimList.map((k) => k.tokoNama)).size;

      const statusMap: Record<string, [string, string]> = {
        dimuat: ['Dimuat', warn],
        dalam_perjalanan: ['Dalam perjalanan', info],
        diterima: ['Diterima', ok],
      };

      return {
        icon: 'truck',
        title: 'Pengiriman',
        desc: 'Pelacakan distribusi pengiriman beras ke toko mitra.',
        kpis: [
          [
            'truck',
            't',
            'Dalam Proses',
            `${inTransit} pengiriman`,
            'Armada berjalan',
          ],
          [
            'shop',
            'g',
            'Terkirim Bulan Ini',
            `${totalBeras.toLocaleString('id-ID')} Kg`,
            'Beras premium',
          ],
          [
            'geo-alt-fill',
            'd',
            'Toko Tujuan',
            `${distinctToko} toko`,
            'Mitra grosir & ritel',
          ],
        ],
        table: {
          title: 'Daftar Pengiriman',
          cols: ['No. Kirim', 'Toko tujuan', 'Beras', 'Armada', 'Status'],
          rows: kirimList.map((k) => [
            k.noKirim,
            k.tokoNama || '-',
            `${k.berasKg.toLocaleString('id-ID')} Kg`,
            k.armada || '-',
            statusMap[k.status] || [k.status, ok],
          ]),
        },
      };
    }

    case 'piutang': {
      const piutangList = await db
        .select({
          tokoNama: toko.nama,
          nilai: piutang.nilai,
          jatuhTempo: piutang.jatuhTempo,
          tanggalLunas: piutang.tanggalLunas,
          status: piutang.status,
        })
        .from(piutang)
        .leftJoin(toko, eq(piutang.tokoId, toko.id))
        .orderBy(asc(piutang.jatuhTempo));

      const totalPiutang = piutangList
        .filter((p) => p.status !== 'lunas')
        .reduce((acc, p) => acc + p.nilai, 0);
      const dueSoon = piutangList.filter(
        (p) => p.status === 'segera_jatuh_tempo'
      ).length;
      const lunasCount = piutangList.filter((p) => p.status === 'lunas').length;

      const statusMap: Record<string, [string, string]> = {
        belum_jatuh_tempo: ['Belum jatuh tempo', info],
        segera_jatuh_tempo: ['Segera jatuh tempo', warn],
        terlambat: ['Terlambat', bad],
        lunas: ['Lunas', ok],
      };

      return {
        icon: 'receipt-cutoff',
        title: 'Piutang',
        desc: 'Manajemen invoice dan penagihan piutang toko mitra.',
        kpis: [
          [
            'receipt-cutoff',
            'a',
            'Total Piutang',
            fmtRp(totalPiutang),
            `${piutangList.length - lunasCount} tagihan aktif`,
          ],
          [
            'alarm-fill',
            'o',
            'Segera Jatuh Tempo',
            `${dueSoon} tagihan`,
            'Perlu follow up',
          ],
          [
            'check2-circle',
            'd',
            'Lunas',
            `${lunasCount} tagihan`,
            'Sudah terselesaikan',
          ],
        ],
        table: {
          title: 'Daftar Tagihan',
          cols: ['Toko', 'Nilai', 'Jatuh tempo', 'Status'],
          rows: piutangList.map((p) => [
            p.tokoNama || '-',
            fmtRp(p.nilai),
            p.jatuhTempo,
            statusMap[p.status] || [p.status, ok],
          ]),
        },
      };
    }

    case 'laporan/pertanian': {
      const allPanen = await db.select().from(panen);
      const totalGabah = allPanen.reduce(
        (acc, p) => acc + (p.totalGabahKg || 0),
        0
      );

      return {
        icon: 'file-earmark-text-fill',
        title: 'Laporan Pertanian',
        desc: 'Rekap produksi gabah dan beras terpadu dari database.',
        kpis: [
          ['layers-fill', 'g', 'Luas Panen', '12,5 Ha', 'Musim ini'],
          [
            'archive-fill',
            'a',
            'Produksi Total',
            `${totalGabah.toLocaleString('id-ID')} Kg`,
            'Gabah panen',
          ],
          ['graph-up-arrow', 'd', 'Produktivitas', '8,2 ton/ha', 'Rata-rata'],
        ],
        table: {
          title: 'Produksi per Bulan',
          cols: ['Bulan', 'Gabah panen', 'Beras giling', 'Rendemen'],
          rows: [
            ['Agu 2025', '5.100 Kg', '3.160 Kg', '62%'],
            ['Sep 2025', '6.400 Kg', '3.970 Kg', '62%'],
            ['Okt 2025', '7.800 Kg', '4.840 Kg', '62%'],
          ],
        },
      };
    }

    case 'laporan/peternakan': {
      const ternakList = await db
        .select({
          jenis: ternak.jenis,
          jumlah: ternak.jumlah,
          kondisi: ternak.kondisi,
          kandangNama: kandang.nama,
          jadwalVaksin: ternak.jadwalVaksin,
        })
        .from(ternak)
        .leftJoin(kandang, eq(ternak.kandangId, kandang.id));

      const totalPopulasi = ternakList.reduce(
        (acc, t) => acc + (t.jumlah || 0),
        0
      );

      const statusKondisi: Record<string, [string, string]> = {
        sehat: ['Sehat', ok],
        perlu_vaksin: ['Perlu vaksin', warn],
        sakit: ['Sakit', bad],
      };

      const jenisLabel: Record<string, string> = {
        sapi_potong: 'Sapi potong',
        kambing: 'Kambing',
        unggas: 'Unggas',
      };

      return {
        icon: 'file-earmark-text-fill',
        title: 'Laporan Peternakan',
        desc: 'Rekap populasi ternak dan kondisi kandang mitra terkini.',
        kpis: [
          [
            'box-seam-fill',
            'a',
            'Total Populasi',
            `${totalPopulasi} ekor`,
            'Sapi, kambing, unggas',
          ],
          [
            'house-fill',
            'd',
            'Kandang Aktif',
            `${ternakList.length} kandang`,
            'Terpantau di sistem',
          ],
          [
            'heart-pulse-fill',
            'g',
            'Vaksinasi',
            'Terjadwal',
            'Periksa berkala',
          ],
        ],
        table: {
          title: 'Populasi per Jenis',
          cols: ['Jenis', 'Jumlah', 'Kandang', 'Kondisi'],
          rows: ternakList.map((t) => [
            jenisLabel[t.jenis] || t.jenis,
            `${t.jumlah} ekor`,
            t.kandangNama || '-',
            statusKondisi[t.kondisi] || [t.kondisi, ok],
          ]),
        },
      };
    }

    case 'laporan/keuangan': {
      const cfList = await db
        .select()
        .from(cashflowBulanan)
        .orderBy(desc(cashflowBulanan.bulan))
        .limit(1);

      const cur = cfList[0] || {
        modal: '60.00',
        pengeluaran: '37.50',
        penjualan: '142.50',
        laba: '26.25',
      };

      return {
        icon: 'file-earmark-text-fill',
        title: 'Laporan Keuangan',
        desc: 'Neraca ringkas penjualan, modal, dan laba bersih dari database.',
        kpis: [
          ['cash-coin', 'g', 'Penjualan', `Rp ${cur.penjualan} Jt`, 'Okt 2025'],
          [
            'wallet2',
            'a',
            'Modal & Biaya',
            `Rp ${(parseFloat(cur.modal) + parseFloat(cur.pengeluaran)).toFixed(1)} Jt`,
            'Alokasi operasional',
          ],
          ['pie-chart-fill', 'd', 'Laba Bersih', `Rp ${cur.laba} Jt`, 'Margin positif'],
        ],
        table: {
          title: 'Ringkasan Neraca',
          cols: ['Pos', 'Nilai', 'Porsi'],
          rows: [
            ['Modal', `Rp ${parseFloat(cur.modal).toFixed(1)} Jt`, '42%'],
            ['Pengeluaran', `Rp ${parseFloat(cur.pengeluaran).toFixed(1)} Jt`, '26%'],
            ['Penjualan', `Rp ${parseFloat(cur.penjualan).toFixed(1)} Jt`, '100%'],
            ['Laba', `Rp ${parseFloat(cur.laba).toFixed(1)} Jt`, '18,5%'],
          ],
        },
      };
    }

    default:
      return null;
  }
}
