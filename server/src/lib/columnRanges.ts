import { db } from '../db/index.js';
import { boards, columns, workphases } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

type Workphase = typeof workphases.$inferSelect;
type ColumnRow = typeof columns.$inferSelect;
type ItemRow = { workphaseId: string | null } & Record<string, unknown>;
type ColumnRange = { startWorkphaseId: string; endWorkphaseId: string };

// ============================================================
// Column-range domain logic — shared by boards.ts, columns.ts, and
// workphases.ts so a board's columns can express a contiguous range of
// workphases without those routes importing from one another.
// ============================================================

// Maps workphase id -> ordinal rank among workphases sorted by position.
// Ranks (not raw float positions) sidestep float-precision edge cases.
export function buildRankMap(orderedWorkphases: Workphase[]): Map<string, number> {
  const map = new Map<string, number>();
  orderedWorkphases.forEach((w, i) => map.set(w.id, i));
  return map;
}

// Fetches a workflow's workphases ordered by position plus the rank map
// derived from them — the query + buildRankMap pairing every route needing
// column-range math repeats.
export function getOrderedWorkphases(workflowId: string): { workphases: Workphase[]; rankMap: Map<string, number> } {
  const ordered = db.select().from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all();
  return { workphases: ordered, rankMap: buildRankMap(ordered) };
}

// [lowRank, highRank] for a range. Uses min/max so an inverted (broken) range
// still resolves to a coverage set instead of nothing.
export function computeColumnRange(range: ColumnRange, rankMap: Map<string, number>): [number, number] | null {
  const startRank = rankMap.get(range.startWorkphaseId);
  const endRank = rankMap.get(range.endWorkphaseId);
  if (startRank === undefined || endRank === undefined) return null;
  return startRank <= endRank ? [startRank, endRank] : [endRank, startRank];
}

// A range is "broken" only when its start/end have crossed over (e.g. via an
// independent workphase reorder) — never stored, always recomputed on read.
export function isColumnBroken(range: ColumnRange, rankMap: Map<string, number>): boolean {
  const startRank = rankMap.get(range.startWorkphaseId);
  const endRank = rankMap.get(range.endWorkphaseId);
  if (startRank === undefined || endRank === undefined) return true;
  return startRank > endRank;
}

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
type DbClient = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

// Recomputes every column's range after `deletedWorkphaseId` is removed from
// `workflowId`. Called from workphases.ts DELETE, before the workphase row
// itself is deleted, both wrapped in one transaction — interior deletions
// resolve to a no-op write (the range still shrinks naturally at the next
// read); boundary deletions repoint the FK to the next remaining covered
// workphase; a column whose sole covered workphase is the one being deleted
// is deleted outright (both FKs are NOT NULL — a dangling reference isn't
// possible).
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
  const originalWorkphases = client.select().from(workphases)
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
      client.update(columns)
        .set({ startWorkphaseId: newStart, endWorkphaseId: newEnd })
        .where(eq(columns.id, col.id))
        .run();
      shrunkColumns.push({ ...col, startWorkphaseId: newStart, endWorkphaseId: newEnd });
    }
  }

  return { shrunkColumns, deletedColumns };
}
