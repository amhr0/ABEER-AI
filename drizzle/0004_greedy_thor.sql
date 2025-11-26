CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`errorType` varchar(100) NOT NULL,
	`errorMessage` text NOT NULL,
	`stackTrace` text,
	`filePath` varchar(500),
	`lineNumber` int,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('new','analyzing','resolved','ignored') NOT NULL DEFAULT 'new',
	`solution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('documentation','code','config','error','solution','note') NOT NULL,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `long_term_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`memoryType` enum('project_detail','user_preference','technical_context','solution_history') NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`importance` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastAccessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `long_term_memory_id` PRIMARY KEY(`id`)
);
