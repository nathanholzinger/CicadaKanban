import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, type Tx } from '../db/index.js';
import { items } from '../db/schema.js';

type SelfRefTable = SQLiteTable & { id: SQLiteColumn; parentId: SQLiteColumn };

// ============================================================
// Self-referential parentId tree math shared by `items` and `projects` — was
// byte-for-byte duplicated per-table, plus a copy-pasted reparent guard
// across three route handlers (audit finding #23). The client consolidated
// its equivalent math into lib/hierarchy.ts; this is the server counterpart.
// ============================================================

// True if `candidateId` sits anywhere in `ofId`'s subtree. DFS with early
// exit — was `isItemDescendant` (items.ts) / `isDescendant` (projects.ts).
function isSelfRefDescendant(table: SelfRefTable, ofId: string, candidateId: string, tx?: Tx): boolean {
  const e = tx ?? db;
  const children = e.select({ id: table.id }).from(table).where(eq(table.parentId, ofId)).all() as { id: string }[];
  for (const child of children) {
    if (child.id === candidateId || isSelfRefDescendant(table, child.id, candidateId, tx)) return true;
  }
  return false;
}

// The "can't be your own parent" + "can't reparent into your own subtree"
// guard, copy-pasted into projects PUT, projects reorder, and items PUT.
// Returns an error message to send as a 400, or null if the reparent is valid.
export function assertValidReparent(table: SelfRefTable, id: string, parentId: string, selfLabel: string, tx?: Tx): string | null {
  if (parentId === id) return `A ${selfLabel} cannot be its own parent`;
  if (isSelfRefDescendant(table, id, parentId, tx)) return 'Cannot reparent to a descendant';
  return null;
}

// ============================================================
// items.parentId BFS collector. Items-specific (needs the isAttached column
// for the predicate), so not folded into the generic self-ref helpers above.
// ============================================================

interface WalkItemDescendantsOptions {
  /** Only descend through (and collect) children matching this predicate.
   *  Defaults to collecting every descendant. */
  predicate?: (child: { id: string; isAttached: number }) => boolean;
  /** Include `rootId` itself as the first entry — item delete wants the item
   *  + its whole subtree in one id list. Defaults to false (strict descendants only). */
  includeRoot?: boolean;
  tx?: Tx;
}

// BFS over an item's descendants. Was duplicated as items.ts's
// `collectDescendantIds` (collect-all, includes root) and
// attachedCascade.ts's `getAttachedDescendantIds` (attached-only, excludes
// root) — the two differed only in predicate and whether the root itself
// belongs in the result.
export function walkItemDescendants(rootId: string, opts: WalkItemDescendantsOptions = {}): string[] {
  const { predicate = () => true, includeRoot = false, tx } = opts;
  const e = tx ?? db;
  const ids: string[] = includeRoot ? [rootId] : [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = e.select({ id: items.id, isAttached: items.isAttached })
      .from(items).where(eq(items.parentId, id)).all();
    for (const child of children) {
      if (predicate(child)) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return ids;
}
