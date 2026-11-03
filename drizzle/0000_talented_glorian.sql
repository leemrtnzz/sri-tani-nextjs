CREATE TABLE `batch_giling` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kode` varchar(30) NOT NULL,
	`tanggal` date NOT NULL,
	`jam` varchar(5),
	`penggarap_id` int,
	`lot_id` int,
	`kapasitas_kg` int NOT NULL DEFAULT 5000,
	`gabah_kg` int NOT NULL,
	`beras_kg` int,
	`rendemen` decimal(5,2),
	`status` enum('menunggu','terjadwal','berjalan','selesai') NOT NULL DEFAULT 'terjadwal',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_giling_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_giling_kode_uq` UNIQUE(`kode`)
);
--> statement-breakpoint
CREATE TABLE `kandang` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(80) NOT NULL,
	`jenis` enum('sapi_potong','kambing','unggas') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kandang_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lot_jemur` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kode` varchar(30) NOT NULL,
	`penggarap_id` int,
	`kapasitas_kg` int NOT NULL DEFAULT 5000,
	`gabah_kg` int NOT NULL DEFAULT 0,
	`kadar_air` decimal(4,1),
	`status` enum('kosong','dijemur','hampir_kering','siap_giling') NOT NULL DEFAULT 'kosong',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lot_jemur_id` PRIMARY KEY(`id`),
	CONSTRAINT `lot_jemur_kode_uq` UNIQUE(`kode`)
);
--> statement-breakpoint
CREATE TABLE `panen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`penggarap_id` int NOT NULL,
	`tanggal_panen` date NOT NULL,
	`musim` varchar(40),
	`hasil_ton_per_ha` decimal(5,2) NOT NULL,
	`total_gabah_kg` int,
	`rating` decimal(2,1),
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `panen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pengaturan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama_organisasi` varchar(150) NOT NULL DEFAULT 'SRI TANI',
	`periode_default` varchar(40),
	`user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengaturan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `penggarap` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`nama` varchar(120) NOT NULL,
	`telepon` varchar(30),
	`alamat` text,
	`luas_lahan_ha` decimal(8,2) NOT NULL DEFAULT '0.00',
	`fase` enum('pembibitan','vegetatif','generatif','campuran') NOT NULL DEFAULT 'pembibitan',
	`rating` decimal(2,1),
	`status` enum('aktif','perlu_verifikasi','nonaktif') NOT NULL DEFAULT 'aktif',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `penggarap_id` PRIMARY KEY(`id`),
	CONSTRAINT `penggarap_user_uq` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `pengiriman` (
	`id` int AUTO_INCREMENT NOT NULL,
	`no_kirim` varchar(30) NOT NULL,
	`toko_id` int NOT NULL,
	`batch_id` int,
	`gudang` varchar(120) NOT NULL DEFAULT 'Gudang SRI TANI',
	`beras_kg` int NOT NULL,
	`armada` varchar(50),
	`tanggal_kirim` date NOT NULL,
	`tanggal_diterima` date,
	`penerima` varchar(120),
	`status` enum('dimuat','dalam_perjalanan','diterima') NOT NULL DEFAULT 'dimuat',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pengiriman_id` PRIMARY KEY(`id`),
	CONSTRAINT `pengiriman_no_kirim_uq` UNIQUE(`no_kirim`)
);
--> statement-breakpoint
CREATE TABLE `petak_lahan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`penggarap_id` int NOT NULL,
	`nama` varchar(120) NOT NULL,
	`color` varchar(9) NOT NULL DEFAULT '#16a34a',
	`coords` json NOT NULL,
	`luas_ha` decimal(8,2) NOT NULL DEFAULT '0.00',
	`pusat_lat` decimal(9,6),
	`pusat_lng` decimal(9,6),
	`status` enum('terpetakan','belum_dipetakan') NOT NULL DEFAULT 'terpetakan',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `petak_lahan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `piutang` (
	`id` int AUTO_INCREMENT NOT NULL,
	`penggarap_id` int NOT NULL,
	`nilai` bigint NOT NULL,
	`dibayar` bigint NOT NULL DEFAULT 0,
	`jatuh_tempo` date NOT NULL,
	`tanggal_bayar` date,
	`status` enum('belum_jatuh_tempo','segera_jatuh_tempo','terlambat','lunas') NOT NULL DEFAULT 'belum_jatuh_tempo',
	`keterangan` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `piutang_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ternak` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kandang_id` int NOT NULL,
	`jenis` enum('sapi_potong','kambing','unggas') NOT NULL,
	`jumlah` int NOT NULL DEFAULT 0,
	`kondisi` enum('sehat','perlu_vaksin','sakit') NOT NULL DEFAULT 'sehat',
	`jadwal_vaksin` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ternak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toko` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(150) NOT NULL,
	`alamat` text,
	`telepon` varchar(30),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `toko_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaksi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tanggal` date NOT NULL,
	`keterangan` varchar(255) NOT NULL,
	`jenis` enum('pemasukan','pengeluaran') NOT NULL,
	`kategori` enum('modal','operasional','penjualan','lain') NOT NULL DEFAULT 'lain',
	`nominal` bigint NOT NULL,
	`toko_id` int,
	`batch_id` int,
	`penggarap_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaksi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nama` varchar(120) NOT NULL,
	`email` varchar(190) NOT NULL,
	`username` varchar(60) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('admin','petugas','user') NOT NULL DEFAULT 'user',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`),
	CONSTRAINT `users_username_uq` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `batch_giling` ADD CONSTRAINT `batch_giling_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_giling` ADD CONSTRAINT `batch_giling_lot_id_lot_jemur_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `lot_jemur`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lot_jemur` ADD CONSTRAINT `lot_jemur_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panen` ADD CONSTRAINT `panen_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengaturan` ADD CONSTRAINT `pengaturan_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `penggarap` ADD CONSTRAINT `penggarap_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengiriman` ADD CONSTRAINT `pengiriman_toko_id_toko_id_fk` FOREIGN KEY (`toko_id`) REFERENCES `toko`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengiriman` ADD CONSTRAINT `pengiriman_batch_id_batch_giling_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_giling`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `petak_lahan` ADD CONSTRAINT `petak_lahan_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `piutang` ADD CONSTRAINT `piutang_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ternak` ADD CONSTRAINT `ternak_kandang_id_kandang_id_fk` FOREIGN KEY (`kandang_id`) REFERENCES `kandang`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_toko_id_toko_id_fk` FOREIGN KEY (`toko_id`) REFERENCES `toko`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_batch_id_batch_giling_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_giling`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_penggarap_id_penggarap_id_fk` FOREIGN KEY (`penggarap_id`) REFERENCES `penggarap`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `batch_giling_tanggal_idx` ON `batch_giling` (`tanggal`);--> statement-breakpoint
CREATE INDEX `panen_penggarap_idx` ON `panen` (`penggarap_id`);--> statement-breakpoint
CREATE INDEX `panen_tanggal_idx` ON `panen` (`tanggal_panen`);--> statement-breakpoint
CREATE INDEX `penggarap_nama_idx` ON `penggarap` (`nama`);--> statement-breakpoint
CREATE INDEX `pengiriman_tanggal_idx` ON `pengiriman` (`tanggal_kirim`);--> statement-breakpoint
CREATE INDEX `petak_penggarap_idx` ON `petak_lahan` (`penggarap_id`);--> statement-breakpoint
CREATE INDEX `piutang_penggarap_idx` ON `piutang` (`penggarap_id`);--> statement-breakpoint
CREATE INDEX `piutang_jatuh_tempo_idx` ON `piutang` (`jatuh_tempo`);--> statement-breakpoint
CREATE INDEX `transaksi_tanggal_idx` ON `transaksi` (`tanggal`);--> statement-breakpoint
CREATE INDEX `transaksi_kategori_idx` ON `transaksi` (`kategori`);