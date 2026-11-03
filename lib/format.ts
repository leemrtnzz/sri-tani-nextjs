import { MONTH_NAMES, parseDateString } from './period';

type Numeric = number | string | null | undefined;

export function toNumber(value: Numeric, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatNumber(value: Numeric, digits = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value));
}

export function formatRupiah(value: Numeric): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatRupiahShort(value: Numeric): string {
  const amount = toNumber(value);
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absolute >= 1_000_000_000) {
    return `${sign}Rp ${formatNumber(absolute / 1_000_000_000, 1)} M`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}Rp ${formatNumber(absolute / 1_000_000, 1)} jt`;
  }
  if (absolute >= 1_000) {
    return `${sign}Rp ${formatNumber(absolute / 1_000, 0)} rb`;
  }
  return `${sign}Rp ${formatNumber(absolute)}`;
}

export function formatKg(value: Numeric, digits = 0): string {
  return `${formatNumber(value, digits)} kg`;
}

export function formatHa(value: Numeric, digits = 2): string {
  return `${formatNumber(value, digits)} Ha`;
}

export function formatDateId(value: string | null | undefined): string {
  if (!value) return '-';
  const date = parseDateString(value);
  if (!date) return value;
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateCompact(value: string | null | undefined): string {
  if (!value) return '-';
  const date = parseDateString(value);
  if (!date) return value;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function formatMonthYear(bulan: number, tahun: number): string {
  return `${MONTH_NAMES[Math.min(12, Math.max(1, bulan)) - 1]} ${tahun}`;
}

export const STATUS_LABELS: Record<string, string> = {
  pembibitan: 'Pembibitan',
  vegetatif: 'Vegetatif',
  generatif: 'Generatif',
  campuran: 'Campuran',
  aktif: 'Aktif',
  perlu_verifikasi: 'Perlu verifikasi',
  nonaktif: 'Nonaktif',
  terpetakan: 'Terpetakan',
  belum_dipetakan: 'Belum dipetakan',
  kosong: 'Kosong',
  dijemur: 'Dijemur',
  hampir_kering: 'Hampir kering',
  siap_giling: 'Siap giling',
  menunggu: 'Menunggu',
  terjadwal: 'Terjadwal',
  berjalan: 'Berjalan',
  selesai: 'Selesai',
  dimuat: 'Dimuat',
  dalam_perjalanan: 'Dalam perjalanan',
  diterima: 'Diterima toko',
  belum_jatuh_tempo: 'Belum jatuh tempo',
  segera_jatuh_tempo: 'Segera jatuh tempo',
  terlambat: 'Terlambat',
  lunas: 'Lunas',
  pemasukan: 'Pemasukan',
  pengeluaran: 'Pengeluaran',
  modal: 'Modal',
  operasional: 'Operasional',
  penjualan: 'Penjualan',
  lain: 'Lainnya',
  master: 'Master',
  admin: 'Administrator',
  petugas: 'Petugas Lapangan',
  penggarap: 'Penggarap',
  user: 'User',
};

export function label(value: string | null | undefined): string {
  if (!value) return '-';
  return STATUS_LABELS[value] ?? value;
}

const toneClasses: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  bad: 'bg-red-50 text-red-800 border-red-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function statusTone(status: string | null | undefined): string {
  switch (status) {
    case 'aktif':
    case 'terpetakan':
    case 'selesai':
    case 'diterima':
    case 'lunas':
    case 'pemasukan':
    case 'penjualan':
      return 'ok';
    case 'perlu_verifikasi':
    case 'menunggu':
    case 'terjadwal':
    case 'segera_jatuh_tempo':
    case 'hampir_kering':
    case 'dijemur':
      return 'warn';
    case 'nonaktif':
    case 'terlambat':
      return 'bad';
    case 'berjalan':
    case 'dalam_perjalanan':
    case 'dimuat':
    case 'siap_giling':
    case 'pengeluaran':
    case 'modal':
    case 'operasional':
      return 'info';
    default:
      return 'neutral';
  }
}

export function statusBadgeClass(status: string | null | undefined): string {
  return toneClasses[statusTone(status)];
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
