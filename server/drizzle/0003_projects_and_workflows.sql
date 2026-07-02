CREATE TABLE `projects` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `parent_id` TEXT REFERENCES `projects`(`id`),
  `name` TEXT NOT NULL,
  `description` TEXT,
  `created_at` INTEGER NOT NULL,
  `updated_at` INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_templates` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_template_columns` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `template_id` TEXT NOT NULL REFERENCES `workflow_templates`(`id`),
  `name` TEXT NOT NULL,
  `position` REAL NOT NULL,
  `triggers_notification` INTEGER NOT NULL DEFAULT 0,
  `is_terminal` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
ALTER TABLE `boards` RENAME TO `workflows`;
--> statement-breakpoint
ALTER TABLE `workflows` ADD COLUMN `project_id` TEXT REFERENCES `projects`(`id`);
--> statement-breakpoint
ALTER TABLE `columns` RENAME COLUMN `board_id` TO `workflow_id`;
--> statement-breakpoint
ALTER TABLE `labels` RENAME COLUMN `board_id` TO `workflow_id`;
--> statement-breakpoint
CREATE TABLE `items` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `type` TEXT REFERENCES `item_types`(`id`),
  `parent_id` TEXT,
  `project_id` TEXT REFERENCES `projects`(`id`),
  `column_id` TEXT REFERENCES `columns`(`id`),
  `title` TEXT NOT NULL,
  `description` TEXT,
  `position` REAL,
  `assignee_type` TEXT,
  `agent_id` TEXT REFERENCES `agents`(`id`),
  `created_at` INTEGER NOT NULL,
  `updated_at` INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO `items` (`id`, `type`, `parent_id`, `project_id`, `column_id`, `title`, `description`, `position`, `assignee_type`, `agent_id`, `created_at`, `updated_at`)
SELECT `id`, `type`, `parent_id`, NULL, `column_id`, `title`, `description`, `position`, `assignee_type`, `agent_id`, `created_at`, `updated_at`
FROM `work_items`;
--> statement-breakpoint
DROP TABLE `work_items`;
--> statement-breakpoint
CREATE TABLE `item_labels` (
  `item_id` TEXT NOT NULL REFERENCES `items`(`id`),
  `label_id` TEXT NOT NULL REFERENCES `labels`(`id`),
  PRIMARY KEY (`item_id`, `label_id`)
);
--> statement-breakpoint
INSERT INTO `item_labels` (`item_id`, `label_id`) SELECT `work_item_id`, `label_id` FROM `work_item_labels`;
--> statement-breakpoint
DROP TABLE `work_item_labels`;
--> statement-breakpoint
CREATE TABLE `activity_log_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `item_id` TEXT NOT NULL REFERENCES `items`(`id`),
  `type` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `metadata` TEXT,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO `activity_log_new` (`id`, `item_id`, `type`, `content`, `metadata`, `created_at`)
SELECT `id`, `work_item_id`, `type`, `content`, `metadata`, `created_at` FROM `activity_log`;
--> statement-breakpoint
DROP TABLE `activity_log`;
--> statement-breakpoint
ALTER TABLE `activity_log_new` RENAME TO `activity_log`;
--> statement-breakpoint
CREATE TABLE `chat_threads_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `item_id` TEXT NOT NULL REFERENCES `items`(`id`),
  `agent_id` TEXT REFERENCES `agents`(`id`),
  `label` TEXT,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO `chat_threads_new` (`id`, `item_id`, `agent_id`, `label`, `created_at`)
SELECT `id`, `work_item_id`, `agent_id`, `label`, `created_at` FROM `chat_threads`;
--> statement-breakpoint
DROP TABLE `chat_threads`;
--> statement-breakpoint
ALTER TABLE `chat_threads_new` RENAME TO `chat_threads`;
--> statement-breakpoint
CREATE TABLE `attachments_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `item_id` TEXT NOT NULL REFERENCES `items`(`id`),
  `type` TEXT NOT NULL,
  `label` TEXT NOT NULL,
  `external_url` TEXT,
  `file_path` TEXT,
  `metadata` TEXT,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO `attachments_new` (`id`, `item_id`, `type`, `label`, `external_url`, `file_path`, `metadata`, `created_at`)
SELECT `id`, `work_item_id`, `type`, `label`, `external_url`, `file_path`, `metadata`, `created_at` FROM `attachments`;
--> statement-breakpoint
DROP TABLE `attachments`;
--> statement-breakpoint
ALTER TABLE `attachments_new` RENAME TO `attachments`;
--> statement-breakpoint
CREATE TABLE `notifications_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `item_id` TEXT REFERENCES `items`(`id`),
  `workflow_id` TEXT REFERENCES `workflows`(`id`),
  `message` TEXT NOT NULL,
  `type` TEXT NOT NULL,
  `is_read` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO `notifications_new` (`id`, `item_id`, `workflow_id`, `message`, `type`, `is_read`, `created_at`)
SELECT `id`, `work_item_id`, `board_id`, `message`, `type`, `is_read`, `created_at` FROM `notifications`;
--> statement-breakpoint
DROP TABLE `notifications`;
--> statement-breakpoint
ALTER TABLE `notifications_new` RENAME TO `notifications`;
