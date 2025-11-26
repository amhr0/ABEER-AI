CREATE TABLE `server_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sshHost` varchar(255),
	`sshPort` int DEFAULT 22,
	`sshUser` varchar(100),
	`sshPrivateKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `server_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `server_settings_userId_unique` UNIQUE(`userId`)
);
