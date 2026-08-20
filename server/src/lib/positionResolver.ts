import { eq, gt, lt, asc, desc, and, isNotNull, type SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Tx } from '../db/index.js';
import { db } from '../db/index.js';
import { coarsestFit } from './coarsestFit.js';


/**
 * Table Generic that defines a minimum structure for a table that can be ordered by 'position'
 * 
 * @param id - id of the item in the list
 * @param position - float value 
 * @param createdAt - used to tie-break equivalent position values
 * @param updatedAt - gets updated when the new position value is updated
 */
export type PositionedTable = SQLiteTable & {
  id: SQLiteColumn;
  position: SQLiteColumn;
  createdAt: SQLiteColumn;
  updatedAt: SQLiteColumn;
};

export type Side = 'before' | 'after';


// Reindex every item in a scope to clean, sequential integer positions,
// preserving current relative order. The shared primitive behind both the
// tight-gap and magnitude-threshold triggers below — generalizes
// `boardDndUtils.ts::computeSameWorkphaseReorder`'s shape (client-side,
// one workphase) to run server-side over any comparison scope. Lazy and
// reactive only — never call this from a scheduled job or a whole-project
// sweep; it's meant to fire as a side effect of a write that's already
// happening.
//
// `isNotNull(table.position)` guards against a scope that happens to also
// contain done items (Part 6, items-only concern) — a done item's
// workphaseId can still match a workflow-wide scope predicate
// (positionScopeFor has no isTerminal filter), but it has no position to
// reindex by definition. Without this, SQLite sorts NULL first in ASC
// order, so a done item would silently sort first and get a real position
// written onto it here — the one place in the resolution path that wasn't
// already protected by ordinary SQL null comparisons (a null position can
// never satisfy gt()/lt() against a real value, so the append/anchor
// neighbor-lookup queries elsewhere in this file were never at risk; this
// blind order-and-renumber loop was). Harmless no-op for tables like
// `projects` whose position is never null in practice.
export function reindexScope(table: PositionedTable, scopeWhere: SQL, tx?: Tx): void {
  const e = tx ?? db;
  const rows = e
    .select({ id: table.id, position: table.position, createdAt: table.createdAt })
    .from(table)
    .where(and(scopeWhere, isNotNull(table.position)))
    .orderBy(asc(table.position), asc(table.createdAt))
    .all() as { id: string; position: number | null; createdAt: number }[];

  const now = Date.now();
  rows.forEach((row, index) => {
    e.update(table).set({ position: index + 1, updatedAt: now }).where(eq(table.id, row.id)).run();
  });
}

function scopeItemCount(table: PositionedTable, scopeWhere: SQL, tx?: Tx): number {
  const e = tx ?? db;
  return e.select({ id: table.id }).from(table).where(scopeWhere).all().length;
}

// The magnitude-threshold trigger: does appending/prepending past
// `candidate` move far enough from proportionate that this scope should be
// reindexed first? Scales with how many items are actually in the scope
// (1000 as a floor) rather than a flat number — a scope that genuinely
// holds 1200 items shouldn't reindex on every append just because a flat
// threshold would otherwise fire constantly and uselessly for it. Checked
// against the magnitude (not just the positive case) so a long run of
// prepends is covered symmetrically with a long run of appends.
function exceedsMagnitudeThreshold(table: PositionedTable, candidate: number, scopeWhere: SQL, tx?: Tx): boolean {
  const count = scopeItemCount(table, scopeWhere, tx);
  const threshold = Math.max(1000, count + 100);
  return Math.abs(candidate) > threshold;
}

// Core resolution shared by the anchor-based and append-only entry points
// below. `getNearPosition` is a closure so it can be re-queried for a fresh
// value after a reindex (the position it returned before the reindex is now
// stale). `allowRetry` bounds retries to one level — after a reindex, the
// scope's positions are freshly-spaced sequential integers, so a second
// tight-gap or magnitude hit on the same operation should not occur.
function resolveNear(
  table: PositionedTable,
  getNearPosition: () => number | null,
  side: Side,
  scopeWhere: SQL,
  tx: Tx | undefined,
  allowRetry: boolean,
): number {
  const e = tx ?? db;
  const nearPosition = getNearPosition();

  if (nearPosition === null) {
    // Genuinely empty scope — nothing to derive a value from, so start at
    // 1.0. Scopes are workflow-wide (or parent-wide for attached children,
    // Part 3, or a project's siblings) — never workphase-narrow — so this
    // only fires for a whole new workflow with no positioned items yet, or
    // a parent with no children yet (see positionScopeFor in items.ts /
    // projectPositionScope in projects.ts). It deliberately does NOT fire
    // just because one particular workphase happens to be empty while
    // others in the same workflow aren't.
    return 1.0;
  }

  const boundingNeighbor = (
    side === 'after'
      ? e
          .select({ position: table.position })
          .from(table)
          .where(and(scopeWhere, gt(table.position, nearPosition)))
          .orderBy(asc(table.position))
          .limit(1)
          .get()
      : e
          .select({ position: table.position })
          .from(table)
          .where(and(scopeWhere, lt(table.position, nearPosition)))
          .orderBy(desc(table.position))
          .limit(1)
          .get()
  ) as { position: number | null } | undefined;

  if (boundingNeighbor?.position != null) {
    const [prev, next] = side === 'after' ? [nearPosition, boundingNeighbor.position] : [boundingNeighbor.position, nearPosition];
    return fitOrReindexAndRetry(table, prev, next, getNearPosition, side, scopeWhere, tx, allowRetry);
  }

  if (side === 'before') {
    // No true predecessor — coarsest-fit toward the floor (0.0) rather than
    // a flat `nearPosition - 1.0` step. Keeps a repeatedly-prepended item's
    // position bounded above zero instead of drifting negative without
    // limit, which would otherwise collide with the `position ?? 0`
    // tie-break sentinel used when sorting alongside unpositioned items
    // (§5's tie-break). Precision exhaustion near zero is handled by the
    // same tight-gap reindex-and-retry as any other coarsest-fit call.
    return fitOrReindexAndRetry(table, 0.0, nearPosition, getNearPosition, side, scopeWhere, tx, allowRetry);
  }

  // side === 'after' with no true successor — degenerate append fallback,
  // unbounded above (there's no natural ceiling the way 0.0 is a natural
  // floor). Provably always past nearPosition: rounding perturbs by at most
  // 0.5, the offset is a full 1.0.
  const candidate = Math.round(nearPosition + 1.0);

  if (allowRetry && exceedsMagnitudeThreshold(table, candidate, scopeWhere, tx)) {
    reindexScope(table, scopeWhere, tx);
    return resolveNear(table, getNearPosition, side, scopeWhere, tx, false);
  }
  return candidate;
}

// Shared by both the true-neighbor case and the before-side zero-floor case:
// coarsest-fit between two bounds, reindexing the scope and retrying once
// (fresh, clean sequential positions) if precision is exhausted.
function fitOrReindexAndRetry(
  table: PositionedTable,
  prev: number,
  next: number,
  getNearPosition: () => number | null,
  side: Side,
  scopeWhere: SQL,
  tx: Tx | undefined,
  allowRetry: boolean,
): number {
  const fit = coarsestFit(prev, next);
  if (fit !== null) return fit;

  if (!allowRetry) {
    throw new Error('positionResolver: precision exhausted even after a reindex — this should not happen');
  }
  reindexScope(table, scopeWhere, tx);
  return resolveNear(table, getNearPosition, side, scopeWhere, tx, false);
}

// Core `{prevId, nextId}` entry point. prevId/nextId name the resolved
// row's predecessor/successor — a position in the sequence, not "the row I
// go before/after" (which reads ambiguously either direction; settled on
// prevId/nextId over beforeId/afterId for exactly that reason — see
// projects.ts's PATCH /:id/move). Exactly one of prevId/nextId is expected
// here for now (resolveAnchorPosition below always supplies exactly one);
// throws if neither is given, matching resolveAnchorPosition's existing
// contract of requiring a real anchor.
export function resolveBetween(
  table: PositionedTable,
  ids: { prevId?: string | null; nextId?: string | null },
  scopeWhere: SQL,
  tx?: Tx,
): number {
  const e = tx ?? db;
  const anchorId = ids.prevId ?? ids.nextId;
  if (!anchorId) {
    throw new Error('positionResolver: resolveBetween requires at least one of prevId/nextId');
  }
  const side: Side = ids.prevId ? 'after' : 'before';

  const getAnchorPosition = () => {
    const anchor = e.select({ position: table.position }).from(table).where(eq(table.id, anchorId)).get() as
      | { position: number | null }
      | undefined;
    if (!anchor) throw new Error(`positionResolver: anchor ${anchorId} not found`);
    return anchor.position;
  };

  const anchorPosition = getAnchorPosition();
  if (anchorPosition === null) {
    throw new Error(`positionResolver: anchor ${anchorId} has no position (likely a done item — see Part 6)`);
  }
  return resolveNear(table, getAnchorPosition, side, scopeWhere, tx, true);
}

// Main `{anchor, side}` entry point: insert immediately before/after a
// specific item, resolved against that item's TRUE current neighbor (found
// by querying the full scope, regardless of what's currently displayed) —
// not a value the client computed itself. Thin translation over
// resolveBetween — anchorId+side is just prevId/nextId expressed the other
// way (side='after' → anchorId is the predecessor → prevId; side='before'
// → anchorId is the successor → nextId).
export function resolveAnchorPosition(table: PositionedTable, anchorId: string, side: Side, scopeWhere: SQL, tx?: Tx): number {
  return resolveBetween(table, side === 'after' ? { prevId: anchorId } : { nextId: anchorId }, scopeWhere, tx);
}

// Append-only entry point: no anchor at all — row creation with no explicit
// position, or a move/drop with no specific target row. Resolves past the
// scope's true last row (or the empty-scope bootstrap above).
export function resolveAppendPosition(table: PositionedTable, scopeWhere: SQL, tx?: Tx): number {
  const e = tx ?? db;
  const getLastPosition = () => {
    const last = e.select({ position: table.position }).from(table).where(scopeWhere).orderBy(desc(table.position)).limit(1).get() as
      | { position: number | null }
      | undefined;
    return last?.position ?? null;
  };
  return resolveNear(table, getLastPosition, 'after', scopeWhere, tx, true);
}

// ── Computed `positionScope` (Part 2) ───────────────────────────────────
//
// Purely derived, never stored — tells a client, or a human reading the API
// directly, what an item's `position` is actually comparable *against*
// without re-deriving it from isAttached/parentId/workphaseId/
// workphase.isTerminal itself.

export type PositionScope = 'attached-siblings' | 'workflow' | 'none';

export function classifyPositionScope(
  item: { isAttached: boolean; parentId: string | null; workphaseId: string | null },
  workphaseIsTerminal: boolean | null,
): PositionScope {
  if (item.isAttached && item.parentId) return 'attached-siblings';
  // Unsorted/invalid (null workphaseId) — not currently position-ordered at
  // all, same practical bucket as a done item even though the reason differs.
  if (item.workphaseId === null) return 'none';
  // Done item (Part 6) — ordered by completedAt, not position.
  if (workphaseIsTerminal) return 'none';
  // Comparable against every other active item in the same workflow, not
  // just the same workphase (Epic 3.2 addendum) — see positionScopeFor.
  return 'workflow';
}
