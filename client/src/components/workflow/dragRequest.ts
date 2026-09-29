// The request-shape half of the board drag gesture: toRequest (placement →
// API request), isIdentity (recognizes a no-op), and sendItemMove (the one
// "send, fold in, or resync" block). Moved out of boardDndUtils.ts (Story
// 6.1 Phase 1, C-3) — the collision/anchor-naming half is dragCollision.ts.

import type { Item } from '../../types';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import { hasParentOpinion, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';

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
// nothing — this subsumes every prior per-case "nothing to write" (a
// covered-set member in the middle band, DRAG-3.12; an empty or done region,
// DRAG-3.10, DRAG-3.24) into one rule. Narrowed by Option A + the lean (2026-09-24):
// at a column/sub-row layer, a real, non-trivial anchor is never identity
// even in the item's own slot (the last sentence below) — the release there
// always sends the anchor `dropAnchorFor` named, since "after the card
// above" and "before the card below" can genuinely differ once other
// workphases' items sit between them in the workflow-wide order
// (item-positioning §2), so "stay" would contradict the line. A Descendants
// release in the item's own gap and depth does write nothing, but that's
// decided before this runs (`descendantsProjection.ts::descendantsReleasePlacement`).
// Identity still holds at Card layer ("set back down"), the terminal/bare-container
// fallbacks, and a null placement. Compared against the session's
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
// gesture write path — Card, Stub, and Descendants releases alike — goes
// through `toRequest` and then here, by way of one caller
// (`useBoardDnd.ts::commitRelease`, which also owns the no-write restore),
// so the contract can't drift between them. `moveItem` is dependency-injected so a
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
    const { needsResync } = writes.complete(activeId, seq, updated);
    if (needsResync) loadBoard();
  } catch (err) {
    console.error('Failed to move item:', err);
    writes.fail(activeId, seq);
    loadBoard();
  }
}
