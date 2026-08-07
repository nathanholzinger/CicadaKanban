import { closestCorners, type CollisionDetection } from '@dnd-kit/core';

// Pure drop-resolution for the board's drag-and-drop, extracted from
// useBoardDnd so it can be unit tested — real drag gestures are deliberately
// not simulated in the E2E suite. Structural subset types keep the
// functions testable without full Column/Item fixtures.
//
// Epic 3.2: position values are no longer computed here — the server
// resolves them against true current data (see positionResolver.ts). This
// module's job is purely to decide *what kind* of drop this is (a
// same-visual-group reorder vs. a genuine cross-column move) and *what
// scope/anchor* to hand to the API.

// Epic 3.2 Part 3: attached-child rows are only ever valid collision targets
// for another attached-child drag under the *same* parent — never for a
// top-level card or column drag, and never for a different parent's
// children. Without this, dragging a parent card whose attached child
// optimistically followed it into the hovered column (via
// handleDragOver's live re-bucket preview, since the child is still
// visually nested inside the still-being-dragged parent) ends up colliding
// with that now-draggable nested child instead of the column itself —
// dnd-kit has no inherent notion of the child being "inside" the dragged
// card, so it has to be told explicitly to ignore it here.
export const boardCollisionDetection: CollisionDetection = args => {
  const activeData = args.active.data.current;
  const droppableContainers = args.droppableContainers.filter(container => {
    if (container.id === args.active.id) return false; // never collide with self
    const data = container.data.current;
    if (activeData?.type === 'attached-child') {
      return data?.type === 'attached-child' && data?.parentId === activeData.parentId;
    }
    return data?.type !== 'attached-child';
  });
  return closestCorners({ ...args, droppableContainers });
};

export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string } }>;
}

// Maps every covered workphase id -> the column that covers it.
export function buildColumnForWorkphaseMap<C extends DropColumn>(columns: readonly C[]): Map<string, C> {
  const map = new Map<string, C>();
  for (const col of columns) {
    for (const row of col.subRows) map.set(row.workphase.id, col);
  }
  return map;
}

// Encodes a droppable id for an expanded column's per-workphase sub-row.
// Paired with the `subrow::` decode branch in resolveDropTarget below — keep
// them in the same file so the id format only needs to be understood once.
export function subrowContainerId(columnId: string, workphaseId: string): string {
  return `subrow::${columnId}::${workphaseId}`;
}

export type DropResolution =
  // Same-visual-group reorder: position-only, workphaceId untouched —
  // covers a plain same-workphase reorder (scopeWorkphaseIds has one entry)
  // and a merged-column interleave (scopeWorkphaseIds has the column's full
  // covered set). `anchorId` is the hovered card's id, or null when a
  // container (not a specific card) was hovered — the server appends to the
  // end of the scope in that case.
  | { kind: 'reorder'; scopeWorkphaseIds: string[]; anchorId: string | null }
  // Genuine cross-column move: workphaceId changes to targetWorkphaseId.
  // `anchorId` is the hovered card's id for precise before/after placement,
  // or null when a container was hovered (server appends to the target).
  | { kind: 'move'; targetWorkphaseId: string; anchorId: string | null };

// Resolves a dnd-kit `over.id` (plus which item is being dragged) to how the
// drop should be applied. The key fix over the pre-Epic-3.2 version: a
// merged column no longer always collapses to its entryWorkphaseId
// regardless of the hovered card's real workphase (which either silently
// no-op'd or silently performed an unintended workphase change, depending on
// drag direction) — instead it checks whether the *active* item's current
// workphaseId is already a member of the target column's covered set. If
// so, this is a same-visual-group reorder; if not, it's a genuine
// cross-column move. Returns null when there's no valid drop target
// (Unsorted, a broken column, or an expanded column's outer wrapper —
// expanded mode requires dropping on a specific sub-row for precision).
//
// `activeWorkphaseId` must be the active item's *original* (pre-drag)
// workphace, not a live lookup — the caller's drag-over handler optimistically
// re-buckets the dragged item's workphaceId in local state for the live
// preview, so re-deriving it from current state here would see that
// already-mutated value and misjudge a genuine cross-column move as an
// already-same-group reorder partway through the drag. Callers should
// resolve it once, from the stable item captured at drag-start (e.g.
// `activeItem`), and pass the same value on every call for the gesture.
export function resolveDropTarget(
  activeId: string,
  activeWorkphaseId: string | null,
  overId: string,
  columns: readonly DropColumn[],
  columnForWorkphase: Map<string, DropColumn>,
  findWorkphaseForItem: (itemId: string) => string | null,
): DropResolution | null {
  if (activeId === overId) return null;

  if (overId.startsWith('subrow::')) {
    const workphaseId = overId.split('::')[2];
    const col = columnForWorkphase.get(workphaseId);
    if (!col || col.broken) return null;
    return activeWorkphaseId === workphaseId
      ? { kind: 'reorder', scopeWorkphaseIds: [workphaseId], anchorId: null }
      : { kind: 'move', targetWorkphaseId: workphaseId, anchorId: null };
  }

  const hoveredColumn = columns.find(c => c.id === overId);
  if (hoveredColumn) {
    if (hoveredColumn.broken || hoveredColumn.displayMode !== 'merged') return null;
    const coveredIds = hoveredColumn.subRows.map(r => r.workphase.id);
    const isMember = activeWorkphaseId !== null && coveredIds.includes(activeWorkphaseId);
    return isMember
      ? { kind: 'reorder', scopeWorkphaseIds: coveredIds, anchorId: null }
      : { kind: 'move', targetWorkphaseId: hoveredColumn.entryWorkphaseId, anchorId: null };
  }

  const hoverWorkphaseId = findWorkphaseForItem(overId);
  if (!hoverWorkphaseId) return null;
  const col = columnForWorkphase.get(hoverWorkphaseId);
  if (!col || col.broken) return null;

  if (col.displayMode === 'expanded') {
    return activeWorkphaseId === hoverWorkphaseId
      ? { kind: 'reorder', scopeWorkphaseIds: [hoverWorkphaseId], anchorId: overId }
      : { kind: 'move', targetWorkphaseId: hoverWorkphaseId, anchorId: overId };
  }

  // Merged column, hovering a specific card: same-visual-group membership is
  // determined by the *active* item's workphase against the whole covered
  // set, not by comparing to the specific hovered card's own workphase.
  const coveredIds = col.subRows.map(r => r.workphase.id);
  const isMember = activeWorkphaseId !== null && coveredIds.includes(activeWorkphaseId);
  return isMember
    ? { kind: 'reorder', scopeWorkphaseIds: coveredIds, anchorId: overId }
    : { kind: 'move', targetWorkphaseId: col.entryWorkphaseId, anchorId: overId };
}
