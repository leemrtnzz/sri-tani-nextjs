import { daysBetween, todayISO } from './period';

export function resolvePiutangStatus(
  nilai: number,
  dibayar: number,
  jatuhTempo: string,
): 'lunas' | 'terlambat' | 'segera_jatuh_tempo' | 'belum_jatuh_tempo' {
  if (dibayar >= nilai) return 'lunas';
  const today = todayISO();
  if (jatuhTempo < today) return 'terlambat';
  if (daysBetween(today, jatuhTempo) <= 7) return 'segera_jatuh_tempo';
  return 'belum_jatuh_tempo';
}
