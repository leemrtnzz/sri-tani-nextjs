'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import anime from 'animejs';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // 1. Animasi Hero Section saat Halaman Dimuat
    anime.timeline({
      easing: 'easeOutExpo',
    })
    .add({
      targets: '.hero-anim',
      translateY: [28, 0],
      opacity: [0, 1],
      delay: anime.stagger(110, { start: 150 }),
      duration: 900,
    })
    .add({
      targets: '.hero-preview',
      translateX: [35, 0],
      opacity: [0, 1],
      duration: 950,
    }, '-=650');

    // 2. Animasi Counter Statistik (IntersectionObserver)
    const counters = document.querySelectorAll('.home-counter');
    let counterPlayed = false;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counterPlayed) {
          counterPlayed = true;
          counters.forEach((el) => {
            const targetVal = parseFloat(el.getAttribute('data-val') ?? '');
            const decimals = parseInt(el.getAttribute('data-dec') || '0', 10);
            const obj = { count: 0 };

            anime({
              targets: obj,
              count: targetVal,
              duration: 2000,
              easing: 'easeOutExpo',
              update: () => {
                el.innerHTML = obj.count.toLocaleString('id-ID', {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                });
              },
            });
          });
        }
      });
    }, { threshold: 0.3 });

    const statsSection = document.getElementById('statistik');
    if (statsSection) counterObserver.observe(statsSection);

    // 3. Animasi Scroll untuk Kartu Sektor & Fitur
    const observers:any = [];
    const animateOnScroll = (selector:any, staggerDelay = 120) => {
      const elements = document.querySelectorAll(selector);
      let played = false;

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting) && !played) {
          played = true;
          anime({
            targets: selector,
            translateY: [32, 0],
            opacity: [0, 1],
            delay: anime.stagger(staggerDelay),
            duration: 850,
            easing: 'easeOutCubic',
          });
        }
      }, { threshold: 0.15 });

      elements.forEach((el) => observer.observe(el));
      observers.push(observer);
    };

    animateOnScroll('.sector-card', 160);
    animateOnScroll('.feature-card', 95);

    return () => {
      counterObserver.disconnect();
      observers.forEach((obs:any) => obs.disconnect());
    };
  }, []);

  return (
    <div className="selection:bg-sri-green selection:text-white">
      {/* NAVBAR */}
      <header id="navbar" className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-linear-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-sri-sidebar text-xl shadow-md">
              <i className="bi bi-flower1" />
            </span>
            <div>
              <span className="text-lg font-bold tracking-tight text-sri-sidebar block leading-none">SRI TANI</span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase mt-1 block">Pertanian &amp; Ternak Terpadu</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#beranda" className="hover:text-sri-sidebar transition-colors">Beranda</a>
            <a href="#sektor" className="hover:text-sri-sidebar transition-colors">Sektor Terpadu</a>
            <a href="#fitur" className="hover:text-sri-sidebar transition-colors">Fitur Sistem</a>
            <a href="#alur-kerja" className="hover:text-sri-sidebar transition-colors">Alur Operasional</a>
            <a href="#statistik" className="hover:text-sri-sidebar transition-colors">Data Mitra</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 bg-green-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-sri-sidebar transition-colors">
              Masuk Akun
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <i className="bi bi-list text-2xl" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3`}>
          <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">Beranda</a>
          <a href="#sektor" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">Sektor Terpadu</a>
          <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">Fitur Sistem</a>
          <a href="#alur-kerja" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">Alur Operasional</a>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/login" className="w-full py-2.5 text-center rounded-lg text-sm font-semibold border border-slate-200 text-slate-700">
              Masuk Akun
            </Link>
            <Link href="/dashboard" className="w-full py-2.5 text-center rounded-lg text-sm font-semibold bg-sri-sidebar text-white">
              Buka Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="beranda" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-sri-sidebar text-white overflow-hidden">
        {/* Subtle Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Copywriting */}
            <div className="lg:col-span-7 space-y-6">
              <div className="hero-anim opacity-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-emerald-300">
                <i className="bi bi-shield-check" />
                <span>Platform Manajemen Agribisnis Terintegrasi</span>
              </div>

              <h1 className="hero-anim opacity-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Digitalisasi Tata Kelola <span className="text-emerald-400">Pertanian Padi</span> dan <span className="text-amber-400">Peternakan</span> dalam Satu Sistem.
              </h1>

              <p className="hero-anim opacity-0 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl">
                Pantau pemetaan geospasial lahan sawah, jadwal penggilingan gabah, populasi dan kesehatan ternak, hingga analisa arus kas penjualan ke mitra toko secara presisi dan waktu nyata.
              </p>

              <div className="hero-anim opacity-0 pt-2 flex flex-wrap items-center gap-4">
                <Link href="/dashboard" className="px-6 py-3.5 rounded-xl bg-sri-green hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center gap-2.5 shadow-lg">
                  <i className="bi bi-grid-1x2-fill" />
                  <span>Akses Dashboard Sistem</span>
                </Link>
                <a href="#sektor" className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2">
                  <span>Pelajari Modul</span>
                  <i className="bi bi-chevron-down text-xs" />
                </a>
              </div>

              {/* Mini Highlights */}
              <div className="hero-anim opacity-0 pt-6 border-t border-white/10 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-xs text-white/60">Pemetaan Lahan</div>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <i className="bi bi-geo-alt text-emerald-400" /> Poligon GIS
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Manajemen Ternak</div>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <i className="bi bi-clipboard2-pulse text-amber-400" /> Pakan &amp; Kandang
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Transparansi Dana</div>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <i className="bi bi-pie-chart text-emerald-400" /> Cashflow Real-time
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive System Preview Card */}
            <div className="lg:col-span-5 hero-preview opacity-0">
              <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-2xl border border-slate-200/80 space-y-5">
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sri-sidebar text-white flex items-center justify-center">
                      <i className="bi bi-activity" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Status Operasional Harian</h3>
                      <span className="text-[11px] text-slate-400 block">Sinkronisasi Data Lapangan</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sistem Aktif
                  </span>
                </div>

                {/* Dual Sector Summary */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Sektor Pertanian</span>
                      <i className="bi bi-layers-fill text-sri-green" />
                    </div>
                    <div className="text-xl font-bold text-slate-800">12,5 Ha</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">28.540 Kg Produksi Gabah</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Sektor Peternakan</span>
                      <i className="bi bi-box-seam-fill text-amber-500" />
                    </div>
                    <div className="text-xl font-bold text-slate-800">420 Ekor</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">14 Kandang Terpantau</div>
                  </div>
                </div>

                {/* Live Metrics List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-sri-darkgreen text-white flex items-center justify-center">
                        <i className="bi bi-house-gear-fill" />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">Lot Pengeringan &amp; Gudang Pakan</div>
                        <div className="text-slate-400">Kapasitas operasional tersedia</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">3 Lot Aktif</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-sri-green text-white flex items-center justify-center">
                        <i className="bi bi-cash-coin" />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">Margin Laba Bersih</div>
                        <div className="text-slate-400">Gabungan hasil panen &amp; ternak</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">+18,5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS COUNTER BAR */}
      <section id="statistik" className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pt-4 sm:pt-0 sm:px-6 first:pl-0 first:pt-0">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Luas Lahan Terpetakan</div>
              <div className="text-3xl font-extrabold text-sri-sidebar mt-1">
                <span className="home-counter" data-val="12.5" data-dec="1">0</span> Ha
              </div>
              <div className="text-xs text-slate-500 mt-1">Dikelola oleh 8 penggarap mitra</div>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-6">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Produksi Pangan</div>
              <div className="text-3xl font-extrabold text-sri-sidebar mt-1">
                <span className="home-counter" data-val="28540" data-dec="0">0</span> Kg
              </div>
              <div className="text-xs text-slate-500 mt-1">Akumulasi gabah kering &amp; beras</div>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-6">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Populasi Ternak Mitra</div>
              <div className="text-3xl font-extrabold text-sri-sidebar mt-1">
                <span className="home-counter" data-val="420" data-dec="0">0</span> Ekor
              </div>
              <div className="text-xs text-slate-500 mt-1">Sapi potong, kambing &amp; unggas</div>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-6">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Distribusi ke Toko</div>
              <div className="text-3xl font-extrabold text-sri-sidebar mt-1">
                <span className="home-counter" data-val="21200" data-dec="0">0</span> Kg
              </div>
              <div className="text-xs text-slate-500 mt-1">Tersalurkan ke jaringan ritel</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEKTOR TERPADU (PERTANIAN & PETERNAKAN) */}
      <section id="sektor" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-sri-green block mb-2">Ekosistem Sirkular</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Integrasi Dua Sektor Produktif</h2>
          <p className="text-sm text-slate-500 mt-2">
            SRI TANI menghubungkan rantai pasok pertanian tanaman pangan dengan pengelolaan peternakan untuk menciptakan efisiensi pakan, pupuk organik, dan peningkatan hasil panen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kartu Sektor 1: Pertanian */}
          <div className="sector-card opacity-0 bg-white rounded-2xl border border-slate-200/90 p-8 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sri-sidebar text-white flex items-center justify-center text-xl mb-6">
                <i className="bi bi-geo-alt-fill" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Manajemen Pertanian &amp; Penggilingan</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Pengelolaan siklus tanam padi secara menyeluruh mulai dari pemetaan batas petak sawah per penggarap hingga pemrosesan pascapanen di fasilitas pengeringan dan penggilingan.
              </p>

              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-sri-green mt-0.5" />
                  <span><strong>Peta Lahan GIS:</strong> Visualisasi poligon sawah berdasarkan penggarap dan fase tanam.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-sri-green mt-0.5" />
                  <span><strong>Pengeringan &amp; Penggilingan:</strong> Penjadwalan antrean <em>batch</em> giling dan ketersediaan lot jemur gabah.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-sri-green mt-0.5" />
                  <span><strong>Evaluasi Hasil Panen:</strong> Pencatatan tonase per hektar dan pemeringkatan performa penggarap.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Rata-rata Produktivitas</span>
              <strong className="text-slate-800 font-bold">8,2 Ton / Hektar</strong>
            </div>
          </div>

          {/* Kartu Sektor 2: Peternakan */}
          <div className="sector-card opacity-0 bg-white rounded-2xl border border-slate-200/90 p-8 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl mb-6">
                <i className="bi bi-box-seam-fill" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Manajemen Peternakan &amp; Kandang Mitra</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Pencatatan terstruktur untuk komoditas ternak (sapi, kambing, dan unggas) yang memanfaatkan hasil samping pertanian seperti dedak/bekatul dan jerami sebagai pakan bernutrisi.
              </p>

              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-amber-500 mt-0.5" />
                  <span><strong>Inventaris Populasi &amp; Kandang:</strong> Pemantauan jumlah ternak, kelahiran, serta kapasitas kandang mitra.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-amber-500 mt-0.5" />
                  <span><strong>Manajemen Pakan &amp; Kesehatan:</strong> Jadwal pemberian pakan olahan, riwayat vaksinasi, dan bobot berkala.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check-circle-fill text-amber-500 mt-0.5" />
                  <span><strong>Pengolahan Pupuk Organik:</strong> Distribusi limbah ternak kembali ke lahan sawah untuk menekan biaya modal.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Efisiensi Pakan Sirkular</span>
              <strong className="text-slate-800 font-bold">Hemat Biaya Operasional 24%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* FITUR UTAMA SISTEM (6 MODUL) */}
      <section id="fitur" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sri-green block mb-2">Arsitektur Modul</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Fitur Lengkap Pengelolaan Operasional</h2>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Setiap menu dirancang untuk memudahkan petugas mitra dan administrator dalam mengawasi proses bisnis dari hulu ke hilir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ['map-fill', 'bg-sri-sidebar', 'Pemetaan Lahan & Kandang', 'Visualisasi titik koordinat dan batas area sawah serta lokasi kandang mitra menggunakan citra satelit interaktif.'],
              ['cash-stack', 'bg-sri-green', 'Analisa Cashflow & Piutang', 'Perhitungan otomatis rasio modal, pengeluaran pakan/pupuk, omzet penjualan beras dan ternak, hingga pelacakan piutang mitra.'],
              ['calendar2-check-fill', 'bg-amber-500', 'Lot Jemur & Penggilingan', 'Manajemen kapasitas lantai jemur gabah, pemantauan kadar air, serta penjadwalan batch mesin penggilingan padi.'],
              ['award-fill', 'bg-sri-gold', 'Panen, Bobot & Rating Mitra', 'Sistem penilaian kualitas hasil panen gabah dan pertambahan bobot ternak sebagai dasar insentif bagi penggarap dan peternak.'],
              ['truck', 'bg-teal-600', 'Manajemen Distribusi & Armada', 'Pelacakan status pengiriman komoditas beras dan ternak potong menuju toko ritel maupun pasar induk secara terpusat.'],
              ['file-earmark-bar-graph-fill', 'bg-slate-700', 'Laporan Terpadu & Audit', 'Rekapitulasi laporan bulanan dan kuartalan untuk produksi pertanian, populasi peternakan, serta neraca keuangan.'],
            ].map(([ic, bg, title, desc], idx) => (
              <div key={idx} className="feature-card opacity-0 p-6 rounded-xl bg-[#f4f6f8] border border-slate-200/80 hover:border-sri-green transition-colors">
                <div className={`w-11 h-11 rounded-lg ${bg} text-white flex items-center justify-center text-lg mb-4`}>
                  <i className={`bi bi-${ic}`} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1.5">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALUR OPERASIONAL */}
      <section id="alur-kerja" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-sri-green block mb-2">Tahapan Kerja</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Alur Operasional Terstandarisasi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            ['Tahap 01', 'Pendataan & Pemetaan', 'Registrasi penggarap dan peternak, penentuan batas poligon sawah, serta alokasi modal bibit, pupuk, dan bibit ternak.'],
            ['Tahap 02', 'Pemeliharaan & Budidaya', 'Pemantauan masa tanam padi, pencatatan pakan dan kesehatan ternak, serta pengelolaan arus kas pengeluaran harian.'],
            ['Tahap 03', 'Pascapanen & Pengolahan', 'Penimbangan hasil panen, penggunaan lot pengeringan gabah, penggilingan menjadi beras, dan pemanfaatan dedak untuk ternak.'],
            ['Tahap 04', 'Distribusi & Bagi Hasil', 'Pengiriman beras dan komoditas ternak ke mitra toko, pencatatan pembayaran/piutang, dan perhitungan margin laba bersih.'],
          ].map(([step, title, desc]) => (
            <div key={step} className="bg-white p-6 rounded-xl border border-slate-200/80 relative">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-sri-sidebar text-white inline-block mb-4">{step}</span>
              <h4 className="text-base font-bold text-slate-800 mb-2">{title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sri-sidebar rounded-2xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold">Siap Mengelola Data Pertanian &amp; Peternakan?</h3>
            <p className="text-sm text-white/75 leading-relaxed">
              Masuk ke portal manajemen SRI TANI untuk memantau peta lahan, jadwal giling, populasi ternak, dan laporan keuangan secara langsung.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link href="/login" className="px-6 py-3 rounded-xl bg-white text-sri-sidebar font-semibold text-sm hover:bg-slate-100 transition-colors">
              Halaman Login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-linear-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-sri-sidebar text-xl shadow-md">
              <i className="bi bi-flower1" />
            </span>
            <div>
              <span className="font-bold text-slate-800 block">SRI TANI - Pertanian &amp; Peternakan Terpadu</span>
              <span>Sistem Informasi Manajemen Agribisnis</span>
            </div>
          </div>
          <div>
            &copy; 2025 SRI TANI. Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}