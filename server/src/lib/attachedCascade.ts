import { db } from '../db/index.js';
import { items } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// BFS over an item's children, only descending through attached children —
// a detached child stops its branch (it doesn't move, so neither do its own children).
export function getAttachedDescendantIds(rootId: string): string[] {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = db.select({ id: items.id, isAttached: items.isAttached })
      .from(items).where(eq(items.parentId, id)).all();
    for (const child of children) {
      if (child.isAttached) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return ids;
}

// Moves an item's attached descendants to match its current workphaseId.
export function cascadeWorkphaseToAttachedDescendants(rootId: string): void {
  const root = db.select({ workphaseId: items.workphaseId }).from(items).where(eq(items.id, rootId)).get();
  if (!root) return;

  const descendantIds = getAttachedDescendantIds(rootId);
  const now = Date.now();
  for (const id of descendantIds) {
    db.update(items).set({ workphaseId: root.workphaseId, updatedAt: now }).where(eq(items.id, id)).run();
  }
}
