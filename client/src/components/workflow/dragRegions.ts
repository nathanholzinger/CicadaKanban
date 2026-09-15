import type { DragTuning } from './dragTuning';
import { subrowContainerId, type DropColumn } from './boardDndUtils';

// Epic 3.5 Story 3 — the *regions* a Card drag can be in (docs/wiki/board-
// drag-interaction §1, §5): a merged column's body, or one sub-row of an
// expanded column. Each is a context a drag can start in or pop into, and
// the surface the drop bands are measured against. Unsorted, a broken
// column, and an expanded column's outer wrapper register no region — they
// are Inert (§4). Pure geometry over rects the board measures from the DOM.
//
// A region is a bounded box (§1, wiki–code reconciliation #20) — hit-tested
// by simple containment, nothing outside it. A column's header/footer, the
// gaps between columns and between sub-rows, and the space below the last
// sub-row are nowhere, the same as the gap between two columns. A sub-row
// is additionally clipped to its column's visible scroll box below: one
// scrolled fully out of view registers no region at all until it scrolls
// back in.

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
   * The vertical scroll offset of the region's scrolling ancestor — 0 for a
   * merged column, whose region is the non-scrolling wrapper *around* its
   * own scrolling body, not the scrolling element itself. This is how
   * popSession.ts's frozen band rect tells a real scroll from the ghost's
   * own insertion (§5, reconciliation #21): only this changes for the
   * former.
   */
  scrollTop: number;
}

export const DRAG_REGION_ATTR = 'data-drag-region';

export function columnRegionKey(columnId: string): string {
  return `column:${columnId}`;
}

export function subrowRegionKey(columnId: string, workphaseId: string): string {
  return `subrow:${columnId}:${workphaseId}`;
}

// Builds the region list from every `[data-drag-region]` element under
// `root`, joined with the column definitions for the workphase facts.
// Measured fresh on each evaluation — a handful of getBoundingClientRect
// calls per pointer move, and the ghost's insertion can change a body's
// height mid-drag. A region whose element sits inside a vertically
// scrolling ancestor (a sub-row, inside its column's `overflow-y-auto`
// body) is clipped to that ancestor's own visible box first — scrolled
// fully out of view, it contributes no region at all.
export function measureDragRegions(root: ParentNode, columns: readonly DropColumn[]): DragRegion[] {
  const byId = new Map(columns.map(c => [c.id, c]));
  const regions: DragRegion[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)) {
    const key = el.getAttribute(DRAG_REGION_ATTR);
    if (!key) continue;
    const scrollBox = findVerticalScrollAncestor(el, root);
    const rect = scrollBox
      ? clipToVisible(el.getBoundingClientRect(), scrollBox.getBoundingClientRect())
      : el.getBoundingClientRect();
    if (!rect) continue;
    const region = regionFromKey(key, rect, scrollBox?.scrollTop ?? 0, byId);
    if (region) regions.push(region);
  }
  return regions;
}

// The nearest ancestor that scrolls vertically, bounded to `root` — never
// reaching past it to the document's own scrolling element, whatever a real
// browser's default there happens to compute to. A merged column's region
// is the wrapper *around* its own scrolling body, not the scrolling element
// itself, so this finds nothing for it (`scrollTop` stays 0, as documented
// on `DragRegion`); a sub-row's region sits inside the column body's
// `overflow-y-auto`, so this finds that.
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
// Reads every field explicitly rather than spreading `rect` — a real
// DOMRect's fields are accessor properties on its prototype, not its own
// enumerable ones, so `{ ...domRect }` silently drops all of them.
export function clipToVisible(rect: Rect, bounds: Rect): Rect | null {
  const top = Math.max(rect.top, bounds.top);
  const bottom = Math.min(rect.bottom, bounds.bottom);
  if (bottom <= top) return null;
  return { top, bottom, left: rect.left, right: rect.right, width: rect.width, height: bottom - top };
}

function regionFromKey(
  key: string,
  rect: Rect,
  scrollTop: number,
  columns: Map<string, DropColumn>,
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
      columnId,
      coveredWorkphaseIds: covered,
      targetWorkphaseId: column.entryWorkphaseId,
      isTerminal: Boolean(column.subRows[0]?.workphase.isTerminal),
      scrollTop,
    };
  }
  if (kind === 'subrow' && workphaseId && covered.includes(workphaseId)) {
    const row = column.subRows.find(r => r.workphase.id === workphaseId);
    return {
      key,
      containerId: subrowContainerId(columnId, workphaseId),
      rect,
      columnId,
      coveredWorkphaseIds: [workphaseId],
      targetWorkphaseId: workphaseId,
      isTerminal: Boolean(row?.workphase.isTerminal),
      scrollTop,
    };
  }
  return null;
}

// Which region contains the point — a region is a bounded box (see the
// header note), nothing more. Null over a column's header/footer, the gaps
// between columns or sub-rows, the space below the last sub-row, or a
// sub-row currently scrolled out of view.
export function regionAt(regions: readonly DragRegion[], point: Point): DragRegion | null {
  return (
    regions.find(
      r => point.x >= r.rect.left && point.x <= r.rect.right && point.y >= r.rect.top && point.y <= r.rect.bottom,
    ) ?? null
  );
}

function verticalDistance(y: number, rect: Rect): number {
  if (y < rect.top) return rect.top - y;
  if (y > rect.bottom) return y - rect.bottom;
  return 0;
}

// The vertical band a point falls in (§5): the top `columnTopBand` fraction,
// the bottom `columnBottomBand` fraction, the middle otherwise. A point
// outside the rect clamps to the nearer edge's band.
export function bandFor(y: number, rect: Rect, tuning: Pick<DragTuning, 'columnTopBand' | 'columnBottomBand'>): Band {
  if (rect.height <= 0) return 'middle';
  const fraction = Math.min(1, Math.max(0, (y - rect.top) / rect.height));
  if (fraction < tuning.columnTopBand) return 'top';
  if (fraction > 1 - tuning.columnBottomBand) return 'bottom';
  return 'middle';
}

// How far a point sits outside a rect (0 inside) — the optional distance
// term of the pop threshold (§3.1).
export function distanceOutside(point: Point, rect: Rect): number {
  const dx = point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0;
  const dy = verticalDistance(point.y, rect);
  return Math.hypot(dx, dy);
}
