CREATE TABLE `item_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `item_types` (`id`, `name`, `created_at`) VALUES
	('00000000-0000-0000-0000-000000000001', 'Epic', 0),
	('00000000-0000-0000-0000-000000000002', 'Story', 0),
	('00000000-0000-0000-0000-000000000003', 'Task', 0);
--> statement-breakpoint
CREATE TABLE `work_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`board_id` text,
	`column_id` text,
	`title` text NOT NULL,
	`description` text,
	`position` real,
	`assignee_type` text,
	`agent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`type`) REFERENCES `item_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `work_items_new` SELECT
	`id`,
	CASE `type`
		WHEN 'epic'  THEN '00000000-0000-0000-0000-000000000001'
		WHEN 'story' THEN '00000000-0000-0000-0000-000000000002'
		ELSE              '00000000-0000-0000-0000-000000000003'
	END,
	`parent_id`,
	`board_id`,
	`column_id`,
	`title`,
	`description`,
	`position`,
	`assignee_type`,
	`agent_id`,
	`created_at`,
	`updated_at`
FROM `work_items`;
--> statement-breakpoint
DROP TABLE `work_items`;
--> statement-breakpoint
ALTER TABLE `work_items_new` RENAME TO `work_items`;
--> statement-breakpoint
DROP TABLE `work_item_types`;
