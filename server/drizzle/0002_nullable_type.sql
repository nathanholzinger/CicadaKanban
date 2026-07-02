-- Make work_items.type nullable (SQLite requires rebuild pattern)
CREATE TABLE `work_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text,
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
INSERT INTO `work_items_new` SELECT * FROM `work_items`;
--> statement-breakpoint
DROP TABLE `work_items`;
--> statement-breakpoint
ALTER TABLE `work_items_new` RENAME TO `work_items`;
