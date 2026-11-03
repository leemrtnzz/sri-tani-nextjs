import { label } from './format';

export const faseOptions = [
  'pembibitan',
  'vegetatif',
  'generatif',
  'campuran',
].map((value) => ({ value, label: label(value) }));

export const statusPenggarapOptions = [
  'aktif',
  'perlu_verifikasi',
  'nonaktif',
].map((value) => ({ value, label: label(value) }));

export const statusPetakOptions = ['terpetakan', 'belum_dipetakan'].map((value) => ({
  value,
  label: label(value),
}));

export const statusLotOptions = [
  'kosong',
  'dijemur',
  'hampir_kering',
  'siap_giling',
].map((value) => ({ value, label: label(value) }));

export const statusBatchOptions = [
  'menunggu',
  'terjadwal',
  'berjalan',
  'selesai',
].map((value) => ({ value, label: label(value) }));

export const statusPengirimanOptions = [
  'dimuat',
  'dalam_perjalanan',
  'diterima',
].map((value) => ({ value, label: label(value) }));

export const statusTagihanOptions = [
  'belum_jatuh_tempo',
  'segera_jatuh_tempo',
  'terlambat',
  'lunas',
].map((value) => ({ value, label: label(value) }));

export const jenisTransaksiOptions = ['pemasukan', 'pengeluaran'].map((value) => ({
  value,
  label: label(value),
}));

export const kategoriTransaksiOptions = [
  'modal',
  'operasional',
  'penjualan',
  'lain',
].map((value) => ({ value, label: label(value) }));
