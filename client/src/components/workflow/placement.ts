// The pop machine's placement rules — the ghost's own placement at every
// layer (placementRegion/placementFor), and which form the carried copy
// draws as (overlayFormFor). Moved out of popSession.ts (Story 6.1 Phase 1,
// C-2): the transition machine (advancePopSession et al.) and the
// placement rules are two separate halves.

import { hasParentOpinion, workphaseOnlySlot, type Placement } from './itemListOps';
import type { CardListRegion, DragRegion } from './dragRegions';
import type { PopSession } from './popSession';

// The region a placement is resolved against: the locked context, or — at
// Board layer — the hovered region, whose band is the within-action there.
// The one key derivation, shared with `useBoardDnd.ts`, which needs the
// same region for `over` and the "others" list at release: a caller
// reading the identical answer rather than a second, independently-typed
// guess (Story 4.1 Phase 3 F3; the hook's own copy retired by audit
// epic-3-5-story-4 #8). Null session (no drag) → undefined.
export function placementRegion(session: PopSession | null, regions: readonly DragRegion[]): DragRegion | undefined {
  if (!session) return undefined;
  const key = session.contextKey === null ? (session.hover?.regionKey ?? null) : session.contextKey;
  return key === null ? undefined : regions.find(r => r.key === key);
}

// Story 6 Phase C (Story 5 decision 6, reopened 2026-09-23): which form the
// carried copy (the DragOverlay) draws as — a Stub row, so it looks like
// the rows it will be placed among, while locked at a Card or Descendants
// layer; the shortCard everywhere else (Board, Column/sub-row, or popped
// out). Reads `placementRegion`'s own result rather than a second,
// independently-typed guess, so `BoardView.tsx`'s render and
// `useBoardDnd.ts`'s overlay re-anchor modifier always agree on which form
// is live right now — the same "one derivation, read by every caller"
// reasoning as `placementRegion` itself.
export type OverlayForm = 'stub' | 'short-card';
export function overlayFormFor(region: DragRegion | undefined): OverlayForm {
  return region?.kind === 'card' || region?.kind === 'descendants' ? 'stub' : 'short-card';
}

// Story 5 decision 5 (2026-09-21), generalizing wiki–code reconciliation
// #29: the no-anchor fallback within a card-list region (no specific card
// hovered — a bare container, a done region, or mid-drag before `over`
// resolves). A terminal region's own rule always wins (nothing is
// anchorable there either way). Otherwise, a position that isn't
// comparable in *this* list's order — `nonComparable`, true for a Stub's
// own kept slot once it's previewing into a workflow-wide list (its
// `origin` carries a `parentId`, never a `workphaseId`) — rests at the
// append slot instead of `workphaseOnlySlot`'s read of a position that
// means nothing here, matching the append fallback a detach without an
// anchor actually resolves to (item-positioning §7.5). A Free Card's
// origin is unaffected: `workphaseOnlySlot` still answers for it exactly
// as before (#29).
function noAnchorSlot(
  region: Pick<CardListRegion, 'isTerminal'>,
  nonComparable: boolean,
  activeItemPosition: number | null,
): 'existing' | 'last' {
  if (region.isTerminal) return 'existing';
  return nonComparable ? 'last' : workphaseOnlySlot(activeItemPosition);
}

// Story 4.1 Phase 3 — what a real drop in-context resolved to, distinct
// from "nothing computed yet" (mid-drag, decision 1: sortable draws the
// slot, the ghost just sits at 'existing'). `null` is the mid-drag case,
// or release over genuinely nothing. `'container'` is release onto the
// bare column/sub-row container — no specific card to anchor beside.
// `{anchorId, side}` is release onto a specific card, `dropAnchorFor`'s own
// anchor + lean (Option A + the lean, 2026-09-24 — `resolveDropSide` is now
// only its fallback for a non-row `over`).
export type PlacementOver = { anchorId: string; side: 'before' | 'after' } | 'container' | null;

// The ghost (§10 ordinal preview, §5 band table): always the *locked*
// context's own within-action when there is one — Column/sub-row: the
// slot a real drop resolved to (`over`), or 'existing' while that's still
// unknown (mid-drag, decision 1); Board layer: the hovered band's slot;
// Card: 'last' for an item arriving from outside (Story 4's narrowed
// scope — no band, no anchor), or `origin` itself for the drag's own
// containing Card — "set back down," not "attach" (Story 5, §6/§8; TC-12).
// Never previews a foreign region a mere hover hasn't actually reached
// (rule 1): the ghost only ever shows what a drop right now would do.
// Null when the card belongs nowhere and the cursor is over nothing: it's
// drawn where it already is.
//
// `origin` is where the drag genuinely started (Story 4.1 Phase 3; Story 5
// sets it for a Stub too) — a `parentId` key marks a Stub's origin, a
// `workphaseId` key a Free Card's. `containingCardId` is Story 5's own
// addition: the Stub's *section-root* Card (decision 1) — distinct from
// `origin.parentId` for a grandchild, whose real direct parent is a Stub
// further down, not the section root — so the Card-branch's "is this my
// own restore point" test compares against this, never `origin.parentId`.
// Null for a Free Card drag.
//
// `priorPlacement` is the item's placement from *before* this drag — set
// only when picking up (or popping back into the context of) a re-dragged
// item whose earlier write is still pending. In-context, with `over` still
// null (mid-drag), it wins over a freshly computed slot: recomputing from
// the raw item would use its stale pre-write position/workphase and
// visibly jump the ghost the instant the item is picked up, or again the
// moment it pops back into the context it started in (audit
// epic-3-5-story-3-reconciled #1). Not consulted for a Card context, or
// once `over` names a real resolved drop: there's nothing left to jump.
export function placementFor(
  session: PopSession,
  regions: readonly DragRegion[],
  activeWorkphaseId: string | null,
  activeItemPosition: number | null,
  origin: Placement,
  containingCardId: string | null,
  priorPlacement: Placement | null = null,
  over: PlacementOver = null,
): Placement | null {
  const region = placementRegion(session, regions);
  if (!region) return null;

  // A Card's within-action: "set back down" for the drag's own containing
  // Card (Story 5, `origin` itself — `region.attachToCardId ===
  // containingCardId`), else attach as the last child (Story 4, or Story 5
  // TC-4's reparent into a *different* Card).
  if (region.kind === 'card') {
    if (region.attachToCardId === containingCardId) return origin;
    return { parentId: region.attachToCardId, slot: 'last' };
  }

  // A Descendants section's within-action, mid-drag only: release there
  // goes through `useBoardDnd.ts::releaseDescendants` instead (Story 6
  // Phase D's full §7 gap + depth rule, against the session's own live
  // projection) — this branch never actually sees a real `over` (Story 6.1
  // Phase 0, L1-5: `handleDragEnd` returns from the Descendants branch
  // before this function is ever called with one). Two cases, mirroring the
  // Card branch above:
  //
  //   - **Same section** (`region.cardId === containingCardId` — a Stub of
  //     this Card, or one of its own descendants, reordering within the
  //     section it's already in): the ghost sits at `origin` (or
  //     `priorPlacement`, same reconciliation-#1 reasoning as any other
  //     context) — dnd-kit's own sortable strategy already draws the
  //     reorder among the section's rows.
  //   - **A foreign item** (Story 6 Phase D — a Free Card, or a Stub
  //     detached from a *different* Card, zooming into this section for
  //     the first time): there's no `origin`/`priorPlacement` restore point
  //     here (nothing to "set back down" to), so the ghost previews
  //     attaching as `region.cardId`'s last child — the Card layer's own
  //     append convention, one layer up.
  if (region.kind === 'descendants') {
    if (region.cardId === containingCardId) return priorPlacement ?? origin;
    return { parentId: region.cardId, slot: 'last' };
  }

  // Story 5: the moment a Stub's own list stops applying — any card-list
  // region, reached from either layer below — the placement previews Free
  // (itemListOps.ts::renderedIsStub already reads a `parentId: null` key
  // this way); a Free Card's placement carries no such opinion, exactly as
  // before Story 5.
  const nonComparable = hasParentOpinion(origin);
  const detach = nonComparable ? { parentId: null as string | null } : {};
  // Audit epic-3-5-story-5 #9: the card-list placement literal below was
  // spelled four times independently — a missing `...detach` on any one of
  // the four would leave a Stub rendering as still-attached on one path
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
    if (over === null) return priorPlacement ?? cardListPlacement(fallback);
    if (over === 'container' || region.isTerminal) return cardListPlacement(fallback);
    return cardListPlacement({ anchorId: over.anchorId, side: over.side });
  }

  // Board layer (popped out): the hovered band decides — unchanged.
  const band = session.hover?.band;
  if (!band && priorPlacement) return priorPlacement;

  if (region.isTerminal || !band || band === 'middle') {
    return cardListPlacement(noAnchorSlot(region, nonComparable, activeItemPosition));
  }
  return cardListPlacement(band === 'top' ? 'first' : 'last');
}

export function regionWorkphaseFor(region: CardListRegion, activeWorkphaseId: string | null): string {
  const member = activeWorkphaseId !== null && region.coveredWorkphaseIds.includes(activeWorkphaseId);
  return member ? activeWorkphaseId : region.targetWorkphaseId;
}
