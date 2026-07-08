ALTER TABLE `projects` ADD COLUMN `position` REAL;
--> statement-breakpoint
UPDATE `projects` SET `position` = `created_at` WHERE `position` IS NULL;
