import type { DragTuning } from './dragTuning';
import type { Placement } from './itemListOps';
import { bandFor, distanceOutside, regionAt, type Band, type DragRegion, type Point, type Rect } from './dragRegions';

// Epic 3.5 Story 3 — the pop state machine (docs/wiki/board-drag-interaction
// §1–§3, §5). Pure: a session value, a transition on each pointer sample,
// and two read-outs (what the ghost should show, what a release means). No
// React, no dnd-kit, no timers — the hook that owns the gesture supplies the
// clock and the measured regions.
//
// The bias the whole model encodes: a drag is a reposition inside its
// current context until the cursor proves otherwise. Three states:
//
//   locked      the card belongs to a context and is clamped to it; the
//               cursor is free to leave, and where it rests decides what a
//               release means — a band of another region.
//   popped out  the cursor stayed outside the context past the pop-out
//               threshold: the card belongs to nothing and follows the
//               cursor. A release in a region is still that region's band.
//   locked      again, once the cursor rests in a region's pop-eligible
//               band past the pop-in threshold — any column, the one it
//               just left included. Settled with the Product Owner after
//               Story 3's first hands-on: popping out and popping in are
//               two deliberate signals, and the popped-out state between
//               them is a real place to be.

export interface PopHover {
  regionKey: string;
  band: Band;
  /**
   * When this hover began — the pop-in clock while popped out. Restarts on
   * the pop-out itself, so the popped-out state always lasts at least the
   * pop-in threshold.
   */
  since: number;
  /**
   * The region's rect as it was on entry — the bands are measured against
   * this for as long as the hover lasts. The ghost's own insertion grows the
   * hovered list (and, in an expanded column, moves the sub-rows below it),
   * so measuring the band against the live rect would let a drop change the
   * band it is about to be resolved by.
   */
  rect: Rect;
}

export interface PopSession {
  /**
   * The region the carried item currently belongs to (§1) — and is clamped
   * to. Null while popped out, and from the start for a drag that began
   * outside every region (Unsorted is drag-source only).
   */
  contextKey: string | null;
  /** The cursor is in a region other than the context. Null in-context, between columns, or over an Inert surface. */
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

// One pointer sample. Returns the same object when nothing changed, so a
// caller can skip a re-render.
export function advancePopSession(
  session: PopSession,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  now: number,
): PopSession {
  const region = regionAt(regions, pointer);

  if (session.contextKey !== null) {
    // Locked. Inside the context: nothing to track.
    if (region?.key === session.contextKey) {
      return session.hover || session.outsideSince !== null ? { ...session, hover: null, outsideSince: null } : session;
    }
    // Outside it — anywhere: another region, a gap, an Inert surface. The
    // pop-out clock runs from the moment the cursor left (§3.1: sustained,
    // never incidental); the hover tracks which region's band a release
    // would resolve by, with its rect frozen on entry.
    const outsideSince = session.outsideSince ?? now;
    const hover = region ? hoverFor(session.hover, region, pointer, tuning, now) : null;
    if (popOutDue(session, pointer, regions, tuning, now, outsideSince)) {
      // Popped out: the pop-in clock starts fresh here.
      return { contextKey: null, hover: hover ? { ...hover, since: now } : null, outsideSince: null };
    }
    return hover === session.hover && outsideSince === session.outsideSince
      ? session
      : { ...session, hover, outsideSince };
  }

  // Popped out (or never had a context): following the cursor. Resting in a
  // region's pop-eligible band past the pop-in threshold locks the card
  // into it.
  if (!region) return session.hover ? { ...session, hover: null } : session;
  const hover = hoverFor(session.hover, region, pointer, tuning, now);
  if (hover.band === 'middle' && now - hover.since >= tuning.popInDelayMs) {
    return { contextKey: region.key, hover: null, outsideSince: null };
  }
  return hover === session.hover ? session : { ...session, hover };
}

// The hover for `region`, keeping the entry time and frozen rect while the
// cursor stays in the same region and returning the same object when the
// band hasn't changed either.
function hoverFor(
  current: PopHover | null,
  region: DragRegion,
  pointer: Point,
  tuning: DragTuning,
  now: number,
): PopHover {
  const staying = current?.regionKey === region.key ? current : null;
  const since = staying?.since ?? now;
  const rect = staying?.rect ?? region.rect;
  const band = bandFor(pointer.y, rect, tuning);
  return staying && staying.band === band ? staying : { regionKey: region.key, band, since, rect };
}

function popOutDue(
  session: PopSession,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
  now: number,
  outsideSince: number,
): boolean {
  if (now - outsideSince >= tuning.popDelayMs) return true;
  if (tuning.popDistancePx <= 0) return false;
  const context = regions.find(r => r.key === session.contextKey);
  return context !== undefined && distanceOutside(pointer, context.rect) >= tuning.popDistancePx;
}

// When the pending transition would fire if the cursor didn't move — for
// the owner to schedule a timer. Null when nothing is pending.
export function popDueAt(session: PopSession, tuning: DragTuning): number | null {
  if (session.contextKey !== null) {
    return session.outsideSince === null ? null : session.outsideSince + tuning.popDelayMs;
  }
  return session.hover?.band === 'middle' ? session.hover.since + tuning.popInDelayMs : null;
}

// The ghost (§10 ordinal preview, §5 band table): in the hovered region at
// the band's slot, else in the context region where the item already
// sorts. Membership follows the region — a covered-set member keeps its own
// workphase, anyone else takes the region's target. A done region never
// previews a positioned insert. Null when the card belongs nowhere and the
// cursor is over nothing: it's drawn where it already is.
export function placementFor(
  session: PopSession,
  regions: readonly DragRegion[],
  activeWorkphaseId: string | null,
): Placement | null {
  const key = session.hover?.regionKey ?? session.contextKey;
  const region = key === null ? undefined : regions.find(r => r.key === key);
  if (!region) return null;
  const band = session.hover?.band;
  const slot = region.isTerminal || !band || band === 'middle' ? 'existing' : band === 'top' ? 'first' : 'last';
  return { workphaseId: regionWorkphaseFor(region, activeWorkphaseId), slot };
}

export function regionWorkphaseFor(region: DragRegion, activeWorkphaseId: string | null): string {
  const member = activeWorkphaseId !== null && region.coveredWorkphaseIds.includes(activeWorkphaseId);
  return member ? activeWorkphaseId : region.targetWorkphaseId;
}

export type ReleaseIntent =
  // The cursor is in the context: dnd-kit's `over` (anchor + side) decides.
  | { kind: 'in-context' }
  // A region the card doesn't belong to — from either state: its band decides (§5).
  | { kind: 'band'; region: DragRegion; band: Band }
  // Between columns or over an Inert surface: nothing is written.
  | { kind: 'none' };

export function releaseIntent(
  session: PopSession,
  pointer: Point,
  regions: readonly DragRegion[],
  tuning: DragTuning,
): ReleaseIntent {
  const region = regionAt(regions, pointer);
  if (!region) return { kind: 'none' };
  if (region.key === session.contextKey) return { kind: 'in-context' };
  const rect = session.hover?.regionKey === region.key ? session.hover.rect : region.rect;
  return { kind: 'band', region, band: bandFor(pointer.y, rect, tuning) };
}
