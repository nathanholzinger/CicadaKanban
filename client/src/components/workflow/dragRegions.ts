import type { DragTuning } from './dragTuning';
import { subrowContainerId, type DropColumn } from './boardDndUtils';

// Epic 3.5 Story 3 — the *regions* a Card drag can be in (docs/wiki/board-
// drag-interaction §1, §5): a merged column's body, or one sub-row of an
// expanded column. Each is a context a drag can start in or pop into, and
// the surface the drop bands are measured against. Unsorted, a broken
// column, and an expanded column's outer wrapper register no region — they
// are Inert (§4). Pure geometry over rects the board measures from the DOM.

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
// height mid-drag.
export function measureDragRegions(root: ParentNode, columns: readonly DropColumn[]): DragRegion[] {
  const byId = new Map(columns.map(c => [c.id, c]));
  const regions: DragRegion[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)) {
    const key = el.getAttribute(DRAG_REGION_ATTR);
    if (!key) continue;
    const region = regionFromKey(key, el.getBoundingClientRect(), byId);
    if (region) regions.push(region);
  }
  return regions;
}

function regionFromKey(key: string, rect: Rect, columns: Map<string, DropColumn>): DragRegion | null {
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
    };
  }
  return null;
}

// Which region the cursor is in. A column's full vertical stripe counts as
// its region(s) — above the body is still "this column" (the top band, once
// clamped), and between two sub-rows the nearer one wins — so a drag only
// leaves a region by moving sideways. Null between columns and over Inert
// surfaces.
export function regionAt(regions: readonly DragRegion[], point: Point): DragRegion | null {
  const inColumn = regions.filter(r => point.x >= r.rect.left && point.x <= r.rect.right);
  if (inColumn.length === 0) return null;
  const containing = inColumn.find(r => point.y >= r.rect.top && point.y <= r.rect.bottom);
  if (containing) return containing;
  let nearest = inColumn[0];
  let best = verticalDistance(point.y, nearest.rect);
  for (const region of inColumn.slice(1)) {
    const distance = verticalDistance(point.y, region.rect);
    if (distance < best) {
      best = distance;
      nearest = region;
    }
  }
  return nearest;
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
