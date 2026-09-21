// Collision detection + request-shape helpers for the board drag gesture:
// toRequest (placement → API request) and isIdentity (recognizes a no-op placement).

import { closestCorners, type CollisionDetection } from '@dnd-kit/core';
import type { Item } from '../../types';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import type { Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import { containsPoint, type Rect } from './dragRegions';

// Pure drop-resolution for the board's drag-and-drop, extracted from
// useBoardDnd so it can be unit tested — real drag gestures are deliberately
// not simulated in the E2E suite. Structural subset types keep the
// functions testable without full Column/Item fixtures.
//
// Epic 3.2: position values are no longer computed here — the server
// resolves them against true current data (see positionResolver.ts). Story
// 4.1 Phase 3: this module's job is `toRequest` — adapting the pop
// machine's own placement (popSession.ts::placementFor) into the API's
// terms, and `isIdentity`, the "nothing to write" half of that same
// question — not deciding a drop's kind from dnd-kit's `over` independently
// the way `resolveDropTarget` used to (deleted this phase; F3).

// What the collision closure needs to know about the live pop session
// (Epic 3.5 Story 3) — a read-only view the hook keeps in a ref.
export interface CollisionSession {
  /** Board layer, hovering a column/sub-row: that region's droppable container. Never set for a Card hover — re-plan 2026-09-16, rule 1: a mere hover never drives `over`. */
  hoverContainerId: string | null;
  /** The context region — in-context candidates are its container and the cards inside it. Null when the drag began outside any region (Unsorted), or while genuinely popped out (Board layer). */
  context: { containerId: string; rect: Rect } | null;
  /**
   * Story 5: locked at a Descendants context, the `parentId` whose Stub
   * rows are in-context collision candidates (decision 1's "direct
   * siblings" scope) — read from the pop session's own `origin`, never
   * from dnd-kit's `active.data.current` (decision 4: the active row's own
   * `role`/`parentId` are exactly the fields that could lag a mid-drag
   * remount, so no policy decision here depends on them). Null at every
   * other context.
   */
  siblingScopeParentId: string | null;
}

// `over` is what drives dnd-kit's sortable shifting and the side indicator,
// so it has to agree with the pop machine (wiki board-drag-interaction
// §1–§3, §5–§6), which is why this is a factory over the live session
// rather than a constant:
//
//   - Card or Stub drag, locked (a column/sub-row, a Card, or a Descendants
//     section): closestCorners over the context's container and the cards
//     (or, at a Descendants context, the sibling rows) whose rect lies
//     inside it — the in-context reorder, unchanged in feel from Epic 3.2.
//     A Card context is never actually resolved this way (its within-
//     action is a constant — popSession.ts::placementFor's Card branch
//     never reads `over`), but restricting candidates here is still what
//     keeps dnd-kit from shifting a sibling against a hover rule 1 ignores.
//   - Card or Stub drag, Board layer (popped out), hovering a region:
//     `over` is that region's container and never a card in it, so the
//     target column's sortable doesn't shift against a hover the band
//     alone resolves; the ghost's index comes from the placement instead.
//   - Card or Stub drag with no context and no hover (picked up in
//     Unsorted, nothing hovered yet): nothing.
//
// Decision 4 (2026-09-21): every item row registers `data: {type: 'item',
// role: 'card' | 'stub', parentId?}`, never a type that differs between a
// Stub's own row and a popped-out Card row for the *same* id — the one
// hazard this collision closure exists to sidestep is `active.data.current`
// lagging a mid-drag remount (a Stub's row unmounting from its Descendants
// section, a Card row mounting in its place), so nothing below reads
// `activeData.role`/`activeData.parentId` for a policy decision; every
// "which kind of drag, which scope" question is answered from the pop
// session's own state (`liveSession`, computed by `useBoardDnd.ts` from
// `regionsRef`/`sessionRef`), never dnd-kit's. Only `activeData.type`
// (`'item'` vs `'column'`, which never changes for either row) gates
// whether the machine applies at all. `data?.role === 'stub'` on a
// *droppable* row is safe to read here — that row isn't the one being
// dragged, so it isn't the one at risk of a stale reference.
export function resolveBoardCollisions(
  args: Parameters<CollisionDetection>[0],
  liveSession: CollisionSession | null,
): ReturnType<CollisionDetection> {
  const activeData = args.active.data.current;
  const session = activeData?.type === 'item' ? liveSession : null;

  if (session?.hoverContainerId) {
    const container = args.droppableContainers.find(c => c.id === session.hoverContainerId);
    return container ? [{ id: container.id, data: { droppableContainer: container, value: 0 } }] : [];
  }

  if (session && session.siblingScopeParentId !== null) {
    const scopeParentId = session.siblingScopeParentId;
    const droppableContainers = args.droppableContainers.filter(container => {
      if (container.id === args.active.id) return false;
      const data = container.data.current;
      return data?.type === 'item' && data?.role === 'stub' && data?.parentId === scopeParentId;
    });
    return closestCorners({ ...args, droppableContainers });
  }

  const droppableContainers = args.droppableContainers.filter(container => {
    if (container.id === args.active.id) return false; // never collide with self
    const data = container.data.current;
    if (data?.type === 'item' && data?.role === 'stub') return false; // never a valid target for a Card-layer or Board drop
    if (!session) return true; // column drag, or no machine in play
    if (!session.context) return false;
    if (container.id === session.context.containerId) return true;
    const rect = args.droppableRects.get(container.id);
    return (
      data?.type === 'item' &&
      data?.role === 'card' &&
      rect !== undefined &&
      rectCenterInside(rect, session.context.rect)
    );
  });
  return closestCorners({ ...args, droppableContainers });
}

function rectCenterInside(rect: Rect, bounds: Rect): boolean {
  return containsPoint(bounds, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
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

// Story 4.1 Phase 3 — the ghost's own placement is the request; nothing
// downstream re-derives one from `over`/`side` independently (F3: the two
// used to drift, once already, before this). `others` is the placement's
// *target* list, rendered, with the active item excluded — the same list
// `isIdentity` compares against, so both read one shared, live-item-based
// answer to "where is everything else right now."
//
// `'first'`/`'last'` are ghost-preview-only ordinals (itemListOps.ts's
// `applyPlacements`/`slotIndex` insert at either literal end of a list with
// no anchor needed); the server has no such concept, so they resolve here
// to a concrete anchor beside `others`' own first/last element — the same
// resolution `bandDropResolution` used to do (TC-7.1/7.2). An explicit
// `{anchorId, side}` slot passes straight through.
function anchorFor(
  slot: Placement['slot'],
  others: readonly { id: string }[],
): Pick<MoveItemInput, 'anchorId' | 'side'> {
  if (typeof slot === 'object') return { anchorId: slot.anchorId, side: slot.side };
  if (slot === 'first' && others.length > 0) return { anchorId: others[0].id, side: 'before' };
  if (slot === 'last' && others.length > 0) return { anchorId: others[others.length - 1].id, side: 'after' };
  return {};
}

// Decision 2 (2026-09-17), replaced by Story 5 (2026-09-21): a placement
// that resolves to the list and ordinal the item already occupies writes
// nothing, at every layer — this subsumes every prior per-case "nothing to
// write" (a covered-set member in the middle band, TC-7.16; an empty or
// done region, TC-7.5/7.8) into one rule. Compared against the session's
// own `origin` — where the drag genuinely started — rather than the raw
// item's `(parentId, isAttached)`/`workphaseId` fields (the old
// comparison, which mistook a *detached* child of X for X's own Stub;
// audit epic-3-5-story-4 #1's `isAttached` guard is retired with it, since
// a detached child's origin is a *workphase* placement and a re-attach's
// is a *parent* one — the two kinds simply never match). Same list: both
// name a `parentId` and it's the same one, or neither names a `parentId`
// and the `workphaseId`s agree (an omitted `workphaseId` always means
// "unchanged"). Same ordinal: `'existing'` always; `'first'`/`'last'`/an
// explicit anchor only when `others` is empty, or the anchor isn't one of
// them — genuinely nothing to order against, the same reason an empty/done
// region or a stray self-reference (`others` excludes the active item, so
// its own id can never match) used to resolve to no request. A non-trivial
// anchor/first/last is never identity even if it happens to already
// describe the same neighbor — the bands never checked that before either.
export function isIdentity(origin: Placement, placement: Placement, others: readonly { id: string }[]): boolean {
  const sameList =
    'parentId' in placement
      ? 'parentId' in origin && placement.parentId === origin.parentId
      : (placement.workphaseId ?? origin.workphaseId) === origin.workphaseId;
  if (!sameList) return false;
  // Hoisted to a const so the narrowing survives into the `some` callback —
  // a property path (`placement.slot`) doesn't narrow inside a closure.
  const { slot } = placement;
  if (slot === 'existing') return true;
  if (slot === 'first' || slot === 'last') return others.length === 0;
  return !others.some(i => i.id === slot.anchorId);
}

// The one adapter from the ghost's own terms (Placement: which list, what
// ordinal) to the item's (MoveItemInput: the PATCH body) — release now
// *reads* the same placement the drag has been showing the whole time
// (decision 1) instead of re-deriving a second answer from dnd-kit's
// `over`/`side` the way `resolveDropTarget` + `buildMoveInput` used to
// (F3). `null` for a `null` placement (drawn where it already is) or an
// identity (decision 2) alike — the caller sends nothing either way, and
// the placement itself (never a value re-derived from this request) is
// what stays on as the pending marker (§10). `item` is only consulted for
// its *current* `workphaseId`, to decide whether the field is even worth
// sending — never for the identity check itself (that's `origin`'s job).
export function toRequest(
  item: Pick<Item, 'workphaseId'>,
  origin: Placement,
  placement: Placement | null,
  others: readonly { id: string }[],
): MoveItemInput | null {
  if (!placement || isIdentity(origin, placement, others)) return null;
  const workphaseId = placement.workphaseId !== item.workphaseId ? placement.workphaseId : undefined;
  if ('parentId' in placement) {
    if (placement.parentId === null) {
      // Story 5: detaching (a card-list placement previewing Free,
      // `parentId: null`) — the real `parentId` stays exactly what it
      // already is (item-attachment §11: detach preserves the parent);
      // only the attachment flag clears, and the position resolves in the
      // workflow-wide scope like any Card's.
      return { workphaseId, isAttached: false, ...anchorFor(placement.slot, others) };
    }
    if (typeof placement.slot === 'object') {
      // Story 5 decision 1: a Descendants-layer sibling reorder — same
      // parent as before, position-only, the pre-Story-5 attached-child
      // sibling-reorder request unchanged (no parentId/isAttached: the
      // attachment itself isn't changing, only the ordinal is).
      return anchorFor(placement.slot, others);
    }
    // Attach as the last child, workphase inherited server-side: Story
    // 4's Card auto-drop for an item from outside, or Story 5 TC-4's
    // reparent into a different Card.
    return { parentId: placement.parentId, isAttached: true };
  }
  return { workphaseId, ...anchorFor(placement.slot, others) };
}

// The one "send a move, fold the response in, or resync" block: on success
// the response is folded in through the write tracker (§5a order, stale
// responses dropped — DRAG-6.5), on failure the pending placement is
// cleared and the board reloads — the server's resolution is authoritative
// over a client guess, which is never kept (DRAG-6.6). A *stale* success
// still resyncs if it disclosed a reindex (reconciliation #15): the row
// itself is rightly discarded (a newer write for the same item supersedes
// it), but the pairs are real, committed renumbering of other rows that a
// silently-dropped response would otherwise take with it. Every board-
// gesture write path goes through here (Card drops via `toRequest`,
// attached-sibling reorders with a bare anchor) so the contract can't
// drift between them (audit epic-3-5-story-2 #4). `moveItem` is
// dependency-injected so a test can substitute a rejecting stub without
// mocking the module.
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
    const { needsResync } = writes.complete(activeId, seq, updated);
    if (needsResync) loadBoard();
  } catch (err) {
    console.error('Failed to move item:', err);
    writes.fail(activeId, seq);
    loadBoard();
  }
}
