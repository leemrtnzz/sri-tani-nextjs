# SRI TANI

Sistem informasi manajemen agribisnis untuk pengelolaan lahan sawah, pengeringan gabah, penggilingan, distribusi beras, keuangan, dan piutang penggarap.

Aplikasi ini memakai Next.js 16, MySQL, Drizzle ORM, NextAuth, Chart.js, dan Leaflet. Dashboard menyajikan data per bulan dan tahun, sedangkan penilaian panen diagregasi per kuartal.

## 1. Aktor dan Hak Akses

| Aktor | Peran | Hak akses bawaan |
| --- | --- | --- |
| Master | Pemilik sistem | Akses penuh ke semua modul dan halaman Hak Akses untuk mengatur izin role lain |
| Admin | Administrator operasional | Melihat, menambah, mengubah, dan menghapus data operasional dan keuangan, tanpa halaman Hak Akses |
| Petugas Lapangan | Petugas operasional | Melihat semua modul, menambah dan mengubah data operasional dan keuangan, tanpa hapus |
| Penggarap | Akun mitra penggarap | Hanya melihat dashboard secara bawaan, modul lain dapat dibuka melalui izin Master |
| Sistem | Proses otomatis | Menghitung luas poligon, rendemen, status piutang, ringkasan cashflow, jadwal relatif, dan peringkat panen |

Hak akses disimpan per role dan per modul dalam tabel `role_permissions` dengan empat aksi: `view`, `create`, `update`, dan `delete`. Master dapat mengubah matriks ini melalui menu **Hak Akses**. Role Master selalu memiliki akses penuh dan tidak dapat dikurangi.

Registrasi mandiri selalu membuat akun dengan role `penggarap`. Akun `master`, `admin`, dan `petugas` dibuat oleh pengelola sistem atau melalui seeder.

## 2. Konsep Data Utama

| Entitas | Fungsi |
| --- | --- |
| `users` | Akun login, peran, dan identitas pengguna |
| `penggarap` | Data penggarap, luas lahan, fase tanam, status, dan akun petugas terkait |
| `petak_lahan` | Batas lahan berbentuk poligon, warna peta, luas otomatis, dan status petak |
| `lot_jemur` | Lot pengeringan gabah, kapasitas, isi, kadar air, dan status |
| `batch_giling` | Jadwal dan proses penggilingan gabah, gabah masuk, beras keluar, dan rendemen |
| `panen` | Catatan panen, hasil ton per hektar, total gabah, rating, dan musim |
| `toko` | Toko tujuan pengiriman beras |
| `pengiriman` | Pengiriman beras dari gudang ke toko, armada, penerima, dan status |
| `piutang` | Kewajiban usaha kepada penggarap, nilai dibayar, jatuh tempo, dan status |
| `transaksi` | Pemasukan dan pengeluaran untuk modal, operasional, penjualan, dan lainnya |
| `kandang`, `ternak` | Data pendukung peternakan yang tampil pada ringkasan publik |

## 3. Proses Bisnis End-to-End

1. Admin atau petugas mendaftarkan penggarap.
2. Sistem dapat membuatkan akun petugas untuk penggarap dengan username, email, dan kata sandi.
3. Petugas memetakan petak lahan pada peta dengan menggambar poligon minimal tiga titik.
4. Sistem menghitung luas petak dari koordinat, lalu menyinkronkan total luas ke data penggarap.
5. Petugas mencatat panen: tanggal, hasil ton per hektar, total gabah, dan rating.
6. Gabah ditempatkan pada lot pengeringan. Kapasitas dan isi lot dipantau.
7. Gabah yang siap digiling dijadwalkan sebagai batch penggilingan.
8. Jadwal penggilingan dikelompokkan menjadi hari ini, besok, minggu depan, dan jadwal lain.
9. Setelah penggilingan, petugas mencatat beras hasil dan sistem menghitung rendemen.
10. Beras dikirim dari gudang ke toko. Status pengiriman bergerak dari dimuat, dalam perjalanan, sampai diterima toko.
11. Penjualan, modal, dan biaya operasional dicatat sebagai transaksi.
12. Dashboard menghitung laba atau rugi, margin, persentase modal, dan persentase pengeluaran.
13. Kewajiban usaha kepada penggarap dicatat sebagai piutang penggarap.
14. Status piutang dihitung otomatis dari nilai dibayar dan tanggal jatuh tempo.
15. Peringkat panen dihitung per kuartal dari rata-rata hasil ton per hektar.

## 4. Aturan Bisnis

### 4.1 Periode

- Periode utama dashboard adalah bulan dan tahun.
- Filter periode memengaruhi transaksi, pengiriman, panen, dan piutang yang ditampilkan.
- Data lahan, lot, dan penggarap merupakan data induk yang tidak difilter per bulan.
- Peringkat panen memakai kuartal, bukan bulan.

### 4.2 Pemetaan Lahan

- Petak disimpan sebagai daftar koordinat `[lat, lng]`.
- Minimal tiga titik untuk membentuk poligon.
- Luas dihitung dengan proyeksi lokal dan rumus shoelace, lalu dikonversi ke hektar.
- Saat petak ditambah, diubah, atau dihapus, total luas penggarap dihitung ulang.

### 4.3 Lot Pengeringan

- Setiap lot memiliki kapasitas dalam kilogram.
- Isi lot tidak boleh melebihi kapasitas.
- Status lot: `kosong`, `dijemur`, `hampir_kering`, `siap_giling`.
- Utilisasi kapasitas ditampilkan pada halaman pengeringan.

### 4.4 Batch Penggilingan

- Setiap batch memiliki tanggal, jam, kapasitas, gabah masuk, dan status.
- Gabah masuk tidak boleh melebihi kapasitas giling.
- Rendemen dihitung otomatis: `beras_kg / gabah_kg * 100`.
- Status batch: `menunggu`, `terjadwal`, `berjalan`, `selesai`.
- Kelompok jadwal:
  - Hari ini: tanggal sama dengan tanggal server.
  - Besok: satu hari setelah tanggal server.
  - Minggu depan: Senin sampai Minggu pada minggu kalender berikutnya.
  - Jadwal lain: di luar tiga kelompok tersebut.

### 4.5 Pengiriman Beras

- Pengiriman mencatat gudang asal, toko tujuan, armada, beras yang dikirim, dan penerima.
- Alur status: `dimuat` -> `dalam_perjalanan` -> `diterima`.
- Saat status diubah menjadi `diterima`, sistem mengisi tanggal diterima bila belum ada.
- Tombol cepat Terima mencatat penerimaan pada tanggal hari ini.

### 4.6 Cashflow

- Transaksi memiliki jenis `pemasukan` atau `pengeluaran`.
- Kategori transaksi: `modal`, `operasional`, `penjualan`, `lain`.
- Pemasukan hanya boleh memakai kategori `penjualan` atau `lain`.
- Pengeluaran hanya boleh memakai kategori `modal`, `operasional`, atau `lain`.
- Rumus ringkasan:
  - Modal = total pengeluaran kategori `modal`.
  - Pengeluaran = total pengeluaran selain kategori `modal`.
  - Penjualan = total pemasukan.
  - Laba = penjualan - modal - pengeluaran.
  - Margin laba = laba / penjualan * 100.
  - Persentase modal = modal / penjualan * 100.
  - Persentase pengeluaran = pengeluaran / penjualan * 100.

### 4.7 Piutang Penggarap

- Piutang ini adalah kewajiban usaha kepada penggarap, misalnya bagi hasil panen yang belum dibayar.
- Status dihitung otomatis:
  - `lunas` jika nilai dibayar lebih besar atau sama dengan nilai piutang.
  - `terlambat` jika tanggal hari ini melewati jatuh tempo.
  - `segera_jatuh_tempo` jika jatuh tempo dalam tujuh hari ke depan.
  - `belum_jatuh_tempo` untuk kondisi lainnya.
- Jika status diubah menjadi `lunas`, sistem mengisi nilai dibayar sebesar nilai piutang dan tanggal bayar hari ini bila belum ada.

### 4.8 Rating Panen

- Rating dan hasil panen diagregasi per penggarap dalam satu kuartal.
- Rata-rata hasil dihitung dari seluruh catatan panen pada kuartal tersebut.
- Peringkat diurutkan dari rata-rata hasil ton per hektar tertinggi.
- Rating rata-rata hanya dihitung dari catatan yang memiliki nilai rating.

### 4.9 Role dan Izin Aksi

- Setiap request API diperiksa terhadap izin role dan resource.
- Halaman dashboard juga diperiksa pada server. Role tanpa izin `view` melihat halaman Akses dibatasi.
- Navigasi sidebar hanya menampilkan modul yang boleh dilihat role tersebut.
- Tombol tambah, ubah, dan hapus pada tabel mengikuti izin role.
- Master selalu memiliki akses penuh.
- Admin bawaan memiliki semua aksi pada semua modul operasional dan keuangan.
- Petugas bawaan memiliki aksi lihat, tambah, dan ubah, tanpa hapus.
- Penggarap bawaan hanya memiliki aksi lihat dashboard.
- Master dapat mengubah izin Admin, Petugas, dan Penggarap melalui `/dashboard/akses`.
- Perubahan izin berlaku pada request berikutnya. Pengguna cukup memuat ulang halaman.

## 5. Diagram UML

### 5.1 Use Case Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Master
actor Admin
actor "Petugas Lapangan" as Petugas
actor Penggarap
actor Sistem

rectangle "SRI TANI" {
  usecase "Kelola penggarap dan akun" as UC1
  usecase "Petakan lahan sawah" as UC2
  usecase "Catat panen dan rating" as UC3
  usecase "Kelola lot pengeringan" as UC4
  usecase "Jadwalkan penggilingan" as UC5
  usecase "Kelola pengiriman beras" as UC6
  usecase "Kelola transaksi cashflow" as UC7
  usecase "Kelola piutang penggarap" as UC8
  usecase "Lihat dashboard periode" as UC9
  usecase "Lihat peringkat kuartal" as UC10
  usecase "Hitung luas poligon" as UC11
  usecase "Hitung rendemen" as UC12
  usecase "Hitung status piutang" as UC13
  usecase "Atur hak akses role" as UC14
}

Master --> UC1
Master --> UC2
Master --> UC3
Master --> UC4
Master --> UC5
Master --> UC6
Master --> UC7
Master --> UC8
Master --> UC9
Master --> UC10
Master --> UC14

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9
Admin --> UC10

Petugas --> UC1
Petugas --> UC2
Petugas --> UC3
Petugas --> UC4
Petugas --> UC5
Petugas --> UC6
Petugas --> UC7
Petugas --> UC8
Petugas --> UC9
Petugas --> UC10

Penggarap --> UC9
Penggarap --> UC10

UC2 ..> UC11 : <<include>>
UC5 ..> UC12 : <<include>>
UC8 ..> UC13 : <<include>>
UC11 --> Sistem
UC12 --> Sistem
UC13 --> Sistem
@enduml
```

### 5.2 Activity Diagram Proses Operasional

```plantuml
@startuml
start
:Pendataan penggarap dan akun petugas;
:Pemetaan petak lahan dengan poligon;
:Sistem menghitung luas dan menyinkronkan total luas penggarap;
:Petugas mencatat data panen;
:Gabah ditempatkan pada lot pengeringan;
if (Gabah siap digiling?) then (ya)
  :Petugas membuat batch penggilingan;
  :Sistem memvalidasi kapasitas;
  :Penggilingan dijalankan;
  :Petugas mencatat beras hasil;
  :Sistem menghitung rendemen;
  :Beras dikirim dari gudang ke toko;
  if (Diterima toko?) then (ya)
    :Status diterima dan tanggal penerimaan dicatat;
  else (belum)
    :Status dimuat atau dalam perjalanan;
  endif
else (belum)
  :Lot tetap dijemur atau menunggu;
endif
:Petugas mencatat penjualan dan biaya;
:Sistem menghitung laba, margin, dan persentase;
:Petugas mencatat piutang kepada penggarap;
:Sistem menghitung status piutang;
:Dashboard dan laporan diperbarui;
stop
@enduml
```

### 5.3 Entity Relationship Diagram

```plantuml
@startuml
hide circle
skinparam linetype ortho

entity "users" as users {
  *id : int
  --
  nama : varchar
  email : varchar
  username : varchar
  password : varchar
  role : enum
}

entity "role_permissions" as role_permissions {
  *id : int
  --
  role : enum
  resource : varchar
  can_view : boolean
  can_create : boolean
  can_update : boolean
  can_delete : boolean
}

entity "penggarap" as penggarap {
  *id : int
  --
  user_id : int
  nama : varchar
  telepon : varchar
  alamat : text
  luas_lahan_ha : decimal
  fase : enum
  rating : decimal
  status : enum
  catatan : text
}

entity "petak_lahan" as petak {
  *id : int
  --
  penggarap_id : int
  nama : varchar
  color : varchar
  coords : json
  luas_ha : decimal
  pusat_lat : decimal
  pusat_lng : decimal
  status : enum
  catatan : text
}

entity "lot_jemur" as lot {
  *id : int
  --
  kode : varchar
  penggarap_id : int
  kapasitas_kg : int
  gabah_kg : int
  kadar_air : decimal
  status : enum
  catatan : text
}

entity "batch_giling" as batch {
  *id : int
  --
  kode : varchar
  tanggal : date
  jam : varchar
  penggarap_id : int
  lot_id : int
  kapasitas_kg : int
  gabah_kg : int
  beras_kg : int
  rendemen : decimal
  status : enum
  catatan : text
}

entity "panen" as panen {
  *id : int
  --
  penggarap_id : int
  tanggal_panen : date
  musim : varchar
  hasil_ton_per_ha : decimal
  total_gabah_kg : int
  rating : decimal
  catatan : text
}

entity "toko" as toko {
  *id : int
  --
  nama : varchar
  alamat : text
  telepon : varchar
}

entity "pengiriman" as kirim {
  *id : int
  --
  no_kirim : varchar
  toko_id : int
  batch_id : int
  gudang : varchar
  beras_kg : int
  armada : varchar
  tanggal_kirim : date
  tanggal_diterima : date
  penerima : varchar
  status : enum
  catatan : text
}

entity "piutang" as piutang {
  *id : int
  --
  penggarap_id : int
  nilai : bigint
  dibayar : bigint
  jatuh_tempo : date
  tanggal_bayar : date
  status : enum
  keterangan : varchar
}

entity "transaksi" as transaksi {
  *id : int
  --
  tanggal : date
  keterangan : varchar
  jenis : enum
  kategori : enum
  nominal : bigint
  toko_id : int
  batch_id : int
  penggarap_id : int
}

users ||--o| penggarap : memiliki akun
penggarap ||--o{ petak : memiliki petak
penggarap ||--o{ lot : memakai lot
penggarap ||--o{ batch : terlibat batch
lot ||--o{ batch : menjadi sumber
penggarap ||--o{ panen : menghasilkan panen
toko ||--o{ kirim : menjadi tujuan
batch ||--o{ kirim : menghasilkan beras
penggarap ||--o{ piutang : menerima pembayaran
toko ||--o{ transaksi : terkait penjualan
batch ||--o{ transaksi : terkait biaya
penggarap ||--o{ transaksi : terkait biaya
@enduml
```

### 5.4 Sequence Diagram Penggilingan dan Pengiriman

```plantuml
@startuml
actor Petugas
participant "Dashboard" as UI
participant "Route Handler" as API
database "MySQL" as DB

Petugas -> UI : Buat batch giling
UI -> API : POST /api/batch-giling
API -> API : Validasi kapasitas
API -> API : Hitung rendemen bila beras diisi
API -> DB : Simpan batch
DB --> API : Data batch
API --> UI : 201 Created
UI --> Petugas : Batch tampil pada jadwal

Petugas -> UI : Tandai pengiriman diterima
UI -> API : PATCH /api/pengiriman/:id
API -> API : Isi tanggal diterima bila kosong
API -> DB : Ubah status dan tanggal diterima
DB --> API : Data pengiriman
API --> UI : 200 OK
UI --> Petugas : Status berubah menjadi diterima

Petugas -> UI : Catat penjualan
UI -> API : POST /api/transaksi
API -> API : Validasi jenis dan kategori
API -> DB : Simpan transaksi
DB --> API : Data transaksi
API --> UI : 201 Created
UI --> Petugas : Ringkasan cashflow diperbarui
@enduml
```

### 5.5 State Diagram Batch Penggilingan

```plantuml
@startuml
[*] --> menunggu
menunggu --> terjadwal : tanggal disetujui
terjadwal --> berjalan : proses dimulai
berjalan --> selesai : beras dicatat
terjadwal --> menunggu : jadwal ditunda
menunggu --> [*]
terjadwal --> [*]
berjalan --> [*]
selesai --> [*]
@enduml
```

### 5.6 State Diagram Pengiriman

```plantuml
@startuml
[*] --> dimuat
dimuat --> dalam_perjalanan : armada berangkat
dalam_perjalanan --> diterima : toko menerima
diterima --> [*]
@enduml
```

### 5.7 State Diagram Piutang Penggarap

```plantuml
@startuml
[*] --> belum_jatuh_tempo
belum_jatuh_tempo --> segera_jatuh_tempo : sisa 7 hari
belum_jatuh_tempo --> terlambat : melewati jatuh tempo
segera_jatuh_tempo --> terlambat : melewati jatuh tempo
belum_jatuh_tempo --> lunas : dibayar penuh
segera_jatuh_tempo --> lunas : dibayar penuh
terlambat --> lunas : dibayar penuh
lunas --> [*]
@enduml
```

### 5.8 Diagram Arsitektur Komponen

```plantuml
@startuml
package "Browser" {
  [Dashboard UI]
  [Leaflet Map]
}

package "Next.js Server" {
  [React Server Component]
  [Route Handler API]
  [Query Layer]
}

database "MySQL" as DB

[Dashboard UI] --> [Route Handler API] : fetch JSON
[Dashboard UI] --> [Leaflet Map] : gambar poligon
[React Server Component] --> [Query Layer] : baca data
[Route Handler API] --> [Query Layer] : baca dan tulis
[Query Layer] --> DB : Drizzle ORM
@enduml
```

## 6. API CRUD

| Endpoint | Metode | Fungsi |
| --- | --- | --- |
| `/api/penggarap` | GET, POST | Daftar dan tambah penggarap, termasuk pembuatan akun petugas |
| `/api/penggarap/:id` | PATCH, DELETE | Ubah dan hapus penggarap |
| `/api/petak-lahan` | GET, POST | Daftar dan tambah petak lahan |
| `/api/petak-lahan/:id` | PATCH, DELETE | Ubah dan hapus petak lahan |
| `/api/lot-jemur` | GET, POST | Daftar dan tambah lot pengeringan |
| `/api/lot-jemur/:id` | PATCH, DELETE | Ubah dan hapus lot |
| `/api/batch-giling` | GET, POST | Daftar dan tambah batch penggilingan |
| `/api/batch-giling/:id` | PATCH, DELETE | Ubah dan hapus batch |
| `/api/panen` | GET, POST | Daftar dan tambah panen |
| `/api/panen/:id` | PATCH, DELETE | Ubah dan hapus panen |
| `/api/toko` | GET, POST | Daftar dan tambah toko |
| `/api/toko/:id` | PATCH, DELETE | Ubah dan hapus toko |
| `/api/pengiriman` | GET, POST | Daftar dan tambah pengiriman |
| `/api/pengiriman/:id` | PATCH, DELETE | Ubah dan hapus pengiriman |
| `/api/piutang` | GET, POST | Daftar dan tambah piutang penggarap |
| `/api/piutang/:id` | PATCH, DELETE | Ubah dan hapus piutang |
| `/api/transaksi` | GET, POST | Daftar dan tambah transaksi cashflow |
| `/api/transaksi/:id` | PATCH, DELETE | Ubah dan hapus transaksi |
| `/api/role-permissions` | GET, PUT | Baca dan ubah matriks izin role, khusus Master |
| `/api/akun` | GET, PATCH | Baca dan ubah pengaturan akun yang sedang masuk |
| `/api/public/summary` | GET | Ringkasan publik untuk halaman beranda |

Semua endpoint CRUD memerlukan sesi login. Setiap aksi diperiksa terhadap izin role dan resource. Role tanpa izin menerima respons 403.

## 7. Struktur Folder

```text
app/
  api/                  Route Handler REST API
  dashboard/            Halaman dashboard per modul
  (auth)/               Halaman login dan register
components/
  dashboard/            Komponen halaman dashboard
  ui/                   Modal, tabel CRUD, kartu statistik
db/
  schema.ts             Definisi tabel dan relasi Drizzle
lib/
  queries/              Query baca untuk server component
  api.ts                Helper autentikasi, guard izin, dan error API
  access.ts             Pemeriksaan akses halaman berbasis role
  permission-meta.ts    Resource, role, label, dan izin bawaan
  permissions.ts        Query izin role dari database
  payloads.ts           Validasi payload per entitas
  period.ts             Periode, kuartal, dan jadwal relatif
  geo.ts                Perhitungan luas poligon
scripts/
  seed.mjs              Seeder data awal
drizzle/
  0000_talented_glorian.sql  Migrasi skema awal
  0001_jazzy_iron_patriot.sql  Migrasi role dan role_permissions
```

## 8. Menjalankan Aplikasi

Prasyarat:

- Node.js 20 atau lebih baru.
- MySQL 8 atau MariaDB yang kompatibel.
- Database `db_sri_tani`.

Konfigurasi `.env.local`:

```env
DATABASE_URL_UTAMA="mysql://root@127.0.0.1:3306/db_sri_tani"
DATABASE_URL="mysql://root@127.0.0.1:3306/db_sri_tani"
AUTH_SECRET="ganti-dengan-secret-yang-aman"
AUTH_TRUST_HOST="true"
```

Langkah menjalankan:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Jika database masih memakai tabel dari versi lama, kosongkan database terlebih dahulu atau terapkan migrasi `drizzle/0000_talented_glorian.sql` dan `drizzle/0001_jazzy_iron_patriot.sql` pada database kosong.

Akun hasil seeder:

| Peran | Username | Kata sandi |
| --- | --- | --- |
| Master | `master` | `password123` |
| Admin | `admin` | `password123` |
| Petugas Lapangan | `petugas` | `password123` |
| Penggarap | `slamet` | `password123` |
| Penggarap | `rudi` | `password123` |
| Penggarap | `sutrisno` | `password123` |
| Penggarap | `wahyu` | `password123` |
| Penggarap | `agus` | `password123` |
| Penggarap | `siti` | `password123` |

## 9. Batasan Implementasi

- Izin role saat ini berlaku pada level aksi dan modul. Pembatasan baris data, misalnya penggarap hanya melihat datanya sendiri, belum diterapkan.
- Pengaturan yang tersedia baru pengaturan akun, belum pengaturan organisasi yang dapat diedit.
- Piutang baru mendukung satu arah, yaitu kewajiban usaha kepada penggarap.
- Cashflow memakai kategori transaksi, belum memisahkan tabel modal awal.
- Peringkat panen memakai rata-rata sederhana per penggarap, belum mempertimbangkan bobot luas lahan.
- Peta memakai tile satelit Esri sehingga membutuhkan koneksi internet.
- Registrasi mandiri selalu membuat role `penggarap`. Role lain dibuat melalui seeder atau pengelolaan langsung oleh Master.
