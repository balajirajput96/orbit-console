CREATE TABLE `integration_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationKey` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`status` enum('connected','available','limited','blocked') NOT NULL,
	`mode` varchar(120) NOT NULL,
	`detail` text NOT NULL,
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_states_integrationKey_unique` UNIQUE(`integrationKey`)
);
--> statement-breakpoint
CREATE TABLE `repository_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(240) NOT NULL,
	`description` text,
	`visibility` enum('public','private') NOT NULL,
	`primaryLanguage` varchar(80),
	`sourceUrl` varchar(512) NOT NULL,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repository_inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `repository_inventory_fullName_unique` UNIQUE(`fullName`)
);
