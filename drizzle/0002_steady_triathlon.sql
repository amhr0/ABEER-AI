CREATE TABLE `apiSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`openaiApiKey` text,
	`githubToken` text,
	`githubUsername` varchar(255),
	`preferredModel` varchar(50) DEFAULT 'gpt-4',
	`enableWebSearch` int DEFAULT 1,
	`enableGithubSearch` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiSettings_userId_unique` UNIQUE(`userId`)
);
