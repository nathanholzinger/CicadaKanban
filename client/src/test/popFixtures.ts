// The pop machine's shared test board and runners (popSession.test.ts,
// placement.test.ts) — one copy, so the two suites can't drift into testing
// different boards.

import { DEFAULT_DRAG_TUNING, type DragTuning } from '../components/workflow/dragTuning';
import { advancePopSession, startPopSession, type PopSession } from '../components/workflow/popSession';
import type { ShortCardMetrics } from '../components/workflow/dragBands';
import type { DragRegion, Point } from '../components/workflow/dragRegions';
import type { AnchorRelation } from '../lib/hierarchyPlacement';
import { cardRegion, descendantsRegion, rect, region } from './dragFixtures';

// Column A (the origin) and column B side by side, 100 wide, 20 gap, 400
// tall; column C further right, all fixture-default 2-card regions. With
// `POP_TEST_METRICS`, B's top band is y < 96 and its bottom band y > 304;
// the one-card edge is the only formula `gapPx` enters into, and this board
// has no one-card region. The points are the ones both suites aim at.
//
// Column A also holds two Cards: P, with a Descendants section filling its
// lower 60, and Q below it. They are not in `regions`, which stays the
// columns, so a case adds the ones it needs. `inA` rests below both Cards, so
// a case that names a Card has to name it, not point at it; `inSection` and
// `aboveSection` are inside P, in and out of its section.
export function threeColumnBoard() {
  const A = region('column:a', rect(0, 0, 100, 400));
  const B = region('column:b', rect(120, 0, 100, 400));
  const C = region('column:c', rect(240, 0, 100, 400));
  const P = cardRegion('card-p', rect(10, 10, 80, 100), A.key);
  const descendantsP = descendantsRegion('card-p', rect(10, 50, 80, 60));
  const Q = cardRegion('card-q', rect(10, 120, 80, 60), A.key);
  return {
    A,
    B,
    C,
    P,
    Q,
    descendantsP,
    regions: [A, B, C],
    points: {
      inA: { x: 50, y: 200 },
      bTop: { x: 170, y: 40 },
      bMiddle: { x: 170, y: 200 },
      bBottom: { x: 170, y: 360 },
      cMiddle: { x: 290, y: 200 },
      gap: { x: 110, y: 200 }, // between A and B: no region at all
      inSection: { x: 50, y: 100 },
      aboveSection: { x: 50, y: 30 },
    },
  };
}

export const POP_TEST_METRICS: ShortCardMetrics = { heightPx: 96, gapPx: 8 };

// What the two suites run under. Every wait reads its value from here, never a
// literal. The values the cases depend on are pinned, so a change to the
// app's defaults can't change what they test: the distance term is off, so the
// clocks alone decide a pop (its own cases set it), and each delay is above 0
// and apart from the others, so a hold takes time and a case that waits on the
// wrong clock fails.
export const POP_TEST_TUNING: DragTuning = {
  ...DEFAULT_DRAG_TUNING,
  popDelayMs: 300,
  popDistancePx: 0,
  popInDelayMs: 200,
  cardZoomDwellMs: 400,
  cardPopInDelayMs: 600,
  descendantsPopInDelayMs: 500,
  modalHoldDwellMs: 350,
  modalHoldCueMs: 650,
};

const BOARD = threeColumnBoard();

// One sample of the machine at `now`, against the shared board unless told otherwise,
// under the shared tuning and metrics.
export function step(
  session: PopSession,
  pointer: Point,
  now: number,
  regions: readonly DragRegion[] = BOARD.regions,
  namedAnchor: AnchorRelation | null = null,
): PopSession {
  return advancePopSession(session, pointer, regions, POP_TEST_TUNING, POP_TEST_METRICS, now, namedAnchor);
}

// Samples the machine in order, from a drag locked in A unless told otherwise.
export function runPop(
  steps: Array<[Point, number]>,
  start: PopSession = startPopSession(BOARD.A.key),
  regions: readonly DragRegion[] = BOARD.regions,
): PopSession {
  return steps.reduce((s, [pointer, now]) => step(s, pointer, now, regions), start);
}

// Board layer, fresh: hovering `point` from a standing start. A locked
// drag's release never depends on a foreign region's band, so a case that
// exercises a band has to actually be at Board layer.
export function hoverAt(point: Point, regions: readonly DragRegion[] = BOARD.regions): PopSession {
  return step(startPopSession(null), point, 0, regions);
}
