export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const MONTH_SHORT = [
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
] as const;

export type Period = {
  bulan: number;
  tahun: number;
  label: string;
  key: string;
  start: string;
  end: string;
};

type ParamValue = string | string[] | undefined;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function firstValue(value: ParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toDateString(new Date());
}

export function parseDateString(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return next;
}

export function monthRange(tahun: number, bulan: number) {
  const first = new Date(tahun, bulan - 1, 1);
  const last = new Date(tahun, bulan, 0);
  return { start: toDateString(first), end: toDateString(last) };
}

export function yearRange(tahun: number) {
  return {
    start: toDateString(new Date(tahun, 0, 1)),
    end: toDateString(new Date(tahun, 11, 31)),
  };
}

export function currentPeriod(): Period {
  const now = new Date();
  return makePeriod(now.getFullYear(), now.getMonth() + 1);
}

export function makePeriod(tahun: number, bulan: number): Period {
  const safeMonth = Math.min(12, Math.max(1, Math.trunc(bulan) || 1));
  const safeYear = Math.min(2100, Math.max(2000, Math.trunc(tahun) || new Date().getFullYear()));
  const { start, end } = monthRange(safeYear, safeMonth);
  return {
    bulan: safeMonth,
    tahun: safeYear,
    label: `${MONTH_NAMES[safeMonth - 1]} ${safeYear}`,
    key: `${safeYear}-${pad(safeMonth)}`,
    start,
    end,
  };
}

export function parsePeriod(bulanParam?: ParamValue, tahunParam?: ParamValue): Period {
  const now = new Date();
  const bulan = Number(firstValue(bulanParam));
  const tahun = Number(firstValue(tahunParam));
  return makePeriod(
    Number.isFinite(tahun) && tahun > 0 ? tahun : now.getFullYear(),
    Number.isFinite(bulan) && bulan > 0 ? bulan : now.getMonth() + 1,
  );
}

export function parseYear(value?: ParamValue): number {
  const tahun = Number(firstValue(value));
  return Number.isFinite(tahun) && tahun >= 2000 && tahun <= 2100
    ? Math.trunc(tahun)
    : new Date().getFullYear();
}

export function parseQuarter(value?: ParamValue): number {
  const kuartal = Number(firstValue(value));
  return kuartal >= 1 && kuartal <= 4 ? Math.trunc(kuartal) : currentQuarter();
}

export function currentQuarter(): number {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

export function quarterOfDate(dateString: string): number {
  const date = parseDateString(dateString);
  if (!date) return currentQuarter();
  return Math.floor(date.getMonth() / 3) + 1;
}

export function quarterStartMonth(kuartal: number): number {
  return (Math.min(4, Math.max(1, kuartal)) - 1) * 3 + 1;
}

export function quarterRange(tahun: number, kuartal: number) {
  const startMonth = quarterStartMonth(kuartal);
  const start = new Date(tahun, startMonth - 1, 1);
  const end = new Date(tahun, startMonth + 2, 0);
  return { start: toDateString(start), end: toDateString(end) };
}

export function quarterLabel(tahun: number, kuartal: number): string {
  return `Kuartal ${['I', 'II', 'III', 'IV'][kuartal - 1]} ${tahun}`;
}

export function quarterYearOptions(span = 3): number[] {
  const year = new Date().getFullYear();
  return Array.from({ length: span }, (_, index) => year - index);
}

export function monthOptions() {
  return MONTH_NAMES.map((label, index) => ({ value: index + 1, label }));
}

export function isDateInRange(dateString: string, start: string, end: string): boolean {
  return dateString >= start && dateString <= end;
}

export function daysBetween(start: string, end: string): number {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  if (!startDate || !endDate) return 0;
  const startUtc = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function nextWeekRange(base = new Date()) {
  const day = base.getDay();
  const daysUntilNextMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const monday = addDays(base, daysUntilNextMonday);
  const sunday = addDays(monday, 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
}

export function relativeSchedule(
  dateString: string,
  baseDate = new Date(),
): 'hari-ini' | 'besok' | 'minggu-depan' | 'lainnya' {
  const today = toDateString(baseDate);
  const tomorrow = toDateString(addDays(baseDate, 1));
  const nextWeek = nextWeekRange(baseDate);

  if (dateString === today) return 'hari-ini';
  if (dateString === tomorrow) return 'besok';
  if (dateString >= nextWeek.start && dateString <= nextWeek.end) return 'minggu-depan';
  return 'lainnya';
}

export function relativeLabel(value: ReturnType<typeof relativeSchedule>): string {
  switch (value) {
    case 'hari-ini':
      return 'Hari ini';
    case 'besok':
      return 'Besok';
    case 'minggu-depan':
      return 'Minggu depan';
    default:
      return 'Lainnya';
  }
}
