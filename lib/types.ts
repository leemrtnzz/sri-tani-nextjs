import type { Coordinate } from './geo';

export interface Option {
  value: number | string;
  label: string;
  meta?: string;
}

export interface PenggarapRow {
  id: number;
  userId: number | null;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  luasLahanHa: number;
  fase: string;
  rating: number | null;
  status: string;
  catatan: string | null;
  username: string | null;
  email: string | null;
  jumlahPetak: number;
  totalLuasPetak: number;
  sisaPiutang: number;
}

export interface PetakRow {
  id: number;
  penggarapId: number;
  penggarapNama: string;
  fase: string;
  nama: string;
  color: string;
  coords: Coordinate[];
  luasHa: number;
  pusatLat: number | null;
  pusatLng: number | null;
  status: string;
  catatan: string | null;
}

export interface LotRow {
  id: number;
  kode: string;
  penggarapId: number | null;
  penggarapNama: string | null;
  kapasitasKg: number;
  gabahKg: number;
  kadarAir: number | null;
  status: string;
  catatan: string | null;
}

export interface BatchRow {
  id: number;
  kode: string;
  tanggal: string;
  jam: string | null;
  penggarapId: number | null;
  penggarapNama: string | null;
  lotId: number | null;
  lotKode: string | null;
  kapasitasKg: number;
  gabahKg: number;
  berasKg: number | null;
  rendemen: number | null;
  status: string;
  catatan: string | null;
}

export interface PanenRow {
  id: number;
  penggarapId: number;
  penggarapNama: string;
  tanggalPanen: string;
  musim: string | null;
  hasilTonPerHa: number;
  totalGabahKg: number | null;
  rating: number | null;
  catatan: string | null;
  kuartal: number;
  tahun: number;
}

export interface TokoRow {
  id: number;
  nama: string;
  alamat: string | null;
  telepon: string | null;
  jumlahPengiriman?: number;
}

export interface PengirimanRow {
  id: number;
  noKirim: string;
  tokoId: number;
  tokoNama: string;
  batchId: number | null;
  batchKode: string | null;
  gudang: string;
  berasKg: number;
  armada: string | null;
  tanggalKirim: string;
  tanggalDiterima: string | null;
  penerima: string | null;
  status: string;
  catatan: string | null;
}

export interface PiutangRow {
  id: number;
  penggarapId: number;
  penggarapNama: string;
  nilai: number;
  dibayar: number;
  sisa: number;
  jatuhTempo: string;
  tanggalBayar: string | null;
  status: string;
  keterangan: string | null;
  hariTerlambat: number;
}

export interface TransaksiRow {
  id: number;
  tanggal: string;
  keterangan: string;
  jenis: string;
  kategori: string;
  nominal: number;
  tokoId: number | null;
  tokoNama: string | null;
  batchId: number | null;
  batchKode: string | null;
  penggarapId: number | null;
  penggarapNama: string | null;
}

export interface CashflowSummary {
  modal: number;
  pengeluaran: number;
  penjualan: number;
  laba: number;
  marginLaba: number;
  persenModal: number;
  persenPengeluaran: number;
  persenLaba: number;
  jumlahTransaksi: number;
}

export interface MonthlyFinancePoint {
  bulan: number;
  label: string;
  penjualan: number;
  modal: number;
  pengeluaran: number;
  laba: number;
}

export interface HarvestRankRow {
  peringkat: number;
  penggarapId: number;
  penggarapNama: string;
  kuartal: number;
  tahun: number;
  jumlahPanen: number;
  totalGabahKg: number;
  rataHasilTonPerHa: number;
  ratingRata: number | null;
}

export interface DashboardQuickInfo {
  lotTersedia: number;
  lotTotal: number;
  batchHariIni: number;
  panenTertinggi: number;
  pengirimanAktif: number;
  piutangJatuhTempo: number;
}

export interface DashboardData {
  period: { bulan: number; tahun: number; label: string };
  kpis: {
    totalLahanHa: number;
    totalPenggarap: number;
    totalGabahKg: number;
    totalBerasKg: number;
    pendapatan: number;
  };
  cashflow: CashflowSummary;
  monthly: MonthlyFinancePoint[];
  plots: PetakRow[];
  quickInfo: DashboardQuickInfo;
  topHarvest: HarvestRankRow[];
  duePiutang: PiutangRow[];
  todayBatches: BatchRow[];
}
