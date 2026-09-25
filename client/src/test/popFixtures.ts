// The pop machine's shared test board and runners (popSession.test.ts,
// placement.test.ts) — one copy, so the two suites can't drift into testing
// different boards.

import { DEFAULT_DRAG_TUNING, type DragTuning } from '../components/workflow/dragTuning';
import { advancePopSession, startPopSession, type PopSession } from '../components/workflow/popSession';
import type { ShortCardMetrics } from '../components/workflow/dragBands';
import type { DragRegion, Point } from '../components/workflow/dragRegions';
import { rect, region } from './dragFixtures';

// Column A (the origin) and column B side by side, 100 wide, 20 gap, 400
// tall; column C further right, all fixture-default 2-card regions. With
// `POP_TEST_METRICS`, B's top band is y < 96 and its bottom band y > 304;
// the one-card edge is the only formula `gapPx` enters into
// (dragRegions.test.ts covers that case; nothing here uses a one-card
// region). The points are the ones both suites aim at.
export function threeColumnBoard() {
  const A = region('column:a', rect(0, 0, 100, 400));
  const B = region('column:b', rect(120, 0, 100, 400));
  const C = region('column:c', rect(240, 0, 100, 400));
  return {
    A,
    B,
    C,
    regions: [A, B, C],
    points: {
      inA: { x: 50, y: 200 },
      bTop: { x: 170, y: 40 },
      bMiddle: { x: 170, y: 200 },
      bBottom: { x: 170, y: 360 },
      cMiddle: { x: 290, y: 200 },
      gap: { x: 110, y: 200 }, // between A and B: no region at all
    },
  };
}

// `heightPx` (96) matches the old `ghostCardHeightPx` default, so every
// 2+-card band boundary reads the same as it always has.
export const POP_TEST_METRICS: ShortCardMetrics = { heightPx: 96, gapPx: 8 };
export const POP_TEST_TUNING: DragTuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 300, popInDelayMs: 200 };

const BOARD = threeColumnBoard();

// Samples the machine in order, from a drag locked in A unless told otherwise.
export function runPop(
  steps: Array<[Point, number]>,
  start: PopSession = startPopSession(BOARD.A.key),
  regions: readonly DragRegion[] = BOARD.regions,
): PopSession {
  return steps.reduce(
    (s, [pointer, now]) => advancePopSession(s, pointer, regions, POP_TEST_TUNING, POP_TEST_METRICS, now),
    start,
  );
}

// Board layer, fresh: hovering `point` from a standing start. A locked
// drag's release never depends on a foreign region's band, so a case that
// exercises a band has to actually be at Board layer.
export function hoverAt(point: Point, regions: readonly DragRegion[] = BOARD.regions): PopSession {
  return advancePopSession(startPopSession(null), point, regions, POP_TEST_TUNING, POP_TEST_METRICS, 0);
}
