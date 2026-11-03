'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import anime from 'animejs';
import Chart from 'chart.js/auto';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export interface DynamicPageContent {
  icon: string;
  title: string;
  desc: string;
  map?: boolean;
  plots?: { name: string; color: string; coords: [number, number][]; luasHa?: string | null }[];
  cf?: {
    months: string[];
    modal: number[];
    peng: number[];
    penj: number[];
    laba: number[];
  };
  kpis?: any[][];
  table?: {
    title: string;
    avatar?: boolean;
    cols: string[];
    rows: any[][];
  };
}

export default function DynamicPageClient({
  page,
}: {
  page: DynamicPageContent;
}) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      anime({
        targets: '.anim-sub-kpi',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(80, { start: 100 }),
        duration: 600,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.anim-sub-panel',
        translateY: [25, 0],
        opacity: [0, 1],
        delay: anime.stagger(120, { start: 300 }),
        duration: 700,
        easing: 'easeOutCubic',
      });
    }

    let chartInstance: Chart | null = null;
    if (chartRef.current && page.cf) {
      chartInstance = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: page.cf.months,
          datasets: [
            {
              label: 'Penjualan (Juta Rp)',
              data: page.cf.penj,
              backgroundColor: '#16a34a',
              borderRadius: 4,
            },
            {
              label: 'Modal (Juta Rp)',
              data: page.cf.modal,
              backgroundColor: '#2563eb',
              borderRadius: 4,
            },
            {
              label: 'Pengeluaran (Juta Rp)',
              data: page.cf.peng,
              backgroundColor: '#f59e0b',
              borderRadius: 4,
            },
            {
              label: 'Laba (Juta Rp)',
              data: page.cf.laba,
              backgroundColor: '#7c3aed',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 11 },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
            },
            x: {
              grid: { display: false },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  }, [page]);

  const kpiIconBg = (colorKey: string) => {
    switch (colorKey) {
      case 'g':
        return 'bg-emerald-500 text-white';
      case 'o':
        return 'bg-amber-500 text-white';
      case 'a':
        return 'bg-blue-500 text-white';
      case 'd':
        return 'bg-teal-600 text-white';
      case 't':
        return 'bg-cyan-600 text-white';
      default:
        return 'bg-sri-sidebar text-white';
    }
  };

  const renderBadge = (item: any) => {
    if (Array.isArray(item)) {
      const [label, status] = item;
      const styles = {
        ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warn: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        bad: 'bg-red-50 text-red-700 border-red-200',
      }[status as 'ok' | 'warn' | 'info' | 'bad'] || 'bg-slate-100 text-slate-700';

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}
        >
          {label}
        </span>
      );
    }

    if (typeof item === 'string' && item.startsWith('r:')) {
      const rating = item.replace('r:', '');
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
          <i className="bi bi-star-fill text-amber-500" />
          {rating}
        </span>
      );
    }

    return <span>{String(item)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 flex-1 min-w-0 bg-white rounded-2xl shadow-2xs border border-slate-200/80 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-sri-green flex items-center justify-center text-lg">
              <i className={`bi bi-${page.icon}`} />
            </span>
            <h2 className="text-2xl font-bold text-slate-800">{page.title}</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">{page.desc}</p>
        </div>
      </div>
      </div>

      {/* KPIs */}
      {page.kpis && page.kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {page.kpis.map(([ic, col, label, val, sub], idx) => (
            <div
              key={idx}
              className="anim-sub-kpi opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-full ${kpiIconBg(col)} flex items-center justify-center text-xl shrink-0`}
              >
                <i className={`bi bi-${ic}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
                <div className="text-2xl font-bold text-slate-800 my-0.5">{val}</div>
                <div className="text-xs text-slate-500 truncate">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map if available */}
      {page.map && (
        <div className="anim-sub-panel opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Visualisasi Peta Satelit</h3>
          <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-slate-200">
            <MapView plots={page.plots || []} />
          </div>
        </div>
      )}

      {/* Bar Chart if Cashflow */}
      {page.cf && (
        <div className="anim-sub-panel opacity-0 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Grafik Cashflow Bulanan (Jan - Okt 2025)</h3>
          <div className="w-full h-[280px]">
            <canvas ref={chartRef} />
          </div>
        </div>
      )}

      {/* Data Table */}
      {page.table && (
        <div className="anim-sub-panel opacity-0 bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">{page.table.title}</h3>
            <span className="text-xs text-slate-500">{page.table.rows.length} data tersimpan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  {page.table.cols.map((col, cIdx) => (
                    <th key={cIdx} className="px-5 py-3.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors" data-row>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-5 py-3.5 whitespace-nowrap">
                        {page.table?.avatar && cIdx === 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-100 text-sri-sidebar font-bold flex items-center justify-center text-xs">
                              {String(cell).charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold text-slate-800">{String(cell)}</span>
                          </div>
                        ) : (
                          renderBadge(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
