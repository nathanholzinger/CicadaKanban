// Classifies what an item's `position` is comparable against for API
// consumers — distinct from positionResolver.ts, which computes/writes the
// position value itself. Shared by items.ts and boards.ts so neither route
// file imports from the other.
//
// Items-only vocabulary (isAttached/parentId/workphaseId/workphaseIsTerminal)
// — not table-generic the way positionResolver.ts is, so this doesn't apply
// to projects or any other PositionedTable.
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
