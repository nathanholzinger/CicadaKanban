// isSelfRefDescendant/assertValidReparent (items + projects), walkItemDescendants,
// hierarchyDepth/subtreeHeight/assertWithinDepthCap + ITEM_DEPTH_CAP (items). All cycle-guarded.

import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, type Tx } from '../db/index.js';
import { items } from '../db/schema.js';

type SelfRefTable = SQLiteTable & { id: SQLiteColumn; parentId: SQLiteColumn };

// ============================================================
// Self-referential parentId tree math shared by `items` and `projects`. The
// client's counterpart is client/src/lib/hierarchy.ts.
// ============================================================

// True if `candidateId` sits anywhere in `ofId`'s subtree. DFS with early
// exit. `visited` guards against a corrupted parentId cycle already in the
// data turning this into unbounded recursion — each id is only ever
// descended into once across the whole call tree; a revisit means
// a cycle exists below `ofId`, which can't contain `candidateId` any more
// than the first visit already determined, so it's safe to just stop there.
function isSelfRefDescendant(
  table: SelfRefTable,
  ofId: string,
  candidateId: string,
  tx?: Tx,
  visited: Set<string> = new Set(),
): boolean {
  if (visited.has(ofId)) return false;
  visited.add(ofId);
  const e = tx ?? db;
  const children = e.select({ id: table.id }).from(table).where(eq(table.parentId, ofId)).all() as { id: string }[];
  for (const child of children) {
    if (child.id === candidateId || isSelfRefDescendant(table, child.id, candidateId, tx, visited)) return true;
  }
  return false;
}

// The "can't be your own parent" + "can't reparent into your own subtree"
// guard, for items and projects alike. Returns an error message to send as
// a 400, or null if the reparent is valid.
export function assertValidReparent(
  table: SelfRefTable,
  id: string,
  parentId: string,
  selfLabel: string,
  tx?: Tx,
): string | null {
  if (parentId === id) return `A ${selfLabel} cannot be its own parent`;
  if (isSelfRefDescendant(table, id, parentId, tx)) return 'Cannot reparent to a descendant';
  return null;
}

// ============================================================
// Item hierarchy depth.
// ============================================================

// The item depth cap, provisionally 6 (wiki item-attachment §8). One definition
// for every parent-giving write, and the board's drag classification reads the
// same value off GET /boards/:id's `itemDepthCap`, so the UI and the API always
// enforce the same cap (wiki hierarchy-placement §6).
export const ITEM_DEPTH_CAP = 6;

// 1-based: a root item is at depth 1 (wiki hierarchy-placement §6). Walks
// parentId upward with a visited set so a corrupted cycle terminates
// instead of looping. Not the API's `depth` field on GET /items/:id, which
// is 0-based.
export function hierarchyDepth(itemId: string, tx?: Tx): number {
  const e = tx ?? db;
  let depth = 1;
  const visited = new Set([itemId]);
  let current = e.select({ parentId: items.parentId }).from(items).where(eq(items.id, itemId)).get();
  while (current?.parentId && !visited.has(current.parentId)) {
    visited.add(current.parentId);
    depth++;
    current = e.select({ parentId: items.parentId }).from(items).where(eq(items.id, current.parentId)).get();
  }
  return depth;
}

// Levels *below* the item — a leaf is 0. Counts the full descendant subtree,
// detached descendants included: a detached child doesn't follow its
// parent's workphase, but it does still sit under it in the hierarchy and
// moves with it (wiki item-attachment §8). One level per BFS generation, so
// the height is just how many generations the walk produced.
export function subtreeHeight(itemId: string, tx?: Tx): number {
  return walkItemDescendantLevels(itemId, { tx }).length;
}

// A target at depth D is a legal parent only if D + 1 + subtreeHeight <= CAP
// — evaluated on the *resulting* deepest leaf, with no direction-aware
// exception: an already-over-cap subtree fails for every target, including
// a root (wiki hierarchy-placement §6). `movingId` null means a brand-new item
// (height 0) — POST's case. Returns the 400 message, or null if legal.
export function assertWithinDepthCap(parentId: string, movingId: string | null, tx?: Tx): string | null {
  const resultingDepth = hierarchyDepth(parentId, tx) + 1 + (movingId ? subtreeHeight(movingId, tx) : 0);
  if (resultingDepth > ITEM_DEPTH_CAP) {
    return `Resulting hierarchy depth ${resultingDepth} exceeds the cap of ${ITEM_DEPTH_CAP}`;
  }
  return null;
}

// ============================================================
// items.parentId BFS collector. Items-specific (needs the isAttached column
// for the predicate), so not folded into the generic self-ref helpers above.
// ============================================================

type ItemChild = { id: string; isAttached: number };

interface WalkItemDescendantsOptions {
  /** Only descend through (and collect) children matching this predicate.
   *  Defaults to collecting every descendant. */
  predicate?: (child: ItemChild) => boolean;
  /** Include `rootId` itself as the first entry — item delete wants the item
   *  + its whole subtree in one id list. Defaults to false (strict descendants only). */
  includeRoot?: boolean;
  tx?: Tx;
}

// The one items-BFS: one generation per array, parents before children,
// only descending through (and reporting) children the predicate accepts.
// `visited` (seeded with `rootId`) guards against a corrupted parentId cycle
// in the data: a node is marked visited the moment it's seen, before the
// predicate even runs, so a cycle can't re-queue the same id forever
// regardless of what the predicate decides — backs `DELETE /items/:id`,
// where a cycle here would otherwise mean the delete never returns.
// Level-ordered so subtreeHeight can count generations without a second
// traversal.
function walkItemDescendantLevels(
  rootId: string,
  opts: Pick<WalkItemDescendantsOptions, 'predicate' | 'tx'> = {},
): ItemChild[][] {
  const { predicate = () => true, tx } = opts;
  const e = tx ?? db;
  const levels: ItemChild[][] = [];
  const visited = new Set([rootId]);
  let frontier = [rootId];
  while (frontier.length > 0) {
    const next: ItemChild[] = [];
    for (const id of frontier) {
      const children = e
        .select({ id: items.id, isAttached: items.isAttached })
        .from(items)
        .where(eq(items.parentId, id))
        .all();
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        if (predicate(child)) next.push(child);
      }
    }
    if (next.length > 0) levels.push(next);
    frontier = next.map(c => c.id);
  }
  return levels;
}

// Flat BFS id list over an item's descendants.
export function walkItemDescendants(rootId: string, opts: WalkItemDescendantsOptions = {}): string[] {
  const { includeRoot = false, ...walkOpts } = opts;
  const ids: string[] = includeRoot ? [rootId] : [];
  for (const level of walkItemDescendantLevels(rootId, walkOpts)) {
    for (const child of level) ids.push(child.id);
  }
  return ids;
}
