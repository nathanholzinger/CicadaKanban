// The pop state machine of the board drag gesture: which layer a drag is
// locked into, and the clocks that move it one layer in or out
// (wiki board-drag-interaction §1.1, §3, §3.1 and §6.1). Pure: a session
// value and a transition on each pointer sample. No React, no dnd-kit, no
// timers — the hook that owns the gesture supplies the clock and the measured
// regions. It holds no placement rules: `placement.ts::placementFor` reads the
// session to name the ghost and the release, and never writes it.
//
// States: locked into a context (a column/sub-row, a Card, or a Card's
// Descendants section), or popped out to Board (`contextKey === null`). What
// moves between them:
//   - Pop out, from any layer: the cursor stays outside the context past
//     `popDelayMs`, or gets `popDistancePx` beyond it. The drag lands on the
//     context's parent, read off `DragRegion.parentRegionKey`.
//   - Pop in, Board → a column/sub-row: the cursor rests in its region past
//     `popInDelayMs`, and is in the middle band when that runs out.
//   - Zoom in, a column/sub-row → a Card: the named relation holds through
//     the dwell and then the cue (`namedCardCandidate`).
//   - Zoom in, a Card → its Descendants section: the cursor rests on the
//     section past `descendantsPopInDelayMs`.

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
// The named anchor arrives as plain data (`{anchorId, side}`), the way
// `pointer`, `regions` and `tuning` do, so this module never touches dnd-kit.
import type { AnchorRelation, DropSide } from '../../lib/hierarchyPlacement';

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
   * in. A card list candidate: the middle band. Any other candidate (a
   * Card, or a Card's Descendants section): always, since it has no band.
   * Set once here, so no call site re-derives it from the kind.
   */
  poppable?: boolean;
  /**
   * Locked column/sub-row only: the side `dropAnchorFor` named alongside
   * this candidate card. Holding the same card on its *other* side is a
   * different named relation (wiki board-drag-interaction §6.1) even though
   * `regionKey` alone wouldn't show it, so this is part of the reset key,
   * compared alongside `regionKey`.
   */
  side?: DropSide;
  /**
   * Locked column/sub-row only: which stage of the hold this candidate is
   * in — `'dwell'` (nothing shown yet) until `cardZoomDwellMs` elapses,
   * `'cue'` from then until the pop. Recomputed from `since` on every
   * sample, not set once, so a hold that crosses the boundary with the
   * cursor perfectly still still returns a changed `PopHover`. The owner
   * re-renders only on a changed session (`useBoardDnd.ts::evaluatePop`),
   * so otherwise the cue would wait for a pointermove that may not come
   * before the pop is due.
   */
  phase?: 'dwell' | 'cue';
}

export interface PopSession {
  /**
   * The region the carried item currently belongs to — and is clamped
   * to. Null while popped out (Board layer), and from the start for a drag
   * that began outside every region (Unsorted is drag-source only).
   */
  contextKey: string | null;
  /**
   * Board layer: the cursor is hovering a column/sub-row, tracked for its
   * band and its own zoom-in clock. Locked in a column/sub-row: the *named*
   * card (`dropAnchorFor`'s own answer, not the cursor's physical position)
   * is tracked toward zooming into it (no band). Locked in a Card: the
   * cursor resting on its own Descendants section, by a hit test. Null
   * otherwise — including always, while locked into Descendants, which has
   * no further child to zoom into.
   */
  hover: PopHover | null;
  /** Locked only: when the cursor left the context — the pop-out clock. Null while it's inside. */
  outsideSince: number | null;
}

// The parent of a context the machine can't see: its region missing from
// the sample, clipped out of view, so its own `parentRegionKey` can't be
// read off it. The owner passes a structural lookup (the parent chain
// doesn't depend on what's visible); without one, a pop-out from a context
// it can't see lands on Board, skipping every layer between
// (wiki board-drag-interaction §1.1, rule 2).
export type ParentKeyOf = (contextKey: string) => string | null;
const NO_PARENT_LOOKUP: ParentKeyOf = () => null;

export function startPopSession(contextKey: string | null): PopSession {
  return { contextKey, hover: null, outsideSince: null };
}

// Whether the card is currently bounded by a context.
export function isLocked(session: PopSession): boolean {
  return session.contextKey !== null;
}

// The machine's state by name — the board root's `data-drag-state` (the
// E2E surface) and the tuning panel's readout both print this, so there is
// one spelling.
export type PopState = 'locked' | 'popped-out';

export function popState(session: PopSession): PopState {
  return isLocked(session) ? 'locked' : 'popped-out';
}

// How long a candidate of this kind takes to pop into. A Card candidate's
// total is the dwell *plus* the cue — the whole hold — and this is the one
// place that total is computed, read by both the pop check below and
// `popDueAt`. A Descendants candidate has its own duration-only clock, with
// no dwell and cue, since that edge names no neighbor to hold steady
// against.
//
// A genuine per-kind table: each kind has its own tuning value. The other
// kind tests (`hoverFor`'s band, `containmentRect`,
// `dragOverlayGeometry.ts::clampToCurrentContext`'s y clamp) are separate
// properties that only happen to split the kinds the same way today, so they
// stay out of it: one table would couple them.
function popInDelayFor(kind: RegionKind, tuning: DragTuning): number {
  if (kind === 'card') return tuning.cardZoomDwellMs + tuning.cardPopInDelayMs;
  if (kind === 'descendants') return tuning.descendantsPopInDelayMs;
  return tuning.popInDelayMs;
}

// One pointer sample. Returns the same object when nothing changed, so a
// caller can skip a re-render. A transition that changes `contextKey`
// re-evaluates the very same pointer sample against the new layer before
// returning. "One layer at a time" limits what a *single* transition may
// skip; it doesn't wait for a fresh pointermove to notice the next one is
// already due, so a decisive pull cascades through two pops at once.
export function advancePopSession(
  session: PopSession,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  metrics: ShortCardMetrics,
  now: number,
  // The live named relation, `dragCollision.ts::dropAnchorFor`'s own
  // answer. Only a locked column/sub-row consults it, below, so a caller
  // at any other layer may leave it out.
  namedAnchor: AnchorRelation | null = null,
  parentKeyOf: ParentKeyOf = NO_PARENT_LOOKUP,
): PopSession {
  if (session.contextKey === null) {
    // Board layer: a Card is never a target here (one layer at a time) —
    // only a column/sub-row is hoverable, both for its own band and for the
    // zoom-in clock into it. `childRegionAt(regions, pointer, null)` finds
    // exactly those: every column/sub-row's own `parentRegionKey` is null.
    const region = childRegionAt(regions, pointer, null);
    if (!region) return session.hover ? { ...session, hover: null } : session;
    const hover = hoverFor(session.hover, region, pointer, metrics, now);
    if (hover.poppable && now - hover.since >= popInDelayFor(region.kind, tuning)) {
      return transitionTo(region.key, pointer, regions, tuning, metrics, now, namedAnchor, parentKeyOf);
    }
    return hover === session.hover ? session : { ...session, hover };
  }

  // Locked (any layer): a release commits this context's own within-action
  // no matter where the bare cursor is. What's left to track: has the
  // cursor left long/far enough to pop back out (to the parent layer, read
  // straight off `parentRegionKey` — null for every column/sub-row, so a
  // locked one always pops to Board with no branch); and is it resting on
  // one of *this* context's own child regions long enough to pop into it. A
  // locked column/sub-row's own child is a Card, found by the *named
  // relation*, not a hit test; `childRegionAt` finds a locked Card's own
  // child instead — its Descendants section.
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
        return transitionTo(hover.regionKey, pointer, regions, tuning, metrics, now, namedAnchor, parentKeyOf);
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
  if (popOutDue(contextRegion, pointer, tuning, now, session.outsideSince)) {
    const parentKey = contextRegion ? contextRegion.parentRegionKey : parentKeyOf(session.contextKey);
    return transitionTo(parentKey, pointer, regions, tuning, metrics, now, namedAnchor, parentKeyOf);
  }
  return session.hover === null && session.outsideSince === outsideSince
    ? session
    : { ...session, hover: null, outsideSince };
}

// Every "pop into/out of `key`": a fresh session at `key`, re-evaluated
// against this same pointer sample right away (see the comment above
// `advancePopSession` on why that re-evaluation can't wait for the next
// `pointermove`).
function transitionTo(
  key: string | null,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  metrics: ShortCardMetrics,
  now: number,
  namedAnchor: AnchorRelation | null,
  parentKeyOf: ParentKeyOf,
): PopSession {
  return advancePopSession(
    { contextKey: key, hover: null, outsideSince: null },
    pointer,
    regions,
    tuning,
    metrics,
    now,
    namedAnchor,
    parentKeyOf,
  );
}

// A locked Card's own child, its Descendants section, is found by a hit
// test: `childRegionAt` resolves one for any Valid Card with a section, so
// this is what zooms a locked Card into it. A locked Descendants context
// has no child region of its own, so this returns null from there.
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

// A locked column/sub-row's own zoom-in candidate: not whichever Card the
// cursor physically rests on, but the Card `dropAnchorFor` names as a
// neighbor of the ghost — the same relation the live blue line draws
// (`dragChrome.tsx::useLiveDropSide`). Holding that relation steady is the
// signal (wiki board-drag-interaction §6.1). `namedAnchor` is null with
// nothing named (alone in the list, or hovering nothing) — no candidate,
// same as `childRegionAt` finding nothing.
//
// Resolving the name against `regions` — rather than trusting it outright
// — is what keeps an invalid target (Cycle-forming, Depth-capped) from
// ever becoming a candidate, with no validity check of its own: it relies on
// `dragStructure.ts::resolveDragStructure` registering a `card:` region only
// for a Valid Card. An invalid Card can still be named for a reposition,
// but is never a zoom-in candidate (wiki board-drag-interaction §3.2).
//
// `since` resets on *either* a different card or the same card's other
// side (`PopHover.side`). `phase` is recomputed every call from
// `now - since`, so a hold that crosses the dwell boundary still returns a
// genuinely different object even with a motionless cursor (`popDueAt`
// below schedules a timer for exactly that moment).
function namedCardCandidate(
  current: PopHover | null,
  namedAnchor: AnchorRelation | null,
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

// A Board-layer hover, or (via `hoverForChildRegion`) a locked Card's hover
// on its own Descendants section. A locked column/sub-row's Card candidate
// comes from `namedCardCandidate` instead. Keeps the entry time while the
// cursor stays in the same region, returning the same object when nothing
// tracked has changed. Only a card list has a band, read off the region's
// *live* rect and card count: the reservation is exact, so the hover never
// changes the region's size. A Descendants candidate has no band at all,
// so it's always `poppable` — the kind's own rule, set once here so no call
// site re-derives it.
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

// The rect the locked-context "is the cursor still inside" test (above)
// and `popOutDue`'s distance term measure against. A merged column must
// never pop out while the cursor is still somewhere inside it
// (wiki board-drag-interaction §2). `rect`/`contentRect` are content-sized,
// so a short merged column's own empty space below its last card is
// nowhere in that box; `boundsRect` (merged columns only) is the column's
// own outer, un-clipped body instead. `rect` itself stays content-sized:
// enlarging it would move the Board-layer bottom-band boundary down with
// it, turning that same empty space into the *middle* band (no-op) instead
// of *bottom* (append). A sub-row's own `rect` already is its full bound,
// and a Card's within-action has no such ambiguity, so both fall through
// unchanged.
//
// Not the inverse of `dragOverlayGeometry.ts::clampToCurrentContext`'s
// `!== 'column'`: that decides how far the carried copy follows the cursor,
// this decides whether the context still holds, and a merged column
// answers the two against different boxes.
function containmentRect(region: DragRegion): Rect {
  return region.kind === 'column' && region.boundsRect ? region.boundsRect : region.rect;
}

// `outsideSince` is the pop-out clock as this sample found it: null when
// the cursor has only just left. The time term needs a clock an *earlier*
// sample started, so a zero `popDelayMs` pops on the next sample, never the
// one that noticed the exit. A transition's own re-evaluation reads the new
// context against regions sampled for the old one, where the new context
// is missing (so "outside"), and a zero delay would pop straight on from
// there, cascading to Board in one sample. The owner's next sample, scoped
// to the new context, is the real read.
function popOutDue(
  contextRegion: DragRegion | undefined,
  pointer: Point,
  tuning: DragTuning,
  now: number,
  outsideSince: number | null,
): boolean {
  if (outsideSince !== null && now - outsideSince >= tuning.popDelayMs) return true;
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
// alike — a Board-layer hover's own region is always a column/sub-row
// (`popInDelayMs`), and a locked hover's is either a Card
// (`namedCardCandidate`) or, one layer further in, its own Descendants
// section (`descendantsPopInDelayMs`, `hoverForChildRegion`); `regions`
// resolves which, and a locked hover falls back to the Card's clock if its
// region can't be found (the shallower of the two).
export function popDueAt(session: PopSession, regions: readonly DragRegion[], tuning: DragTuning): number | null {
  if (session.contextKey !== null && session.outsideSince !== null) return session.outsideSince + tuning.popDelayMs;
  const hover = session.hover;
  if (!hover?.poppable) return null;
  const candidate = regions.find(r => r.key === hover.regionKey);
  const kind = candidate?.kind ?? 'card';
  // A Card candidate's hold has an intermediate milestone worth its own
  // timer — the dwell's own end, when the cue mounts — not just the final
  // pop. Without this, a hold with the pointer perfectly still would only
  // ever schedule the final pop, and the cue would never appear until it
  // was already over.
  if (kind === 'card' && hover.phase !== 'cue') return hover.since + tuning.cardZoomDwellMs;
  return hover.since + popInDelayFor(kind, tuning);
}
