// An item's position scope: classifyPositionScope and withPositionScope label what its
// `position` is comparable against for API consumers, and positionScopeFor is the same rule
// as a SQL predicate. Also here: isTerminalLookup, which builds the lookup withPositionScope
// takes, and workflowIdForWorkphase. Distinct from positionResolver.ts, which computes and
// writes the position value itself.
//
// Items-only vocabulary (isAttached/parentId/workphaseId/workphaseIsTerminal) — not
// table-generic the way positionResolver.ts is, so this doesn't apply to projects or any
// other PositionedTable. positionScopeFor is classifyPositionScope's rule expressed as a
// query instead of a string, so it lives here rather than in positionResolver.ts. Also used
// by itemHierarchy.ts and the item, board, workflow and workphase routes.
import { and, eq, inArray, isNotNull, not, type SQL } from 'drizzle-orm';
import type { Tx } from '../db/index.js';
import { db } from '../db/index.js';
import { items, workphases } from '../db/schema.js';

export type PositionScope = 'attached-siblings' | 'workflow' | 'none';

// `workphaseIsTerminal` is null when the item's workphase isn't one of the
// workflow its project uses (wiki item-positioning §2): the item shows in
// Unsorted, like one with no workphase.
export function classifyPositionScope(
  item: { isAttached: boolean; parentId: string | null; workphaseId: string | null },
  workphaseIsTerminal: boolean | null,
): PositionScope {
  if (item.isAttached && item.parentId) return 'attached-siblings';
  // Unsorted: not position-ordered at all, the same practical bucket as a done item
  // even though the reason differs.
  if (item.workphaseId === null || workphaseIsTerminal === null) return 'none';
  // Done item — ordered by completedAt, not position.
  if (workphaseIsTerminal) return 'none';
  // Comparable against every other active item in the same workflow, not
  // just the same workphase — see positionScopeFor.
  return 'workflow';
}

// Attaches the computed, read-only `positionScope` field (wiki item-positioning §2)
// to an item row before it goes out over the API, telling a client what the
// item's `position` is actually comparable against without it re-deriving
// isAttached/parentId/workphaseId/workphase.isTerminal itself.
//
// `isTerminalOf` is a caller-supplied lookup rather than a live query here, so a caller
// mapping many rows can build it once (isTerminalLookup below) instead of querying per row.
// It answers null for a workphase the item's project's workflow doesn't use, which
// classifyPositionScope's `workphaseIsTerminal` expects.
export function withPositionScope<
  T extends { isAttached: number | boolean; parentId: string | null; workphaseId: string | null },
>(item: T, isTerminalOf: (workphaseId: string) => boolean | null): T & { positionScope: PositionScope } {
  const workphaseIsTerminal = item.workphaseId ? isTerminalOf(item.workphaseId) : null;
  const positionScope = classifyPositionScope(
    { isAttached: Boolean(item.isAttached), parentId: item.parentId, workphaseId: item.workphaseId },
    workphaseIsTerminal,
  );
  return { ...item, positionScope };
}

// Builds the `isTerminalOf` lookup withPositionScope above needs, from a
// batch of already-fetched workphase rows (each caller decides which rows —
// a whole board's worth, an item + its children, or a whole workflow's).
export function isTerminalLookup<T extends { id: string; isTerminal: number | boolean }>(
  rows: T[],
): (workphaseId: string) => boolean | null {
  const map = new Map(rows.map(w => [w.id, Boolean(w.isTerminal)] as const));
  return (workphaseId: string) => map.get(workphaseId) ?? null;
}

// The position-comparison scope for an item: parent-scoped
// (parentId, isAttached) for an attached child, its true siblings
// (wiki item-positioning §3), or workflow-scoped for everything else
// (wiki item-positioning §2). So every detached/root item's scope is every
// workphaseId sharing its current workphase's workflowId, not just that one
// workphase — always excluding attached children, since they render nested
// under their parent rather than as flat list members (the same filter as
// the client's `itemListOps.ts::selectBoardItems`). `excludeId` keeps the
// subject's own (possibly just-updated) row out of its own scope query.
export function positionScopeFor(
  subject: { isAttached: boolean; parentId: string | null; workphaseId: string | null },
  excludeId?: string,
  tx?: Tx,
): SQL {
  const base: SQL =
    subject.isAttached && subject.parentId
      ? and(eq(items.parentId, subject.parentId), eq(items.isAttached, 1))!
      : and(
          inArray(items.workphaseId, subject.workphaseId ? workphaseIdsInSameWorkflow(subject.workphaseId, tx) : []),
          not(and(eq(items.isAttached, 1), isNotNull(items.parentId))!),
        )!;
  return excludeId ? and(base, not(eq(items.id, excludeId)))! : base;
}

// Resolves the workflowId a workphase belongs to, or null if the workphase
// doesn't exist.
export function workflowIdForWorkphase(workphaseId: string, tx?: Tx): string | null {
  const e = tx ?? db;
  const workphase = e
    .select({ workflowId: workphases.workflowId })
    .from(workphases)
    .where(eq(workphases.id, workphaseId))
    .get();
  return workphase?.workflowId ?? null;
}

// Every workphaseId belonging to the same workflow as `workphaseId` —
// resolves a detached/root item's true comparison scope (above). Falls back
// to just the given id if it doesn't resolve to a workflow (shouldn't
// happen for a valid FK, but keeps this from silently scoping to nothing).
function workphaseIdsInSameWorkflow(workphaseId: string, tx?: Tx): string[] {
  const workflowId = workflowIdForWorkphase(workphaseId, tx);
  if (!workflowId) return [workphaseId];
  const e = tx ?? db;
  return e
    .select({ id: workphases.id })
    .from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .all()
    .map(w => w.id);
}
