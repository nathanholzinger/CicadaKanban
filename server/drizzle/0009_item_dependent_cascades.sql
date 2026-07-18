-- Convert the item-dependent tables' FKs to ON DELETE CASCADE so the database
-- owns the dependent cleanup that deleteItemById / deleteProjectById used to
-- hand-roll. item_labels also cascades on label delete (global labels).
-- chat_threads is rebuilt again here to switch item_id no-action -> cascade
-- while keeping agent_id ON DELETE set null (from 0008). chat_messages cascades
-- when its thread is deleted. SQLite requires the table-rebuild pattern; the
-- migrator runs with foreign_keys = OFF, so the drops/renames are safe.
CREATE TABLE `item_labels_new` (
	`item_id` text NOT NULL,
	`label_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `label_id`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `item_labels_new` (`item_id`,`label_id`)
SELECT `item_id`,`label_id` FROM `item_labels`;
--> statement-breakpoint
DROP TABLE `item_labels`;
--> statement-breakpoint
ALTER TABLE `item_labels_new` RENAME TO `item_labels`;
--> statement-breakpoint
CREATE TABLE `attachments_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`external_url` text,
	`file_path` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `attachments_new` (`id`,`item_id`,`type`,`label`,`external_url`,`file_path`,`metadata`,`created_at`)
SELECT `id`,`item_id`,`type`,`label`,`external_url`,`file_path`,`metadata`,`created_at` FROM `attachments`;
--> statement-breakpoint
DROP TABLE `attachments`;
--> statement-breakpoint
ALTER TABLE `attachments_new` RENAME TO `attachments`;
--> statement-breakpoint
CREATE TABLE `activity_log_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `activity_log_new` (`id`,`item_id`,`type`,`content`,`metadata`,`created_at`)
SELECT `id`,`item_id`,`type`,`content`,`metadata`,`created_at` FROM `activity_log`;
--> statement-breakpoint
DROP TABLE `activity_log`;
--> statement-breakpoint
ALTER TABLE `activity_log_new` RENAME TO `activity_log`;
--> statement-breakpoint
CREATE TABLE `notifications_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text,
	`workflow_id` text,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `notifications_new` (`id`,`item_id`,`workflow_id`,`message`,`type`,`is_read`,`created_at`)
SELECT `id`,`item_id`,`workflow_id`,`message`,`type`,`is_read`,`created_at` FROM `notifications`;
--> statement-breakpoint
DROP TABLE `notifications`;
--> statement-breakpoint
ALTER TABLE `notifications_new` RENAME TO `notifications`;
--> statement-breakpoint
CREATE TABLE `chat_threads_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`agent_id` text,
	`label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `chat_threads_new` (`id`,`item_id`,`agent_id`,`label`,`created_at`)
SELECT `id`,`item_id`,`agent_id`,`label`,`created_at` FROM `chat_threads`;
--> statement-breakpoint
DROP TABLE `chat_threads`;
--> statement-breakpoint
ALTER TABLE `chat_threads_new` RENAME TO `chat_threads`;
--> statement-breakpoint
CREATE TABLE `chat_messages_new` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `chat_messages_new` (`id`,`thread_id`,`role`,`content`,`created_at`)
SELECT `id`,`thread_id`,`role`,`content`,`created_at` FROM `chat_messages`;
--> statement-breakpoint
DROP TABLE `chat_messages`;
--> statement-breakpoint
ALTER TABLE `chat_messages_new` RENAME TO `chat_messages`;
