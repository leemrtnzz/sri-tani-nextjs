'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatRupiah, formatRupiahShort } from '@/lib/format';
import type { CashflowSummary, MonthlyFinancePoint } from '@/lib/types';

const colors = {
  penjualan: '#22a95c',
  modal: '#2563eb',
  operasional: '#b48327',
  laba: '#0b4630',
};

function hasMonthlyData(data: MonthlyFinancePoint[]): boolean {
  return data.some(
    (point) => point.penjualan > 0 || point.modal > 0 || point.pengeluaran > 0,
  );
}

export function MonthlyFinanceChart({ data }: { data: MonthlyFinancePoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((point) => point.label),
        datasets: [
          {
            label: 'Penjualan',
            data: data.map((point) => point.penjualan),
            backgroundColor: colors.penjualan,
            borderRadius: 3,
          },
          {
            label: 'Modal',
            data: data.map((point) => point.modal),
            backgroundColor: colors.modal,
            borderRadius: 3,
          },
          {
            label: 'Operasional',
            data: data.map((point) => point.pengeluaran),
            backgroundColor: colors.operasional,
            borderRadius: 3,
          },
          {
            label: 'Laba',
            data: data.map((point) => point.laba),
            backgroundColor: colors.laba,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: { boxWidth: 12, boxHeight: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${formatRupiah(context.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#eef2f6' },
            ticks: {
              callback: (value) => formatRupiahShort(Number(value)),
              font: { size: 11 },
            },
          },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });

    return () => chart.destroy();
  }, [data]);

  if (!hasMonthlyData(data)) {
    return (
      <div className="h-[280px] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center px-4">
        <i className="bi bi-bar-chart text-2xl text-slate-500" />
        <p className="text-sm font-semibold text-slate-800 mt-2">
          Belum ada transaksi pada tahun ini
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Tambahkan pemasukan atau pengeluaran untuk melihat grafik.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function FinanceDonut({ summary }: { summary: CashflowSummary }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const values = [
    { label: 'Modal', value: summary.modal, color: colors.modal },
    { label: 'Operasional', value: summary.pengeluaran, color: colors.operasional },
    { label: 'Laba', value: Math.max(0, summary.laba), color: colors.penjualan },
  ].filter((item) => item.value > 0);

  useEffect(() => {
    if (!canvasRef.current || values.length === 0) return;

    const chart = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: values.map((item) => item.label),
        datasets: [
          {
            data: values.map((item) => item.value),
            backgroundColor: values.map((item) => item.color),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: '72%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.label}: ${formatRupiah(context.parsed)}`,
            },
          },
        },
      },
    });

    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  if (values.length === 0) {
    return (
      <div className="h-[180px] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center px-3">
        <i className="bi bi-pie-chart text-xl text-slate-500" />
        <p className="text-xs font-semibold text-slate-800 mt-1.5">
          Belum ada komposisi keuangan
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[180px] w-[180px] mx-auto">
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] text-slate-600">Margin laba</span>
        <strong className="text-xl font-bold text-slate-900">
          {summary.marginLaba}%
        </strong>
      </div>
    </div>
  );
}
