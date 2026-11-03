'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type QuarterFilterProps = {
  basePath: string;
  tahun: number;
  kuartal: number;
};

const ROMAN = ['I', 'II', 'III', 'IV'];

export default function QuarterFilter({
  basePath,
  tahun,
  kuartal,
}: QuarterFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (nextTahun: number, nextKuartal: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tahun', String(nextTahun));
    params.set('kuartal', String(nextKuartal));
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="panen-tahun" className="block text-xs text-slate-600 mb-1">
          Tahun
        </label>
        <select
          id="panen-tahun"
          value={tahun}
          onChange={(event) => update(Number(event.target.value), kuartal)}
          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-xs text-slate-600 mb-1">Kuartal</span>
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          {ROMAN.map((roman, index) => {
            const value = index + 1;
            const active = value === kuartal;
            return (
              <button
                key={roman}
                type="button"
                aria-pressed={active}
                onClick={() => update(tahun, value)}
                className={`min-w-10 min-h-9 px-2.5 rounded-md text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-sri-sidebar text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {roman}
              </button>
            );
          })}
        </div>
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
