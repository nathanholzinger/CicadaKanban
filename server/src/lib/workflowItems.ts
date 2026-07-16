import { db } from '../db/index.js';
import { items } from '../db/schema.js';

type Workphase = { id: string };
type ItemRow = typeof items.$inferSelect;

// Shared by boards.ts and workflows.ts GET /:id — both need "every item
// sitting in one of this workflow's workphases," which SQLite has no direct
// index for (items.workphaseId isn't workflow-scoped), so this is a full
// table scan filtered in JS. Fine at this app's single-user data volumes.
export function getWorkflowItems(workflowWorkphases: Workphase[]): ItemRow[] {
  const workphaseIds = new Set(workflowWorkphases.map(w => w.id));
  const allItems = db.select().from(items).all();
  return allItems.filter(i => i.workphaseId && workphaseIds.has(i.workphaseId));
}
