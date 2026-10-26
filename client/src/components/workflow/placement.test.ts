import { describe, it, expect } from 'vitest';
import { startPopSession, type PopSession } from './popSession';
import {
  overlayFormFor,
  placementFor,
  placementRegion,
  resolvePlacementOver,
  type PlacementSubject,
} from './placement';
import { freeOrigin, rect, region, stubOrigin } from '../../test/dragFixtures';
import type { Placement } from './itemListOps';
import { POP_TEST_TUNING as tuning, hoverAt, runPop, step, threeColumnBoard } from '../../test/popFixtures';

// Every wait reads its value from the tuning object (`POP_TEST_TUNING`), never a
// number such as 0.5 s.

// The shared board (`test/popFixtures.ts`): columns A, B, C, with A the origin and
// holding the Cards P (here `cardP`, with its section) and Q (`otherCard`).
const { A, B, P: cardP, Q: otherCard, descendantsP, regions, points } = threeColumnBoard();
const { bTop, bMiddle, bBottom } = points;

const OUT = tuning.popDelayMs;
const IN = tuning.popInDelayMs;

describe('placementFor', () => {
  const activeWorkphase = A.coveredWorkphaseIds[0];
  // Every case before the Stub-drag block is a Free Card drag: `origin` names its
  // own workphase and carries no parent opinion, and `containingCardId` is null (a
  // Free Card never has one), so neither changes these cases' outcome. A Stub's
  // `origin` does: the Card and Descendants branches read both, and the card-list
  // branch reads `origin` to preview a Stub as Free (the describe blocks below).
  // `subject` builds that drag — a Free Card of `activeWorkphase` at position 1, its
  // own origin — with any field overridden.
  interface SubjectFields {
    workphaseId?: string | null;
    position?: number | null;
    origin?: Placement;
    containingCardId?: string | null;
    priorPlacement?: Placement | null;
  }
  const subject = (pop: PopSession, fields: SubjectFields = {}): PlacementSubject => {
    const { workphaseId = activeWorkphase, position = 1, containingCardId = null, priorPlacement = null } = fields;
    const origin = fields.origin ?? freeOrigin(workphaseId ?? activeWorkphase);
    return { pop, activeItem: { workphaseId, position }, origin, containingCardId, priorPlacement };
  };

  it('in-context: the item sorts where it already is, under its own workphase', () => {
    expect(placementFor(subject(startPopSession(A.key)), regions)).toEqual({
      workphaseId: activeWorkphase,
      slot: 'existing',
    });
  });

  // `over` is release-only: mid-drag, sortable draws the slot and the ghost
  // just sits at 'existing' (tested above with no `over` at all). These are
  // the calls `useBoardDnd.ts::handleDragEnd` makes once a real drop has
  // resolved.
  describe('over (release, in-context)', () => {
    it('DRAG-1.4, TC-2.11: a specific card: the anchor + side dnd-kit resolved, under its own workphase', () => {
      expect(
        placementFor(subject(startPopSession(A.key)), regions, {
          anchorId: 'card-x',
          side: 'after',
        }),
      ).toEqual({ workphaseId: activeWorkphase, slot: { anchorId: 'card-x', side: 'after' } });
    });

    it("the bare container: the same workphase-only fallback mid-drag already uses — there's no card to anchor beside", () => {
      expect(placementFor(subject(startPopSession(A.key)), regions, 'container')).toEqual({
        workphaseId: activeWorkphase,
        slot: 'existing',
      });
    });

    it('a done region never anchors, even onto one of its own cards — same fallback as a bare container', () => {
      const done = region('column:d', rect(0, 0, 100, 400), { isTerminal: true });
      expect(
        placementFor(subject(startPopSession(done.key)), [done], {
          anchorId: 'done-card',
          side: 'before',
        }),
      ).toEqual({ workphaseId: done.targetWorkphaseId, slot: 'existing' });
    });

    it('a real drop always wins over priorPlacement — only the null (mid-drag) case defers to it', () => {
      const prior: Placement = { workphaseId: 'wp-elsewhere', slot: { anchorId: 'other-item', side: 'after' } };
      expect(
        placementFor(subject(startPopSession(A.key), { priorPlacement: prior }), regions, {
          anchorId: 'card-x',
          side: 'before',
        }),
      ).toEqual({ workphaseId: activeWorkphase, slot: { anchorId: 'card-x', side: 'before' } });
    });
  });

  it("DRAG-3.11: Board layer — the hovered band picks the slot — first, existing, last — under the region's target workphase", () => {
    expect(placementFor(subject(hoverAt(bTop)), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
    expect(placementFor(subject(hoverAt(bMiddle)), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
    expect(placementFor(subject(hoverAt(bBottom)), regions)).toEqual({
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
    expect(placementFor(subject(s, { workphaseId: 'w2' }), [A, merged])).toEqual({ workphaseId: 'w2', slot: 'first' });
  });

  it("DRAG-3.9: Board layer — a done region previews no positioned insert in any band, whatever the item's own position", () => {
    const done = region('column:d', rect(120, 0, 100, 400), { isTerminal: true });
    for (const p of [bTop, bMiddle, bBottom]) {
      for (const position of [1, null]) {
        const s = hoverAt(p, [A, done]);
        expect(placementFor(subject(s, { position }), [A, done])).toEqual({
          workphaseId: done.targetWorkphaseId,
          slot: 'existing',
        });
      }
    }
  });

  // No position to keep — a reopened done item, a first-time assignment —
  // takes the append fallback instead of the position-sort's null-coerced
  // top slot, in either of the two places band resolution lands on
  // 'existing'.
  it('DRAG-6.10: Board layer — an active region with no anchor previews last, not existing, when the item has no position to keep', () => {
    expect(placementFor(subject(hoverAt(bMiddle), { position: null }), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    const poppedIn = runPop([
      [bMiddle, 0],
      [bMiddle, OUT],
      [bMiddle, OUT + IN],
    ]);
    expect(placementFor(subject(poppedIn, { position: null }), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'last',
    });
    // The edge bands are unaffected — they already name an explicit anchor.
    expect(placementFor(subject(hoverAt(bTop), { position: null }), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'first',
    });
  });

  it('popped out over nothing: no placement — the card is drawn where it already is', () => {
    expect(placementFor(subject(startPopSession(null)), regions)).toBeNull();
  });

  // Re-picking up an item whose earlier write is still pending (or popping
  // back into the context it started in) must not recompute a fresh slot
  // from the raw, possibly stale item — that jumps the ghost. The prior
  // placement wins whenever there's no hover to say otherwise, in the list
  // it draws the item in.
  describe('DRAG-6.13: priorPlacement (a re-dragged item)', () => {
    const prior: Placement = { workphaseId: activeWorkphase, slot: { anchorId: 'other-item', side: 'after' } };

    it('in-context, no hover: the prior placement wins over a freshly computed slot', () => {
      expect(placementFor(subject(startPopSession(A.key), { priorPlacement: prior }), regions)).toBe(prior);
      // Even where the fresh computation would have said something else —
      // e.g. no position to keep, which alone would say 'last'.
      expect(placementFor(subject(startPopSession(A.key), { position: null, priorPlacement: prior }), regions)).toBe(
        prior,
      );
    });

    // X's move to B is pending, so it's drawn in B (and its drag reads B's
    // workphase, as drawn). Carried back and locked in A, the ghost is A's
    // to draw, not left behind in B.
    it("locked in a list the prior placement doesn't draw it in, it gives way to that list's own slot", () => {
      const inB = B.targetWorkphaseId;
      const pendingInB: Placement = { workphaseId: inB, slot: { anchorId: 'other-item', side: 'after' } };
      expect(
        placementFor(subject(startPopSession(A.key), { workphaseId: inB, priorPlacement: pendingInB }), regions),
      ).toEqual({
        workphaseId: A.targetWorkphaseId,
        slot: 'existing',
      });
    });

    it("a pending attach (the prior names a parent) never stands in for a card list's ghost", () => {
      const attaching: Placement = { parentId: 'card-y', slot: 'last' };
      expect(placementFor(subject(startPopSession(A.key), { priorPlacement: attaching }), regions)).toEqual({
        workphaseId: activeWorkphase,
        slot: 'existing',
      });
    });

    it('a pending detach (parentId: null) into this list still stands in', () => {
      const detached: Placement = { parentId: null, workphaseId: activeWorkphase, slot: 'last' };
      expect(placementFor(subject(startPopSession(A.key), { priorPlacement: detached }), regions)).toBe(detached);
    });

    it('a Board-layer hovered band ignores it — a genuine new region still computes its own slot', () => {
      expect(placementFor(subject(hoverAt(bTop), { priorPlacement: prior }), regions)).toEqual({
        workphaseId: B.targetWorkphaseId,
        slot: 'first',
      });
    });

    it('with no prior placement (the ordinary drag), in-context still computes the raw slot as before', () => {
      expect(placementFor(subject(startPopSession(A.key)), regions)).toEqual({
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
    expect(placementFor(subject(s), regions)).toEqual({
      workphaseId: B.targetWorkphaseId,
      slot: 'existing',
    });
  });

  // A Stub's own origin (`{parentId, slot: 'existing'}`) through the Card and
  // Descendants branches, and out into a card list.
  describe('a Stub drag (origin carries parentId)', () => {
    const P = cardP.attachToCardId;
    const origin = stubOrigin(P);
    const stub = (pop: PopSession, position: number | null) =>
      subject(pop, { workphaseId: null, position, origin, containingCardId: P });

    it('DRAG-5.12: at its own containing Card, the within-action is origin itself — "set back down"', () => {
      expect(placementFor(stub(startPopSession(cardP.key), null), [cardP])).toBe(origin);
    });

    it('DRAG-5.4: at a *different* Card, the within-action is attach as its last child', () => {
      expect(placementFor(stub(startPopSession(otherCard.key), null), [otherCard])).toEqual({
        parentId: otherCard.attachToCardId,
        slot: 'last',
      });
    });

    it("DRAG-5.9: at its own Descendants section, mid-drag, it sits at origin — dnd-kit's own sortable strategy draws the reorder (this branch never sees a real `over`; a release there goes through releaseDescendants instead)", () => {
      expect(placementFor(stub(startPopSession(descendantsP.key), null), [descendantsP])).toBe(origin);
    });

    // A Stub of this Card whose own slot the section doesn't draw has no row to hold a ghost.
    it('DRAG-7.6: at its own Descendants section with its own slot hidden, it previews as the last child', () => {
      const hidden = { ...stub(startPopSession(descendantsP.key), null), projection: { slotHidden: true } };
      expect(placementFor(hidden, [descendantsP])).toEqual({ parentId: cardP.attachToCardId, slot: 'last' });
      const drawn = { ...stub(startPopSession(descendantsP.key), null), projection: { slotHidden: false } };
      expect(placementFor(drawn, [descendantsP])).toBe(origin);
    });

    it('DRAG-6.12: reaching a card-list region previews Free (parentId: null) and rests at "last", never the position-sort\'s stale slot', () => {
      // activeItemPosition is a real number here on purpose — a Stub's own
      // attached-siblings-scope position, which must NOT be read as "a
      // position to keep" once it's previewing into a workflow-wide list.
      expect(placementFor(stub(startPopSession(A.key), 3), regions)).toEqual({
        parentId: null,
        workphaseId: activeWorkphase,
        slot: 'last',
      });
    });

    it("DRAG-5.1, DRAG-6.12: a real anchor at the column layer resolves exactly like any Card's anchor+side", () => {
      expect(placementFor(stub(startPopSession(A.key), 3), regions, { anchorId: 'q', side: 'after' })).toEqual({
        parentId: null,
        workphaseId: activeWorkphase,
        slot: { anchorId: 'q', side: 'after' },
      });
    });

    it('DRAG-5.3, DRAG-6.12: at Board layer (genuinely popped out), it also previews Free at the append slot', () => {
      expect(placementFor(stub(hoverAt(bMiddle), 3), regions)).toEqual({
        parentId: null,
        workphaseId: B.targetWorkphaseId,
        slot: 'last',
      });
    });

    it('a terminal region still previews existing (nothing anchorable there) even for a detaching Stub', () => {
      const done = region('column:d', rect(0, 0, 100, 400), { isTerminal: true });
      expect(placementFor(stub(startPopSession(done.key), 3), [done])).toEqual({
        parentId: null,
        workphaseId: done.targetWorkphaseId,
        slot: 'existing',
      });
    });
  });

  // A Descendants section reached by a *foreign* item: `region.cardId`
  // differs from `containingCardId` (null for a Free Card; a different Card
  // for a Stub detaching and reparenting), so the mid-drag ghost previews
  // attaching as the section's own Card's last child — mirroring the Card
  // branch's own `attachToCardId === containingCardId` distinction one
  // layer up. This branch never actually sees a real `over`: a release goes
  // through `useBoardDnd.ts::releaseDescendants` instead.
  describe('a Descendants section reached by a foreign item', () => {
    const P = cardP.attachToCardId;
    const Q = otherCard.attachToCardId;

    it("a Free Card, mid-drag: previews attaching as last child of the section's own Card", () => {
      expect(
        placementFor(
          subject(startPopSession(descendantsP.key), { workphaseId: null, position: null, origin: freeOrigin('w1') }),
          [descendantsP],
        ),
      ).toEqual({ parentId: P, slot: 'last' });
    });

    it('a Stub detaching from a *different* Card (containingCardId !== region.cardId): the same foreign-entry rule, not parentOpinionOf(origin)', () => {
      const origin = stubOrigin(Q);
      const fromQ = subject(startPopSession(descendantsP.key), {
        workphaseId: null,
        position: null,
        origin,
        containingCardId: Q,
      });
      expect(placementFor(fromQ, [descendantsP])).toEqual({
        parentId: P,
        slot: 'last',
      });
    });

    it('the same Card as containingCardId is still the same-section rule (regression guard against always taking the foreign path)', () => {
      const origin = stubOrigin(P);
      expect(
        placementFor(
          subject(startPopSession(descendantsP.key), {
            workphaseId: null,
            position: null,
            origin,
            containingCardId: P,
          }),
          [descendantsP],
        ),
      ).toBe(origin);
    });
  });
});

// Which form the carried copy draws as — a pure read of
// `placementRegion`'s own result, per layer, and across a real pop-in and
// pop-out (not just two isolated `startPopSession` fixtures) so the
// transition itself is covered, not only its two endpoints.
describe('overlayFormFor', () => {
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
    const inCard = { x: 50, y: 100 }; // still inside column A throughout — irrelevant to *which* Card is targeted
    const outsideCard = { x: 500, y: 500 }; // outside every region
    const namedAtP = { anchorId: cardP.attachToCardId, side: 'after' as const };
    const total = tuning.cardZoomDwellMs + tuning.cardPopInDelayMs;

    let s = startPopSession(A.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('short-card');

    // Zoom in to the Card: the *named* relation dropAnchorFor answers with,
    // held through the dwell and the cue — not a hit test on where the
    // cursor physically rests.
    s = step(s, inCard, 0, allRegions, namedAtP);
    s = step(s, inCard, total, allRegions, namedAtP);
    expect(s.contextKey).toBe(cardP.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('stub');

    // Pop back out to the column: the shortCard again, symmetrically.
    s = step(s, outsideCard, total, allRegions);
    s = step(s, outsideCard, total + OUT, allRegions);
    expect(s.contextKey).toBe(A.key);
    expect(overlayFormFor(placementRegion(s, allRegions))).toBe('short-card');
  });
});

// The release-only anchor/bare-container distinction, beside placementFor's
// own mid-drag half.
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
