import { eq, gt, lt, asc, desc, and, type SQL } from 'drizzle-orm';
import type { Tx } from '../db/index.js';
import { db } from '../db/index.js';
import { items } from '../db/schema.js';

// Epic 3.2's general position-resolution contract. See
// `docs/planning/epic-3.2-decisions.md` and `.claude/plans/please-adopt-the-architect-functional-chipmunk.md`
// (Part 2) for the full design rationale — summarized here:
//
// Position-adjacent writes never trust a client-computed final value. The
// caller supplies *relative intent* (an anchor item + a side, or "append to
// this scope with no anchor at all") and everything here resolves the
// actual number against TRUE current data — a fresh query, never limited to
// whatever the requesting view had loaded or displayed. This is what
// prevents a narrowed view (e.g. a subproject board that only loaded its
// own items) from silently reordering items it never saw.
//
// A "scope" is any Drizzle SQL predicate identifying "what else does this
// item's position get compared against" — same workphaseId, same
// (parentId, isAttached), or workphaseId IN a merged column's covered set.
// This module is deliberately scope-agnostic; callers own the scope rule.

export type Side = 'before' | 'after';

const MAX_COARSEST_FIT_DECIMALS = 12;

function roundToDecimals(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

// Search increasing decimal precision for the coarsest value that still
// fits strictly between two true neighbors, rather than always taking the
// raw arithmetic midpoint. Example: between 1.5 and 2.0, the raw midpoint is
// 1.75, but 1.8 already fits (1 decimal), so 1.8 wins. Returns null if the
// gap is exhausted even at max precision — the caller should reindex the
// scope and retry, not keep searching deeper.
export function coarsestFit(prev: number, next: number): number | null {
  const midpoint = (prev + next) / 2;
  for (let decimals = 0; decimals <= MAX_COARSEST_FIT_DECIMALS; decimals++) {
    const candidate = roundToDecimals(midpoint, decimals);
    if (candidate > prev && candidate < next) return candidate;
  }
  return null;
}

// Reindex every item in a scope to clean, sequential integer positions,
// preserving current relative order. The shared primitive behind both the
// tight-gap and magnitude-threshold triggers below — generalizes
// `boardDndUtils.ts::computeSameWorkphaseReorder`'s shape (client-side,
// one workphase) to run server-side over any comparison scope. Lazy and
// reactive only — never call this from a scheduled job or a whole-project
// sweep; it's meant to fire as a side effect of a write that's already
// happening.
export function reindexScope(scopeWhere: SQL, tx?: Tx): void {
  const e = tx ?? db;
  const rows = e
    .select({ id: items.id, position: items.position, createdAt: items.createdAt })
    .from(items)
    .where(scopeWhere)
    .orderBy(asc(items.position), asc(items.createdAt))
    .all();

  const now = Date.now();
  rows.forEach((row, index) => {
    e.update(items).set({ position: index + 1, updatedAt: now }).where(eq(items.id, row.id)).run();
  });
}

function scopeItemCount(scopeWhere: SQL, tx?: Tx): number {
  const e = tx ?? db;
  return e.select({ id: items.id }).from(items).where(scopeWhere).all().length;
}

// The magnitude-threshold trigger: does appending/prepending past
// `candidate` move far enough from proportionate that this scope should be
// reindexed first? Scales with how many items are actually in the scope
// (1000 as a floor) rather than a flat number — a scope that genuinely
// holds 1200 items shouldn't reindex on every append just because a flat
// threshold would otherwise fire constantly and uselessly for it. Checked
// against the magnitude (not just the positive case) so a long run of
// prepends is covered symmetrically with a long run of appends.
function exceedsMagnitudeThreshold(candidate: number, scopeWhere: SQL, tx?: Tx): boolean {
  const count = scopeItemCount(scopeWhere, tx);
  const threshold = Math.max(1000, count + 100);
  return Math.abs(candidate) > threshold;
}

// Core resolution shared by the anchor-based and append-only entry points
// below. `getNearPosition` is a closure so it can be re-queried for a fresh
// value after a reindex (the position it returned before the reindex is now
// stale). `allowRetry` bounds retries to one level — after a reindex, the
// scope's positions are freshly-spaced sequential integers, so a second
// tight-gap or magnitude hit on the same operation should not occur.
function resolveNear(getNearPosition: () => number | null, side: Side, scopeWhere: SQL, tx: Tx | undefined, allowRetry: boolean): number {
  const e = tx ?? db;
  const nearPosition = getNearPosition();

  if (nearPosition === null) {
    // Empty scope — bootstrap. A rank-aware bootstrap (anchor to the
    // nearest non-empty workphase by rank, rather than restarting at a
    // fixed baseline — the fix for the original independent-counter-
    // collision bug) is a workphase-specific refinement layered in by
    // whichever caller has workphase-rank context; this generic resolver
    // only knows about "scope", not "workphase", so it defaults to the
    // same simple base case `nextPosition` already used for an empty list.
    return 1.0;
  }

  const boundingNeighbor =
    side === 'after'
      ? e
          .select({ position: items.position })
          .from(items)
          .where(and(scopeWhere, gt(items.position, nearPosition)))
          .orderBy(asc(items.position))
          .limit(1)
          .get()
      : e
          .select({ position: items.position })
          .from(items)
          .where(and(scopeWhere, lt(items.position, nearPosition)))
          .orderBy(desc(items.position))
          .limit(1)
          .get();

  if (boundingNeighbor?.position != null) {
    const [prev, next] = side === 'after' ? [nearPosition, boundingNeighbor.position] : [boundingNeighbor.position, nearPosition];
    const fit = coarsestFit(prev, next);
    if (fit !== null) return fit;

    if (!allowRetry) {
      throw new Error('positionResolver: precision exhausted even after a reindex — this should not happen');
    }
    reindexScope(scopeWhere, tx);
    return resolveNear(getNearPosition, side, scopeWhere, tx, false);
  }

  // No true bounding neighbor beyond nearPosition — degenerate append
  // fallback. Provably always past nearPosition: rounding perturbs by at
  // most 0.5, the offset is a full 1.0.
  const direction = side === 'after' ? 1 : -1;
  const candidate = Math.round(nearPosition + direction * 1.0);

  if (allowRetry && exceedsMagnitudeThreshold(candidate, scopeWhere, tx)) {
    reindexScope(scopeWhere, tx);
    return resolveNear(getNearPosition, side, scopeWhere, tx, false);
  }
  return candidate;
}

// Main `{anchor, side}` entry point: insert immediately before/after a
// specific item, resolved against that item's TRUE current neighbor (found
// by querying the full scope, regardless of what's currently displayed) —
// not a value the client computed itself.
export function resolveAnchorPosition(anchorId: string, side: Side, scopeWhere: SQL, tx?: Tx): number {
  const e = tx ?? db;
  const getAnchorPosition = () => {
    const anchor = e.select({ position: items.position }).from(items).where(eq(items.id, anchorId)).get();
    if (!anchor) throw new Error(`positionResolver: anchor ${anchorId} not found`);
    return anchor.position;
  };

  const anchorPosition = getAnchorPosition();
  if (anchorPosition === null) {
    throw new Error(`positionResolver: anchor ${anchorId} has no position (likely a done item — see Part 6)`);
  }
  return resolveNear(getAnchorPosition, side, scopeWhere, tx, true);
}

// Append-only entry point: no anchor at all — item creation with no
// explicit position, or a move/drop with no specific target card. Resolves
// past the scope's true last item (or the empty-scope bootstrap above).
export function resolveAppendPosition(scopeWhere: SQL, tx?: Tx): number {
  const e = tx ?? db;
  const getLastPosition = () => {
    const last = e.select({ position: items.position }).from(items).where(scopeWhere).orderBy(desc(items.position)).limit(1).get();
    return last?.position ?? null;
  };
  return resolveNear(getLastPosition, 'after', scopeWhere, tx, true);
}

// ── Computed `positionScope` (Part 2) ───────────────────────────────────
//
// Purely derived, never stored — tells a client, or a human reading the API
// directly, what an item's `position` is actually comparable *against*
// without re-deriving it from isAttached/parentId/workphaseId/
// workphase.isTerminal itself.

export type PositionScope = 'attached-siblings' | 'workphase' | 'none';

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
  return 'workphase';
}
