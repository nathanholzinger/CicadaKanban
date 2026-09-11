import { closestCorners, type CollisionDetection } from '@dnd-kit/core';
import type { Item } from '../../types';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import { applyItemWriteResponse } from './useItemManagement';

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
  // Same-visual-group reorder: position-only, workphaseId untouched —
  // covers a plain same-workphase reorder (scopeWorkphaseIds has one entry)
  // and a merged-column interleave (scopeWorkphaseIds has the column's full
  // covered set). `anchorId` is the hovered card's id, or null when a
  // container (not a specific card) was hovered — the server appends to the
  // end of the scope in that case.
  | { kind: 'reorder'; scopeWorkphaseIds: string[]; anchorId: string | null }
  // Genuine cross-column move: workphaseId changes to targetWorkphaseId.
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
// workphase, not a live lookup — the caller's drag-over handler optimistically
// re-buckets the dragged item's workphaseId in local state for the live
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

// Narrowed structural subset of dnd-kit's ClientRect — only what
// resolveDropSide needs, so callers can pass either a real ClientRect or a
// plain fixture without importing dnd-kit's type.
export interface VerticalRect {
  top: number;
  height: number;
}

// `over.rect` and `active.rect.current.translated` are measured via two
// independent tracking paths (a droppable's periodic getBoundingClientRect
// snapshot vs. initial rect + accumulated pointer delta) — expected to
// agree closely but not always bit-identically, especially under a real
// mouse-driven drag. A 1px tie band keeps an exact/near-exact center drop
// resolving to 'before' (matching today's default, and what dropping
// squarely onto a card is expected to do) without blurring a genuine
// top-quarter/bottom-quarter drop, which sits ~10-12px further out.
const SIDE_TIE_EPSILON_PX = 1;

// Which side of the hovered card a drop resolves to — 'before' if the
// dragged card's current center sits at or above the hovered card's
// center (within the tie epsilon), 'after' otherwise. Pure geometry, no
// dnd-kit types required directly. Missing rects (dnd-kit's
// `active.rect.current.translated` can be null before the first measured
// frame) fail safe to 'before' rather than throwing.
export function resolveDropSide(
  activeRect: VerticalRect | null | undefined,
  overRect: VerticalRect | null | undefined,
): 'before' | 'after' {
  if (!activeRect || !overRect) return 'before';

  const activeCenterY = activeRect.top + activeRect.height / 2;
  const overCenterY = overRect.top + overRect.height / 2;

  return activeCenterY <= overCenterY + SIDE_TIE_EPSILON_PX ? 'before' : 'after';
}

// The PATCH /items/:id/move body a resolved Card drop turns into: a
// same-group reorder sends the legacy scope shape, a cross-column move sends
// the target workphase; either carries `{anchorId, side}` when there's a
// card to anchor against (TC-2.11). Pure — the request literal is the part
// worth pinning in a test.
export function buildMoveInput(resolution: DropResolution, side: 'before' | 'after'): MoveItemInput {
  const anchor = resolution.anchorId ? { anchorId: resolution.anchorId, side } : {};
  return resolution.kind === 'reorder'
    ? { scopeWorkphaseIds: resolution.scopeWorkphaseIds, ...anchor }
    : { workphaseId: resolution.targetWorkphaseId, ...anchor };
}

// The one "send a move, fold the response in, or resync" block: on success
// updates local state (folding in any reindex the server disclosed — Epic
// 3.5, applyItemWriteResponse), on failure falls back to a full board
// reload — the server's resolution is authoritative over a stale client
// guess. Every board-gesture write path goes through here (Card drops via
// buildMoveInput, attached-sibling reorders with a bare anchor) so the
// fold/resync contract can't drift between them (audit epic-3-5-story-2
// #4). `moveItem` is dependency-injected (not imported directly) purely so
// a test can substitute a rejecting stub without mocking the module;
// production code always passes the real client/src/api/items.ts moveItem.
export async function sendItemMove(
  moveItem: (id: string, data: MoveItemInput) => Promise<ItemWriteResponse>,
  activeId: string,
  input: MoveItemInput,
  setItems: (updater: (prev: Item[]) => Item[]) => void,
  loadBoard: () => void,
): Promise<void> {
  try {
    const updated = await moveItem(activeId, input);
    setItems(prev => applyItemWriteResponse(prev, updated));
  } catch (err) {
    console.error('Failed to move item:', err);
    loadBoard();
  }
}
