'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import anime from 'animejs';
import Chart from 'chart.js/auto';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export interface DashboardData {
  kpis: {
    totalLahanHa: string;
    totalPenggarapCount: number;
    totalGabahKg: number;
    totalBerasKirimKg: number;
    totalPendapatan: number;
  };
  plots: {
    name: string;
    color: string;
    coords: [number, number][];
    luasHa?: string | number | null;
    status?: string;
  }[];
  cashflow: {
    modal: number;
    pengeluaran: number;
    penjualan: number;
    laba: number;
    marginLaba: string;
    persenModal: string;
    persenPengeluaran: string;
    persenLaba: string;
  };
  quickInfo: {
    availableLots: number;
    totalLots: number;
    batchesToday: number;
    highestHarvest: string;
    activeDeliveries: number;
  };
}

export default function DashboardHomeClient({ data }: { data: DashboardData }) {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cfTab, setCfTab] = useState<'grafik' | 'persen'>('grafik');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduce) {
      anime({
        targets: '.anim-kpi',
        translateY: [24, 0],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 200 }),
        duration: 750,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.anim-panel',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(140, { start: 500 }),
        duration: 800,
        easing: 'easeOutCubic',
      });
      anime({
        targets: '.anim-quick',
        translateX: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 850 }),
        duration: 650,
        easing: 'easeOutQuad',
      });
    }

    document.querySelectorAll<HTMLElement>('.count-up').forEach((el) => {
      const target = parseFloat(el.dataset.val || '0');
      const dec = parseInt(el.dataset.dec || '0', 10);
      const fmt = (v: number) =>
        v.toLocaleString('id-ID', {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        });

      if (reduce) {
        el.textContent = fmt(target);
        return;
      }

      const o = { v: 0 };
      anime({
        targets: o,
        v: target,
        duration: 1800,
        delay: 300,
        easing: 'easeOutExpo',
        update: () => {
          el.textContent = fmt(o.v);
        },
      });
    });

    let chartInstance: Chart | null = null;
    if (chartCanvasRef.current) {
      chartInstance = new Chart(chartCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Modal', 'Pengeluaran', 'Penjualan', 'Laba'],
          datasets: [
            {
              data: [
                data.cashflow.modal,
                data.cashflow.pengeluaran,
                data.cashflow.penjualan,
                data.cashflow.laba,
              ],
              backgroundColor: ['#2563eb', '#f59e0b', '#16a34a', '#7c3aed'],
              borderWidth: 0,
              hoverOffset: 5,
            },
          ],
        },
        options: {
          cutout: '72%',
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: reduce ? 0 : 1100,
            delay: reduce ? 0 : 700,
            easing: 'easeOutQuart',
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  }, [data]);

  return (
    <>
      {/* Header & Filter Periode */}
      <div className="p-5 flex-1 min-w-0 bg-white rounded-2xl shadow-2xs border border-slate-200/80 space-y-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan aktivitas pertanian padi dan penjualan ke toko
          </p>
        </div>
        <div>
          <span className="block text-xs text-slate-500 mb-1">Periode</span>
          <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2 flex items-center justify-between gap-8 text-sm font-medium text-slate-700 shadow-2xs">
            <span>Oktober 2025</span>
            <i className="bi bi-calendar3 text-slate-500" />
          </div>
        </div>
      </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="anim-kpi opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-full bg-sri-green text-white flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-layers-fill" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Lahan</div>
            <div className="text-2xl font-bold text-slate-800 my-0.5">
              <span className="count-up" data-val={data.kpis.totalLahanHa} data-dec="1">
                0
              </span>{' '}
              Ha
            </div>
            <div className="text-xs text-slate-500">{data.kpis.totalPenggarapCount} mitra penggarap</div>
          </div>
        </div>

        <div className="anim-kpi opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-archive-fill" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Produksi</div>
            <div className="text-2xl font-bold text-slate-800 my-0.5">
              <span className="count-up" data-val={data.kpis.totalGabahKg} data-dec="0">
                0
              </span>{' '}
              Kg
            </div>
            <div className="text-xs text-slate-500">Gabah Hasil Panen</div>
          </div>
        </div>

        <div className="anim-kpi opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-full bg-sri-green text-white flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-shop" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Penjualan ke Toko</div>
            <div className="text-2xl font-bold text-slate-800 my-0.5">
              <span className="count-up" data-val={data.kpis.totalBerasKirimKg} data-dec="0">
                0
              </span>{' '}
              Kg
            </div>
            <div className="text-xs text-slate-500">Beras Terdistribusi</div>
          </div>
        </div>

        <div className="anim-kpi opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-full bg-sri-green text-white flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-cash-coin" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Pendapatan</div>
            <div className="text-2xl font-bold text-slate-800 my-0.5">
              Rp <span className="count-up" data-val={data.kpis.totalPendapatan} data-dec="0">0</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700 mt-0.5">
              <i className="bi bi-arrow-up-short text-sm -ml-1" /> Data Kas Terverifikasi
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Peta Lahan Sawah */}
        <div className="anim-panel opacity-0 lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Peta Lahan Sawah</h3>
            <span className="text-xs text-slate-500">{data.plots.length} petak terpetakan</span>
          </div>
          <div className="relative w-full h-[360px] rounded-lg overflow-hidden border border-slate-200 flex-1 map-box">
            <MapView plots={data.plots} />
            <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-md z-[500] min-w-[120px] text-xs border border-slate-100">
              <div className="font-bold text-slate-700 mb-2">Penggarap</div>
              <div className="space-y-1.5 text-slate-600 max-h-[140px] overflow-y-auto">
                {data.plots.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Analisa Cashflow */}
        <div className="anim-panel opacity-0 lg:col-span-4 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Analisa Cashflow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-4">
              <div className={`relative w-[180px] h-[180px] mx-auto ${cfTab !== 'grafik' ? 'hidden' : ''}`}>
                <canvas ref={chartCanvasRef} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-500">Margin Laba</span>
                  <strong className="text-xl font-bold text-slate-800">{data.cashflow.marginLaba}%</strong>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs sm:col-span-1">
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Modal
                  </span>
                  <span className="font-semibold text-slate-800">{data.cashflow.persenModal}%</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Pengeluaran
                  </span>
                  <span className="font-semibold text-slate-800">{data.cashflow.persenPengeluaran}%</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    Penjualan
                  </span>
                  <span className="font-semibold text-slate-800">100%</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                    Laba Bersih
                  </span>
                  <span className="font-semibold text-slate-800">{data.cashflow.persenLaba}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCfTab('grafik')}
              aria-pressed={cfTab === 'grafik'}
              className={`px-3 py-1.5 rounded-md text-xs cursor-pointer ${
                cfTab === 'grafik'
                  ? 'font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'font-medium text-slate-600 border border-transparent hover:bg-slate-50'
              }`}
            >
              <i className="bi bi-bar-chart-fill mr-1" /> Grafik
            </button>
            <button
              type="button"
              onClick={() => setCfTab('persen')}
              aria-pressed={cfTab === 'persen'}
              className={`px-3 py-1.5 rounded-md text-xs cursor-pointer ${
                cfTab === 'persen'
                  ? 'font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'font-medium text-slate-600 border border-transparent hover:bg-slate-50'
              }`}
            >
              Persentase
            </button>
          </div>
        </div>

        {/* Panel 3: Informasi Cepat */}
        <div className="anim-panel opacity-0 lg:col-span-3 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Informasi Cepat</h3>
          <div className="space-y-3">
            {[
              [
                'house-gear-fill',
                'bg-sri-darkgreen',
                'Lot Pengeringan Gabah',
                <>
                  Tersedia <strong className="text-slate-800">{data.quickInfo.availableLots} lot</strong> dari{' '}
                  {data.quickInfo.totalLots}
                </>,
              ],
              [
                'calendar2-week-fill',
                'bg-sri-green',
                'Jadwal Penggilingan',
                <>
                  Hari ini, <strong className="text-slate-800">{data.quickInfo.batchesToday} batch</strong> aktif
                </>,
              ],
              [
                'trophy-fill',
                'bg-sri-gold',
                'Panen Tertinggi',
                <>
                  Puncak <strong className="text-slate-800">{data.quickInfo.highestHarvest} ton/ha</strong>
                </>,
              ],
              [
                'truck',
                'bg-teal-600',
                'Pengiriman',
                <>
                  <strong className="text-slate-800">{data.quickInfo.activeDeliveries} pengiriman</strong> aktif
                </>,
              ],
            ].map(([ic, bg, title, sub], idx) => (
              <div
                key={idx}
                className="anim-quick opacity-0 border border-slate-100 rounded-xl p-3 flex items-center gap-3.5 shadow-2xs hover:border-slate-200 transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-full ${bg} text-white flex items-center justify-center text-lg shrink-0`}
                >
                  <i className={`bi bi-${ic}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{title}</div>
                  <div className="text-xs text-slate-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

