ALTER TABLE `columns` RENAME TO `workphases`;
--> statement-breakpoint
ALTER TABLE `workflow_template_columns` RENAME TO `workflow_template_phases`;
--> statement-breakpoint
ALTER TABLE `items` RENAME COLUMN `column_id` TO `workphase_id`;
