import { describe, it, expect } from 'vitest';
import { DEFAULT_DRAG_TUNING, type DragTuning } from './dragTuning';
import {
  advancePopSession,
  isLocked,
  placementFor,
  popDueAt,
  releaseIntent,
  startPopSession,
  type PopSession,
} from './popSession';
import { rect, region } from '../../test/dragFixtures';
import type { Placement } from './itemListOps';

// docs/wiki/board-drag-interaction §1–§3, §5. Cases from DRAG-1 and DRAG-3,
// every threshold parameterized on the tuning value, never 0.5 s.

// Column A (the origin) and column B side by side, 100 wide, 20 gap, 400
// tall; column C further right, all fixture-default 2-card regions. Bands
// at the default ghostCardHeightPx (96): B's top band is y < 96, bottom
// band y > 304.
const A = region('column:a', rect(0, 0, 100, 400));
const B = region('column:b', rect(120, 0, 100, 400));
const C = region('column:c', rect(240, 0, 100, 400));
const regions = [A, B, C];

const inA = { x: 50, y: 200 };
const bTop = { x: 170, y: 40 };
const bMiddle = { x: 170, y: 200 };
const bBottom = { x: 170, y: 360 };
const cMiddle = { x: 290, y: 200 };
const gap = { x: 110, y: 200 };

const tuning: DragTuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 300, popInDelayMs: 200 };
const OUT = tuning.popDelayMs;
const IN = tuning.popInDelayMs;

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
  return advancePopSession(poppedOut(), point, regionsArg, tuning, 0);
}

function run(steps: Array<[{ x: number; y: number }, number]>, start = startPopSession(A.key)): PopSession {
  return steps.reduce((s, [pointer, now]) => advancePopSession(s, pointer, regions, tuning, now), start);
}

describe('locked', () => {
  it('DRAG-1.1: starts locked in the origin context with nothing tracked', () => {
    expect(startPopSession(A.key)).toEqual(locked(A.key));
    expect(isLocked(startPopSession(A.key))).toBe(true);
  });

  it('inside the context nothing is tracked, and the same object comes back', () => {
    const s = startPopSession(A.key);
    expect(advancePopSession(s, inA, regions, tuning, 0)).toBe(s);
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
    const out = advancePopSession(almost, bMiddle, regions, tuning, 100 + OUT);
    expect(out).toEqual({
      contextKey: null,
      outsideSince: null,
      hover: {
        regionKey: B.key,
        band: 'middle',
        poppable: true,
        since: 100 + OUT,
        rect: B.rect,
        scrollTop: 0,
        cardCount: 2,
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
    const near = advancePopSession(startPopSession(A.key), { x: 140, y: 200 }, regions, withDistance, 0); // 40px past A
    expect(near.contextKey).toBe(A.key);
    const far = advancePopSession(startPopSession(A.key), { x: 170, y: 200 }, regions, withDistance, 0); // 70px past A
    expect(far.contextKey).toBeNull();
  });

  it("Board layer: the band is measured against the region's rect as it was on entry, so the ghost's own insertion can't move the band", () => {
    const entered = advancePopSession(poppedOut(), bTop, regions, tuning, 0);
    // Grown from the bottom only, top unchanged — a real ghost inserting
    // *within* a region only ever extends how far down it reaches; the
    // region's own top edge is fixed by what's above it, not by its own
    // content, so no real insertion could move that instead (Story 8
    // re-plan's own ground-truth finding — followRegionTop relies on
    // exactly this to tell a real external shift from the ghost's own
    // doing without needing scrollTop as a separate signal at all).
    const grownB = region(B.key, rect(120, 0, 100, 500));
    const later = advancePopSession(entered, bTop, [A, grownB, C], tuning, 10);
    expect(later.hover?.band).toBe('top');
    expect(releaseIntent(later, [A, grownB, C])).toMatchObject({ kind: 'band', band: 'top' });
    // A *fresh* entry, with no sticky hover to ignore the growth for, does
    // reflect it — bBottom (y 360) was the bottom band against B's original
    // 400-tall rect (boundary 304) but is only the middle band against
    // grownB's own, now-500-tall one (boundary 404): the contrast that
    // shows sticky is doing something, not that nothing here reads live.
    const fresh = advancePopSession(poppedOut(), bBottom, [A, grownB, C], tuning, 0);
    expect(fresh.hover?.band).toBe('middle');
  });

  it('Board layer: the frozen rect follows a real scroll of the region (reconciliation #21), unlike the ghost regrowing it (which never moves the top edge at all — see `grownB` above)', () => {
    const entered = advancePopSession(poppedOut(), bTop, regions, tuning, 0);
    // The column scrolled down 30px: B's freshly-measured rect moves up by
    // 30 on screen (scrollTop just comes along for the ride — followRegionTop
    // reads the top edge itself, not this).
    const scrolledB = region(B.key, rect(120, -30, 100, 400), { scrollTop: 30 });
    const after = advancePopSession(entered, bTop, [A, scrolledB, C], tuning, 10);
    expect(after.hover).toMatchObject({ rect: { ...B.rect, top: -30, bottom: 370 }, scrollTop: 30, band: 'top' });

    // Scrolling back to 0 carries it right back.
    const back = advancePopSession(after, bTop, [A, B, C], tuning, 20);
    expect(back.hover).toMatchObject({ rect: B.rect, scrollTop: 0 });
  });

  it('Board layer: the frozen rect also follows a sibling region reshaping next to it, with no scroll involved at all', () => {
    // Story 8 re-plan: an expanded column's sub-rows share one scroll body,
    // and each can carve out or give back a card's height at Board layer —
    // one doing so shifts a sibling's own top edge exactly as a real scroll
    // would, but scrollTop itself never changes. followRegionTop reads the
    // top edge directly for exactly this reason, rather than trusting
    // scrollTop to say whether the region moved. A point picked to land in
    // the gap between the un-followed and followed boundary (here, 96 and
    // 136) actually exercises that — one that would stay "top" either way
    // wouldn't prove this is being read at all.
    const entered = advancePopSession(poppedOut(), { x: 170, y: 110 }, regions, tuning, 0);
    expect(entered.hover?.band).toBe('middle');
    const pushedDownB = region(B.key, rect(120, 40, 100, 400));
    const after = advancePopSession(entered, { x: 170, y: 110 }, [A, pushedDownB, C], tuning, 10);
    expect(after.hover).toMatchObject({ rect: { ...B.rect, top: 40, bottom: 440 }, scrollTop: 0, band: 'top' });
  });
});

describe('popped out', () => {
  const outInB = run([
    [bMiddle, 0],
    [bMiddle, OUT],
  ]);

  it('follows the cursor: over nothing there is no hover, and no pop pending', () => {
    const s = advancePopSession(outInB, gap, regions, tuning, OUT + 1);
    expect(s).toEqual(poppedOut());
    expect(popDueAt(s, tuning)).toBeNull();
  });

  it('resting in a middle band past the pop-in threshold locks the card into that column', () => {
    const almost = advancePopSession(outInB, bMiddle, regions, tuning, OUT + IN - 1);
    expect(almost.contextKey).toBeNull();
    const back = advancePopSession(almost, bMiddle, regions, tuning, OUT + IN);
    expect(back).toEqual(locked(B.key));
  });

  it('the pop-in clock starts at the pop-out, not at the region entry — the popped-out state is always reachable', () => {
    // Entered B at 0, popped out at OUT; pop-in is due at OUT + IN, never at OUT.
    expect(popDueAt(outInB, tuning)).toBe(OUT + IN);
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
    const moved = advancePopSession(outInB, cMiddle, regions, tuning, OUT + IN - 1);
    expect(moved.hover).toEqual({
      regionKey: C.key,
      band: 'middle',
      poppable: true,
      since: OUT + IN - 1,
      rect: C.rect,
      scrollTop: 0,
      cardCount: 2,
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
    expect(popDueAt(run([[bTop, 100]]), tuning)).toBe(100 + OUT);
    expect(popDueAt(run([[gap, 100]]), tuning)).toBe(100 + OUT);
    expect(popDueAt(startPopSession(A.key), tuning)).toBeNull();
  });

  it('popped out: the pop-in clock only from a middle band', () => {
    expect(popDueAt(advancePopSession(poppedOut(), bMiddle, regions, tuning, 100), tuning)).toBe(100 + IN);
    expect(popDueAt(advancePopSession(poppedOut(), bTop, regions, tuning, 100), tuning)).toBeNull();
  });
});

describe('placementFor', () => {
  const activeWorkphase = A.coveredWorkphaseIds[0];

  it('in-context: the item sorts where it already is, under its own workphase', () => {
    expect(placementFor(startPopSession(A.key), regions, activeWorkphase, 1)).toEqual({
      workphaseId: activeWorkphase,
      slot: 'existing',
    });
  });

  it("DRAG-3.11: Board layer — the hovered band picks the slot — first, existing, last — under the region's target workphase", () => {
    expect(placementFor(hoverAt(bTop), regions, activeWorkphase, 1)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
    expect(placementFor(hoverAt(bMiddle), regions, activeWorkphase, 1)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
    expect(placementFor(hoverAt(bBottom), regions, activeWorkphase, 1)).toEqual({
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
    expect(placementFor(s, [A, merged], 'w2', 1)).toEqual({ workphaseId: 'w2', slot: 'first' });
  });

  it("DRAG-3.9: Board layer — a done region previews no positioned insert in any band, whatever the item's own position", () => {
    const done = region('column:d', rect(120, 0, 100, 400), { isTerminal: true });
    for (const p of [bTop, bMiddle, bBottom]) {
      for (const position of [1, null]) {
        const s = hoverAt(p, [A, done]);
        expect(placementFor(s, [A, done], activeWorkphase, position)).toEqual({
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
    expect(placementFor(hoverAt(bMiddle), regions, activeWorkphase, null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    const poppedIn = run([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(placementFor(poppedIn, regions, activeWorkphase, null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    // The edge bands are unaffected — they already name an explicit anchor.
    expect(placementFor(hoverAt(bTop), regions, activeWorkphase, null)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
  });

  it('popped out over nothing: no placement — the card is drawn where it already is', () => {
    expect(placementFor(poppedOut(), regions, activeWorkphase, 1)).toBeNull();
  });

  // audit epic-3-5-story-3-reconciled #1: re-picking up an item whose
  // earlier write is still pending (or popping back into the context it
  // started in) must not recompute a fresh slot from the raw, possibly
  // stale item — that jumps the ghost. The prior placement wins whenever
  // there's no hover to say otherwise.
  describe('priorPlacement (a re-dragged item)', () => {
    const prior: Placement = { workphaseId: 'wp-elsewhere', slot: { anchorId: 'other-item', side: 'after' } };

    it('in-context, no hover: the prior placement wins over a freshly computed slot', () => {
      expect(placementFor(startPopSession(A.key), regions, activeWorkphase, 1, prior)).toBe(prior);
      // Even where the fresh computation would have said something else —
      // e.g. no position to keep, which alone would say 'last'.
      expect(placementFor(startPopSession(A.key), regions, activeWorkphase, null, prior)).toBe(prior);
    });

    it('a Board-layer hovered band ignores it — a genuine new region still computes its own slot', () => {
      expect(placementFor(hoverAt(bTop), regions, activeWorkphase, 1, prior)).toEqual({
        workphaseId: B.targetWorkphaseId,
        slot: 'first',
      });
    });

    it('with no prior placement (the ordinary drag), in-context still computes the raw slot as before', () => {
      expect(placementFor(startPopSession(A.key), regions, activeWorkphase, 1, null)).toEqual({
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
    expect(placementFor(s, regions, activeWorkphase, 1)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
  });
});

describe('releaseIntent', () => {
  it('locked: always in-context (anchor + side via dnd-kit) — rule 1, regardless of a foreign hover, since one is never even tracked', () => {
    expect(releaseIntent(startPopSession(A.key), regions)).toEqual({ kind: 'in-context' });
    expect(releaseIntent(run([[bBottom, 100]]), regions)).toEqual({ kind: 'in-context' });
  });

  it("Board layer (popped out): a hovered region's band", () => {
    expect(releaseIntent(hoverAt(bBottom), regions)).toEqual({ kind: 'band', region: B, band: 'bottom' });
    // Even back over the column it came from: a band drop there too.
    expect(releaseIntent(hoverAt(inA), regions)).toEqual({ kind: 'band', region: A, band: 'middle' });
  });

  it('DRAG-1.5 / DRAG-3.4: after popping into B, a release in B is in-context', () => {
    const s = run([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(releaseIntent(s, regions)).toEqual({ kind: 'in-context' });
  });

  it('locked, released between columns or over an Inert surface: still in-context (rule 1) — only Board layer over nothing is a genuine no-op', () => {
    expect(releaseIntent(startPopSession(A.key), regions)).toEqual({ kind: 'in-context' });
    expect(releaseIntent(poppedOut(), regions)).toEqual({ kind: 'none' });
  });
});
