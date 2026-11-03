CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('master','admin','petugas','penggarap') NOT NULL,
	`resource` varchar(40) NOT NULL,
	`can_view` boolean NOT NULL DEFAULT false,
	`can_create` boolean NOT NULL DEFAULT false,
	`can_update` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_role_resource_uq` UNIQUE(`role`,`resource`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('master','admin','petugas','penggarap') NOT NULL DEFAULT 'penggarap';