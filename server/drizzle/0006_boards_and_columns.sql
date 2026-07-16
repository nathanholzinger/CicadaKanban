CREATE TABLE `boards` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `workflow_id` TEXT NOT NULL REFERENCES `workflows`(`id`),
  `name` TEXT NOT NULL,
  `position` REAL NOT NULL,
  `created_at` INTEGER NOT NULL,
  `updated_at` INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE `columns` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `board_id` TEXT NOT NULL REFERENCES `boards`(`id`),
  `name` TEXT,
  `start_workphase_id` TEXT NOT NULL REFERENCES `workphases`(`id`),
  `end_workphase_id` TEXT NOT NULL REFERENCES `workphases`(`id`),
  `display_mode` TEXT NOT NULL DEFAULT 'merged',
  `position` REAL NOT NULL,
  `created_at` INTEGER NOT NULL
);
