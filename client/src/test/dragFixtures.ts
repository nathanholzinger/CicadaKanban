import type { DragRegion, Rect } from '../components/workflow/dragRegions';
import type { DropColumn } from '../components/workflow/boardDndUtils';

// Shared geometry fixtures for the Epic 3.5 drag tests (regions, the pop
// machine, band resolution) — one place for the rect/region shape, same
// reasoning as itemFixture.ts.

export function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// A region keyed the way the board keys them; the workphase facts default
// to one covered workphase named after the key. `contentRect` defaults to
// the same rect (no clipping — the common case a geometry-only test
// wants); `cardCount` defaults to 2, the "normal" band shape, so a fixture
// that doesn't care about Story 8's single-band/one-card exceptions
// doesn't have to spell it out.
export function region(key: string, r: Rect, overrides: Partial<DragRegion> = {}): DragRegion {
  return {
    key,
    containerId: key,
    rect: r,
    contentRect: r,
    columnId: key.split(':')[1],
    coveredWorkphaseIds: ['wp-' + key],
    targetWorkphaseId: 'wp-' + key,
    isTerminal: false,
    scrollTop: 0,
    cardCount: 2,
    ...overrides,
  };
}

// A merged column covering the given workphases — override any field,
// including `subRows` (for an expanded column, or per-row facts like
// `isTerminal`), for a differently-shaped board fixture. Shared by
// boardDndUtils.test.ts and dragRegions.test.ts, which each built this
// independently (audit epic-3-5-story-3-reconciled #8).
export function column(id: string, workphaseIds: string[], overrides: Partial<DropColumn> = {}): DropColumn {
  return {
    id,
    broken: false,
    displayMode: 'merged',
    entryWorkphaseId: workphaseIds[0],
    subRows: workphaseIds.map(w => ({ workphase: { id: w } })),
    ...overrides,
  };
}
