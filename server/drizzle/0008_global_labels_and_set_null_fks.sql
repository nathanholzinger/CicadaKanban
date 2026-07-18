-- Global labels (drop labels.workflow_id), drop workphases.agent_id, and switch
-- items.type / items.workphase_id / items.agent_id / chat_threads.agent_id to
-- ON DELETE SET NULL. SQLite requires the table-rebuild pattern for these.
-- The migrator runs with foreign_keys = OFF, so the drops/renames are safe.
CREATE TABLE `items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text,
	`parent_id` text,
	`project_id` text,
	`workphase_id` text,
	`title` text NOT NULL,
	`description` text,
	`position` real,
	`is_attached` integer DEFAULT 1 NOT NULL,
	`assignee_type` text,
	`agent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`type`) REFERENCES `item_types`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workphase_id`) REFERENCES `workphases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `items_new` (`id`,`type`,`parent_id`,`project_id`,`workphase_id`,`title`,`description`,`position`,`is_attached`,`assignee_type`,`agent_id`,`created_at`,`updated_at`)
SELECT `id`,`type`,`parent_id`,`project_id`,`workphase_id`,`title`,`description`,`position`,`is_attached`,`assignee_type`,`agent_id`,`created_at`,`updated_at` FROM `items`;
--> statement-breakpoint
DROP TABLE `items`;
--> statement-breakpoint
ALTER TABLE `items_new` RENAME TO `items`;
--> statement-breakpoint
CREATE TABLE `workphases_new` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`name` text NOT NULL,
	`position` real NOT NULL,
	`triggers_notification` integer DEFAULT 0 NOT NULL,
	`is_terminal` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `workphases_new` (`id`,`workflow_id`,`name`,`position`,`triggers_notification`,`is_terminal`,`created_at`)
SELECT `id`,`workflow_id`,`name`,`position`,`triggers_notification`,`is_terminal`,`created_at` FROM `workphases`;
--> statement-breakpoint
DROP TABLE `workphases`;
--> statement-breakpoint
ALTER TABLE `workphases_new` RENAME TO `workphases`;
--> statement-breakpoint
CREATE TABLE `labels_new` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `labels_new` (`id`,`name`,`color`,`created_at`)
SELECT `id`,`name`,`color`,`created_at` FROM `labels`;
--> statement-breakpoint
DROP TABLE `labels`;
--> statement-breakpoint
ALTER TABLE `labels_new` RENAME TO `labels`;
--> statement-breakpoint
CREATE TABLE `chat_threads_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`agent_id` text,
	`label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `chat_threads_new` (`id`,`item_id`,`agent_id`,`label`,`created_at`)
SELECT `id`,`item_id`,`agent_id`,`label`,`created_at` FROM `chat_threads`;
--> statement-breakpoint
DROP TABLE `chat_threads`;
--> statement-breakpoint
ALTER TABLE `chat_threads_new` RENAME TO `chat_threads`;
