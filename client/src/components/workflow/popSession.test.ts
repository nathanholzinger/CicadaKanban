import { describe, it, expect } from 'vitest';
import type { DropSide } from '../../lib/hierarchyPlacement';
import type { DragTuning } from './dragTuning';
import { advancePopSession, isLocked, popDueAt, startPopSession } from './popSession';
import { rect, region } from '../../test/dragFixtures';
import {
  POP_TEST_METRICS as metrics,
  POP_TEST_TUNING as tuning,
  runPop,
  step,
  threeColumnBoard,
} from '../../test/popFixtures';

// Every wait reads its value from the tuning object (`POP_TEST_TUNING`), never a
// number such as 0.5 s.

// The shared board (`test/popFixtures.ts`): columns A, B, C, with A the origin and
// holding the Cards P and Q.
const { A, B, C, P, Q, descendantsP, regions, points } = threeColumnBoard();
const { inA, bTop, bMiddle, bBottom, cMiddle, gap, inSection, aboveSection } = points;

const OUT = tuning.popDelayMs;
const IN = tuning.popInDelayMs;
const DWELL = tuning.cardZoomDwellMs;
const CUE = tuning.cardPopInDelayMs;

describe('locked', () => {
  it('DRAG-1.1: starts locked in the origin context with nothing tracked', () => {
    expect(startPopSession(A.key)).toEqual({ contextKey: A.key, hover: null, outsideSince: null });
    expect(isLocked(startPopSession(A.key))).toBe(true);
  });

  it('inside the context nothing is tracked, and the same object comes back', () => {
    const s = startPopSession(A.key);
    expect(step(s, inA, 0, regions)).toBe(s);
  });

  it('DRAG-1.30: leaving the context starts the pop-out clock — into a gap as much as into another column, and neither is tracked beyond that', () => {
    expect(runPop([[gap, 100]])).toEqual({ ...startPopSession(A.key), outsideSince: 100 });
    expect(runPop([[bTop, 100]])).toEqual({ ...startPopSession(A.key), outsideSince: 100 });
  });

  it('DRAG-1.30: coming back inside before THRESHOLD resets the clock', () => {
    const s = runPop([
      [bMiddle, 100],
      [inA, 200],
      [bMiddle, 250 + OUT],
    ]);
    expect(s.contextKey).toBe(A.key);
    expect(s.outsideSince).toBe(250 + OUT);
  });

  it('DRAG-1.3, DRAG-1.30: outside for >= THRESHOLD pops out — the card belongs to nothing and the pop-in clock starts now', () => {
    const almost = runPop([
      [bMiddle, 100],
      [bMiddle, 100 + OUT - 1],
    ]);
    expect(almost.contextKey).toBe(A.key);
    const out = step(almost, bMiddle, 100 + OUT, regions);
    expect(out).toEqual({
      contextKey: null,
      outsideSince: null,
      hover: {
        regionKey: B.key,
        band: 'middle',
        poppable: true,
        since: 100 + OUT,
      },
    });
    expect(isLocked(out)).toBe(false);
  });

  it('pops out in a gap too, with nothing hovered', () => {
    expect(
      runPop([
        [gap, 0],
        [gap, OUT],
      ]),
    ).toEqual(startPopSession(null));
  });

  it('DRAG-1.30: the clock runs wherever the cursor is outside, from whenever it first left — wandering to a different foreign point never restarts it, nor tracks anything about that point', () => {
    const s = runPop([
      [bTop, 0],
      [bBottom, OUT - 10],
    ]);
    expect(s.contextKey).toBe(A.key);
    expect(s.outsideSince).toBe(0);
    expect(s.hover).toBeNull();
  });

  it('DRAG-1.14: the distance term pops out as soon as the cursor is far enough from the context (either satisfies)', () => {
    const withDistance = { ...tuning, popDistancePx: 50 };
    const near = advancePopSession(startPopSession(A.key), { x: 140, y: 200 }, regions, withDistance, metrics, 0); // 40px past A
    expect(near.contextKey).toBe(A.key);
    const far = advancePopSession(startPopSession(A.key), { x: 170, y: 200 }, regions, withDistance, metrics, 0); // 70px past A
    expect(far.contextKey).toBeNull();
  });

  it('DRAG-1.14: with popDistancePx at 0 the distance term is off — a cursor far outside pops nothing until the clock runs out', () => {
    const off = { ...tuning, popDistancePx: 0 };
    const farOut = { x: 500, y: 200 };
    const early = advancePopSession(startPopSession(A.key), farOut, regions, off, metrics, 0);
    expect(early.contextKey).toBe(A.key);
    const late = advancePopSession(early, farOut, regions, off, metrics, OUT);
    expect(late.contextKey).toBeNull();
  });

  // `M`'s own `rect` is content-sized and stops well short of `boundsRect`,
  // the column's outer body. The space between them, below the last card, is
  // still inside the column, so it must never start the exit clock. A
  // sub-row has no such gap (its `rect` is its full bound), so it reads
  // `rect`.
  describe("DRAG-1.25: merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect", () => {
    const shortRect = rect(0, 0, 100, 120); // the column's own cards — y 0..120
    const outerBody = rect(0, 0, 100, 400); // the column's outer body — y 0..400
    const M = region('column:m', shortRect, { boundsRect: outerBody });

    it('below the last card but still inside the outer body: still locked, nothing tracked', () => {
      const s = step(startPopSession(M.key), { x: 50, y: 200 }, 0, [M]);
      expect(s).toEqual(startPopSession(M.key));
    });

    it('past the outer body too: the pop-out clock starts, same as any other region', () => {
      const s = step(startPopSession(M.key), { x: 50, y: 450 }, 0, [M]);
      expect(s).toEqual({ ...startPopSession(M.key), outsideSince: 0 });
    });

    it('a sub-row has no boundsRect to speak of — its own rect stays the containment test', () => {
      const sub = region('subrow:m:w1', shortRect);
      const s = step(startPopSession(sub.key), { x: 50, y: 200 }, 0, [sub]);
      expect(s).toEqual({ ...startPopSession(sub.key), outsideSince: 0 });
    });

    it('DRAG-1.14: the distance term also measures against the outer body for a merged column', () => {
      const withDistance = { ...tuning, popDistancePx: 50 };
      const near = advancePopSession(startPopSession(M.key), { x: 50, y: 430 }, [M], withDistance, metrics, 0); // 30px past the outer body
      expect(near.contextKey).toBe(M.key);
      const far = advancePopSession(startPopSession(M.key), { x: 50, y: 470 }, [M], withDistance, metrics, 0); // 70px past the outer body
      expect(far.contextKey).toBeNull();
    });
  });

  it("DRAG-3.21: at Board layer the band reads the region's live rect on every sample, not one frozen at entry", () => {
    const entered = step(startPopSession(null), { x: 170, y: 110 }, 0, regions);
    expect(entered.hover?.band).toBe('middle'); // 110 is within B's original 96..304 middle band
    // B's rect has moved (a scroll, or a sibling reflowing next to it; the
    // two are treated alike): its top edge is 40px lower, so the same point
    // now sits inside the *new* top band (edge at 40 + 96 = 136).
    const shiftedB = region(B.key, rect(120, 40, 100, 400));
    const after = step(entered, { x: 170, y: 110 }, 10, [A, shiftedB, C]);
    expect(after.hover?.band).toBe('top');
  });

  it("DRAG-3.15, DRAG-3.21: at Board layer the band also reads the region's live card count on every sample, so the one-card exception never goes stale while a region is the hover target", () => {
    const entered = step(startPopSession(null), { x: 170, y: 70 }, 0, regions);
    expect(entered.hover?.band).toBe('top'); // the 2-card edge is 96; 70 < 96
    const oneCardB = region(B.key, rect(120, 0, 100, 400), { cardCount: 1 });
    const after = step(entered, { x: 170, y: 70 }, 10, [A, oneCardB, C]);
    expect(after.hover?.band).toBe('middle'); // the one-card edge is (96 + 8) / 2 = 52; 70 >= 52
  });
});

// A locked column/sub-row's zoom-in candidate comes from the *named
// relation* (`dragCollision.ts::dropAnchorFor`'s answer, passed as
// `namedAnchor`), not a hit test. `inA` below is deliberately nowhere near
// either card's rect throughout, so the pointer's position can't be what
// picks the Card.
describe('locked column/sub-row: the named-card zoom-in candidate', () => {
  const withCards = [A, B, C, P, Q];
  const namedP = (side: DropSide = 'after') => ({ anchorId: P.attachToCardId, side });

  it('DRAG-1.4: holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone', () => {
    let s = step(startPopSession(A.key), inA, 0, withCards, namedP());
    expect(s.hover).toEqual({ regionKey: P.key, since: 0, poppable: true, side: 'after', phase: 'dwell' });
    s = step(s, inA, DWELL, withCards, namedP());
    expect(s.hover).toEqual({ regionKey: P.key, since: 0, poppable: true, side: 'after', phase: 'cue' });
    expect(s.contextKey).toBe(A.key);
  });

  it('DRAG-4.19: holding it through the cue pops into the named Card, wherever the bare cursor happens to be', () => {
    const s = step(startPopSession(A.key), inA, 0, withCards, namedP());
    const popped = step(s, inA, DWELL + CUE, withCards, namedP());
    expect(popped.contextKey).toBe(P.key);
  });

  it('DRAG-1.4: a different named card resets the hold from the dwell, even mid-cue', () => {
    let s = step(startPopSession(A.key), inA, 0, withCards, namedP());
    s = step(s, inA, DWELL + 10, withCards, namedP());
    expect(s.hover?.phase).toBe('cue');
    s = step(s, inA, DWELL + 20, withCards, { anchorId: Q.attachToCardId, side: 'after' });
    expect(s.hover).toEqual({ regionKey: Q.key, since: DWELL + 20, poppable: true, side: 'after', phase: 'dwell' });
  });

  it('DRAG-1.4: the same card on its other side resets the hold too', () => {
    let s = step(startPopSession(A.key), inA, 0, withCards, namedP('after'));
    s = step(s, inA, DWELL + 10, withCards, namedP('after'));
    expect(s.hover?.phase).toBe('cue');
    s = step(s, inA, DWELL + 20, withCards, namedP('before'));
    expect(s.hover).toEqual({ regionKey: P.key, since: DWELL + 20, poppable: true, side: 'before', phase: 'dwell' });
  });

  it('DRAG-4.23: nothing named (alone in the list, or hovering nothing): no candidate at all', () => {
    const s = step(startPopSession(A.key), inA, 0, withCards, null);
    expect(s.hover).toBeNull();
  });

  it('DRAG-1.7, DRAG-1.8: a card with no registered region — an invalid target, cycle-forming or depth-capped, that resolveDragStructure never resolves a region for — is never a candidate even though it can still be named for a reorder', () => {
    const s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, {
      anchorId: 'invalid',
      side: 'after',
    });
    expect(s.hover).toBeNull();
    expect(s.contextKey).toBe(A.key);
  });

  it('popDueAt schedules the dwell-end milestone first (so the cue can mount with the cursor perfectly still), then the final pop once the cue has started', () => {
    const dwelling = step(startPopSession(A.key), inA, 0, withCards, namedP());
    expect(popDueAt(dwelling, withCards, tuning)).toBe(DWELL);
    const cueing = step(dwelling, inA, DWELL, withCards, namedP());
    expect(popDueAt(cueing, withCards, tuning)).toBe(DWELL + CUE);
  });
});

// A locked Card's zoom-in into its Descendants section (DRAG-1.21's zoom-in
// half) is a plain, duration-only hold with no dwell/cue split, found by
// `dragRegions.ts::childRegionAt`. It runs on `descendantsPopInDelayMs`, not
// `cardPopInDelayMs`/`cardZoomDwellMs`.
describe('locked Card: zoom-in into its own Descendants section', () => {
  const withDescendants = [A, P, descendantsP];
  const DESC = tuning.descendantsPopInDelayMs;

  it('resting inside the section short of the threshold stays locked at Card', () => {
    const first = step(startPopSession(P.key), inSection, 0, withDescendants);
    expect(first.hover).toEqual({ regionKey: descendantsP.key, since: 0, poppable: true });
    const s = step(first, inSection, DESC - 1, withDescendants);
    expect(s.contextKey).toBe(P.key);
  });

  it('resting past the threshold zooms into the Descendants section, wherever the bare cursor happens to be', () => {
    const first = step(startPopSession(P.key), inSection, 0, withDescendants);
    const s = step(first, inSection, DESC, withDescendants);
    expect(s.contextKey).toBe(descendantsP.key);
  });

  it('DRAG-4.12: a childless Card (no Descendants region at all) never pops any further — the auto-drop is its only outcome', () => {
    const s = step(startPopSession(P.key), inSection, DESC, [A, P]);
    expect(s.contextKey).toBe(P.key);
  });

  it('once locked at Descendants, there is no further child to zoom into (the layer table\'s own "(none)")', () => {
    const s = step(startPopSession(descendantsP.key), inSection, DESC, withDescendants);
    expect(s.contextKey).toBe(descendantsP.key);
    expect(s.hover).toBeNull();
  });
});

describe('locked at a Descendants section', () => {
  const withDescendants = [A, P, descendantsP];

  it('DRAG-5.5: an excursion out of the section shorter than popDelayMs pops nothing, and coming back resets the clock', () => {
    const locked = startPopSession(descendantsP.key);
    const away = step(locked, aboveSection, 0, withDescendants);
    expect(away.outsideSince).toBe(0);
    const back = step(away, inSection, OUT - 1, withDescendants);
    expect(back).toEqual(locked);

    // A second excursion runs its own clock: the two together outlast popDelayMs, and still nothing pops.
    const awayAgain = step(back, aboveSection, OUT, withDescendants);
    const s = step(awayAgain, aboveSection, 2 * OUT - 1, withDescendants);
    expect(s.contextKey).toBe(descendantsP.key);
    expect(s.outsideSince).toBe(OUT);
  });
});

// A pop-out moves one layer (DRAG-1.17) even when the context has no region
// in the sample.
describe('popping out of a context the sample has no region for', () => {
  // The owner's structural lookup: the stack doesn't change with what's visible.
  const parentKeyOf = (key: string) => (key === descendantsP.key ? P.key : key === P.key ? A.key : null);

  it('a context clipped out of view pops to its structural parent, not straight to Board', () => {
    // Locked at card:p, scrolled out of its column's view: only the column is measured.
    const exited = advancePopSession(startPopSession(P.key), inA, [A], tuning, metrics, 0, null, parentKeyOf);
    const s = advancePopSession(exited, inA, [A], tuning, metrics, OUT, null, parentKeyOf);
    expect(s.contextKey).toBe(A.key);
  });

  it('popDelayMs = 0: the exit only starts the clock, then pops one layer, not through to Board', () => {
    const zero: DragTuning = { ...tuning, popDelayMs: 0 };
    const sectionScope = [descendantsP]; // sampled while locked at the section: no card:p
    const exited = advancePopSession(
      startPopSession(descendantsP.key),
      aboveSection,
      sectionScope,
      zero,
      metrics,
      0,
      null,
      parentKeyOf,
    );
    expect(exited.contextKey).toBe(descendantsP.key);
    const s = advancePopSession(exited, aboveSection, sectionScope, zero, metrics, 1, null, parentKeyOf);
    expect(s.contextKey).toBe(P.key);

    // The owner's next sample is scoped to the Card: it pops again only if
    // the pointer really is outside it.
    const cardScope = [P, descendantsP];
    expect(advancePopSession(s, aboveSection, cardScope, zero, metrics, 1, null, parentKeyOf).contextKey).toBe(P.key);
    expect(advancePopSession(s, { x: 300, y: 300 }, cardScope, zero, metrics, 1, null, parentKeyOf).contextKey).toBe(
      A.key,
    );
  });
});

describe('popped out', () => {
  const outInB = runPop([
    [bMiddle, 0],
    [bMiddle, OUT],
  ]);

  it('follows the cursor: over nothing there is no hover, and no pop pending', () => {
    const s = step(outInB, gap, OUT + 1, regions);
    expect(s).toEqual(startPopSession(null));
    expect(popDueAt(s, regions, tuning)).toBeNull();
  });

  it('DRAG-1.11: resting in a middle band past the pop-in threshold locks the card into that column', () => {
    const almost = step(outInB, bMiddle, OUT + IN - 1, regions);
    expect(almost.contextKey).toBeNull();
    const back = step(almost, bMiddle, OUT + IN, regions);
    expect(back).toEqual(startPopSession(B.key));
  });

  it('DRAG-1.11: the pop-in clock starts at the pop-out, not at the region entry — the popped-out state is always reachable', () => {
    // Entered B at 0, popped out at OUT; pop-in is due at OUT + IN, never at OUT.
    expect(popDueAt(outInB, regions, tuning)).toBe(OUT + IN);
  });

  it('can pop back into the column it just left', () => {
    const s = runPop(
      [
        [inA, OUT + 1],
        [inA, OUT + 1 + IN],
      ],
      outInB,
    );
    expect(s).toEqual({ contextKey: A.key, hover: null, outsideSince: null });
  });

  it('DRAG-1.11: the top and bottom bands never pop in, however long; moving to another column restarts the clock', () => {
    const top = runPop(
      [
        [bTop, OUT + 1],
        [bTop, OUT + 10 * IN],
      ],
      outInB,
    );
    expect(top.contextKey).toBeNull();
    expect(top.hover?.band).toBe('top');
    const moved = step(outInB, cMiddle, OUT + IN - 1, regions);
    expect(moved.hover).toEqual({
      regionKey: C.key,
      band: 'middle',
      poppable: true,
      since: OUT + IN - 1,
    });
    expect(moved.contextKey).toBeNull();
  });

  it('DRAG-1.11: time in the top band counts toward the pop-in clock, so sliding into the middle band after it has run pops in at once', () => {
    const inTop = runPop(
      [
        [bTop, 0],
        [bTop, IN + 50],
      ],
      startPopSession(null),
    );
    expect(inTop.contextKey).toBeNull();
    expect(step(inTop, bMiddle, IN + 51, regions)).toEqual(startPopSession(B.key));
  });

  it('DRAG-1.11: leaving the region before the clock runs out and coming back starts it over', () => {
    const back = runPop(
      [
        [bMiddle, 0],
        [gap, IN - 10],
        [bMiddle, IN - 5],
      ],
      startPopSession(null),
    );
    // Past popInDelayMs from the first entry, but not from the return.
    expect(step(back, bMiddle, IN, regions).contextKey).toBeNull();
    expect(step(back, bMiddle, IN - 5 + IN, regions)).toEqual(startPopSession(B.key));
  });

  it('a drag from outside every region (Unsorted) starts popped out and locks in the same way', () => {
    const s = startPopSession(null);
    expect(isLocked(s)).toBe(false);
    expect(
      runPop(
        [
          [bMiddle, 0],
          [bMiddle, IN],
        ],
        s,
      ),
    ).toEqual(startPopSession(B.key));
  });
});

describe('popDueAt', () => {
  it('locked: the pop-out clock while outside, nothing inside', () => {
    expect(popDueAt(runPop([[bTop, 100]]), regions, tuning)).toBe(100 + OUT);
    expect(popDueAt(runPop([[gap, 100]]), regions, tuning)).toBe(100 + OUT);
    expect(popDueAt(startPopSession(A.key), regions, tuning)).toBeNull();
  });

  it('DRAG-1.11: popped out, the pop-in clock only from a middle band', () => {
    expect(popDueAt(step(startPopSession(null), bMiddle, 100, regions), regions, tuning)).toBe(100 + IN);
    expect(popDueAt(step(startPopSession(null), bTop, 100, regions), regions, tuning)).toBeNull();
  });
});
