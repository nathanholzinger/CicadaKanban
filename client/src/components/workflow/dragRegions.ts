import type { DragTuning } from './dragTuning';
import { subrowContainerId, type DropColumn } from './boardDndUtils';

// Epic 3.5 Story 3 — the *regions* a Card drag can be in (docs/wiki/board-
// drag-interaction §1, §5): a merged column's body, or one sub-row of an
// expanded column. Each is a context a drag can start in or pop into, and
// the surface the drop bands are measured against. Unsorted, a broken
// column, and an expanded column's outer wrapper register no region — they
// are Inert (§4). Pure geometry over rects the board measures from the DOM.
//
// Story 4: a Card is also a region — `card:<id>`, reachable as a zoom-in
// target only from the column/sub-row that contains it (`parentRegionKey`)
// and only while genuinely locked into that parent context — never hit-
// tested unconditionally, and never a Board-layer target in its own right
// (re-plan 2026-09-16; see `nonCardRegionAt`/`cardRegionAt` below). It
// carries `attachToCardId` instead of (well, alongside a nominal) workphase
// target; every function below that branches on region shape does so on
// that field, never on a separate "kind" enum, so a plain containment
// helper only has to grow one more field to read.
//
// A region is a bounded box (§1, wiki–code reconciliation #20) — hit-tested
// by simple containment, nothing outside it. A column's header/footer, the
// gaps between columns and between sub-rows, and the space below the last
// sub-row are nowhere, the same as the gap between two columns. A sub-row
// (or a Card) is additionally clipped to its column's visible scroll box
// below: one scrolled fully out of view registers no region at all until it
// scrolls back in.

export interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type Band = 'top' | 'middle' | 'bottom';

export interface DragRegion {
  /** `column:<id>` or `subrow:<columnId>:<workphaseId>` — also the DOM attribute value. */
  key: string;
  /** The dnd-kit droppable id a drop in this region resolves against. */
  containerId: string;
  rect: Rect;
  columnId: string;
  coveredWorkphaseIds: string[];
  /** The workphase a non-member takes on entry — the merged column's entry workphase, or the sub-row's exact one. */
  targetWorkphaseId: string;
  /** A done region: no positioned inserts, every band is a workphase-only move (§5). */
  isTerminal: boolean;
  /**
   * The vertical scroll offset of the region's scrolling ancestor — 0 when
   * it has none (never happens for a column/sub-row region as of Story 8's
   * re-plan; every one of them nests inside its column's own scrolling
   * body). This is how popSession.ts's frozen band rect tells a real
   * scroll from the ghost's own insertion (§5, reconciliation #21): only
   * this changes for the former.
   */
  scrollTop: number;
  /**
   * Story 8 re-plan (2026-09-16) — the region element's own bounds, before
   * `clipToVisible` clips them to a scrolling ancestor's visible box. `rect`
   * (above) stays the clipped one, for hit-testing: a band scrolled fully
   * out of view must be neither drawn nor reachable. `contentRect` is what
   * band boundaries are measured against instead, so a band's position is a
   * fact about the region's real content, never about how much of it
   * happens to be scrolled into view.
   */
  contentRect: Rect;
  /**
   * The number of real cards currently rendered in this column/sub-row —
   * `0` for a `card:` region, where it's unused. Read straight off the DOM
   * (`data-drag-card-count`, set by the React side from the same `items`
   * array it renders) rather than inferred from `contentRect`'s height,
   * since a real card's height is only approximately `ghostCardHeightPx`
   * (KanbanCard.tsx's collapsed-ghost styling narrows this but doesn't
   * pin it exactly). Drives `bandFor`'s single-band collapse (0) and
   * one-card exception (1) — see its own comment.
   */
  cardCount: number;
  /**
   * Story 4: set only for a `card:<id>` region — the Card a drop here
   * attaches into. Undefined for every column/sub-row region. This is the
   * one field every card-aware branch downstream (popSession.ts,
   * boardDndUtils.ts, useBoardDnd.ts) actually reads; nothing else about a
   * Card region's shape is special-cased separately.
   */
  attachToCardId?: string;
  /**
   * Story 4 (re-plan, 2026-09-16): set only for a `card:<id>` region — the
   * key of the column/sub-row region that contains it. This is where a pop-
   * out of the Card lands (its context's own *parent* layer, never Board
   * directly — the layer rule: one context change at a time). Undefined for
   * every column/sub-row region, which always pops out to Board (`null`).
   */
  parentRegionKey?: string;
}

export const DRAG_REGION_ATTR = 'data-drag-region';
// Story 8 re-plan: set alongside DRAG_REGION_ATTR on the same element, from
// the same `items`/`mergedItems` array the column/sub-row actually renders
// — the one place that count is already known, rather than re-deriving it
// by walking the DOM for card-shaped children.
export const DRAG_CARD_COUNT_ATTR = 'data-drag-card-count';

export function columnRegionKey(columnId: string): string {
  return `column:${columnId}`;
}

export function subrowRegionKey(columnId: string, workphaseId: string): string {
  return `subrow:${columnId}:${workphaseId}`;
}

// Story 4: a Card's own key. Kept alongside the column/sub-row key
// builders above so every region-key format has one owner.
export function cardRegionKey(itemId: string): string {
  return `card:${itemId}`;
}

// What measureDragRegions needs to know about a Card to register it as a
// region — just enough for workphase inheritance (wiki §6). Returning null
// (an invalid target for *this* drag, or an id the caller doesn't
// recognize) means "not a region at all" — the same as a column that
// doesn't resolve: §3.2's "invalid targets are never poppable" falls out of
// this for free, since a non-region can't be hovered, popped into, or
// dropped on.
export interface CardTarget {
  workphaseId: string;
}

// Builds the region list from every `[data-drag-region]` element under
// `root`, joined with the column definitions for the workphase facts.
// Measured fresh on each evaluation — a handful of getBoundingClientRect
// calls per pointer move, and the ghost's insertion can change a body's
// height mid-drag. A region whose element sits inside a vertically
// scrolling ancestor (a sub-row, inside its column's `overflow-y-auto`
// body — a Card is one too) is clipped to that ancestor's own visible box
// first — scrolled fully out of view, it contributes no region at all.
//
// `resolveCardTarget` is Story 4: omitted, no `card:` element
// registers a region at all (so a caller that hasn't wired Card regions up
// yet — or a test fixture — sees exactly Story 3's set). Passed, it decides
// per Card whether *this* drag can target it; returning null skips the
// element the same way an unresolvable column key already does.
export function measureDragRegions(
  root: ParentNode,
  columns: readonly DropColumn[],
  resolveCardTarget?: (cardId: string) => CardTarget | null,
): DragRegion[] {
  const byId = new Map(columns.map(c => [c.id, c]));
  const regions: DragRegion[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)) {
    const key = el.getAttribute(DRAG_REGION_ATTR);
    if (!key) continue;
    const scrollBox = findVerticalScrollAncestor(el, root);
    const contentRect = layoutRect(el);
    const rect = scrollBox ? clipToVisible(contentRect, layoutRect(scrollBox)) : contentRect;
    if (!rect) continue;
    const scrollTop = scrollBox?.scrollTop ?? 0;
    const region = key.startsWith('card:')
      ? cardRegionFromKey(key, rect, contentRect, scrollTop, resolveCardTarget, findParentRegionKey(el, root))
      : regionFromKey(key, rect, contentRect, scrollTop, byId, cardCountOf(el));
    if (region) regions.push(region);
  }
  return regions;
}

// Reads a DOMRect's fields into a plain object — a real DOMRect's fields
// are accessor properties on its prototype, not its own enumerable ones,
// so `{ ...domRect }` silently drops every one of them (see clipToVisible's
// history below). Every `Rect` downstream of this (clipped, translated,
// frozen) is a plain object, so nothing else in this module — or
// `translateRect`, which used to spread its input — has to remember the
// hazard (audit epic-3-5-story-3-reconciled #2).
function toRect(domRect: DOMRect): Rect {
  const { top, left, right, bottom, width, height } = domRect;
  return { top, left, right, bottom, width, height };
}

// The element's box, in the same coordinate space dnd-kit's own collision
// math uses throughout a drag — not necessarily the *painted* box
// `getBoundingClientRect` reports. A sortable item dnd-kit is currently
// shifting to make room for a neighbor carries a live CSS transform, which
// `getBoundingClientRect` faithfully includes; dnd-kit's own sortable
// strategy does *not* re-measure while animating one (the same mismatch
// `tests/helpers/dragGesture.ts::boxOf` corrects for), so a Card region
// measured naively would disagree with dnd-kit's own idea of where that
// Card collides. Columns and sub-rows never carry this transform (only list
// *items* do), so this is a no-op for them — safe to apply uniformly rather
// than branching on region kind (Story 4 planning, decision 2).
function layoutRect(el: HTMLElement): Rect {
  const rect = toRect(el.getBoundingClientRect());
  const { dx, dy } = currentTranslate(el);
  if (dx === 0 && dy === 0) return rect;
  return { top: rect.top - dy, bottom: rect.bottom - dy, left: rect.left - dx, right: rect.right - dx, ...size(rect) };
}

function size(rect: Rect): Pick<Rect, 'width' | 'height'> {
  return { width: rect.width, height: rect.height };
}

// The translation dnd-kit's sortable strategy has currently applied to
// `el`, read back out of the computed style (`CSS.Transform.toString`'s
// `translate3d` resolves to a matrix/matrix3d) rather than trusted from a
// prop — this runs on *any* element measureDragRegions is asked about, most
// of which were never dnd-kit sortables at all.
function currentTranslate(el: HTMLElement): { dx: number; dy: number } {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === 'none') return { dx: 0, dy: 0 };
  const match = /matrix(3d)?\(([^)]+)\)/.exec(transform);
  if (!match) return { dx: 0, dy: 0 };
  const values = match[2].split(',').map(Number);
  return match[1] ? { dx: values[12], dy: values[13] } : { dx: values[4], dy: values[5] };
}

// Story 4: a Card region's shape — enough for `cardRegionAt`'s lookup and
// `regionWorkphaseFor`'s inheritance to key off `attachToCardId` without a
// separate lookup. `isTerminal: false` unconditionally — a done Card's
// Stubs still keep positions (wiki §5 closing note, §7), it's only the
// column/sub-row level that goes position-less on completion. No
// `resolveCardTarget` (a caller that hasn't wired Story 4 up), an id it
// can't place (invalid for this drag, or off-board), or no resolvable
// parent region registers no region at all.
function cardRegionFromKey(
  key: string,
  rect: Rect,
  contentRect: Rect,
  scrollTop: number,
  resolveCardTarget: ((cardId: string) => CardTarget | null) | undefined,
  parentRegionKey: string | null,
): DragRegion | null {
  if (!resolveCardTarget || !parentRegionKey) return null;
  const cardId = key.slice('card:'.length);
  const target = resolveCardTarget(cardId);
  if (!target) return null;
  return {
    key,
    containerId: cardId,
    rect,
    contentRect,
    columnId: cardId,
    coveredWorkphaseIds: [target.workphaseId],
    targetWorkphaseId: target.workphaseId,
    isTerminal: false,
    scrollTop,
    cardCount: 0,
    attachToCardId: cardId,
    parentRegionKey,
  };
}

// The real card count a column/sub-row's own element carries
// (DRAG_CARD_COUNT_ATTR, set by the React side from the same list it
// renders) — 0 when absent rather than NaN, so an element that predates
// this attribute (a stale test fixture) degrades to "empty region" instead
// of poisoning every downstream arithmetic comparison.
function cardCountOf(el: HTMLElement): number {
  const raw = el.getAttribute(DRAG_CARD_COUNT_ATTR);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

// The column/sub-row region that contains this Card element — walking up
// the DOM to the nearest ancestor that also carries `[data-drag-region]`.
// Safe as a simple walk (never has to consider a *second* card in between):
// only a top-level, still-Free Card registers a region at all (an already-
// attached Stub's row carries no `[data-drag-region]`), so nothing nests a
// card region inside another one. No parent found (a Card rendered outside
// any registered region, which shouldn't happen) means no region at all —
// same as an id `resolveCardTarget` can't place.
function findParentRegionKey(el: HTMLElement, root: ParentNode): string | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const key = node.getAttribute(DRAG_REGION_ATTR);
    if (key) return key;
  }
  return null;
}

// The nearest ancestor that scrolls vertically, bounded to `root` — never
// reaching past it to the document's own scrolling element, whatever a real
// browser's default there happens to compute to. Every column/sub-row
// region (Story 8 re-plan) sits inside its column body's own
// `overflow-y-auto`, so this always finds that one.
function findVerticalScrollAncestor(el: HTMLElement, root: ParentNode): HTMLElement | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

// Clips `rect` vertically to `bounds` (a scrolling ancestor's own visible
// box) — null when nothing of it remains visible. Horizontal is left
// alone: the board scrolls whole columns sideways, never a fraction of one.
// The hazard `toRect` above now guards at the boundary: this was the
// function that caught it, back when it read `el.getBoundingClientRect()`
// directly and spread it — every sub-row region resolved with
// `left`/`right`/`width` missing, so no point could ever match it.
export function clipToVisible(rect: Rect, bounds: Rect): Rect | null {
  const top = Math.max(rect.top, bounds.top);
  const bottom = Math.min(rect.bottom, bounds.bottom);
  if (bottom <= top) return null;
  return { top, bottom, left: rect.left, right: rect.right, width: rect.width, height: bottom - top };
}

function regionFromKey(
  key: string,
  rect: Rect,
  contentRect: Rect,
  scrollTop: number,
  columns: Map<string, DropColumn>,
  cardCount: number,
): DragRegion | null {
  const [kind, columnId, workphaseId] = key.split(':');
  const column = columns.get(columnId);
  if (!column || column.broken) return null;
  const covered = column.subRows.map(r => r.workphase.id);
  if (kind === 'column' && column.displayMode === 'merged') {
    return {
      key,
      containerId: column.id,
      rect,
      contentRect,
      columnId,
      coveredWorkphaseIds: covered,
      targetWorkphaseId: column.entryWorkphaseId,
      isTerminal: Boolean(column.subRows[0]?.workphase.isTerminal),
      scrollTop,
      cardCount,
    };
  }
  if (kind === 'subrow' && workphaseId && covered.includes(workphaseId)) {
    const row = column.subRows.find(r => r.workphase.id === workphaseId);
    return {
      key,
      containerId: subrowContainerId(columnId, workphaseId),
      rect,
      contentRect,
      columnId,
      coveredWorkphaseIds: [workphaseId],
      targetWorkphaseId: workphaseId,
      isTerminal: Boolean(row?.workphase.isTerminal),
      scrollTop,
      cardCount,
    };
  }
  return null;
}

// Whether `point` lies inside `rect`, inclusive of the edges — the one
// containment test, shared by `regionAt` below and `boardDndUtils.ts`'s
// in-context collision filter (audit epic-3-5-story-3-reconciled #2).
export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// Which column/sub-row region contains the point — a region is a bounded
// box (see the header note), nothing more. Null over a column's
// header/footer, the gaps between columns or sub-rows, the space below the
// last sub-row, a sub-row currently scrolled out of view, or (always) a
// Card: a Card is never a Board-layer target in its own right (re-plan,
// 2026-09-16) — the layer rule is one context change at a time, and Board's
// own zoom-in target is a column/sub-row, never a card two layers down.
// This is also always the right lookup for where a drag *starts* (wiki §1:
// always a column/sub-row) and for the pop-out clock, which measures
// against the *current* locked region's own rect, never a card's.
export function nonCardRegionAt(regions: readonly DragRegion[], point: Point): DragRegion | null {
  return regions.find(r => r.attachToCardId === undefined && containsPoint(r.rect, point)) ?? null;
}

// Which of `parentKey`'s own Cards contains the point — the one further
// zoom-in a locked column/sub-row offers (re-plan, 2026-09-16): reachable
// only from *this* context, never from Board or from a different column's
// context, matching "no crossing into a sibling without a trip through the
// parent first." A card whose own `parentRegionKey` doesn't match is never
// a candidate, even if it geometrically contains the point (impossible in
// practice — a card only ever sits inside its own column/sub-row — but the
// check is the one thing that would actually enforce it).
export function cardRegionAt(regions: readonly DragRegion[], point: Point, parentKey: string): DragRegion | null {
  return regions.find(r => r.parentRegionKey === parentKey && containsPoint(r.rect, point)) ?? null;
}

// Translates a frozen rect by a change in scroll offset — an increase in
// scrollTop moves content up on screen, so the rect moves the same amount
// the other way. A 0 delta returns the very same object, so a still cursor
// over a still region keeps producing `===` hovers (reconciliation #21).
// Lives here, not in popSession.ts, so every Rect-shaped operation has one
// owner (audit epic-3-5-story-3-reconciled #2) — popSession.ts's `hoverFor`
// only decides *whether* to carry the rect forward; this is the geometry.
export function translateRect(rect: Rect, deltaScrollTop: number): Rect {
  if (deltaScrollTop === 0) return rect;
  const dy = -deltaScrollTop;
  return {
    top: rect.top + dy,
    bottom: rect.bottom + dy,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
}

function verticalDistance(y: number, rect: Rect): number {
  if (y < rect.top) return rect.top - y;
  if (y > rect.bottom) return y - rect.bottom;
  return 0;
}

export type BandTuning = Pick<DragTuning, 'ghostCardHeightPx'>;
export type BandRegion = Pick<DragRegion, 'contentRect' | 'isTerminal' | 'cardCount'>;

// Story 8 re-plan (2026-09-16) — where the two band boundaries sit, in
// viewport pixels, measured from `contentRect` (never the visible-clipped
// `rect`: a boundary scrolled out of view stays exactly where its content
// put it, reachable only by scrolling to it — wiki §5). Null collapses to
// a single band spanning the whole region: a done region (positions never
// apply, wiki §5 closing note) or a genuinely empty one (nothing to be
// before/after). Exactly one card halves the edge instead of the normal
// full `ghostCardHeightPx` — full edges would meet at the card's own
// midpoint and leave no middle band for it to be a real, unlabeled "keep
// this position" target (Product Owner special rule, 2026-09-16). The one
// definition both the resolver (`bandFor`) and the guides read, so what's
// drawn is what a release resolves against (audit epic-3-5-story-3 #5).
export function bandBoundaries(region: BandRegion, tuning: BandTuning): { top: number; bottom: number } | null {
  if (region.isTerminal || region.cardCount === 0) return null;
  const edge = region.cardCount === 1 ? tuning.ghostCardHeightPx / 2 : tuning.ghostCardHeightPx;
  return { top: region.contentRect.top + edge, bottom: region.contentRect.bottom - edge };
}

// The vertical band a point falls in (§5): above `top` is the top band,
// below `bottom` is the bottom band, the middle otherwise (or the whole
// region, collapsed). A point outside the rect clamps to the nearer edge's
// band, same as before — the boundaries are absolute pixels now, not
// fractions, so no clamping arithmetic is needed to get that for free.
export function bandFor(y: number, region: BandRegion, tuning: BandTuning): Band {
  const boundaries = bandBoundaries(region, tuning);
  if (!boundaries) return 'middle';
  if (y < boundaries.top) return 'top';
  if (y > boundaries.bottom) return 'bottom';
  return 'middle';
}

// How far a point sits outside a rect (0 inside) — the optional distance
// term of the pop threshold (§3.1).
export function distanceOutside(point: Point, rect: Rect): number {
  const dx = point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0;
  const dy = verticalDistance(point.y, rect);
  return Math.hypot(dx, dy);
}
