// The pop state machine (locked / popped-out) for the board drag gesture — pure,
// unit-tested. Rules: docs/wiki/board-drag-interaction/README.md.

import type { DragTuning } from './dragTuning';
import {
  cardRegionKey,
  childRegionAt,
  containsPoint,
  isCardList,
  type DragRegion,
  type Point,
  type Rect,
  type RegionKind,
} from './dragRegions';
import { bandFor, distanceOutside, type Band, type ShortCardMetrics } from './dragBands';
// Story 6, hands-on finding 3 (2026-09-24) — `DropAnchor` is plain data
// (`{anchorId, side}`, no dnd-kit types), so importing its *type* here
// doesn't compromise this module's "no dnd-kit" promise; only the hook
// that owns the gesture ever constructs one (from dnd-kit's own live
// `active`/`over`, via `dropAnchorFor`) and hands it in as a plain value,
// the same way `pointer`/`regions`/`tuning` already arrive.
import type { DropAnchor } from './dragCollision';

// Epic 3.5 Story 3, re-planned for Story 4 (2026-09-16) — the pop state
// machine (docs/wiki/board-drag-interaction §1–§3, §5–§6). Pure: a session
// value and a transition on each pointer sample. No React, no dnd-kit, no
// timers — the hook that owns the gesture supplies the clock and the
// measured regions. `placement.ts` (Story 6.1 Phase 1, C-2) is this
// machine's other half — the one read-out (`placementFor`) that names the
// ghost mid-drag and the request itself at release alike (Story 4.1 Phase
// 3 — a release is just that same call with `over` filled in, not a
// second, separately-derived answer) — kept apart from the transition
// rules above, which it reads (`PopSession`) but never writes.
//
// The board is a strict stack of layers, never more than one deep from
// where you are: **Board** (`contextKey === null`) → **Column/sub-row** →
// **Card** → **Descendants** (Story 6, one Card's own section). Three
// rules, settled with the Product Owner before this build (2026-09-16),
// replace Story 3's flatter model:
//
//   1. A release always commits the *locked* context's own within-action —
//      Column/sub-row: anchor + side among its own items (dnd-kit's `over`,
//      scoped to just those). Card: append as the last child for an item
//      arriving from outside, or "set back down" for the drag's own
//      containing Card (Story 5) — either way no band, no anchor; manual
//      placement among Stubs is the Descendants layer one further in (§7,
//      Story 6 Phase D). This holds regardless of where the bare cursor is:
//      the overlay never visually
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
// own section, where a Stub's drag starts — but it wasn't yet a *zoom-in*
// candidate (`childRegionAt`'s own guard, `dragRegions.ts`), since a Card's
// within-action was always the auto-drop. Story 6, hands-on finding 3
// (2026-09-24): a locked column/sub-row's own zoom-in candidate no longer
// comes from `childRegionAt` at all — `namedCardCandidate`, below, replaces
// the hit test with the card `dropAnchorFor` already names as a neighbor of
// the ghost. Story 6 Phase D: `childRegionAt` now also finds a locked
// Card's own Descendants section (the guard above is gone), so
// `hoverForChildRegion` is what actually zooms a Card into it; a locked
// Descendants context has no further child of its own, so the same call
// keeps returning null there.
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
  /**
   * Locked column/sub-row only (Story 6, hands-on finding 3): the side
   * `dropAnchorFor` named alongside this candidate card. Holding the same
   * card on its *other* side is a different named relation (wiki §6) even
   * though `regionKey` alone wouldn't show it, so this is part of the
   * reset key, compared alongside `regionKey`.
   */
  side?: 'before' | 'after';
  /**
   * Locked column/sub-row only: which stage of the hold this candidate is
   * in — `'dwell'` (nothing shown yet) until `cardZoomDwellMs` elapses,
   * `'cue'` from then until the pop. Recomputed on every sample from
   * `since`, not just set once: a hold that crosses the boundary with the
   * cursor perfectly still still needs a *changed* `PopHover` object (the
   * caller's `pop !== current.pop` check, `useBoardDnd.ts::evaluatePop`)
   * to know to re-render and mount the cue — otherwise it would wait for a
   * pointermove that may never come before the pop is already due.
   */
  phase?: 'dwell' | 'cue';
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
   * band and its own zoom-in clock. Locked in a column/sub-row: the *named*
   * card (Story 6, finding 3 — `dropAnchorFor`'s own answer, not the
   * cursor's physical position) is tracked toward zooming into it (no
   * band). Locked in a Card: the cursor resting on its own Descendants
   * section, by a plain hit test this time (Story 6 Phase D). Null
   * otherwise — including always, while locked into Descendants: the layer
   * table's own "(none)," no further child to zoom into.
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
// instead of a repeated per-kind branch at every call site (Story 4.1
// Phase 0). Story 6, finding 3: a Card candidate's total is now the dwell
// *plus* the cue (the whole hold, not just the cue) — the one place that
// total is computed, read by both the pop-check below and `popDueAt`'s own
// fallback. Story 6 Phase D: a Descendants candidate is its own,
// duration-only clock (`descendantsPopInDelayMs`) — no dwell/cue split,
// since this edge names no specific neighbor to hold steady against.
function popInDelayFor(kind: RegionKind, tuning: DragTuning): number {
  if (kind === 'card') return tuning.cardZoomDwellMs + tuning.cardPopInDelayMs;
  if (kind === 'descendants') return tuning.descendantsPopInDelayMs;
  return tuning.popInDelayMs;
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
  // Story 6, hands-on finding 3 (2026-09-24): the live named relation
  // (`dragCollision.ts::dropAnchorFor`'s own answer — the hook computes it
  // from dnd-kit's `active`/`over`, this module never touches either) —
  // only consulted from a locked column/sub-row, below. Defaulted so every
  // existing call site (Board layer, a locked Card, a locked Descendants
  // section) is unaffected.
  namedAnchor: DropAnchor | null = null,
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
      return transitionTo(region.key, pointer, regions, tuning, metrics, now, namedAnchor);
    }
    return hover === session.hover ? session : { ...session, hover };
  }

  // Locked (any layer): a release commits this context's own within-action
  // no matter where the bare cursor is (rule 1). What's left to track: has
  // the cursor left long/far enough to pop back out (rule 2's parent-layer
  // target, read straight off `parentRegionKey` — null for every
  // column/sub-row, so a locked one always pops to Board with no branch);
  // and is it resting on one of *this* context's own child regions long
  // enough to pop into it. A locked column/sub-row's own child is a Card,
  // found by the *named relation* now (Story 6, finding 3), not a hit test;
  // `childRegionAt` is what finds a locked Card's own child instead — its
  // Descendants section (Story 6 Phase D), the one case this hit test still
  // serves.
  const contextRegion = regions.find(r => r.key === session.contextKey);
  const inside = contextRegion !== undefined && containsPoint(containmentRect(contextRegion), pointer);

  if (inside) {
    const hover =
      contextRegion && isCardList(contextRegion)
        ? namedCardCandidate(session.hover, namedAnchor, regions, tuning, now)
        : hoverForChildRegion(session.hover, regions, pointer, session.contextKey, metrics, now);
    if (hover) {
      const candidateKind = regions.find(r => r.key === hover.regionKey)?.kind ?? 'card';
      if (hover.poppable && now - hover.since >= popInDelayFor(candidateKind, tuning)) {
        return transitionTo(hover.regionKey, pointer, regions, tuning, metrics, now, namedAnchor);
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
    return transitionTo(contextRegion?.parentRegionKey ?? null, pointer, regions, tuning, metrics, now, namedAnchor);
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
  namedAnchor: DropAnchor | null,
): PopSession {
  return advancePopSession(
    { contextKey: key, hover: null, outsideSince: null },
    pointer,
    regions,
    tuning,
    metrics,
    now,
    namedAnchor,
  );
}

// The pre-Story-6-finding-3 path, unchanged: a locked Card's own child (its
// Descendants section) is found by a plain hit test — `childRegionAt` now
// resolves one for any Valid Card with a section (Story 6 Phase D), so this
// is what actually zooms a locked Card into it. A locked Descendants
// context has no further child of its own (`childRegionAt` never finds a
// region whose `parentRegionKey` is a `descendants:` key), so this call
// always returns null from there — the layer table's own "(none)".
function hoverForChildRegion(
  current: PopHover | null,
  regions: readonly DragRegion[],
  pointer: Point,
  parentKey: string,
  metrics: ShortCardMetrics,
  now: number,
): PopHover | null {
  const candidate = childRegionAt(regions, pointer, parentKey);
  return candidate ? hoverFor(current, candidate, pointer, metrics, now) : null;
}

// Story 6, hands-on finding 3 (2026-09-24) — a locked column/sub-row's own
// zoom-in candidate: no longer whichever Card the cursor physically rests
// on, but the Card `dropAnchorFor` already names as a neighbor of the
// ghost (the same relation the live blue line draws, `KanbanCard.tsx`'s
// `useLiveDropSide`) — "holding that relation steady is the signal" (wiki
// §6). `namedAnchor` is null with nothing named (alone in the list, or
// hovering nothing) — no candidate, same as `childRegionAt` finding
// nothing.
//
// Resolving the name against `regions` — rather than trusting it outright
// — is what keeps an invalid target (cycle-forming, depth-capped) from
// ever becoming a candidate at all, with no separate validity check of its
// own: `resolveDragStructure` never registers a `card:` region for one in
// the first place (`cardStructureFromKey`'s own `isValidCard` gate), so it
// simply isn't found here — the exact "named for a reorder, never a
// zoom-in candidate" rule (§3.2), already how `childRegionAt`'s own callers
// got it for free.
//
// `since` resets on *either* a different card or the same card's other
// side (`side`, part of the reset key alongside `regionKey`) — "the same
// card on its other side" is a different named relation (wiki §6). `phase`
// is recomputed every call from `now - since`, so a hold that crosses the
// dwell boundary still returns a genuinely different object even with a
// motionless cursor (`popDueAt` below schedules a timer for exactly that
// moment).
function namedCardCandidate(
  current: PopHover | null,
  namedAnchor: DropAnchor | null,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  now: number,
): PopHover | null {
  if (!namedAnchor) return null;
  const region = regions.find(r => r.kind === 'card' && r.key === cardRegionKey(namedAnchor.anchorId));
  if (!region) return null;
  const staying = current?.regionKey === region.key && current.side === namedAnchor.side ? current : null;
  const since = staying?.since ?? now;
  const phase: NonNullable<PopHover['phase']> = now - since < tuning.cardZoomDwellMs ? 'dwell' : 'cue';
  return staying && staying.phase === phase
    ? staying
    : { regionKey: region.key, since, poppable: true, side: namedAnchor.side, phase };
}

// Board-layer hover, or (via `hoverForChildRegion`, Story 6 Phase D) a
// locked Card's hover on its own Descendants section — a locked
// column/sub-row's own Card candidate no longer comes through here at all
// (Story 6, finding 3: that's `namedCardCandidate` instead). Keeps the
// entry time while the cursor stays in the same region, returning the same
// object when nothing tracked has changed. Only a card list has a band
// (§5), read off the region's *live* rect and card count now that the
// reservation is exact (Phase 1); a Descendants candidate has no band at
// all, so it's unconditionally `poppable` instead — the kind's own rule,
// set once here (audit epic-3-5-story-4 #11) rather than re-derived at each
// call site that used to gate on `candidate.kind === 'card'` separately
// from reading `hover.poppable` (unified with the old, separate
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
// One expression over `hover.poppable` + `popInDelayFor` covers every layer
// alike (audit epic-3-5-story-4 #11) — a Board-layer hover's own region is
// always a column/sub-row (`popInDelayFor` resolves that to `popInDelayMs`
// exactly as directly naming the constant used to), and a locked hover's is
// either a Card (`cardPopInDelayMs`, `namedCardCandidate`) or, one layer
// further in, its own Descendants section (`descendantsPopInDelayMs`,
// Story 6 Phase D, `hoverForChildRegion`); `regions` resolves which, and a
// locked hover falls back to `cardPopInDelayMs` if its region can't be
// found (the shallower of the two).
export function popDueAt(session: PopSession, regions: readonly DragRegion[], tuning: DragTuning): number | null {
  if (session.contextKey !== null && session.outsideSince !== null) return session.outsideSince + tuning.popDelayMs;
  const hover = session.hover;
  if (!hover?.poppable) return null;
  const candidate = regions.find(r => r.key === hover.regionKey);
  const kind = candidate?.kind ?? 'card';
  // Story 6, finding 3: a Card candidate's hold has an intermediate
  // milestone worth its own timer — the dwell's own end, when the cue
  // mounts — not just the final pop. Without this, a hold with the
  // pointer perfectly still would only ever schedule the final pop, and
  // the cue would never appear until it was already over.
  if (kind === 'card' && hover.phase !== 'cue') return hover.since + tuning.cardZoomDwellMs;
  return hover.since + popInDelayFor(kind, tuning);
}
