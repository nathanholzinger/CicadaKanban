// The pop machine's placement rules — the ghost's own placement at every
// layer (placementRegion/placementFor, with regionWorkphaseFor, the workphase
// a card-list drop takes), what a release's `over` resolves to
// (resolvePlacementOver), and which form the carried copy draws as
// (overlayFormFor). A release commits the locked layer's own
// within-action, and the ghost always shows exactly that
// (wiki board-drag-interaction §1.1, rule 1). The transition machine
// (popSession.ts) is the other half: this reads its session, never writes it.

import type { Item } from '../../types';
import type { AnchorRelation } from '../../lib/hierarchyPlacement';
import { hasParentOpinion, workphaseOnlySlot, type Placement } from './itemListOps';
import type { CardListRegion, DragRegion } from './dragRegions';
import type { DescendantsProjection } from './DragSessionContext';
import type { PopSession } from './popSession';

// The region a placement is resolved against: the locked context, or — at
// Board layer — the hovered region, whose band is the within-action there.
// The one key derivation, also read by `useBoardDnd.ts` for `over` and the
// "others" list at release, so the release reads the identical answer
// rather than a second, independently-typed guess. Null session (no drag)
// → undefined.
export function placementRegion(session: PopSession | null, regions: readonly DragRegion[]): DragRegion | undefined {
  if (!session) return undefined;
  const key = session.contextKey === null ? (session.hover?.regionKey ?? null) : session.contextKey;
  return key === null ? undefined : regions.find(r => r.key === key);
}

// Which form the carried copy (the DragOverlay) draws as — a Stub row, so it
// looks like the rows it will be placed among, while locked at a Card or
// Descendants layer; the shortCard everywhere else (Board, Column/sub-row,
// or popped out) (wiki board-drag-interaction §5a). Reads
// `placementRegion`'s own result rather than a second, independently-typed
// guess, so the render and the overlay re-anchor modifier (both through
// `dragOverlayGeometry.ts::overlayShapeFor`) always agree on which form is
// live right now — the same "one derivation, read by every caller"
// reasoning as `placementRegion` itself.
export type OverlayForm = 'stub' | 'short-card';
export function overlayFormFor(region: DragRegion | undefined): OverlayForm {
  return region?.kind === 'card' || region?.kind === 'descendants' ? 'stub' : 'short-card';
}

// The no-anchor fallback within a card-list region (no specific card
// hovered — a bare container, a done region, or mid-drag before `over`
// resolves). A terminal region's own rule always wins (nothing is
// anchorable there either way). Otherwise, a position that isn't
// comparable in *this* list's order — `nonComparable`, true for a Stub's
// own kept slot once it's previewing into a workflow-wide list (its
// `origin` carries a `parentId`, never a `workphaseId`) — rests at the
// append slot instead of `workphaseOnlySlot`'s read of a position that
// means nothing here, matching the append fallback a detach without an
// anchor actually resolves to (wiki board-drag-interaction §10). A Free
// Card's origin gets `workphaseOnlySlot`'s answer.
function noAnchorSlot(
  region: Pick<CardListRegion, 'isTerminal'>,
  nonComparable: boolean,
  activeItemPosition: number | null,
): 'existing' | 'last' {
  if (region.isTerminal) return 'existing';
  return nonComparable ? 'last' : workphaseOnlySlot(activeItemPosition);
}

// What a real drop in-context resolved to, distinct from "nothing computed
// yet" (mid-drag: the sortable strategy draws the slot, and the ghost just
// sits at 'existing'). `null` is the mid-drag case, or release over
// genuinely nothing. `'container'` is release onto the bare column/sub-row
// container — no specific card to anchor beside. `{anchorId, side}` is
// release onto a specific card: `dropAnchorFor`'s own anchor and side.
export type PlacementOver = AnchorRelation | 'container' | null;

// The drag a placement is for — the slice of a `DragSession` `placementFor`
// reads, so a session passes as it is.
export interface PlacementSubject {
  pop: PopSession;
  activeItem: Pick<Item, 'workphaseId' | 'position'>;
  origin: Placement;
  containingCardId: string | null;
  priorPlacement: Placement | null;
  projection?: Pick<DescendantsProjection, 'slotHidden'> | null;
}

// The ghost: always the *locked* context's own within-action when there is
// one — Column/sub-row: the slot a real drop resolved to (`over`), or
// 'existing' while that's still unknown (mid-drag); Board layer: the
// hovered band's slot; Card: 'last' for an item arriving from outside (no
// band, no anchor), or `origin` itself for the drag's own containing Card —
// "set back down," not "attach". Never previews a foreign region a mere
// hover hasn't actually reached: the ghost only ever shows what a drop
// right now would do. Null when the card belongs nowhere and the cursor is
// over nothing: it's drawn where it already is.
//
// `origin` is where the drag genuinely started — a `parentId` key marks a
// Stub's origin, a `workphaseId` key a Free Card's. `containingCardId` is
// the Stub's *section-root* Card — distinct from `origin.parentId` for a
// grandchild, whose real direct parent is a Stub further down, not the
// section root — so the Card-branch's "is this my own restore point" test
// compares against this, never `origin.parentId`. Null for a Free Card
// drag.
//
// `priorPlacement` is the item's placement from *before* this drag — set
// only when picking up (or popping back into the context of) a re-dragged
// item whose earlier write is still pending. In-context, with `over` still
// null (mid-drag), it wins over a freshly computed slot: recomputing from
// the raw item would use its stale pre-write position/workphase and
// visibly jump the ghost the instant the item is picked up, or again the
// moment it pops back into the context it started in. Only in the list it
// draws the item in, though (`drawsInList`): locked in any other list, it
// would leave the ghost behind in the old one. Not consulted for a Card
// context (see the Card branch), or once `over` names a real resolved
// drop: there's nothing left to jump.
export function placementFor(
  subject: PlacementSubject,
  regions: readonly DragRegion[],
  over: PlacementOver = null,
): Placement | null {
  const { pop: session, origin, containingCardId, priorPlacement } = subject;
  const { workphaseId: activeWorkphaseId, position: activeItemPosition } = subject.activeItem;
  const region = placementRegion(session, regions);
  if (!region) return null;

  // A Card's within-action (wiki board-drag-interaction §6): "set back
  // down" for the drag's own containing Card (`origin` itself —
  // `region.attachToCardId === containingCardId`), else attach as the last
  // child, including a Stub's reparent into a *different* Card.
  //
  // `origin`, never `priorPlacement`, unlike the Descendants branch below:
  // a set-down here must write nothing, and `origin` is what `isIdentity`
  // compares it against. An earlier write's pending marker is put back
  // after that release (`usePendingGhostGuard.ts::restorePriorPlacement`),
  // never re-sent.
  if (region.kind === 'card') {
    if (region.attachToCardId === containingCardId) return origin;
    return { parentId: region.attachToCardId, slot: 'last' };
  }

  // A Descendants section's within-action, mid-drag only: a release there
  // resolves the gap + depth rule against the session's own live
  // projection instead (`useBoardDnd.ts::releaseDescendants`), so this
  // branch never sees a real `over`. Two cases, mirroring the Card branch
  // above:
  //
  //   - **Same section** (`region.cardId === containingCardId` — a Stub of
  //     this Card, or one of its own descendants, reordering within the
  //     section it's already in): the ghost sits at `origin` (or
  //     `priorPlacement`, for the same no-jump reason as any other
  //     context) — dnd-kit's own sortable strategy already draws the
  //     reorder among the section's rows.
  //   - **A foreign item** (a Free Card, or a Stub detached from a
  //     *different* Card, zooming into this section for the first time):
  //     there's no `origin`/`priorPlacement` restore point here (nothing to
  //     "set back down" to), so the ghost previews attaching as
  //     `region.cardId`'s last child — the Card layer's own append
  //     convention, one layer up. So does a Stub of this Card whose own
  //     slot the section doesn't draw (`projection.slotHidden`): a ghost
  //     can't be drawn in a slot that isn't there.
  if (region.kind === 'descendants') {
    if (region.cardId === containingCardId && !subject.projection?.slotHidden) return priorPlacement ?? origin;
    return { parentId: region.cardId, slot: 'last' };
  }

  // The moment a Stub's own list stops applying — any card-list region,
  // reached from either layer below — the placement previews Free: a
  // `parentId: null` key, which `itemListOps.ts::renderedIsStub` reads as
  // Free. A Free Card's placement carries no such opinion.
  const nonComparable = hasParentOpinion(origin);
  const detach = nonComparable ? { parentId: null as string | null } : {};
  // The one spelling of a card-list placement: a missing `...detach` on any
  // one path would leave a Stub rendering as still-attached on that path
  // only (its section keeps the row while the column also shows it), the
  // exact silent failure the presence semantic in `hasParentOpinion` exists
  // to guard against.
  const cardListPlacement = (slot: Placement['slot']): Placement => ({
    ...detach,
    workphaseId: regionWorkphaseFor(region, activeWorkphaseId),
    slot,
  });

  if (session.contextKey !== null) {
    const fallback = noAnchorSlot(region, nonComparable, activeItemPosition);
    if (over === null) {
      return priorPlacement && drawsInList(priorPlacement, region) ? priorPlacement : cardListPlacement(fallback);
    }
    if (over === 'container' || region.isTerminal) return cardListPlacement(fallback);
    return cardListPlacement({ anchorId: over.anchorId, side: over.side });
  }

  // Board layer (popped out): the hovered band decides
  // (wiki board-drag-interaction §5).
  const band = session.hover?.band;
  if (!band && priorPlacement) return priorPlacement;

  if (region.isTerminal || !band || band === 'middle') {
    return cardListPlacement(noAnchorSlot(region, nonComparable, activeItemPosition));
  }
  return cardListPlacement(band === 'top' ? 'first' : 'last');
}

// Whether `placement` draws the item in this card list: Free (no parent
// opinion, or detaching to none) under a workphase the region covers.
// Every card-list placement names its workphase (`cardListPlacement`).
function drawsInList(placement: Placement, region: CardListRegion): boolean {
  if (hasParentOpinion(placement) && placement.parentId !== null) return false;
  return placement.workphaseId !== undefined && region.coveredWorkphaseIds.includes(placement.workphaseId);
}

// A drop keeps the item's own workphase when the region already covers it,
// so it's a position-only reorder; otherwise it takes the region's target
// workphase (wiki item-positioning §4).
export function regionWorkphaseFor(region: CardListRegion, activeWorkphaseId: string | null): string {
  const member = activeWorkphaseId !== null && region.coveredWorkphaseIds.includes(activeWorkphaseId);
  return member ? activeWorkphaseId : region.targetWorkphaseId;
}

// The anchor/bare-container distinction a release resolves, beside
// `placementFor` (the mid-drag half of the same "which region, which
// anchor" question). `overId`/`anchor` are the caller's own
// already-resolved facts — dnd-kit's `Over`'s id, and `dropAnchorFor`'s own
// answer — so this file stays dnd-kit-free, never importing `Over` itself.
// `null` `overId` covers both "no drop at all" and the release-only cases
// `placementFor`'s own callers never see mid-drag. `list` is
// `useBoardDnd.ts::releaseListFor`'s own return shape, narrowed to the one
// field this needs.
//
// A release over the bare container is `'container'`, which writes nothing
// for a card already in the list. That's not a lost drop: dnd-kit doesn't
// shuffle when `over` is the container, so the ghost never left its slot,
// and the drop lands where the ghost is (wiki board-drag-interaction §2).
export function resolvePlacementOver(
  list: { containerId: string } | null,
  overId: string | null,
  anchor: PlacementOver,
): PlacementOver {
  if (!list) return null;
  if (overId === null || overId === list.containerId) return 'container';
  return anchor ?? 'container';
}
