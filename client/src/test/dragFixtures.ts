import type { DragRegion, Rect } from '../components/workflow/dragRegions';

// Shared geometry fixtures for the Epic 3.5 drag tests (regions, the pop
// machine, band resolution) — one place for the rect/region shape, same
// reasoning as itemFixture.ts.

export function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// A region keyed the way the board keys them; the workphase facts default
// to one covered workphase named after the key.
export function region(key: string, r: Rect, overrides: Partial<DragRegion> = {}): DragRegion {
  return {
    key,
    containerId: key,
    rect: r,
    columnId: key.split(':')[1],
    coveredWorkphaseIds: ['wp-' + key],
    targetWorkphaseId: 'wp-' + key,
    isTerminal: false,
    ...overrides,
  };
}
