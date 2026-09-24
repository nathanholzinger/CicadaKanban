// Collision detection + request-shape helpers for the board drag gesture:
// toRequest (placement → API request) and isIdentity (recognizes a no-op placement).

import { closestCorners, type Active, type CollisionDetection, type Over } from '@dnd-kit/core';
import { arrayMove, hasSortableData } from '@dnd-kit/sortable';
import type { Item } from '../../types';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import { hasParentOpinion, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import { containsPoint, type Rect } from './dragRegions';

// Decision 4 (2026-09-21) — every item row's dnd-kit registration, typed so
// the invariant it introduced ("every item row registers `type: 'item'`,
// never a type that differs between a Stub's row and a popped-out Card row
// for the same id") holds by construction, not by convention alone: an
// untyped literal lets `role: 'stubs'` compile without complaint (audit
// epic-3-5-story-5 #11). `itemRowData`/`columnData` are the one write path;
// `isCardRow`/`isStubRow` the one read path for a policy decision that
// needs a specific role (both `useSortable` calls, the collision filter
// below, and the test fixtures all go through these instead of re-typing
// the literal).
export type ItemRowRole = 'card' | 'stub';
export type DragRowData = { type: 'item'; role: ItemRowRole; parentId?: string | null } | { type: 'column' };

export function itemRowData(role: ItemRowRole, parentId?: string | null): DragRowData {
  return parentId !== undefined ? { type: 'item', role, parentId } : { type: 'item', role };
}

export function columnData(): DragRowData {
  return { type: 'column' };
}

export function isCardRow(data: Record<string, unknown> | undefined): data is { type: 'item'; role: 'card' } {
  return data?.type === 'item' && data?.role === 'card';
}

export function isStubRow(
  data: Record<string, unknown> | undefined,
): data is { type: 'item'; role: 'stub'; parentId?: string | null } {
  return data?.type === 'item' && data?.role === 'stub';
}

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
   * Story 6 Phase B: locked at a Descendants context, that region's own
   * measured rect — candidates are every Stub row (any depth) whose center
   * falls inside it, the same rect-containment test the Card/Board-layer
   * branch below already uses for its own in-context candidates. Replaces
   * Story 5's interim `siblingScopeParentId` (an exact real-`parentId`
   * match): the section now renders as one flat list (decision 1), so
   * scoping by "is this row visually inside the section" is both simpler
   * and matches §7.1's own "any row of the section, any depth" — the
   * within-action itself (`placementFor`, `toRequest`) is what still keeps
   * a release scoped to true siblings only, unchanged in this phase. Null
   * at every other context.
   */
  descendantsSectionRect: Rect | null;
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

  if (session?.descendantsSectionRect) {
    const sectionRect = session.descendantsSectionRect;
    const droppableContainers = args.droppableContainers.filter(container => {
      if (container.id === args.active.id) return false;
      if (!isStubRow(container.data.current)) return false;
      const rect = args.droppableRects.get(container.id);
      return rect !== undefined && rectCenterInside(rect, sectionRect);
    });
    return closestCorners({ ...args, droppableContainers });
  }

  const droppableContainers = args.droppableContainers.filter(container => {
    const data = container.data.current;
    if (isStubRow(data)) return false; // never a valid target for a Card-layer or Board drop
    // Option A (2026-09-24): in a locked column/sub-row the dragged card's
    // own row *is* a candidate, as in stock dnd-kit sortable: over its own
    // slot, `over` is itself and nothing shuffles (the lean still names a
    // neighbor, `dropAnchorFor`). Excluded, the ghost always jumped to a
    // neighbor's slot, even at pickup. A column drag still never collides
    // with itself.
    if (!session) return container.id !== args.active.id; // column drag, or no machine in play
    if (!session.context) return false;
    if (container.id === session.context.containerId) return true;
    const rect = args.droppableRects.get(container.id);
    return isCardRow(data) && rect !== undefined && rectCenterInside(rect, session.context.rect);
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

export interface DropAnchor {
  anchorId: string;
  side: 'before' | 'after';
}

// Option A + lean (2026-09-24): the card a drop anchors to, and
// which side of it — the one answer both the live blue line
// (`KanbanCard.tsx`) and the release (`useBoardDnd.ts::handleDragEnd`) read,
// so they can't disagree.
//
// Over a Card row (a column/sub-row's own list), dnd-kit's sortable shuffle
// decides the ghost's slot, stock dnd-kit semantics (the drop lands where
// the gap is), and the dragged copy only picks which neighbor names it:
// above the ghost's middle, "after" the card above it; below, "before" the
// card below it. Both name the same slot, so the ghost, the line and the
// save always agree; the lean only chooses the neighbor (the future zoom-in
// candidate). At the top or bottom of the list there's one neighbor; alone
// in the list, none (null).
//
// The ghost's middle follows dnd-kit's vertical strategy: over its own
// slot when `over` is itself, top-aligned to `over` when it moved up,
// bottom-aligned when it moved down, at `ghostHeightPx` (the shortCard).
// The order is read from `over`'s own sortable data — the same `items`
// dnd-kit draws the shuffle from — never the active row's (decision 4: it
// can lag a mid-drag remount).
//
// Anywhere else (a Descendants section's Stub rows, until Story 6 Phase D's
// gap + depth rule; a card not in `over`'s list) it's still `over` itself,
// on `resolveDropSide`'s which-half-of-`over` side.
export function dropAnchorFor(
  active: Pick<Active, 'id' | 'rect'>,
  over: Over,
  ghostHeightPx: number,
): DropAnchor | null {
  const translated = active.rect.current.translated;
  const onOver = (): DropAnchor => ({ anchorId: String(over.id), side: resolveDropSide(translated, over.rect) });
  if (!isCardRow(over.data.current) || !hasSortableData(over)) return onOver();
  const { items, index: overIndex } = over.data.current.sortable;
  const activeIndex = items.indexOf(active.id);
  if (activeIndex === -1) return onOver();

  const { top, height } = over.rect;
  const ghostCenterY =
    activeIndex < overIndex
      ? top + height - ghostHeightPx / 2
      : activeIndex > overIndex
        ? top + ghostHeightPx / 2
        : top + height / 2;
  const order = arrayMove(items, activeIndex, overIndex);
  const above = order[overIndex - 1];
  const below = order[overIndex + 1];
  const leansUp = translated ? translated.top + translated.height / 2 < ghostCenterY : true;
  if (above !== undefined && (leansUp || below === undefined)) return { anchorId: String(above), side: 'after' };
  if (below !== undefined) return { anchorId: String(below), side: 'before' };
  return null;
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
  const sameList = hasParentOpinion(placement)
    ? hasParentOpinion(origin) && placement.parentId === origin.parentId
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
  if (hasParentOpinion(placement)) {
    if (placement.parentId === null) {
      // Story 5: detaching (a card-list placement previewing Free,
      // `parentId: null`) — the real `parentId` stays exactly what it
      // already is (item-attachment §11: detach preserves the parent);
      // only the attachment flag clears, and the position resolves in the
      // workflow-wide scope like any Card's.
      return { workphaseId, isAttached: false, ...anchorFor(placement.slot, others) };
    }
    // Audit epic-3-5-story-5 #3: this branch used to key on the *slot's own
    // shape* (`typeof slot === 'object'`) rather than the parent equality
    // its own comment stated — a proxy that only held because Story 5's
    // Descendants branch is the sole producer of an anchor-shaped slot
    // alongside a `parentId`, and always sets `parentId: origin.parentId`.
    // Story 6 breaks that coincidence (a reparent *with* placement among a
    // different Card's Stubs also resolves to an anchor slot), so the real
    // rule — same parent as `origin`'s own — is what decides a bare
    // position-only reorder from a full reparent now.
    if (hasParentOpinion(origin) && placement.parentId === origin.parentId) {
      // Story 5 decision 1: a Descendants-layer sibling reorder — same
      // parent as before, position-only, the pre-Story-5 attached-child
      // sibling-reorder request unchanged (no parentId/isAttached: the
      // attachment itself isn't changing, only the ordinal is).
      return anchorFor(placement.slot, others);
    }
    // A genuinely different parent: attach (or reparent) with whatever
    // placement it resolved to. `anchorFor` degrades to `{}` for `'last'`
    // with no siblings, so Story 4's Card auto-drop for an item from
    // outside is byte-identical; a real anchor slot here is Story 6's
    // reparent-with-placement among a different Card's Stubs.
    return { parentId: placement.parentId, isAttached: true, ...anchorFor(placement.slot, others) };
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
