// isSelfRefDescendant/assertValidReparent (items + projects), the depth cap's
// depth/height/check for both (ITEM_DEPTH_CAP, PROJECT_DEPTH_CAP), parentRefusal
// (the parent-legality sequence over them), walkItemDescendants. All cycle-guarded.

import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, type Tx } from '../db/index.js';
import { items, projects } from '../db/schema.js';

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
// Hierarchy depth and the cap, for items and projects alike: one formula
// (wiki hierarchy-placement §6), each feature's own cap.
// ============================================================

// The item depth cap, provisionally 6 (wiki item-attachment §8). One definition
// for every parent-giving write, and the board's drag classification reads the
// same value off GET /boards/:id's `itemDepthCap`, so the UI and the API always
// enforce the same cap (wiki hierarchy-placement §6).
export const ITEM_DEPTH_CAP = 6;

// The project depth cap, provisionally 6 (wiki project-tree §3). Set apart from
// the item cap, though it starts at the same number: changing one never changes
// the other. The sidebar reads it off GET /projects/depth-cap, so the UI and the
// API enforce the same cap.
export const PROJECT_DEPTH_CAP = 6;

// 1-based: a top-level entry is at depth 1 (wiki hierarchy-placement §6). Walks
// parentId upward with a visited set so a corrupted cycle terminates
// instead of looping.
function selfRefDepth(table: SelfRefTable, id: string, tx?: Tx): number {
  const e = tx ?? db;
  const parentOf = (rowId: string) =>
    (
      e.select({ parentId: table.parentId }).from(table).where(eq(table.id, rowId)).get() as
        { parentId: string | null } | undefined
    )?.parentId;
  let depth = 1;
  const visited = new Set([id]);
  let parentId = parentOf(id);
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    depth++;
    parentId = parentOf(parentId);
  }
  return depth;
}

// An item's depth. Not the API's `depth` field on GET /items/:id, which is 0-based.
export function hierarchyDepth(itemId: string, tx?: Tx): number {
  return selfRefDepth(items, itemId, tx);
}

// Levels *below* the entry — a leaf is 0. Counts the full descendant subtree
// (for items, detached descendants included: a detached child doesn't follow its
// parent's workphase, but it does still sit under it in the hierarchy and
// moves with it, wiki item-attachment §8). One level per BFS generation, so
// the height is just how many generations the walk produced.
function selfRefSubtreeHeight(table: SelfRefTable, id: string, tx?: Tx): number {
  return walkSelfRefLevels(table, id, { tx }).length;
}

export function subtreeHeight(itemId: string, tx?: Tx): number {
  return selfRefSubtreeHeight(items, itemId, tx);
}

// A target at depth D is a legal parent only if D + 1 + subtreeHeight <= CAP
// (wiki hierarchy-placement §6) — evaluated on the *resulting* deepest leaf, with
// no direction-aware exception: an already-over-cap subtree fails for every
// target, a top-level one included. `parentId` null is the top level, depth 0.
// `movingId` null means a brand-new entry (height 0) — a create's case. Returns
// the 400 message, or null if legal.
function withinCapError(
  table: SelfRefTable,
  cap: number,
  parentId: string | null,
  movingId: string | null,
  tx?: Tx,
): string | null {
  const parentDepth = parentId ? selfRefDepth(table, parentId, tx) : 0;
  const resultingDepth = parentDepth + 1 + (movingId ? selfRefSubtreeHeight(table, movingId, tx) : 0);
  if (resultingDepth > cap) {
    return `Resulting hierarchy depth ${resultingDepth} exceeds the cap of ${cap}`;
  }
  return null;
}

export function assertWithinDepthCap(parentId: string | null, movingId: string | null, tx?: Tx): string | null {
  return withinCapError(items, ITEM_DEPTH_CAP, parentId, movingId, tx);
}

function assertWithinProjectDepthCap(parentId: string | null, movingId: string | null, tx?: Tx): string | null {
  return withinCapError(projects, PROJECT_DEPTH_CAP, parentId, movingId, tx);
}

// ============================================================
// The legality of a parent, for items and projects alike: the one sequence every
// write that gives a row a parent runs.
// ============================================================

// What differs between the two trees: the table and the cap check. A tree's key
// is also what its messages call a row.
const TREES: Record<
  'item' | 'project',
  { table: SelfRefTable; capError: (parentId: string | null, movingId: string | null, tx?: Tx) => string | null }
> = {
  item: { table: items, capError: assertWithinDepthCap },
  project: { table: projects, capError: assertWithinProjectDepthCap },
};

// Why `parentId` is no legal parent for a row, or null when it is: it exists, it isn't
// the row itself and isn't in its subtree (wiki item-attachment §7, wiki project-tree §3),
// and the resulting subtree stays within the cap (wiki hierarchy-placement §6). `parentId`
// null is the top level, which has no parent to check but takes the cap all the same: a
// subtree too tall for the cap fails it for every target. `moving` is the row being given
// the parent, or null for a create, which has no subtree. The cap gates a write that
// changes the parent, so one that names the parent the row already has isn't checked.
export function parentRefusal(
  tree: 'item' | 'project',
  moving: { id: string; parentId: string | null } | null,
  parentId: string | null,
  tx?: Tx,
): string | null {
  const { table, capError } = TREES[tree];
  if (parentId !== null) {
    const parent = (tx ?? db).select({ id: table.id }).from(table).where(eq(table.id, parentId)).get();
    if (!parent) return `parentId does not reference an existing ${tree}`;
    if (moving) {
      const reparentError = assertValidReparent(table, moving.id, parentId, tree, tx);
      if (reparentError) return reparentError;
    }
  }
  if (moving && parentId === moving.parentId) return null;
  return capError(parentId, moving?.id ?? null, tx);
}

// ============================================================
// The parentId BFS collector, over the self-referential tables. Items add a
// predicate on `isAttached` (walkItemDescendants), so it takes one.
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

// The one BFS: one generation per array, parents before children,
// only descending through (and reporting) children the predicate accepts.
// `visited` (seeded with `rootId`) guards against a corrupted parentId cycle
// in the data: a node is marked visited the moment it's seen, before the
// predicate even runs, so a cycle can't re-queue the same id forever
// regardless of what the predicate decides — backs `DELETE /items/:id`,
// where a cycle here would otherwise mean the delete never returns.
// Level-ordered so a subtree's height can count generations without a second
// traversal.
function walkSelfRefLevels<Child extends { id: string }>(
  table: SelfRefTable,
  rootId: string,
  opts: { predicate?: (child: Child) => boolean; tx?: Tx } = {},
): Child[][] {
  const { predicate = () => true, tx } = opts;
  const e = tx ?? db;
  const levels: Child[][] = [];
  const visited = new Set([rootId]);
  let frontier = [rootId];
  while (frontier.length > 0) {
    const next: Child[] = [];
    for (const id of frontier) {
      const children = e.select().from(table).where(eq(table.parentId, id)).all() as Child[];
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
  const { includeRoot = false, predicate, tx } = opts;
  const ids: string[] = includeRoot ? [rootId] : [];
  for (const level of walkSelfRefLevels<ItemChild>(items, rootId, { predicate, tx })) {
    for (const child of level) ids.push(child.id);
  }
  return ids;
}
