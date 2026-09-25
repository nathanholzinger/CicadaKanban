import { describe, it, expect } from 'vitest';
import { DEFAULT_DRAG_TUNING, type DragTuning } from './dragTuning';
import {
  advancePopSession,
  isLocked,
  overlayFormFor,
  placementFor,
  placementRegion,
  popDueAt,
  startPopSession,
  type PopSession,
} from './popSession';
import { cardRegion, descendantsRegion, freeOrigin, rect, region, stubOrigin } from '../../test/dragFixtures';
import type { Placement } from './itemListOps';
import type { ShortCardMetrics } from './dragRegions';

// docs/wiki/board-drag-interaction §1–§3, §5. Cases from DRAG-1 and DRAG-3,
// every threshold parameterized on the tuning value, never 0.5 s.

// Column A (the origin) and column B side by side, 100 wide, 20 gap, 400
// tall; column C further right, all fixture-default 2-card regions.
// `metrics.heightPx` (96) is chosen to match the old `ghostCardHeightPx`
// default so every 2+-card boundary below (B's top band y < 96, bottom
// band y > 304) reads the same as it always has — the one-card edge is the
// only formula `gapPx` actually enters into (dragRegions.test.ts covers
// that case; nothing here uses a one-card region).
const A = region('column:a', rect(0, 0, 100, 400));
const B = region('column:b', rect(120, 0, 100, 400));
const C = region('column:c', rect(240, 0, 100, 400));
const regions = [A, B, C];
const metrics: ShortCardMetrics = { heightPx: 96, gapPx: 8 };

const inA = { x: 50, y: 200 };
const bTop = { x: 170, y: 40 };
const bMiddle = { x: 170, y: 200 };
const bBottom = { x: 170, y: 360 };
const cMiddle = { x: 290, y: 200 };
const gap = { x: 110, y: 200 };

const tuning: DragTuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 300, popInDelayMs: 200 };
const OUT = tuning.popDelayMs;
const IN = tuning.popInDelayMs;
const DWELL = tuning.cardZoomDwellMs;
const CUE = tuning.cardPopInDelayMs;

const locked = (key: string): PopSession => ({ contextKey: key, hover: null, outsideSince: null });
const poppedOut = (): PopSession => ({ contextKey: null, hover: null, outsideSince: null });

// Board layer, fresh: hovering `point` from a standing start (re-plan
// 2026-09-16 — a locked drag's release no longer depends on a foreign
// region's band at all, so every case that exercises the band has to
// actually be at Board layer, not merely glancing at one while still
// locked elsewhere).
function hoverAt(
  point: { x: number; y: number },
  regionsArg: readonly ReturnType<typeof region>[] = regions,
): PopSession {
  return advancePopSession(poppedOut(), point, regionsArg, tuning, metrics, 0);
}

function run(steps: Array<[{ x: number; y: number }, number]>, start = startPopSession(A.key)): PopSession {
  return steps.reduce((s, [pointer, now]) => advancePopSession(s, pointer, regions, tuning, metrics, now), start);
}

describe('locked', () => {
  it('DRAG-1.1: starts locked in the origin context with nothing tracked', () => {
    expect(startPopSession(A.key)).toEqual(locked(A.key));
    expect(isLocked(startPopSession(A.key))).toBe(true);
  });

  it('inside the context nothing is tracked, and the same object comes back', () => {
    const s = startPopSession(A.key);
    expect(advancePopSession(s, inA, regions, tuning, metrics, 0)).toBe(s);
  });

  it('leaving the context starts the pop-out clock — into a gap as much as into another column, and neither is tracked beyond that (re-plan 2026-09-16, rule 1: nothing about a foreign region matters until an actual pop)', () => {
    expect(run([[gap, 100]])).toEqual({ ...locked(A.key), outsideSince: 100 });
    expect(run([[bTop, 100]])).toEqual({ ...locked(A.key), outsideSince: 100 });
  });

  it('DRAG-1.3 (momentary): coming back inside before THRESHOLD resets the clock', () => {
    const s = run([
      [bMiddle, 100],
      [inA, 200],
      [bMiddle, 250 + OUT],
    ]);
    expect(s.contextKey).toBe(A.key);
    expect(s.outsideSince).toBe(250 + OUT);
  });

  it('DRAG-1.3 (sustained): outside for >= THRESHOLD pops out — the card belongs to nothing and the pop-in clock starts now', () => {
    const almost = run([
      [bMiddle, 100],
      [bMiddle, 100 + OUT - 1],
    ]);
    expect(almost.contextKey).toBe(A.key);
    const out = advancePopSession(almost, bMiddle, regions, tuning, metrics, 100 + OUT);
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
      run([
        [gap, 0],
        [gap, OUT],
      ]),
    ).toEqual(poppedOut());
  });

  it('DRAG-1.4: the clock runs wherever the cursor is outside, from whenever it first left — wandering to a different foreign point never restarts it, nor tracks anything about that point', () => {
    const s = run([
      [bTop, 0],
      [bBottom, OUT - 10],
    ]);
    expect(s.contextKey).toBe(A.key);
    expect(s.outsideSince).toBe(0);
    expect(s.hover).toBeNull();
  });

  it('the distance term pops out as soon as the cursor is far enough from the context (either satisfies)', () => {
    const withDistance = { ...tuning, popDistancePx: 50 };
    const near = advancePopSession(startPopSession(A.key), { x: 140, y: 200 }, regions, withDistance, metrics, 0); // 40px past A
    expect(near.contextKey).toBe(A.key);
    const far = advancePopSession(startPopSession(A.key), { x: 170, y: 200 }, regions, withDistance, metrics, 0); // 70px past A
    expect(far.contextKey).toBeNull();
  });

  // Story 4.1 Phase 4 (F6, ruled by the Product Owner 2026-09-18): a merged
  // column must never pop out while the cursor is still somewhere inside
  // it. `M`'s own `rect` is content-sized (Phase 1's exact reservation) and
  // stops well short of `boundsRect`, the column's outer body — the empty
  // space between them is exactly the case that used to strand the exit
  // clock (F6's finding: "the pointer below a short merged column's last
  // card is nowhere"). A sub-row has no such gap (its own `rect` already is
  // its full bound), so it keeps reading straight off `rect`, unchanged.
  describe("merged-column boundsRect — the 'still inside' test reads the outer body, not the content-sized rect", () => {
    const shortRect = rect(0, 0, 100, 120); // the column's own cards — y 0..120
    const outerBody = rect(0, 0, 100, 400); // BoardColumn.tsx's own overflow-y-auto wrapper — y 0..400
    const M = region('column:m', shortRect, { boundsRect: outerBody });

    it('below the last card but still inside the outer body: still locked, nothing tracked', () => {
      const s = advancePopSession(startPopSession(M.key), { x: 50, y: 200 }, [M], tuning, metrics, 0);
      expect(s).toEqual(locked(M.key));
    });

    it('past the outer body too: the pop-out clock starts, same as any other region', () => {
      const s = advancePopSession(startPopSession(M.key), { x: 50, y: 450 }, [M], tuning, metrics, 0);
      expect(s).toEqual({ ...locked(M.key), outsideSince: 0 });
    });

    it('a sub-row has no boundsRect to speak of — its own rect stays the containment test', () => {
      const sub = region('subrow:m:w1', shortRect);
      const s = advancePopSession(startPopSession(sub.key), { x: 50, y: 200 }, [sub], tuning, metrics, 0);
      expect(s).toEqual({ ...locked(sub.key), outsideSince: 0 });
    });

    it('the distance term also measures against the outer body for a merged column', () => {
      const withDistance = { ...tuning, popDistancePx: 50 };
      const near = advancePopSession(startPopSession(M.key), { x: 50, y: 430 }, [M], withDistance, metrics, 0); // 30px past the outer body
      expect(near.contextKey).toBe(M.key);
      const far = advancePopSession(startPopSession(M.key), { x: 50, y: 470 }, [M], withDistance, metrics, 0); // 70px past the outer body
      expect(far.contextKey).toBeNull();
    });
  });

  // Story 4.1 Phase 1: the frozen-rect/`followRegionTop` family (and the
  // sticky-hover check it existed for) is gone — the reservation is exact
  // now (a hovered region's own rendered size never actually changes), so
  // `hoverFor` just reads the region's live rect and live card count on
  // every sample. These two cases replace the old "the band is measured
  // against the region's rect as it was on entry" test, whose own premise
  // ("so the ghost's own insertion can't move the band") no longer holds —
  // it now can, on purpose, because nothing needs protecting against it.
  it("Board layer: the band reads the region's live rect on every sample, not one frozen at entry", () => {
    const entered = advancePopSession(poppedOut(), { x: 170, y: 110 }, regions, tuning, metrics, 0);
    expect(entered.hover?.band).toBe('middle'); // 110 is within B's original 96..304 middle band
    // B's rect has genuinely moved (a real scroll, or a sibling reflowing
    // next to it — nothing here has to tell the two apart anymore): its
    // top edge is 40px lower, so the same point now sits inside the *new*
    // top band (edge at 40 + 96 = 136).
    const shiftedB = region(B.key, rect(120, 40, 100, 400));
    const after = advancePopSession(entered, { x: 170, y: 110 }, [A, shiftedB, C], tuning, metrics, 10);
    expect(after.hover?.band).toBe('top');
  });

  it("Board layer: the band also reads the region's live card count on every sample — the one-card exception can no longer go stale while a region is the hover target", () => {
    const entered = advancePopSession(poppedOut(), { x: 170, y: 70 }, regions, tuning, metrics, 0);
    expect(entered.hover?.band).toBe('top'); // the 2-card edge is 96; 70 < 96
    const oneCardB = region(B.key, rect(120, 0, 100, 400), { cardCount: 1 });
    const after = advancePopSession(entered, { x: 170, y: 70 }, [A, oneCardB, C], tuning, metrics, 10);
    expect(after.hover?.band).toBe('middle'); // the one-card edge is (96 + 8) / 2 = 52; 70 >= 52
  });
});

// Story 6, hands-on finding 3 (2026-09-24): a locked column/sub-row's own
// zoom-in candidate comes from the *named relation* (`dropAnchorFor`'s own
// answer, handed in as `namedAnchor`), not a hit test — `inA` below is
// deliberately nowhere near either card's own rect throughout, to prove
// the physical pointer position no longer decides which Card is targeted.
describe('locked column/sub-row: the named-card zoom-in candidate (Story 6, finding 3)', () => {
  const P = cardRegion('p', rect(10, 10, 80, 40), A.key);
  const Q = cardRegion('q', rect(10, 60, 80, 40), A.key);
  const withCards = [A, B, C, P, Q];
  const namedP = (side: 'before' | 'after' = 'after') => ({ anchorId: 'p', side });

  it('holding the named relation past the dwell shows the cue phase, still locked in the column — nothing pops on the dwell alone', () => {
    let s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, namedP());
    expect(s.hover).toEqual({ regionKey: P.key, since: 0, poppable: true, side: 'after', phase: 'dwell' });
    s = advancePopSession(s, inA, withCards, tuning, metrics, DWELL, namedP());
    expect(s.hover).toEqual({ regionKey: P.key, since: 0, poppable: true, side: 'after', phase: 'cue' });
    expect(s.contextKey).toBe(A.key);
  });

  it('holding it through the cue pops into the named Card, wherever the bare cursor happens to be', () => {
    const s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, namedP());
    const popped = advancePopSession(s, inA, withCards, tuning, metrics, DWELL + CUE, namedP());
    expect(popped.contextKey).toBe(P.key);
  });

  it('a different named card resets the hold from the dwell, even mid-cue', () => {
    let s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, namedP());
    s = advancePopSession(s, inA, withCards, tuning, metrics, DWELL + 10, namedP());
    expect(s.hover?.phase).toBe('cue');
    s = advancePopSession(s, inA, withCards, tuning, metrics, DWELL + 20, { anchorId: 'q', side: 'after' });
    expect(s.hover).toEqual({ regionKey: Q.key, since: DWELL + 20, poppable: true, side: 'after', phase: 'dwell' });
  });

  it("the same card on its other side resets the hold too — wiki §6's own reset rule", () => {
    let s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, namedP('after'));
    s = advancePopSession(s, inA, withCards, tuning, metrics, DWELL + 10, namedP('after'));
    expect(s.hover?.phase).toBe('cue');
    s = advancePopSession(s, inA, withCards, tuning, metrics, DWELL + 20, namedP('before'));
    expect(s.hover).toEqual({ regionKey: P.key, since: DWELL + 20, poppable: true, side: 'before', phase: 'dwell' });
  });

  it('nothing named (alone in the list, or hovering nothing): no candidate at all', () => {
    const s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, null);
    expect(s.hover).toBeNull();
  });

  it('§3.2: a card with no registered region — an invalid target, cycle-forming or depth-capped, that resolveDragStructure never resolves a region for — is never a candidate even though it can still be named for a reorder', () => {
    const s = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, {
      anchorId: 'invalid',
      side: 'after',
    });
    expect(s.hover).toBeNull();
    expect(s.contextKey).toBe(A.key);
  });

  it('popDueAt schedules the dwell-end milestone first (so the cue can mount with the cursor perfectly still), then the final pop once the cue has started', () => {
    const dwelling = advancePopSession(startPopSession(A.key), inA, withCards, tuning, metrics, 0, namedP());
    expect(popDueAt(dwelling, withCards, tuning)).toBe(DWELL);
    const cueing = advancePopSession(dwelling, inA, withCards, tuning, metrics, DWELL, namedP());
    expect(popDueAt(cueing, withCards, tuning)).toBe(DWELL + CUE);
  });
});

// Story 6 Phase D: a locked Card's own zoom-in into its Descendants
// section — a plain, duration-only hold (no dwell/cue split; wiki §3.1's
// fourth clock), found by `childRegionAt` now that a Descendants region is
// no longer excluded from it (dragRegions.ts). Uses `descendantsPopInDelayMs`,
// not `cardPopInDelayMs`/`cardZoomDwellMs`.
describe('locked Card: zoom-in into its own Descendants section (Story 6 Phase D)', () => {
  const P = cardRegion('p', rect(10, 10, 80, 200), A.key);
  const descendantsP = descendantsRegion('p', rect(10, 60, 80, 140));
  const withDescendants = [A, P, descendantsP];
  const inDescendants = { x: 50, y: 100 };
  const DESC = tuning.descendantsPopInDelayMs;

  it('resting inside the section short of the threshold stays locked at Card', () => {
    const first = advancePopSession(startPopSession(P.key), inDescendants, withDescendants, tuning, metrics, 0);
    expect(first.hover).toEqual({ regionKey: descendantsP.key, since: 0, poppable: true });
    const s = advancePopSession(first, inDescendants, withDescendants, tuning, metrics, DESC - 1);
    expect(s.contextKey).toBe(P.key);
  });

  it('resting past the threshold zooms into the Descendants section, wherever the bare cursor happens to be', () => {
    const first = advancePopSession(startPopSession(P.key), inDescendants, withDescendants, tuning, metrics, 0);
    const s = advancePopSession(first, inDescendants, withDescendants, tuning, metrics, DESC);
    expect(s.contextKey).toBe(descendantsP.key);
  });

  it('a childless Card (no Descendants region at all) never pops any further — the auto-drop is its only outcome', () => {
    const s = advancePopSession(startPopSession(P.key), inDescendants, [A, P], tuning, metrics, DESC);
    expect(s.contextKey).toBe(P.key);
  });

  it('once locked at Descendants, there is no further child to zoom into (the layer table\'s own "(none)")', () => {
    const s = advancePopSession(
      startPopSession(descendantsP.key),
      inDescendants,
      withDescendants,
      tuning,
      metrics,
      DESC,
    );
    expect(s.contextKey).toBe(descendantsP.key);
    expect(s.hover).toBeNull();
  });
});

describe('popped out', () => {
  const outInB = run([
    [bMiddle, 0],
    [bMiddle, OUT],
  ]);

  it('follows the cursor: over nothing there is no hover, and no pop pending', () => {
    const s = advancePopSession(outInB, gap, regions, tuning, metrics, OUT + 1);
    expect(s).toEqual(poppedOut());
    expect(popDueAt(s, regions, tuning)).toBeNull();
  });

  it('resting in a middle band past the pop-in threshold locks the card into that column', () => {
    const almost = advancePopSession(outInB, bMiddle, regions, tuning, metrics, OUT + IN - 1);
    expect(almost.contextKey).toBeNull();
    const back = advancePopSession(almost, bMiddle, regions, tuning, metrics, OUT + IN);
    expect(back).toEqual(locked(B.key));
  });

  it('the pop-in clock starts at the pop-out, not at the region entry — the popped-out state is always reachable', () => {
    // Entered B at 0, popped out at OUT; pop-in is due at OUT + IN, never at OUT.
    expect(popDueAt(outInB, regions, tuning)).toBe(OUT + IN);
  });

  it('can pop back into the column it just left', () => {
    const s = run(
      [
        [inA, OUT + 1],
        [inA, OUT + 1 + IN],
      ],
      outInB,
    );
    expect(s).toEqual(locked(A.key));
  });

  it('the top and bottom bands never pop in, however long; moving to another column restarts the clock', () => {
    const top = run(
      [
        [bTop, OUT + 1],
        [bTop, OUT + 10 * IN],
      ],
      outInB,
    );
    expect(top.contextKey).toBeNull();
    expect(top.hover?.band).toBe('top');
    const moved = advancePopSession(outInB, cMiddle, regions, tuning, metrics, OUT + IN - 1);
    expect(moved.hover).toEqual({
      regionKey: C.key,
      band: 'middle',
      poppable: true,
      since: OUT + IN - 1,
    });
    expect(moved.contextKey).toBeNull();
  });

  it('a drag from outside every region (Unsorted) starts popped out and locks in the same way', () => {
    const s = startPopSession(null);
    expect(isLocked(s)).toBe(false);
    expect(
      run(
        [
          [bMiddle, 0],
          [bMiddle, IN],
        ],
        s,
      ),
    ).toEqual(locked(B.key));
  });
});

describe('popDueAt', () => {
  it('locked: the pop-out clock while outside, nothing inside', () => {
    expect(popDueAt(run([[bTop, 100]]), regions, tuning)).toBe(100 + OUT);
    expect(popDueAt(run([[gap, 100]]), regions, tuning)).toBe(100 + OUT);
    expect(popDueAt(startPopSession(A.key), regions, tuning)).toBeNull();
  });

  it('popped out: the pop-in clock only from a middle band', () => {
    expect(popDueAt(advancePopSession(poppedOut(), bMiddle, regions, tuning, metrics, 100), regions, tuning)).toBe(
      100 + IN,
    );
    expect(popDueAt(advancePopSession(poppedOut(), bTop, regions, tuning, metrics, 100), regions, tuning)).toBeNull();
  });
});

describe('placementFor', () => {
  const activeWorkphase = A.coveredWorkphaseIds[0];
  // Every pre-Story-5 case here is a Free Card drag: `origin` names its own
  // workphase, and `containingCardId` is null throughout (a Free Card never
  // has one) — neither ever changes the outcome of these cases (both only
  // ever matter for the Card/Descendants branches, exercised in their own
  // describe block below).

  it('in-context: the item sorts where it already is, under its own workphase', () => {
    expect(
      placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null),
    ).toEqual({
      workphaseId: activeWorkphase,
      slot: 'existing',
    });
  });

  // Story 4.1 Phase 3: `over` is release-only (decision 1 — mid-drag,
  // sortable draws the slot and the ghost just sits at 'existing', tested
  // above with no `over` at all). These are what useBoardDnd.ts's
  // handleDragEnd actually calls once a real drop has resolved.
  describe('over (release, in-context)', () => {
    it('a specific card: the anchor + side dnd-kit resolved, under its own workphase (TC-2.11)', () => {
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, null, {
          anchorId: 'card-x',
          side: 'after',
        }),
      ).toEqual({ workphaseId: activeWorkphase, slot: { anchorId: 'card-x', side: 'after' } });
    });

    it("the bare container: the same workphase-only fallback mid-drag already uses — there's no card to anchor beside", () => {
      expect(
        placementFor(
          startPopSession(A.key),
          regions,
          activeWorkphase,
          1,
          freeOrigin(activeWorkphase),
          null,
          null,
          'container',
        ),
      ).toEqual({
        workphaseId: activeWorkphase,
        slot: 'existing',
      });
    });

    it('a done region never anchors, even onto one of its own cards — same fallback as a bare container (audit epic-3-5-story-3-reconciled #4)', () => {
      const done = region('column:d', rect(0, 0, 100, 400), { isTerminal: true });
      expect(
        placementFor(startPopSession(done.key), [done], activeWorkphase, 1, freeOrigin(activeWorkphase), null, null, {
          anchorId: 'done-card',
          side: 'before',
        }),
      ).toEqual({ workphaseId: done.targetWorkphaseId, slot: 'existing' });
    });

    it('a real drop always wins over priorPlacement — only the null (mid-drag) case defers to it', () => {
      const prior: Placement = { workphaseId: 'wp-elsewhere', slot: { anchorId: 'other-item', side: 'after' } };
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, prior, {
          anchorId: 'card-x',
          side: 'before',
        }),
      ).toEqual({ workphaseId: activeWorkphase, slot: { anchorId: 'card-x', side: 'before' } });
    });
  });

  it("DRAG-3.11: Board layer — the hovered band picks the slot — first, existing, last — under the region's target workphase", () => {
    expect(placementFor(hoverAt(bTop), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
    expect(placementFor(hoverAt(bMiddle), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
    expect(placementFor(hoverAt(bBottom), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
  });

  it('DRAG-3.7: Board layer — a covered-set member keeps its own workphase in the preview', () => {
    const merged = region('column:m', rect(120, 0, 100, 400), {
      coveredWorkphaseIds: ['w1', 'w2'],
      targetWorkphaseId: 'w1',
    });
    const s = hoverAt(bTop, [A, merged]);
    expect(placementFor(s, [A, merged], 'w2', 1, freeOrigin('w2'), null)).toEqual({ workphaseId: 'w2', slot: 'first' });
  });

  it("DRAG-3.9: Board layer — a done region previews no positioned insert in any band, whatever the item's own position", () => {
    const done = region('column:d', rect(120, 0, 100, 400), { isTerminal: true });
    for (const p of [bTop, bMiddle, bBottom]) {
      for (const position of [1, null]) {
        const s = hoverAt(p, [A, done]);
        expect(placementFor(s, [A, done], activeWorkphase, position, freeOrigin(activeWorkphase), null)).toEqual({
          workphaseId: done.targetWorkphaseId,
          slot: 'existing',
        });
      }
    }
  });

  // Reconciliation #29, the mirror of #14: no position to keep — a
  // reopened done item, a first-time assignment — takes the append
  // fallback instead of the position-sort's null-coerced top slot, in
  // either of the two places band resolution lands on 'existing'.
  it('#29: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep', () => {
    expect(placementFor(hoverAt(bMiddle), regions, activeWorkphase, null, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    const poppedIn = run([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(placementFor(poppedIn, regions, activeWorkphase, null, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    // The edge bands are unaffected — they already name an explicit anchor.
    expect(placementFor(hoverAt(bTop), regions, activeWorkphase, null, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
  });

  it('popped out over nothing: no placement — the card is drawn where it already is', () => {
    expect(placementFor(poppedOut(), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null)).toBeNull();
  });

  // audit epic-3-5-story-3-reconciled #1: re-picking up an item whose
  // earlier write is still pending (or popping back into the context it
  // started in) must not recompute a fresh slot from the raw, possibly
  // stale item — that jumps the ghost. The prior placement wins whenever
  // there's no hover to say otherwise.
  describe('priorPlacement (a re-dragged item)', () => {
    const prior: Placement = { workphaseId: 'wp-elsewhere', slot: { anchorId: 'other-item', side: 'after' } };

    it('in-context, no hover: the prior placement wins over a freshly computed slot', () => {
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, prior),
      ).toBe(prior);
      // Even where the fresh computation would have said something else —
      // e.g. no position to keep, which alone would say 'last'.
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, null, freeOrigin(activeWorkphase), null, prior),
      ).toBe(prior);
    });

    it('a Board-layer hovered band ignores it — a genuine new region still computes its own slot', () => {
      expect(
        placementFor(hoverAt(bTop), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, prior),
      ).toEqual({
        workphaseId: B.targetWorkphaseId,
        slot: 'first',
      });
    });

    it('with no prior placement (the ordinary drag), in-context still computes the raw slot as before', () => {
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, null),
      ).toEqual({
        workphaseId: activeWorkphase,
        slot: 'existing',
      });
    });
  });

  it('after popping in, the new context is where the item sorts', () => {
    const s = run([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(s).toEqual(locked(B.key));
    expect(placementFor(s, regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
  });

  // Story 5 (2026-09-21): a Stub's own origin (`{parentId, slot: 'existing'}`)
  // through the Card and Descendants branches — TC-1/2/4/5/9/12.
  describe('a Stub drag (origin carries parentId)', () => {
    const P = 'card-p';
    const cardP = cardRegion(P, rect(0, 0, 100, 200), A.key);
    const otherCard = cardRegion('card-q', rect(0, 0, 100, 200), A.key);
    const descendantsP = descendantsRegion(P, rect(0, 0, 100, 200));
    const origin = stubOrigin(P);

    it('TC-12: at its own containing Card, the within-action is origin itself — "set back down"', () => {
      expect(placementFor(startPopSession(cardP.key), [cardP], null, null, origin, P)).toBe(origin);
    });

    it('TC-4: at a *different* Card, the within-action is attach as its last child', () => {
      expect(placementFor(startPopSession(otherCard.key), [otherCard], null, null, origin, P)).toEqual({
        parentId: 'card-q',
        slot: 'last',
      });
    });

    it("TC-9 (sibling bullets): at its own Descendants section, mid-drag (this branch never actually sees a real `over` — release there goes through releaseDescendants instead, Story 6 Phase D) sits at origin — dnd-kit's own sortable strategy draws the reorder", () => {
      expect(placementFor(startPopSession(descendantsP.key), [descendantsP], null, null, origin, P)).toBe(origin);
    });

    it('TC-1/2/3: reaching a card-list region previews Free (parentId: null) and rests at "last", never the position-sort\'s stale slot (decision 5)', () => {
      // activeItemPosition is a real number here on purpose — a Stub's own
      // attached-siblings-scope position, which must NOT be read as "a
      // position to keep" once it's previewing into a workflow-wide list.
      expect(placementFor(startPopSession(A.key), regions, null, 3, origin, P)).toEqual({
        parentId: null,
        workphaseId: activeWorkphase,
        slot: 'last',
      });
    });

    it("TC-1: a real anchor at the column layer resolves exactly like any Card's anchor+side", () => {
      expect(
        placementFor(startPopSession(A.key), regions, null, 3, origin, P, null, { anchorId: 'q', side: 'after' }),
      ).toEqual({ parentId: null, workphaseId: activeWorkphase, slot: { anchorId: 'q', side: 'after' } });
    });

    it('TC-3: Board layer (genuinely popped out) also previews Free at the append slot', () => {
      expect(placementFor(hoverAt(bMiddle), regions, null, 3, origin, P)).toEqual({
        parentId: null,
        workphaseId: B.targetWorkphaseId,
        slot: 'last',
      });
    });

    it('a terminal region still previews existing (nothing anchorable there) even for a detaching Stub', () => {
      const done = region('column:d', rect(0, 0, 100, 400), { isTerminal: true });
      expect(placementFor(startPopSession(done.key), [done], null, 3, origin, P)).toEqual({
        parentId: null,
        workphaseId: done.targetWorkphaseId,
        slot: 'existing',
      });
    });
  });

  // Story 6 Phase D — a Descendants section reached by a *foreign* item
  // (never possible before this phase, since only the origin's own section
  // ever resolved a `descendants:` region at all): `region.cardId` differs
  // from `containingCardId` (null for a Free Card; a different Card for a
  // Stub detaching and reparenting), so the mid-drag ghost previews
  // attaching as the section's own Card's last child — mirroring the Card
  // branch's own `attachToCardId === containingCardId` distinction one
  // layer up. This branch never actually sees a real `over` (release goes
  // through `releaseDescendants` instead, Story 6.1 Phase 0 L1-5).
  describe('a Descendants section reached by a foreign item (Story 6 Phase D)', () => {
    const Q = 'card-q';
    const descendantsQ = descendantsRegion(Q, rect(0, 0, 100, 200));

    it("a Free Card, mid-drag: previews attaching as last child of the section's own Card", () => {
      expect(
        placementFor(startPopSession(descendantsQ.key), [descendantsQ], null, null, freeOrigin('w1'), null),
      ).toEqual({ parentId: Q, slot: 'last' });
    });

    it('a Stub detaching from a *different* Card (containingCardId !== region.cardId): the same foreign-entry rule, not parentOpinionOf(origin)', () => {
      const P = 'card-p';
      const origin = stubOrigin(P);
      expect(placementFor(startPopSession(descendantsQ.key), [descendantsQ], null, null, origin, P)).toEqual({
        parentId: Q,
        slot: 'last',
      });
    });

    it('the same Card as containingCardId is still the same-section rule (regression guard against always taking the foreign path)', () => {
      const origin = stubOrigin(Q);
      expect(placementFor(startPopSession(descendantsQ.key), [descendantsQ], null, null, origin, Q)).toBe(origin);
    });
  });
});

// Story 6 Phase C: which form the carried copy draws as — a pure read of
// `placementRegion`'s own result, per layer, and across a real pop-in and
// pop-out (not just two isolated `startPopSession` fixtures) so the
// transition itself is covered, not only its two endpoints.
describe('overlayFormFor', () => {
  const P = 'card-p';
  const cardP = cardRegion(P, rect(0, 0, 100, 200), A.key);
  const descendantsP = descendantsRegion(P, rect(0, 0, 100, 200));

  it('no drag at all (undefined region): the shortCard', () => {
    expect(overlayFormFor(undefined)).toBe('short-card');
  });

  it('Board layer, merely hovering a column (not yet locked): the shortCard', () => {
    expect(overlayFormFor(placementRegion(hoverAt(bMiddle), regions))).toBe('short-card');
  });

  it('locked in a column/sub-row: the shortCard', () => {
    expect(overlayFormFor(placementRegion(startPopSession(A.key), [A]))).toBe('short-card');
  });

  it('locked at a Card layer: the Stub', () => {
    expect(overlayFormFor(placementRegion(startPopSession(cardP.key), [cardP]))).toBe('stub');
  });

  it('locked at a Descendants layer: the Stub', () => {
    expect(overlayFormFor(placementRegion(startPopSession(descendantsP.key), [descendantsP]))).toBe('stub');
  });

  it('across a real pop-in (Column → Card) and pop-out (Card → Column), the form switches both ways', () => {
    const allRegions = [...regions, cardP, descendantsP];
    const inCard = { x: 50, y: 100 }; // still inside column A throughout — irrelevant to *which* Card is targeted (finding 3)
    const outsideCard = { x: 500, y: 500 }; // outside every region
    const namedAtP = { anchorId: P, side: 'after' as const };
    const total = tuning.cardZoomDwellMs + tuning.cardPopInDelayMs;

    let s = startPopSession(A.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('short-card');

    // Zoom in to the Card (Story 6, finding 3: the *named* relation
    // dropAnchorFor answers with, held through the dwell and the cue —
    // not a hit test on where the cursor physically rests).
    s = advancePopSession(s, inCard, allRegions, tuning, metrics, 0, namedAtP);
    s = advancePopSession(s, inCard, allRegions, tuning, metrics, total, namedAtP);
    expect(s.contextKey).toBe(cardP.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('stub');

    // Pop back out to the column: the shortCard again, symmetrically.
    s = advancePopSession(s, outsideCard, allRegions, tuning, metrics, total);
    s = advancePopSession(s, outsideCard, allRegions, tuning, metrics, total + OUT);
    expect(s.contextKey).toBe(A.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('short-card');
  });
});
