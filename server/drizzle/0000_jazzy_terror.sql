CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`claude_project_id` text NOT NULL,
	`surface` text NOT NULL,
	`repo_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`external_url` text,
	`file_path` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`agent_id` text,
	`label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `columns` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`agent_id` text,
	`name` text NOT NULL,
	`position` real NOT NULL,
	`triggers_notification` integer DEFAULT 0 NOT NULL,
	`is_terminal` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `labels` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text,
	`board_id` text,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_item_labels` (
	`work_item_id` text NOT NULL,
	`label_id` text NOT NULL,
	PRIMARY KEY(`work_item_id`, `label_id`),
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_item_types` (
	`type` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_items` (
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
	FOREIGN KEY (`type`) REFERENCES `work_item_types`(`type`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
