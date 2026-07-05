ALTER TABLE `projects` ADD COLUMN `position` REAL;
UPDATE `projects` SET `position` = `created_at` WHERE `position` IS NULL;
