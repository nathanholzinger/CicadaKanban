// cascadeWorkphaseToAttachedDescendants: propagates a parent's workphase change to its
// attached children only — a detached child halts the cascade for its whole branch. (Epic 3)

import { db, type Tx } from '../db/index.js';
import { items } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { walkItemDescendants } from './itemTree.js';

// BFS over an item's children, only descending through attached children —
// a detached child stops its branch (it doesn't move, so neither do its own children).
function getAttachedDescendantIds(rootId: string, tx?: Tx): string[] {
  return walkItemDescendants(rootId, { predicate: (child) => Boolean(child.isAttached), tx });
}

// Moves an item's attached descendants to match its current workphaseId. Pass
// `tx` to run inside a caller's transaction (e.g. the move/PUT handlers, where
// the parent's own workphase write and this cascade must commit together).
export function cascadeWorkphaseToAttachedDescendants(rootId: string, tx?: Tx): void {
  const e = tx ?? db;
  const root = e.select({ workphaseId: items.workphaseId }).from(items).where(eq(items.id, rootId)).get();
  if (!root) return;

  const descendantIds = getAttachedDescendantIds(rootId, tx);
  const now = Date.now();
  for (const id of descendantIds) {
    e.update(items).set({ workphaseId: root.workphaseId, updatedAt: now }).where(eq(items.id, id)).run();
  }
}
