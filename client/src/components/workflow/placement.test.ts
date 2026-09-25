import { describe, it, expect } from 'vitest';
import { advancePopSession, startPopSession } from './popSession';
import { overlayFormFor, placementFor, placementRegion, resolvePlacementOver } from './placement';
import { cardRegion, descendantsRegion, freeOrigin, rect, region, stubOrigin } from '../../test/dragFixtures';
import type { Placement } from './itemListOps';
import {
  POP_TEST_METRICS as metrics,
  POP_TEST_TUNING as tuning,
  hoverAt,
  runPop,
  threeColumnBoard,
} from '../../test/popFixtures';

// docs/wiki/board-drag-interaction §1–§3, §5. Cases from DRAG-1 and DRAG-3,
// every threshold parameterized on the tuning value, never 0.5 s.

// The shared board (`test/popFixtures.ts`): columns A, B, C, with A the origin.
const { A, B, regions, points } = threeColumnBoard();
const { bTop, bMiddle, bBottom } = points;

const OUT = tuning.popDelayMs;
const IN = tuning.popInDelayMs;

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
    const poppedIn = runPop([
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
    expect(
      placementFor(startPopSession(null), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null),
    ).toBeNull();
  });

  // re-picking up an item whose
  // earlier write is still pending (or popping back into the context it
  // started in) must not recompute a fresh slot from the raw, possibly
  // stale item — that jumps the ghost. The prior placement wins whenever
  // there's no hover to say otherwise, in the list it draws the item in.
  describe('priorPlacement (a re-dragged item)', () => {
    const prior: Placement = { workphaseId: activeWorkphase, slot: { anchorId: 'other-item', side: 'after' } };

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

    // X's move to B is pending, so
    // it's drawn in B (and its drag reads B's workphase, as drawn). Carried
    // back and locked in A, the ghost is A's to draw, not left behind in B.
    it("locked in a list the prior placement doesn't draw it in, it gives way to that list's own slot", () => {
      const inB = B.targetWorkphaseId;
      const pendingInB: Placement = { workphaseId: inB, slot: { anchorId: 'other-item', side: 'after' } };
      expect(placementFor(startPopSession(A.key), regions, inB, 1, freeOrigin(inB), null, pendingInB)).toEqual({
        workphaseId: A.targetWorkphaseId,
        slot: 'existing',
      });
    });

    it("a pending attach (the prior names a parent) never stands in for a card list's ghost", () => {
      const attaching: Placement = { parentId: 'card-y', slot: 'last' };
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, attaching),
      ).toEqual({ workphaseId: activeWorkphase, slot: 'existing' });
    });

    it('a pending detach (parentId: null) into this list still stands in', () => {
      const detached: Placement = { parentId: null, workphaseId: activeWorkphase, slot: 'last' };
      expect(
        placementFor(startPopSession(A.key), regions, activeWorkphase, 1, freeOrigin(activeWorkphase), null, detached),
      ).toBe(detached);
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
    const s = runPop([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(s).toEqual(startPopSession(B.key));
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

// Story 6.1 Phase 2 (carried structural finding, Story 4 audit #18 → Story
// 5 audit #19): the release-only anchor/bare-container distinction, beside
// placementFor's own mid-drag half.
describe('resolvePlacementOver', () => {
  const list = { containerId: 'column:a' };

  it('no release list at all (no region resolved): null', () => {
    expect(resolvePlacementOver(null, 'card-x', { anchorId: 'card-x', side: 'after' })).toBeNull();
  });

  it('no drop (over is null): the bare container', () => {
    expect(resolvePlacementOver(list, null, null)).toBe('container');
  });

  it("over resolves to the list's own container: the bare container, even with an anchor computed", () => {
    expect(resolvePlacementOver(list, 'column:a', { anchorId: 'card-x', side: 'after' })).toBe('container');
  });

  it('over names a specific card: the anchor', () => {
    expect(resolvePlacementOver(list, 'card-x', { anchorId: 'card-x', side: 'before' })).toEqual({
      anchorId: 'card-x',
      side: 'before',
    });
  });

  it('over names a card but the anchor came back null (e.g. alone in the list): the bare container', () => {
    expect(resolvePlacementOver(list, 'card-x', null)).toBe('container');
  });
});
