import {
  fasePlantValues,
  jenisTransaksiValues,
  kategoriTransaksiValues,
  statusBatchValues,
  statusLotValues,
  statusPenggarapValues,
  statusPengirimanValues,
  statusPetakValues,
  statusTagihanValues,
} from '@/db/schema';
import { polygonAreaHa, polygonCenter, type Coordinate } from './geo';
import {
  booleanValue,
  colorValue,
  coordinatesValue,
  dateValue,
  decimalString,
  enumValue,
  has,
  idValue,
  numberValue,
  optionalIdValue,
  text,
  ValidationError,
  type ValidationError as ValidationErrorType,
} from './validation';

type Body = Record<string, unknown>;
type Payload = Record<string, unknown>;

function put(target: Payload, key: string, value: unknown) {
  if (value !== undefined) target[key] = value;
}

export function penggarapPayload(body: Body, partial = false): Payload {
  const output: Payload = {};
  put(output, 'nama', text(body.nama, 'Nama penggarap', { required: !partial, min: 2, max: 120 }));
  put(output, 'telepon', text(body.telepon, 'Telepon', { max: 30 }));
  put(output, 'alamat', text(body.alamat, 'Alamat', { max: 500 }));
  put(
    output,
    'luasLahanHa',
    decimalString(body.luasLahanHa, 'Luas lahan', {
      required: false,
      min: 0,
      max: 100_000,
      scale: 2,
    }),
  );
  put(
    output,
    'fase',
    enumValue(body.fase, fasePlantValues, 'Fase tanam', {
      fallback: partial ? undefined : 'pembibitan',
    }),
  );
  put(
    output,
    'rating',
    decimalString(body.rating, 'Rating', { min: 0, max: 5, scale: 1 }),
  );
  put(
    output,
    'status',
    enumValue(body.status, statusPenggarapValues, 'Status penggarap', {
      fallback: partial ? undefined : 'aktif',
    }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));
  return output;
}

export function accountPayload(body: Body) {
  const username = text(body.username, 'Username akun', { min: 3, max: 60 });
  const email = text(body.email, 'Email akun', { max: 190 });
  const password = text(body.password, 'Kata sandi akun', { min: 6, max: 100 });
  const buatAkun = booleanValue(body.buatAkun, false);

  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new ValidationError('Username hanya boleh huruf, angka, dan garis bawah.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('Format email akun tidak valid.');
  }

  return {
    buatAkun: buatAkun || Boolean(username || email || password),
    username: username || undefined,
    email: email ? email.toLowerCase() : undefined,
    password: password || undefined,
  };
}

export function petakPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'penggarapId', has(body, 'penggarapId') || !partial ? idValue(body.penggarapId, 'Penggarap') : undefined);
  put(output, 'nama', text(body.nama, 'Nama petak', { required: !partial, min: 2, max: 120 }));
  put(output, 'color', has(body, 'color') ? colorValue(body.color) : undefined);
  put(
    output,
    'status',
    enumValue(body.status, statusPetakValues, 'Status petak', {
      fallback: partial ? undefined : 'terpetakan',
    }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));

  const coords = coordinatesValue(body.coords, 'Batas lahan', !partial);
  if (coords) {
    const center = polygonCenter(coords);
    output.coords = coords satisfies Coordinate[];
    output.luasHa = polygonAreaHa(coords).toFixed(2);
    output.pusatLat = center[0].toFixed(6);
    output.pusatLng = center[1].toFixed(6);
  }

  return output;
}

export function lotPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'kode', text(body.kode, 'Kode lot', { max: 30 }));
  put(output, 'penggarapId', optionalIdValue(body.penggarapId, 'Penggarap'));
  put(
    output,
    'kapasitasKg',
    numberValue(body.kapasitasKg, 'Kapasitas lot', {
      required: !partial,
      min: 1,
      max: 1_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'gabahKg',
    numberValue(body.gabahKg, 'Gabah di lot', {
      required: !partial,
      min: 0,
      max: 1_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'kadarAir',
    decimalString(body.kadarAir, 'Kadar air', { min: 0, max: 100, scale: 1 }),
  );
  put(
    output,
    'status',
    enumValue(body.status, statusLotValues, 'Status lot', {
      fallback: partial ? undefined : 'kosong',
    }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));
  return output;
}

export function batchPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'kode', text(body.kode, 'Kode batch', { max: 30 }));
  put(output, 'tanggal', dateValue(body.tanggal, 'Tanggal giling', !partial));
  put(output, 'jam', text(body.jam, 'Jam mulai', { max: 5 }));
  put(output, 'penggarapId', optionalIdValue(body.penggarapId, 'Penggarap'));
  put(output, 'lotId', optionalIdValue(body.lotId, 'Lot pengeringan'));
  put(
    output,
    'kapasitasKg',
    numberValue(body.kapasitasKg, 'Kapasitas giling', {
      required: !partial,
      min: 1,
      max: 1_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'gabahKg',
    numberValue(body.gabahKg, 'Gabah masuk', {
      required: !partial,
      min: 1,
      max: 1_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'berasKg',
    numberValue(body.berasKg, 'Beras hasil', { min: 0, max: 1_000_000, integer: true }),
  );
  put(
    output,
    'status',
    enumValue(body.status, statusBatchValues, 'Status batch', {
      fallback: partial ? undefined : 'terjadwal',
    }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));
  return output;
}

export function panenPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'penggarapId', has(body, 'penggarapId') || !partial ? idValue(body.penggarapId, 'Penggarap') : undefined);
  put(output, 'tanggalPanen', dateValue(body.tanggalPanen, 'Tanggal panen', !partial));
  put(output, 'musim', text(body.musim, 'Musim', { max: 40 }));
  put(
    output,
    'hasilTonPerHa',
    decimalString(body.hasilTonPerHa, 'Hasil ton per hektar', {
      required: !partial,
      min: 0,
      max: 100,
      scale: 2,
    }),
  );
  put(
    output,
    'totalGabahKg',
    numberValue(body.totalGabahKg, 'Total gabah', {
      min: 0,
      max: 10_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'rating',
    decimalString(body.rating, 'Rating', { min: 0, max: 5, scale: 1 }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));
  return output;
}

export function tokoPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'nama', text(body.nama, 'Nama toko', { required: !partial, min: 2, max: 150 }));
  put(output, 'alamat', text(body.alamat, 'Alamat', { max: 500 }));
  put(output, 'telepon', text(body.telepon, 'Telepon', { max: 30 }));
  return output;
}

export function pengirimanPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'noKirim', text(body.noKirim, 'Nomor kirim', { max: 30 }));
  put(output, 'tokoId', has(body, 'tokoId') || !partial ? idValue(body.tokoId, 'Toko') : undefined);
  put(output, 'batchId', optionalIdValue(body.batchId, 'Batch giling'));
  put(output, 'gudang', text(body.gudang, 'Gudang', { max: 120 }));
  put(
    output,
    'berasKg',
    numberValue(body.berasKg, 'Beras dikirim', {
      required: !partial,
      min: 1,
      max: 1_000_000,
      integer: true,
    }),
  );
  put(output, 'armada', text(body.armada, 'Armada', { max: 50 }));
  put(output, 'tanggalKirim', dateValue(body.tanggalKirim, 'Tanggal kirim', !partial));
  put(output, 'tanggalDiterima', dateValue(body.tanggalDiterima, 'Tanggal diterima'));
  put(output, 'penerima', text(body.penerima, 'Penerima', { max: 120 }));
  put(
    output,
    'status',
    enumValue(body.status, statusPengirimanValues, 'Status pengiriman', {
      fallback: partial ? undefined : 'dimuat',
    }),
  );
  put(output, 'catatan', text(body.catatan, 'Catatan', { max: 500 }));
  return output;
}

export function piutangPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'penggarapId', has(body, 'penggarapId') || !partial ? idValue(body.penggarapId, 'Penggarap') : undefined);
  put(
    output,
    'nilai',
    numberValue(body.nilai, 'Nilai piutang', {
      required: !partial,
      min: 1,
      max: 9_000_000_000_000,
      integer: true,
    }),
  );
  put(
    output,
    'dibayar',
    numberValue(body.dibayar, 'Nilai dibayar', {
      min: 0,
      max: 9_000_000_000_000,
      integer: true,
    }),
  );
  put(output, 'jatuhTempo', dateValue(body.jatuhTempo, 'Jatuh tempo', !partial));
  put(output, 'tanggalBayar', dateValue(body.tanggalBayar, 'Tanggal bayar'));
  put(
    output,
    'status',
    enumValue(body.status, statusTagihanValues, 'Status piutang'),
  );
  put(output, 'keterangan', text(body.keterangan, 'Keterangan', { max: 255 }));
  return output;
}

export function transaksiPayload(body: Body, partial = false) {
  const output: Payload = {};
  put(output, 'tanggal', dateValue(body.tanggal, 'Tanggal transaksi', !partial));
  put(
    output,
    'keterangan',
    text(body.keterangan, 'Keterangan', { required: !partial, min: 2, max: 255 }),
  );
  put(
    output,
    'jenis',
    enumValue(body.jenis, jenisTransaksiValues, 'Jenis transaksi', {
      fallback: partial ? undefined : 'pengeluaran',
    }),
  );
  put(
    output,
    'kategori',
    enumValue(body.kategori, kategoriTransaksiValues, 'Kategori transaksi', {
      fallback: partial ? undefined : 'lain',
    }),
  );
  put(
    output,
    'nominal',
    numberValue(body.nominal, 'Nominal', {
      required: !partial,
      min: 1,
      max: 9_000_000_000_000,
      integer: true,
    }),
  );
  put(output, 'tokoId', optionalIdValue(body.tokoId, 'Toko'));
  put(output, 'batchId', optionalIdValue(body.batchId, 'Batch giling'));
  put(output, 'penggarapId', optionalIdValue(body.penggarapId, 'Penggarap'));
  return output;
}

export type ParsedPayload = Record<string, unknown>;
export type { ValidationErrorType };
