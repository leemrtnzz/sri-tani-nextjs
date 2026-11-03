import type { ReactNode } from 'react';

type StatCardProps = {
  icon: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'green' | 'amber' | 'blue' | 'dark' | 'red';
};

const toneClass = {
  green: 'bg-sri-green',
  amber: 'bg-sri-gold',
  blue: 'bg-blue-600',
  dark: 'bg-sri-sidebar',
  red: 'bg-red-600',
} as const;

export default function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'green',
}: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
      <div
        className={`w-11 h-11 rounded-lg ${toneClass[tone]} text-white flex items-center justify-center text-lg shrink-0`}
      >
        <i className={`bi bi-${icon}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-600">{label}</div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 break-words">
          {value}
        </div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
    </div>
  );
}
