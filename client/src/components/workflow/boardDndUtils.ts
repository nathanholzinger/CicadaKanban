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
}

// `over` is what drives dnd-kit's sortable shifting and the side indicator,
// so it has to agree with the pop machine (wiki board-drag-interaction
// §1–§3, §5–§6), which is why this is a factory over the live session
// rather than a constant:
//
//   - Card drag, locked (a column/sub-row, or a Card): closestCorners over
//     the context's container and the cards whose rect lies inside it —
//     the in-context reorder, unchanged in feel from Epic 3.2. A Card
//     context is never actually resolved this way (its within-action is a
//     constant append — popSession.ts::placementFor's Card branch never
//     reads `over`), but restricting candidates here is still what keeps
//     dnd-kit from shifting a sibling against a hover rule 1 ignores.
//   - Card drag, Board layer (popped out), hovering a region: `over` is
//     that region's container and never a card in it, so the target
//     column's sortable doesn't shift against a hover the band alone
//     resolves; the ghost's index comes from the placement instead.
//   - Card drag with no context and no hover (picked up in Unsorted,
//     nothing hovered yet): nothing.
//
// Epic 3.2 Part 3, unchanged: attached-child rows are only ever valid
// collision targets for another attached-child drag under the *same* parent
// — never for a card or column drag, and never for a different parent's
// children (including, still, a Card drag locked into that parent's own
// context — Story 4's narrowed scope has no anchor+side among Stubs to
// resolve). dnd-kit has no notion of a nested child being "inside" the
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
    if (data?.type === 'attached-child') return false; // never a valid target for a card drag
    if (!session) return true; // column drag, or no machine in play
    if (!session.context) return false;
    if (container.id === session.context.containerId) return true;
    const rect = args.droppableRects.get(container.id);
    return data?.type === 'card' && rect !== undefined && rectCenterInside(rect, session.context.rect);
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

// Decision 2 (2026-09-17): a placement that resolves to the list and
// ordinal the item already occupies writes nothing, at every layer — this
// subsumes every prior per-case "nothing to write" (a covered-set member
// in the middle band, TC-7.16; an empty or done region, TC-7.5/7.8) into
// one rule. Same list: a `parentId` placement matching the item's current
// parent *and* the item currently attached to it — a detached child has
// the parentId without the attachment (Epic 3: it's a Free Card in a
// column list, not a Stub in that parent's), so re-attaching it to its own
// parent is a genuine list change the server accepts as an attach toggle
// (audit epic-3-5-story-4 #1); or a `workphaseId` one matching its current
// workphase (an omitted `workphaseId` always means "unchanged" — nothing
// upstream ever builds a Placement that names the list without changing
// it). Story 5 replaces this whole comparison with the session's `origin`
// — a detached child's origin is a workphase placement, so the two kinds
// never match — and the `isAttached` read goes with it. Same
// ordinal: `'existing'` always; `'first'`/`'last'`/an explicit anchor only
// when `others` is empty, or the anchor isn't one of them — genuinely
// nothing to order against, the same reason an empty/done region or a
// stray self-reference (`others` excludes the active item, so its own id
// can never match) used to resolve to no request. A non-trivial
// anchor/first/last is never identity even if it happens to already
// describe the same neighbor — the bands never checked that before
// either, and this story changes no band or threshold.
export type IdentitySubject = Pick<Item, 'workphaseId' | 'parentId' | 'isAttached'>;

export function isIdentity(item: IdentitySubject, placement: Placement, others: readonly { id: string }[]): boolean {
  const sameList =
    'parentId' in placement
      ? placement.parentId === item.parentId && Boolean(item.isAttached)
      : (placement.workphaseId ?? item.workphaseId) === item.workphaseId;
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
// what stays on as the pending marker (§10).
export function toRequest(
  item: IdentitySubject,
  placement: Placement | null,
  others: readonly { id: string }[],
): MoveItemInput | null {
  if (!placement || isIdentity(item, placement, others)) return null;
  if ('parentId' in placement) {
    // Story 4: attach as the last Stub, inheriting the parent's workphase
    // server-side — no anchor, no workphaseId of its own. Manual anchor +
    // side placement among Stubs is Story 6.
    return { parentId: placement.parentId, isAttached: true };
  }
  const workphaseId = placement.workphaseId !== item.workphaseId ? placement.workphaseId : undefined;
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
