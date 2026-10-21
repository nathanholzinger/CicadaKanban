// deleteProjectById: a project's delete cascade, its descendant projects and items and workflows.

import { eq, inArray } from 'drizzle-orm';
import type { Tx } from '../db/index.js';
import { items, projects, workflows } from '../db/schema.js';
import { deleteWorkflowsById } from './workflowCascade.js';

// Recursively deletes a project subtree (wiki project-tree §9). Runs inside a caller-supplied
// transaction (tx) so the whole cascade (descendant projects, items, workflow artifacts)
// commits atomically; a mid-cascade failure rolls the lot back.
export function deleteProjectById(id: string, tx: Tx): void {
  const children = tx.select().from(projects).where(eq(projects.parentId, id)).all();
  for (const child of children) deleteProjectById(child.id, tx);

  // Items to remove: owned by this project ONLY — not also every item merely
  // sitting in one of this project's workphases. A project that was
  // reparented away, or had its own workflow assigned, after filing items
  // into this project's workphases still points its workphaseId here;
  // sweeping those up too would silently delete another project's items.
  // Removing the workphases (deleteWorkflowsById) already nulls their workphaseId
  // (ON DELETE SET NULL) — they survive and surface as "Unknown status" on whatever
  // board their real project now resolves to. Each deleted item's dependent rows (itemLabels,
  // activityLog, notifications, attachments, chat threads/messages) are
  // removed by ON DELETE CASCADE, so deleting the items is enough.
  const allItemIds = tx
    .select({ id: items.id })
    .from(items)
    .where(eq(items.projectId, id))
    .all()
    .map(i => i.id);

  if (allItemIds.length > 0) {
    tx.delete(items).where(inArray(items.id, allItemIds)).run();
  }

  // Labels are global — NOT deleted with a project.
  const workflowIds = tx
    .select({ id: workflows.id })
    .from(workflows)
    .where(eq(workflows.projectId, id))
    .all()
    .map(w => w.id);
  deleteWorkflowsById(workflowIds, tx);

  tx.delete(projects).where(eq(projects.id, id)).run();
}
