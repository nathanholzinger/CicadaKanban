// The pop state machine (locked / popped-out) for the board drag gesture — pure,
// unit-tested. Rules: docs/wiki/board-drag-interaction/README.md.

import type { DragTuning } from './dragTuning';
import { workphaseOnlySlot, type Placement } from './itemListOps';
import {
  bandFor,
  childRegionAt,
  containsPoint,
  distanceOutside,
  isCardList,
  type Band,
  type CardListRegion,
  type DragRegion,
  type Point,
  type Rect,
  type RegionKind,
  type ShortCardMetrics,
} from './dragRegions';

// Epic 3.5 Story 3, re-planned for Story 4 (2026-09-16) — the pop state
// machine (docs/wiki/board-drag-interaction §1–§3, §5–§6). Pure: a session
// value, a transition on each pointer sample, and one read-out
// (`placementFor`) that names the ghost mid-drag and the request itself at
// release alike (Story 4.1 Phase 3 — a release is just this same call with
// `over` filled in, not a second, separately-derived answer). No React, no
// dnd-kit, no timers — the hook that owns the gesture supplies the clock
// and the measured regions.
//
// The board is a strict stack of layers, never more than one deep from
// where you are: **Board** (`contextKey === null`) → **Column/sub-row** →
// **Card**. Three rules, settled with the Product Owner before this build
// (2026-09-16), replace Story 3's flatter model:
//
//   1. A release always commits the *locked* context's own within-action —
//      Column/sub-row: anchor + side among its own items (dnd-kit's `over`,
//      scoped to just those). Card: append as the last child for an item
//      arriving from outside, or "set back down" for the drag's own
//      containing Card (Story 5) — either way no band, no anchor; manual
//      placement among Stubs is Story 6's Descendants layer. This holds
//      regardless of where the bare cursor is: the overlay never visually
//      leaves its context (bounded, exactly as Story 3 built it), so
//      nothing shown ever promises a foreign region's band the way Story 3
//      let a quick glance imply.
//   2. Popping is always exactly one layer: zooming in reaches only the
//      *next* layer down (Board → a column/sub-row; a column/sub-row → one
//      of its own Cards — never a foreign column's Card, never two layers
//      in one hop), and popping out always lands on the *current* context's
//      own parent (a Card's is the column/sub-row that contains it, read
//      off `DragRegion.parentRegionKey` — never Board directly).
//   3. Zooming in is a duration-only signal (never a fast yank — it can
//      mean a reparent). Zooming out is duration *or* distance, same as
//      Story 3 built it; a cascade of two pops back-to-back (yank a Card's
//      own attach-preview out, and the cursor is already far past the
//      column too) falls out of rule 2 alone — each layer's own threshold
//      still has to clear on its own terms, just against a fresh clock.
//
// Board layer's own within-action (§5) is the one place a *hovered, not
// locked* region still matters: a quick release there is that region's
// band; resting past `popInDelayMs` locks into it. This is Story 3's
// mechanism, unchanged — it just no longer reaches past Board layer.
//
// Story 4.1 Phase 0: every locked layer's zoom-in and pop-out is now one
// branch, parametric on `region.kind` and `region.parentRegionKey`
// (`childRegionAt`, `popInDelayFor`) rather than a `card:`-prefix string
// test (`isCardKey`, retired) or an `attachToCardId !== undefined` check
// repeated at each call site. Story 5 adds a `descendants` kind — a Card's
// own section, where a Stub's drag starts — but it's never a *zoom-in*
// candidate yet (`childRegionAt`'s own guard, `dragRegions.ts`): Story 6 is
// what makes a Card's within-action a further pop-in rather than always
// the auto-drop.
//
// Story 4.1 Phase 1: the reservation is now exact (wiki §5 — a region's
// `contentRect` never changes size whether or not it's the live hover
// target, since the ghost row is a fixed-height shortCard occupying
// exactly what the dead zones did), so `hoverFor` reads a region's live
// rect and live card count directly. The frozen-rect family that absorbed
// the old, approximate reservation (`PopHover.rect`/`.cardCount`,
// `followRegionTop`, the sticky-hover check that kept a hover stable
// against its own carve-out collapsing) is gone with it.

export interface PopHover {
  regionKey: string;
  /**
   * When this hover began — the pop-in clock. Restarts whenever the
   * hovered region changes.
   */
  since: number;
  /**
   * Board layer only: the band a release would commit right now (exactly
   * the middle band is `poppable`, below). Undefined for a locked
   * column/sub-row's hover on one of its own Cards — that hover has no
   * band at all, just a flat "long enough" duration check.
   */
  band?: Band;
  /**
   * Whether resting here past its own `popInDelayFor` pops the candidate
   * in. A card list candidate: the middle band. A Card candidate: always
   * (audit epic-3-5-story-4 #11) — it has no band, so unconditionally
   * poppable is the kind's own rule, set once here rather than re-derived
   * at each call site that used to special-case `kind === 'card'`.
   */
  poppable?: boolean;
}

export interface PopSession {
  /**
   * The region the carried item currently belongs to (§1) — and is clamped
   * to. Null while popped out (Board layer), and from the start for a drag
   * that began outside every region (Unsorted is drag-source only).
   */
  contextKey: string | null;
  /**
   * Board layer: the cursor is hovering a column/sub-row, tracked for its
   * band and its own zoom-in clock. Locked in a column/sub-row: the cursor
   * is resting on one of *its* Cards, tracked toward zooming into it (no
   * band). Null otherwise — including always, while locked into a Card:
   * Story 4 has no further zoom-in of its own yet.
   */
  hover: PopHover | null;
  /** Locked only: when the cursor left the context — the pop-out clock. Null while it's inside. */
  outsideSince: number | null;
}

export function startPopSession(contextKey: string | null): PopSession {
  return { contextKey, hover: null, outsideSince: null };
}

// Whether the card is currently bounded by a context (§2).
export function isLocked(session: PopSession): boolean {
  return session.contextKey !== null;
}

// The machine's state by name — the board root's `data-drag-state` (the
// E2E surface) and the tuning panel's readout both print this, so there is
// one spelling (audit epic-3-5-story-3 #6).
export type PopState = 'locked' | 'popped-out';

export function popState(session: PopSession): PopState {
  return isLocked(session) ? 'locked' : 'popped-out';
}

// How long a candidate of this kind takes to pop into (§3.1) — a lookup
// instead of a repeated `cardPopInDelayMs`-or-`popInDelayMs` branch at
// every call site (Story 4.1 Phase 0). Story 5 gains a `descendants` row.
function popInDelayFor(kind: RegionKind, tuning: DragTuning): number {
  return kind === 'card' ? tuning.cardPopInDelayMs : tuning.popInDelayMs;
}

// One pointer sample. Returns the same object when nothing changed, so a
// caller can skip a re-render. A transition that changes `contextKey`
// re-evaluates the very same pointer sample against the new layer before
// returning — rule 2's "one layer at a time" is about what a *single*
// transition may skip, not about waiting for a fresh pointermove to notice
// the next one is already due (see the header's rule 3 cascade note).
export function advancePopSession(
  session: PopSession,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  metrics: ShortCardMetrics,
  now: number,
): PopSession {
  if (session.contextKey === null) {
    // Board layer: a Card is never a target here (rule 2) — only a
    // column/sub-row is hoverable, both for its own band and for the
    // zoom-in clock into it. `childRegionAt(regions, pointer, null)` finds
    // exactly those: every column/sub-row's own `parentRegionKey` is null.
    const region = childRegionAt(regions, pointer, null);
    if (!region) return session.hover ? { ...session, hover: null } : session;
    const hover = hoverFor(session.hover, region, pointer, metrics, now);
    if (hover.poppable && now - hover.since >= popInDelayFor(region.kind, tuning)) {
      return transitionTo(region.key, pointer, regions, tuning, metrics, now);
    }
    return hover === session.hover ? session : { ...session, hover };
  }

  // Locked (any layer): a release commits this context's own within-action
  // no matter where the bare cursor is (rule 1). What's left to track: has
  // the cursor left long/far enough to pop back out (rule 2's parent-layer
  // target, read straight off `parentRegionKey` — null for every
  // column/sub-row, so a locked one always pops to Board with no branch);
  // and is it resting on one of *this* context's own child regions long
  // enough to pop into it (a Card has none yet — Story 6's own further
  // zoom-in is what would give it any).
  const contextRegion = regions.find(r => r.key === session.contextKey);
  const inside = contextRegion !== undefined && containsPoint(containmentRect(contextRegion), pointer);

  if (inside) {
    const candidate = childRegionAt(regions, pointer, session.contextKey);
    if (candidate) {
      const hover = hoverFor(session.hover, candidate, pointer, metrics, now);
      if (hover.poppable && now - hover.since >= popInDelayFor(candidate.kind, tuning)) {
        return transitionTo(candidate.key, pointer, regions, tuning, metrics, now);
      }
      return hover === session.hover && session.outsideSince === null
        ? session
        : { ...session, hover, outsideSince: null };
    }
    return session.hover === null && session.outsideSince === null
      ? session
      : { ...session, hover: null, outsideSince: null };
  }

  const outsideSince = session.outsideSince ?? now;
  if (popOutDue(contextRegion, pointer, tuning, now, outsideSince)) {
    return transitionTo(contextRegion?.parentRegionKey ?? null, pointer, regions, tuning, metrics, now);
  }
  return session.hover === null && session.outsideSince === outsideSince
    ? session
    : { ...session, hover: null, outsideSince };
}

// The three "pop into/out of `key`" recursive calls above, folded into one
// (audit epic-3-5-story-4 #11) — a fresh session at `key`, re-evaluated
// against this same pointer sample right away (see the header comment
// above `advancePopSession` on why that re-evaluation can't wait for the
// next `pointermove`).
function transitionTo(
  key: string | null,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  metrics: ShortCardMetrics,
  now: number,
): PopSession {
  return advancePopSession(
    { contextKey: key, hover: null, outsideSince: null },
    pointer,
    regions,
    tuning,
    metrics,
    now,
  );
}

// Board-layer hover, or a locked column/sub-row's hover on one of its own
// Cards: keeps the entry time while the cursor stays in the same region,
// returning the same object when nothing tracked has changed. Only a card
// list has a band (§5), read off the region's *live* rect and card count
// now that the reservation is exact (Phase 1); a Card candidate has no
// band at all, so it's unconditionally `poppable` instead — the kind's own
// rule, set once here (audit epic-3-5-story-4 #11) rather than re-derived
// at each call site that used to gate on `candidate.kind === 'card'`
// separately from reading `hover.poppable` (unified with the old, separate
// `hoverForCard` in Phase 0).
function hoverFor(
  current: PopHover | null,
  region: DragRegion,
  pointer: Point,
  metrics: ShortCardMetrics,
  now: number,
): PopHover {
  const staying = current?.regionKey === region.key ? current : null;
  if (!isCardList(region)) {
    return staying ?? { regionKey: region.key, since: now, poppable: true };
  }
  const since = staying?.since ?? now;
  const band = bandFor(pointer.y, region, metrics);
  const poppable = band === 'middle';
  return staying && staying.band === band ? staying : { regionKey: region.key, band, poppable, since };
}

// Story 4.1 Phase 4 (F6, ruled by the Product Owner 2026-09-18) — the rect
// the locked-context "is the cursor still inside" test (above) and
// `popOutDue`'s distance term measure against. The real requirement is
// narrower than either of the two options originally floated: a merged
// column must never pop out while the cursor is still somewhere inside it.
// `rect`/`contentRect` are exact-reservation, content-sized (Phase 1) — a
// short merged column's own empty space below its last card is nowhere in
// that box, so the exit clock ran there even though the cursor never left
// the column visually. `boundsRect` (merged columns only, `dragRegions.ts`)
// is the column's own outer, un-clipped body instead — resizing `rect`
// itself would have silently moved the Board-layer bottom-band boundary
// down with it, turning that same empty space into the *middle* band
// (no-op) instead of *bottom* (append). A sub-row's own `rect` already is
// its full bound (nothing to add), and a Card's within-action has no such
// ambiguity, so both fall through unchanged. `clampToCurrentContext`
// (useBoardDnd.ts) is unaffected — still X-only for a merged column,
// against `rect`, not `boundsRect`: this only changes when the pop-out
// clock is running, never how far the overlay can visually stray.
function containmentRect(region: DragRegion): Rect {
  return region.kind === 'column' && region.boundsRect ? region.boundsRect : region.rect;
}

function popOutDue(
  contextRegion: DragRegion | undefined,
  pointer: Point,
  tuning: DragTuning,
  now: number,
  outsideSince: number,
): boolean {
  if (now - outsideSince >= tuning.popDelayMs) return true;
  if (tuning.popDistancePx <= 0) return false;
  return (
    contextRegion !== undefined && distanceOutside(pointer, containmentRect(contextRegion)) >= tuning.popDistancePx
  );
}

// When the pending transition would fire if the cursor didn't move — for
// the owner to schedule a timer. Null when nothing is pending. At most one
// of {a locked pop-out, a locked zoom-in, a Board-layer pop-in} is ever
// pending at once (advancePopSession never sets both `hover` and
// `outsideSince`), so there's no ambiguity about which clock this reports.
// One expression over `hover.poppable` + `popInDelayFor` covers both layers
// alike (audit epic-3-5-story-4 #11) — a Board-layer hover's own region is
// always a column/sub-row (`popInDelayFor` resolves that to `popInDelayMs`
// exactly as directly naming the constant used to), and a locked hover's is
// always a Card today (`cardPopInDelayMs`); `regions` resolves which, and a
// locked hover falls back to `cardPopInDelayMs` if its region can't be
// found (the only kind a locked hover could be before Story 5 adds another).
export function popDueAt(session: PopSession, regions: readonly DragRegion[], tuning: DragTuning): number | null {
  if (session.contextKey !== null && session.outsideSince !== null) return session.outsideSince + tuning.popDelayMs;
  const hover = session.hover;
  if (!hover?.poppable) return null;
  const candidate = regions.find(r => r.key === hover.regionKey);
  return hover.since + popInDelayFor(candidate?.kind ?? 'card', tuning);
}

// Story 4.1 Phase 3 — what a real drop in-context resolved to, distinct
// from "nothing computed yet" (mid-drag, decision 1: sortable draws the
// slot, the ghost just sits at 'existing'). `null` is the mid-drag case,
// or release over genuinely nothing. `'container'` is release onto the
// bare column/sub-row container — no specific card to anchor beside.
// `{anchorId, side}` is release onto a specific card, `resolveDropSide`'s
// side.
export type PlacementOver = { anchorId: string; side: 'before' | 'after' } | 'container' | null;

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

  // A Descendants section's within-action, this story (decision 1): direct-
  // sibling reorder, scoped to `origin`'s own real parent — the same policy
  // `resolveBoardCollisions`' `siblingScopeParentId` restricts collisions
  // to. `over` is always a specific sibling row here (no bare "container"
  // concept for this kind — `handleDragEnd` never passes `'container'`);
  // mid-drag, with `over` still null, dnd-kit's own sortable strategy
  // already draws the reorder, so the ghost just sits at `origin` (or its
  // `priorPlacement`, same reconciliation-#1 reasoning as any other
  // context). Full gap+depth placement is Story 6's (§7).
  if (region.kind === 'descendants') {
    if (over === null || over === 'container') return priorPlacement ?? origin;
    const parentId = 'parentId' in origin ? origin.parentId : null;
    return { parentId, slot: { anchorId: over.anchorId, side: over.side } };
  }

  // Story 5: the moment a Stub's own list stops applying — any card-list
  // region, reached from either layer below — the placement previews Free
  // (itemListOps.ts::renderedIsStub already reads a `parentId: null` key
  // this way); a Free Card's placement carries no such opinion, exactly as
  // before Story 5.
  const nonComparable = 'parentId' in origin;
  const detach = nonComparable ? { parentId: null as string | null } : {};

  if (session.contextKey !== null) {
    const fallback = noAnchorSlot(region, nonComparable, activeItemPosition);
    if (over === null)
      return (
        priorPlacement ?? { ...detach, workphaseId: regionWorkphaseFor(region, activeWorkphaseId), slot: fallback }
      );
    if (over === 'container' || region.isTerminal) {
      return { ...detach, workphaseId: regionWorkphaseFor(region, activeWorkphaseId), slot: fallback };
    }
    return {
      ...detach,
      workphaseId: regionWorkphaseFor(region, activeWorkphaseId),
      slot: { anchorId: over.anchorId, side: over.side },
    };
  }

  // Board layer (popped out): the hovered band decides — unchanged.
  const band = session.hover?.band;
  if (!band && priorPlacement) return priorPlacement;

  let slot: Placement['slot'];
  if (region.isTerminal || !band || band === 'middle') {
    slot = noAnchorSlot(region, nonComparable, activeItemPosition);
  } else {
    slot = band === 'top' ? 'first' : 'last';
  }
  return { ...detach, workphaseId: regionWorkphaseFor(region, activeWorkphaseId), slot };
}

export function regionWorkphaseFor(region: CardListRegion, activeWorkphaseId: string | null): string {
  const member = activeWorkphaseId !== null && region.coveredWorkphaseIds.includes(activeWorkphaseId);
  return member ? activeWorkphaseId : region.targetWorkphaseId;
}
