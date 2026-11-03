'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { MONTH_NAMES } from '@/lib/period';

type PeriodFilterProps = {
  basePath: string;
  bulan: number;
  tahun: number;
  label?: string;
};

export default function PeriodFilter({
  basePath,
  bulan,
  tahun,
  label = 'Periode',
}: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (nextBulan: number, nextTahun: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bulan', String(nextBulan));
    params.set('tahun', String(nextTahun));
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 4 + index);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="filter-bulan" className="block text-xs text-slate-600 mb-1">
          {label}
        </label>
        <select
          id="filter-bulan"
          value={bulan}
          onChange={(event) => update(Number(event.target.value), tahun)}
          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-tahun" className="block text-xs text-slate-600 mb-1">
          Tahun
        </label>
        <select
          id="filter-tahun"
          value={tahun}
          onChange={(event) => update(bulan, Number(event.target.value))}
          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {pending && (
        <span className="text-xs text-slate-500 inline-flex items-center gap-1.5 pb-2.5">
          <i className="bi bi-arrow-repeat animate-spin" />
          Memuat
        </span>
      )}
    </div>
  );
}
