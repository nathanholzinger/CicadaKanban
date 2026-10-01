-- A top-level item's attachment flag is clear (wiki item-attachment §1). This
-- clears it on the existing top-level rows, which hold the column's default
-- (set), so a reparent that omitted the flag would attach them. The column
-- keeps its default: every insert states the flag.
UPDATE `items` SET `is_attached` = 0 WHERE `parent_id` IS NULL;
