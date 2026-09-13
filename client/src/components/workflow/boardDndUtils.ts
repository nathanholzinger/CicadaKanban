import { closestCorners, type CollisionDetection } from '@dnd-kit/core';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import type { Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { Band, DragRegion, Rect } from './dragRegions';

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

// What the collision closure needs to know about the live pop session
// (Epic 3.5 Story 3) — a read-only view the hook keeps in a ref.
export interface CollisionSession {
  /** The cursor is in a region other than the context: that region's droppable container. */
  hoverContainerId: string | null;
  /** The context region — in-context candidates are its container and the cards inside it. Null when the drag began outside any region (Unsorted). */
  context: { containerId: string; rect: Rect } | null;
}

// `over` is what drives dnd-kit's sortable shifting and the side indicator,
// so it has to agree with the pop machine (wiki board-drag-interaction
// §2–§3, §5), which is why this is a factory over the live session rather
// than a constant:
//
//   - Card drag, cursor in the context (or nowhere): closestCorners over the
//     context's container and the cards whose rect lies inside it — the
//     in-context reorder, unchanged in feel from Epic 3.2.
//   - Card drag, cursor in another region: `over` is that region's container
//     and never a card in it, so the target column's sortable doesn't shift
//     against a hover the band ignores; the ghost's index comes from the
//     placement alone. After a pop the region *is* the context.
//   - Card drag with no context (picked up in Unsorted) and no hover: nothing.
//
// Epic 3.2 Part 3, unchanged: attached-child rows are only ever valid
// collision targets for another attached-child drag under the *same* parent
// — never for a card or column drag, and never for a different parent's
// children. dnd-kit has no notion of a nested child being "inside" the
// dragged card, so it has to be told to ignore it here.
export function resolveBoardCollisions(
  args: Parameters<CollisionDetection>[0],
  liveSession: CollisionSession | null,
): ReturnType<CollisionDetection> {
  const activeData = args.active.data.current;
  const session = activeData?.type === 'card' ? liveSession : null;

  if (session?.hoverContainerId) {
    const container = args.droppableContainers.find(c => c.id === session.hoverContainerId);
    return container ? [{ id: container.id, data: { droppableContainer: container, value: 0 } }] : [];
  }

  const droppableContainers = args.droppableContainers.filter(container => {
    if (container.id === args.active.id) return false; // never collide with self
    const data = container.data.current;
    if (activeData?.type === 'attached-child') {
      return data?.type === 'attached-child' && data?.parentId === activeData.parentId;
    }
    if (data?.type === 'attached-child') return false;
    if (!session) return true; // column drag, or no machine in play
    if (!session.context) return false;
    if (container.id === session.context.containerId) return true;
    const rect = args.droppableRects.get(container.id);
    return data?.type === 'card' && rect !== undefined && rectCenterInside(rect, session.context.rect);
  });
  return closestCorners({ ...args, droppableContainers });
}

export function createBoardCollisionDetection(getSession: () => CollisionSession | null): CollisionDetection {
  return args => resolveBoardCollisions(args, getSession());
}

function rectCenterInside(rect: Rect, bounds: Rect): boolean {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return cx >= bounds.left && cx <= bounds.right && cy >= bounds.top && cy <= bounds.bottom;
}

export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string; isTerminal?: number | boolean } }>;
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

// Epic 3.5 Story 3 — what a release in another region's band means (wiki
// board-drag-interaction §5, item-positioning §7). `regionItems` is the
// region's *rendered* list, so "first"/"last" are read off the client's own
// order under the tie-break (TC-7.3/7.4); the carried item is skipped if the
// preview already drew it there. Returns null when the band asks for
// nothing the item doesn't already have — a covered-set member in the
// middle band, or in an empty/done region (DRAG-3.7/3.10).
//
//   top    → { anchorId: first, side: 'before' }          (TC-7.1)
//   bottom → { anchorId: last,  side: 'after' }           (TC-7.2)
//   middle → workphase-only: position kept                (TC-7.16)
//   empty or done region → workphase-only, any band       (TC-7.5, 7.8)
export function bandDropResolution(
  region: DragRegion,
  band: Band,
  active: { id: string; workphaseId: string | null },
  regionItems: readonly { id: string }[],
): { resolution: DropResolution; side: 'before' | 'after' } | null {
  const others = regionItems.filter(i => i.id !== active.id);
  const member = active.workphaseId !== null && region.coveredWorkphaseIds.includes(active.workphaseId);

  let anchorId: string | null = null;
  let side: 'before' | 'after' = 'before';
  if (!region.isTerminal && others.length > 0 && band !== 'middle') {
    anchorId = band === 'top' ? others[0].id : others[others.length - 1].id;
    side = band === 'top' ? 'before' : 'after';
  }

  if (member) {
    if (!anchorId) return null;
    return { resolution: { kind: 'reorder', scopeWorkphaseIds: region.coveredWorkphaseIds, anchorId }, side };
  }
  return { resolution: { kind: 'move', targetWorkphaseId: region.targetWorkphaseId, anchorId }, side };
}

// The ordinal claim a move request makes — what the board keeps drawing
// until the response lands (§10's pending marker). `workphaseId` is the
// list the item is drawn in: the request's target, else its own.
export function pendingPlacementFor(input: MoveItemInput, ownWorkphaseId: string | null): Placement {
  const workphaseId = input.workphaseId ?? ownWorkphaseId ?? undefined;
  if (input.anchorId && input.side) return { workphaseId, slot: { anchorId: input.anchorId, side: input.side } };
  // A bare workphase change keeps its position; a bare same-group reorder is
  // an append (server: itemHierarchy.ts's position resolution).
  return { workphaseId, slot: input.workphaseId ? 'existing' : 'last' };
}

// The one "send a move, fold the response in, or resync" block: on success
// the response is folded in through the write tracker (§5a order, stale
// responses dropped — DRAG-6.5), on failure the pending placement is
// cleared and the board reloads — the server's resolution is authoritative
// over a client guess, which is never kept (DRAG-6.6). Every board-gesture
// write path goes through here (Card drops via buildMoveInput, attached-
// sibling reorders with a bare anchor) so the contract can't drift between
// them (audit epic-3-5-story-2 #4). `moveItem` is dependency-injected so a
// test can substitute a rejecting stub without mocking the module.
export async function sendItemMove(
  moveItem: (id: string, data: MoveItemInput) => Promise<ItemWriteResponse>,
  activeId: string,
  input: MoveItemInput,
  pending: Placement | null,
  writes: ItemWriteTracker,
  loadBoard: () => void,
): Promise<void> {
  const seq = writes.begin(activeId, pending);
  try {
    const updated = await moveItem(activeId, input);
    writes.complete(activeId, seq, updated);
  } catch (err) {
    console.error('Failed to move item:', err);
    writes.fail(activeId, seq);
    loadBoard();
  }
}
