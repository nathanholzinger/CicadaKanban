// Range coverage/overlap/broken-column detection, range validation and the
// Unsorted bucket for board columns. Shrink-on-workphase-delete and the
// terminal-flip check also live here.

import { db, type Tx } from '../db/index.js';
import { boards, columns, workphases } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { buildRankMap } from './workphaseOrder.js';

type Workphase = typeof workphases.$inferSelect;
type ColumnRow = typeof columns.$inferSelect;
type ItemRow = { workphaseId: string | null } & Record<string, unknown>;
type ColumnRange = { startWorkphaseId: string; endWorkphaseId: string };

// ============================================================
// Column-range domain logic, so a board's columns can express a contiguous range of
// workphases without the routes that deal in them importing from one another.
// ============================================================

// [lowRank, highRank] for a range. Uses min/max so an inverted (broken) range
// still resolves to a coverage set instead of nothing (wiki boards-columns-unsorted §9).
export function computeColumnRange(range: ColumnRange, rankMap: Map<string, number>): [number, number] | null {
  const startRank = rankMap.get(range.startWorkphaseId);
  const endRank = rankMap.get(range.endWorkphaseId);
  if (startRank === undefined || endRank === undefined) return null;
  return startRank <= endRank ? [startRank, endRank] : [endRank, startRank];
}

// A range is "broken" when its start/end have crossed over (e.g. via an independent
// workphase reorder) or when either names a workphase the workflow doesn't have — never
// stored, always recomputed on read (wiki boards-columns-unsorted §9).
export function isColumnBroken(range: ColumnRange, rankMap: Map<string, number>): boolean {
  const startRank = rankMap.get(range.startWorkphaseId);
  const endRank = rankMap.get(range.endWorkphaseId);
  if (startRank === undefined || endRank === undefined) return true;
  return startRank > endRank;
}

// What a column covers is worked out from the workflow's current order on every
// read (wiki boards-columns-unsorted §4).
export function getCoveredWorkphases(
  range: ColumnRange,
  orderedWorkphases: Workphase[],
  rankMap: Map<string, number>,
): Workphase[] {
  const bounds = computeColumnRange(range, rankMap);
  if (!bounds) return [];
  const [lo, hi] = bounds;
  return orderedWorkphases.slice(lo, hi + 1);
}

export function columnsOverlap(a: ColumnRange, b: ColumnRange, rankMap: Map<string, number>): boolean {
  const rangeA = computeColumnRange(a, rankMap);
  const rangeB = computeColumnRange(b, rankMap);
  if (!rangeA || !rangeB) return false;
  return rangeA[0] <= rangeB[1] && rangeB[0] <= rangeA[1];
}

type ColumnRangeValidation =
  { ok: true } | { ok: false; status: number; body: { error: string; conflictingColumnId?: string } };

// The range check for a column being created or updated: both endpoints belong to this
// workflow, start doesn't come after end (wiki boards-columns-unsorted §5), the
// range doesn't overlap a sibling column, and it doesn't span a terminal and a
// non-terminal workphase (wiki boards-columns-unsorted §6).
// `siblingColumns` must leave out the column being updated, which would overlap itself;
// on failure, `status`/`body` are ready to hand straight to `res`.
export function validateColumnRange(
  range: ColumnRange,
  rankMap: Map<string, number>,
  siblingColumns: { id: string; name: string | null; startWorkphaseId: string; endWorkphaseId: string }[],
  orderedWorkphases: Workphase[],
): ColumnRangeValidation {
  if (!rankMap.has(range.startWorkphaseId) || !rankMap.has(range.endWorkphaseId)) {
    return {
      ok: false,
      status: 400,
      body: { error: "startWorkphaseId and endWorkphaseId must belong to this board's workflow" },
    };
  }
  if (rankMap.get(range.startWorkphaseId)! > rankMap.get(range.endWorkphaseId)!) {
    return { ok: false, status: 400, body: { error: 'startWorkphaseId must not come after endWorkphaseId' } };
  }

  const conflict = siblingColumns.find(c => columnsOverlap(range, c, rankMap));
  if (conflict) {
    return {
      ok: false,
      status: 400,
      body: {
        error: `Range overlaps existing column "${conflict.name ?? conflict.id}"`,
        conflictingColumnId: conflict.id,
      },
    };
  }

  // A column can't span both a terminal (done) and a non-terminal (active)
  // workphase (wiki boards-columns-unsorted §6): done items have no stored
  // position at all (ordered by completedAt instead), so a column spanning the
  // boundary would have no coherent order to show.
  const covered = getCoveredWorkphases(range, orderedWorkphases, rankMap);
  const hasTerminal = covered.some(w => w.isTerminal);
  const hasNonTerminal = covered.some(w => !w.isTerminal);
  if (hasTerminal && hasNonTerminal) {
    return {
      ok: false,
      status: 400,
      body: { error: 'A column cannot span both a terminal (done) and a non-terminal workphase' },
    };
  }

  return { ok: true };
}

// The board's Unsorted bucket (wiki boards-columns-unsorted §10).
export function computeUnsorted<T extends ItemRow>(
  orderedWorkphases: Workphase[],
  boardColumns: ColumnRange[],
  rankMap: Map<string, number>,
  workflowItems: T[],
): { uncovered: Workphase[]; invalidItems: T[] } {
  const covered = new Set<string>();
  for (const col of boardColumns) {
    for (const w of getCoveredWorkphases(col, orderedWorkphases, rankMap)) covered.add(w.id);
  }
  const uncovered = orderedWorkphases.filter(w => !covered.has(w.id));

  const workphaseIdSet = new Set(orderedWorkphases.map(w => w.id));
  const invalidItems = workflowItems.filter(i => !i.workphaseId || !workphaseIdSet.has(i.workphaseId));

  return { uncovered, invalidItems };
}

// Same shape as `db`, but also satisfied by the `tx` handle inside a
// db.transaction() callback — lets callers fold this into a larger
// transaction instead of committing its writes independently.
type DbClient = Tx | typeof db;

// Recomputes every column's range after `deletedWorkphaseId` is removed from
// `workflowId` (wiki boards-columns-unsorted §8). Called from workphases.ts
// DELETE, before the workphase row itself is deleted, both wrapped in one
// transaction — interior deletions resolve to a no-op write (the range still
// shrinks naturally at the next read); boundary deletions repoint the FK to
// the next remaining covered workphase; a column whose sole covered workphase
// is the one being deleted is deleted outright (both FKs are NOT NULL — a
// dangling reference isn't possible).
export function shrinkColumnsForDeletedWorkphase(
  client: DbClient,
  deletedWorkphaseId: string,
  workflowId: string,
): { shrunkColumns: ColumnRow[]; deletedColumns: ColumnRow[] } {
  const workflowBoards = client.select().from(boards).where(eq(boards.workflowId, workflowId)).all();
  if (workflowBoards.length === 0) return { shrunkColumns: [], deletedColumns: [] };

  const boardIds = workflowBoards.map(b => b.id);
  const allColumns = client.select().from(columns).where(inArray(columns.boardId, boardIds)).all();
  if (allColumns.length === 0) return { shrunkColumns: [], deletedColumns: [] };

  // Includes the doomed workphase so each column's original coverage can be
  // computed before it's gone.
  const originalWorkphases = client
    .select()
    .from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all();
  const originalRankMap = buildRankMap(originalWorkphases);

  const shrunkColumns: ColumnRow[] = [];
  const deletedColumns: ColumnRow[] = [];

  for (const col of allColumns) {
    const covered = getCoveredWorkphases(col, originalWorkphases, originalRankMap);
    if (!covered.some(w => w.id === deletedWorkphaseId)) continue;

    const remaining = covered.filter(w => w.id !== deletedWorkphaseId);
    if (remaining.length === 0) {
      client.delete(columns).where(eq(columns.id, col.id)).run();
      deletedColumns.push(col);
      continue;
    }

    const newStart = remaining[0].id;
    const newEnd = remaining[remaining.length - 1].id;
    if (newStart !== col.startWorkphaseId || newEnd !== col.endWorkphaseId) {
      client
        .update(columns)
        .set({ startWorkphaseId: newStart, endWorkphaseId: newEnd })
        .where(eq(columns.id, col.id))
        .run();
      shrunkColumns.push({ ...col, startWorkphaseId: newStart, endWorkphaseId: newEnd });
    }
  }

  return { shrunkColumns, deletedColumns };
}

// Read-only check for `PUT /workphases/:id` flipping `isTerminal`: simulates
// the flip against every column covering `flippedWorkphaseId` and returns
// the ones that would end up spanning both a terminal and a non-terminal
// workphase (wiki boards-columns-unsorted §6) — the same invariant
// `validateColumnRange` enforces at column create/update time, just checked
// from the workphase side instead. Call with plain `db` *before* opening a
// transaction (nothing has been written yet, so a conflict can still just
// 400) — the caller only commits the flip once this returns empty.
export function findColumnsMixingTerminalAfterFlip(
  client: DbClient,
  workflowId: string,
  flippedWorkphaseId: string,
  newIsTerminal: boolean,
): ColumnRow[] {
  const workflowBoards = client.select().from(boards).where(eq(boards.workflowId, workflowId)).all();
  if (workflowBoards.length === 0) return [];

  const boardIds = workflowBoards.map(b => b.id);
  const allColumns = client.select().from(columns).where(inArray(columns.boardId, boardIds)).all();
  if (allColumns.length === 0) return [];

  const orderedWorkphases = client
    .select()
    .from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all()
    .map(w => (w.id === flippedWorkphaseId ? { ...w, isTerminal: newIsTerminal ? 1 : 0 } : w));
  const rankMap = buildRankMap(orderedWorkphases);

  return allColumns.filter(col => {
    const covered = getCoveredWorkphases(col, orderedWorkphases, rankMap);
    if (!covered.some(w => w.id === flippedWorkphaseId)) return false;
    const hasTerminal = covered.some(w => w.isTerminal);
    const hasNonTerminal = covered.some(w => !w.isTerminal);
    return hasTerminal && hasNonTerminal;
  });
}
