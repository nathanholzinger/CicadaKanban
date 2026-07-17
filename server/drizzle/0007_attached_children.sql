ALTER TABLE `items` ADD COLUMN `is_attached` INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `boards` ADD COLUMN `show_attached_children` INTEGER NOT NULL DEFAULT 1;
