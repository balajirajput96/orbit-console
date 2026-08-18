CREATE TABLE `automation_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleKey` varchar(100) NOT NULL,
	`cronTaskUid` varchar(80) NOT NULL,
	`cronExpression` varchar(80) NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_schedules_scheduleKey_unique` UNIQUE(`scheduleKey`),
	CONSTRAINT `automation_schedules_cronTaskUid_unique` UNIQUE(`cronTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `github_workflow_health` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(240) NOT NULL,
	`workflowName` varchar(240),
	`runId` varchar(40),
	`branch` varchar(240),
	`status` varchar(40) NOT NULL,
	`conclusion` varchar(80),
	`health` enum('healthy','pending','failed','unavailable','unknown') NOT NULL,
	`sourceUrl` varchar(512) NOT NULL,
	`runUpdatedAt` timestamp,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `github_workflow_health_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_workflow_health_fullName_unique` UNIQUE(`fullName`)
);
