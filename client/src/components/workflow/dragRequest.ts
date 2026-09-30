// The request-shape half of the board drag gesture: toRequest (placement →
// API request), isIdentity (recognizes a no-op), and sendItemMove (the one
// "send, fold in, or resync" block). The collision/anchor-naming half is
// dragCollision.ts.

import type { Item } from '../../types';
import type { ItemWriteResponse, MoveItemInput } from '../../api/items';
import { hasParentOpinion, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';

// The ghost's own placement is the request; nothing downstream re-derives
// one from `over`/`side` independently, so the two can't drift apart.
// `others` is the placement's *target* list, rendered, with the active item
// excluded — the same list `isIdentity` compares against, so both read one
// shared, live-item-based answer to "where is everything else right now."
//
// `'first'`/`'last'` are ghost-preview-only ordinals (the preview inserts at
// either literal end of a list with no anchor needed,
// `itemListOps.ts::applyPlacements`); the server has no such concept, so
// they resolve here to a concrete anchor beside `others`' own first/last
// element (wiki item-positioning §7.1). An explicit `{anchorId, side}` slot
// passes straight through.
function anchorFor(
  slot: Placement['slot'],
  others: readonly { id: string }[],
): Pick<MoveItemInput, 'anchorId' | 'side'> {
  if (typeof slot === 'object') return { anchorId: slot.anchorId, side: slot.side };
  if (slot === 'first' && others.length > 0) return { anchorId: others[0].id, side: 'before' };
  if (slot === 'last' && others.length > 0) return { anchorId: others[others.length - 1].id, side: 'after' };
  return {};
}

// A placement that resolves to the list and ordinal the item already
// occupies writes nothing — one rule for every "nothing to write": a
// covered-set member released in the middle band, an empty or done region,
// a Card-layer "set back down", a bare-container fallback, and a null
// placement. At a column/sub-row layer, though, a real, non-trivial anchor
// is never identity, even in the item's own slot: the release there always
// sends the anchor `dropAnchorFor` named, since "after the card above" and
// "before the card below" can genuinely differ once other workphases' items
// sit between them in the workflow-wide order
// (wiki board-drag-interaction §2, rule 5). A Descendants release in the
// item's own gap and depth does write nothing, but that's decided before
// this runs (`descendantsProjection.ts::descendantsReleasePlacement`).
//
// Compared against the session's own `origin` — where the drag genuinely
// started — rather than the raw item's `(parentId, isAttached)`/
// `workphaseId` fields, which would mistake a *detached* child of X for X's
// own Stub: a detached child's origin is a *workphase* placement and a
// re-attach's is a *parent* one, so the two kinds never match. Same list:
// both name a `parentId` and it's the same one, or neither names a
// `parentId` and the `workphaseId`s agree (an omitted `workphaseId` always
// means "unchanged"). Same ordinal: `'existing'` always; `'first'`/`'last'`/
// an explicit anchor only when `others` is empty, or the anchor isn't one of
// them — genuinely nothing to order against (`others` excludes the active
// item, so a stray self-reference never matches). A non-trivial
// anchor/first/last is never identity even if it happens to already
// describe the same neighbor.
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
// ordinal) to the item's (MoveItemInput: the PATCH body) — a release
// *reads* the same placement the drag has been showing the whole time,
// never a second answer re-derived from dnd-kit's `over`/`side`, so the
// preview shows where the write will land (wiki board-drag-interaction
// §10). `null` for a `null` placement (drawn where it already is) or an
// identity alike — the caller sends nothing either way, and the placement
// itself (never a value re-derived from this request) is what stays on as
// the pending marker. `item` is only consulted for its *current*
// `workphaseId`, to decide whether the field is even worth sending — never
// for the identity check itself (that's `origin`'s job).
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
      // Detaching (a card-list placement previewing Free, `parentId: null`)
      // writes `isAttached: false` and leaves the real `parentId` exactly
      // what it already is (wiki board-drag-interaction §8); the position
      // resolves in the workflow-wide scope like any Card's.
      return { workphaseId, isAttached: false, ...anchorFor(placement.slot, others) };
    }
    // Same parent as `origin`'s own is what tells a position-only reorder
    // from a full reparent — never the slot's shape, since a reparent
    // *with* placement among a different Card's Stubs also resolves to an
    // anchor slot.
    if (hasParentOpinion(origin) && placement.parentId === origin.parentId) {
      // A Descendants-layer sibling reorder — same parent as before,
      // position-only (no parentId/isAttached: the attachment itself isn't
      // changing, only the ordinal is).
      return anchorFor(placement.slot, others);
    }
    // A genuinely different parent: attach (or reparent) with whatever
    // placement it resolved to. `anchorFor` degrades to `{}` for `'last'`
    // with no siblings, so the Card auto-drop into a childless Card sends
    // no anchor; a real anchor slot here is a reparent with a placement
    // among a different Card's Stubs.
    return { parentId: placement.parentId, isAttached: true, ...anchorFor(placement.slot, others) };
  }
  return { workphaseId, ...anchorFor(placement.slot, others) };
}

// The one "send a move, fold the response in, or resync" block
// (wiki board-drag-interaction §10): on success the response is folded in
// through the write tracker (in reconciliation order, stale responses
// dropped), on failure the pending placement is cleared and the board
// reloads — the server's resolution is authoritative over a client guess,
// which is never kept. A *stale* success still resyncs if it disclosed a
// reindex: the row itself is rightly discarded (a newer write for the same
// item supersedes it), but the pairs are real, committed renumbering of
// other rows that a silently-dropped response would otherwise take with it.
// Every board-gesture write path — Card, Stub, and Descendants releases
// alike — goes through `toRequest` and then here, by way of
// `useBoardDnd.ts::commitRelease`, so the contract can't drift between
// them. `moveItem` is dependency-injected so a test can substitute a
// rejecting stub without mocking the module.
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
