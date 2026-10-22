// The reservation/band math for a card-list region
// (wiki board-drag-interaction §5) — reservationFor/bandBoundaries/bandFor
// turn a region's own isTerminal/cardCount into pixel boundaries;
// distanceOutside is the pop threshold's optional distance term. The
// board's own band policy, not a fact about what a region *is*
// structurally (that's dragRegions.ts).

import type { CardListRegion, Point, Rect } from './dragRegions';

export type Band = 'top' | 'middle' | 'bottom';

// The two numbers the reservation math is built from — a fixed fact about
// the shortCard component (`cardMetrics.ts::SHORT_CARD_HEIGHT_PX`) and the
// card lists' own gap (`cardMetrics.ts::CARD_LIST_GAP_PX`), never tuning
// values: neither is found by feel. Passed in rather than imported, so this
// pure module depends only on `dragRegions.ts`; its callers pass
// `cardMetrics.ts::SHORT_CARD_METRICS`.
export interface ShortCardMetrics {
  heightPx: number;
  gapPx: number;
}
export type BandRegion = Pick<CardListRegion, 'contentRect' | 'isTerminal' | 'cardCount'>;

// What the band reservation looks like for a card list, everything short of
// actual pixels-on-a-rect: the shape (which of the three cases below), the
// label box's own height, and where a divider sits (positional only — the
// same number `bandBoundaries` turns into an absolute boundary). The one
// place the formula lives: `bandBoundaries` and
// `BandGuides.tsx::DragCarveFrame` read `.shape`/`.zoneHeight`/`.edge`
// rather than recomputing any of it, so what the guides draw and what a
// release resolves to can't disagree.
export interface Reservation {
  /**
   * 'positional': real cards, positions apply — two zones, a real divider.
   * 'terminal': a done region with cards — one bottom-only zone, sized for
   * the ghost that always previews last there. 'empty' / 'none': nothing
   * else here — one zone spanning the whole region, only the label
   * distinguishing a still-positional empty region from a done one with
   * nothing in it yet (both render identically today).
   */
  shape: 'positional' | 'empty' | 'terminal' | 'none';
  /** The label box's own height. */
  zoneHeight: number;
  /** Where the divider sits (and the band boundary resolves against) — positional only; 0 otherwise (nothing to divide). */
  edge: number;
}

// A genuinely empty region carves the full card height (`heightPx`),
// nothing to shift out of the way; a region with exactly one card brings both
// edges in to `(heightPx + gapPx) / 2` instead of the normal `heightPx`, so
// the card stays a real, unlabeled middle band rather than being bisected
// into top/bottom with nothing left between; a done region with cards reserves one bottom-only
// zone of `heightPx + gapPx`, exactly where its ghost (which always
// previews last there) lands.
export function reservationFor(
  region: Pick<CardListRegion, 'isTerminal' | 'cardCount'>,
  metrics: ShortCardMetrics,
): Reservation {
  const { heightPx, gapPx } = metrics;
  if (region.cardCount === 0) return { shape: region.isTerminal ? 'none' : 'empty', zoneHeight: heightPx, edge: 0 };
  if (region.isTerminal) return { shape: 'terminal', zoneHeight: heightPx + gapPx, edge: 0 };
  const edge = region.cardCount === 1 ? (heightPx + gapPx) / 2 : heightPx;
  return { shape: 'positional', zoneHeight: (heightPx + gapPx) / 2, edge };
}

// Where the two band boundaries sit, in viewport pixels, measured from
// `contentRect` (never the visible-clipped `rect`: a boundary scrolled out
// of view stays exactly where its content put it, reachable only by
// scrolling to it). Null collapses to a single band spanning the whole
// region: a done region (positions never apply) or a genuinely empty one
// (nothing to be before/after) — `reservationFor`'s non-'positional'
// shapes.
export function bandBoundaries(region: BandRegion, metrics: ShortCardMetrics): { top: number; bottom: number } | null {
  const reservation = reservationFor(region, metrics);
  if (reservation.shape !== 'positional') return null;
  return { top: region.contentRect.top + reservation.edge, bottom: region.contentRect.bottom - reservation.edge };
}

// The vertical band a point falls in: above `top` is the top band, below
// `bottom` is the bottom band, the middle otherwise (or the whole region,
// collapsed). A point outside the rect falls in the nearer edge's band: the
// boundaries are absolute pixels, not fractions, so no clamping arithmetic
// is needed to get that.
export function bandFor(y: number, region: BandRegion, metrics: ShortCardMetrics): Band {
  const boundaries = bandBoundaries(region, metrics);
  if (!boundaries) return 'middle';
  if (y < boundaries.top) return 'top';
  if (y > boundaries.bottom) return 'bottom';
  return 'middle';
}

// How far `value` sits outside `[min, max]` (0 inside) — the one axis-
// distance rule, shared by both axes below rather than spelled once for
// each.
function distanceFromRange(value: number, min: number, max: number): number {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

// How far a point sits outside a rect (0 inside) — the optional distance
// term of the pop threshold.
export function distanceOutside(point: Point, rect: Rect): number {
  const dx = distanceFromRange(point.x, rect.left, rect.right);
  const dy = distanceFromRange(point.y, rect.top, rect.bottom);
  return Math.hypot(dx, dy);
}
