import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { DESCENDANTS_INDENT_PX } from '../cardMetrics';
import { classifyDragTargets } from './dragClassification';
import { cardRegionKey, descendantsRegionKey } from './dragRegions';
import { getAttachedChildrenFrom, overflowRowId } from './itemListOps';
import {
  NO_PROJECTION,
  advanceProjection,
  descendantsReleasePlacement,
  sameProjection,
  type ProjectionSample,
} from './descendantsProjection';

// Card P's section, every row at depth 0:
//   S1
//   S2
//   S3
// plus a Free Card X from outside it.
const P = 'P';
const items = [
  makeItem(P),
  makeItem('S1', { parentId: P, position: 1 }),
  makeItem('S2', { parentId: P, position: 2 }),
  makeItem('S3', { parentId: P, position: 3 }),
  makeItem('X'),
];
const getAttachedChildren = (parentId: string) => getAttachedChildrenFrom(items, parentId);
const section = descendantsRegionKey(P);
const START_X = 100;

// A sample of S2's own drag, held in P's section (entered this sample,
// unless `previousContextKey` says otherwise), with any field overridden.
function sample(fields: Partial<ProjectionSample> & { cap?: number } = {}): ProjectionSample {
  const { cap = 10, ...rest } = fields;
  return {
    previousContextKey: null,
    contextKey: section,
    classification: classifyDragTargets('S2', items, cap),
    originCardId: P,
    namedAnchor: null,
    pointerX: START_X,
    getAttachedChildren,
    sectionLevels: 3,
    ...rest,
  };
}

const held = (fields: Partial<ProjectionSample> & { cap?: number } = {}) =>
  sample({ previousContextKey: section, ...fields });

describe('advanceProjection', () => {
  it("a Stub's pickup seeds at its own slot and depth, so resting still resolves to where it came from", () => {
    const { projection } = advanceProjection(NO_PROJECTION, sample());
    expect(projection).toEqual({
      gap: 1,
      depth: 0,
      valid: true,
      resolved: { parentId: P, anchor: { anchorId: 'S1', side: 'after' } },
      atOwnSlot: true,
      slotHidden: false,
    });
  });

  it("DRAG-4.30: a foreign item enters at the section's last gap as the Card's last child, even under a nested last row", () => {
    // S3 gains a child, so the last row is nested at depth 1.
    const nested = [...items, makeItem('S3a', { parentId: 'S3', position: 1 })];
    const foreign = sample({
      classification: classifyDragTargets('X', nested, 10),
      originCardId: null,
      getAttachedChildren: parentId => getAttachedChildrenFrom(nested, parentId),
    });
    const { projection } = advanceProjection(NO_PROJECTION, foreign);
    expect(projection).toEqual({
      gap: 4,
      depth: 0,
      valid: true,
      resolved: { parentId: P, anchor: { anchorId: 'S3', side: 'after' } },
      atOwnSlot: false,
      slotHidden: false,
    });
    // A release right away commits the Card layer's own attach: last among P's children.
    expect(descendantsReleasePlacement(projection, P)).toEqual({
      parentId: P,
      slot: { anchorId: 'S3', side: 'after' },
    });
  });

  it("while held, the depth is the pointer's travel since entry, in indents", () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const tabbed = advanceProjection(entered, held({ pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(tabbed.projection).toMatchObject({ gap: 1, depth: 1, resolved: { parentId: 'S1', anchor: null } });
    expect(tabbed.seed).toBe(entered.seed);
  });

  it('DRAG-4.8: the named row moves the gap; a sample naming none keeps it', () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const moved = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    expect(moved.projection?.gap).toBe(2);
    expect(advanceProjection(moved, held()).projection?.gap).toBe(2);
  });

  it('DRAG-4.18: over the cap the state is still offered, marked invalid', () => {
    // S1 sits at depth 2, so S2 under it would be at depth 3.
    const entered = advanceProjection(NO_PROJECTION, sample({ cap: 2 }));
    expect(entered.projection?.valid).toBe(true);
    const tabbed = advanceProjection(entered, held({ cap: 2, pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(tabbed.projection).toMatchObject({ depth: 1, valid: false });
  });

  it('DRAG-4.30: leaving the section clears it; coming back reseeds at the own slot, wherever the pointer is now', () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const moved = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    const left = advanceProjection(moved, held({ contextKey: cardRegionKey(P) }));
    expect(left).toEqual(NO_PROJECTION);
    const back = advanceProjection(left, sample({ previousContextKey: cardRegionKey(P), pointerX: START_X + 300 }));
    expect(back.projection).toMatchObject({ gap: 1, depth: 0 });
    expect(descendantsReleasePlacement(back.projection, P)).toBeNull();
  });
});

// A section that draws fewer levels than it holds. Card P's tree, depth below the Card in
// brackets:
//   A (0)
//     Q (1)
//       R (2)            R's children are hidden when three levels show
//         R1 (3)
//           R1a (4)
//         R2 (3)
//       T (2)            T has only a Free child, G
//   B (0)
// plus a Free Card X from outside, and R's Free child F.
describe('advanceProjection under a cut-off section', () => {
  const deep = [
    makeItem(P),
    makeItem('A', { parentId: P, position: 1 }),
    makeItem('B', { parentId: P, position: 2 }),
    makeItem('Q', { parentId: 'A' }),
    makeItem('R', { parentId: 'Q', position: 1 }),
    makeItem('T', { parentId: 'Q', position: 2 }),
    makeItem('R1', { parentId: 'R', position: 1 }),
    makeItem('R2', { parentId: 'R', position: 2 }),
    makeItem('R1a', { parentId: 'R1' }),
    makeItem('F', { parentId: 'R', isAttached: 0 }),
    makeItem('G', { parentId: 'T', isAttached: 0 }),
    makeItem('X'),
  ];
  const deepSample = (fields: Partial<ProjectionSample> = {}): ProjectionSample => ({
    previousContextKey: null,
    contextKey: section,
    classification: classifyDragTargets('X', deep, 20),
    originCardId: null,
    namedAnchor: null,
    pointerX: START_X,
    getAttachedChildren: parentId => getAttachedChildrenFrom(deep, parentId),
    sectionLevels: 3,
    ...fields,
  });
  // X enters at the last gap, then the ghost is named a neighbor, with the pointer `tabs`
  // indents from where it entered.
  function hover(anchor: ProjectionSample['namedAnchor'], tabs = 0, fields: Partial<ProjectionSample> = {}) {
    const entered = advanceProjection(NO_PROJECTION, deepSample(fields));
    return advanceProjection(
      entered,
      deepSample({
        previousContextKey: section,
        namedAnchor: anchor,
        pointerX: START_X + tabs * DESCENDANTS_INDENT_PX,
        ...fields,
      }),
    ).projection;
  }
  const R_OVERFLOW = overflowRowId('R');

  it('DRAG-7.3: between R and its overflow row, one state: R’s first child', () => {
    for (const anchor of [
      { anchorId: 'R', side: 'after' },
      { anchorId: R_OVERFLOW, side: 'before' },
    ] as const) {
      for (const tabs of [-5, 0, 5]) {
        expect(hover(anchor, tabs), `${anchor.anchorId} ${anchor.side} ${tabs}`).toMatchObject({
          gap: 3,
          depth: 3,
          valid: true,
          resolved: { parentId: 'R', anchor: { anchorId: 'R1', side: 'before' } },
        });
      }
    }
  });

  it('DRAG-7.4: below R’s overflow row, R’s last child, or tabbed left R’s next sibling, and none right of the row', () => {
    for (const anchor of [
      { anchorId: R_OVERFLOW, side: 'after' },
      { anchorId: 'T', side: 'before' },
    ] as const) {
      // The pointer's tabs are from depth 0, where X entered. Level 3 is the overflow row's own.
      const last = { gap: 6, depth: 3, resolved: { parentId: 'R', anchor: { anchorId: 'R2', side: 'after' } } };
      expect(hover(anchor, 3), anchor.anchorId).toMatchObject(last);
      // Pushed right, it stays at the overflow row's level.
      expect(hover(anchor, 9), anchor.anchorId).toMatchObject(last);
      // One tab left: R’s next sibling, after R’s whole subtree, hidden levels included.
      const sibling = { depth: 2, resolved: { parentId: 'Q', anchor: { anchorId: 'R', side: 'after' } } };
      expect(hover(anchor, 2), anchor.anchorId).toMatchObject(sibling);
      // T is Bottom, at the level of R, so nothing shallower is offered.
      expect(hover(anchor, -9), anchor.anchorId).toMatchObject(sibling);
    }
  });

  it('DRAG-7.4: with no row below it, the states run from the top level to R’s last child, and no further', () => {
    const withoutT = deep.filter(i => i.id !== 'T');
    const anchor = { anchorId: R_OVERFLOW, side: 'after' } as const;
    const getAttachedChildren = (parentId: string) => getAttachedChildrenFrom(withoutT, parentId);
    expect(hover(anchor, 0, { getAttachedChildren })).toMatchObject({
      depth: 0,
      resolved: { parentId: P, anchor: { anchorId: 'A', side: 'after' } },
    });
    expect(hover(anchor, 1, { getAttachedChildren })).toMatchObject({
      depth: 1,
      resolved: { parentId: 'A', anchor: { anchorId: 'Q', side: 'after' } },
    });
    expect(hover(anchor, 3, { getAttachedChildren })).toMatchObject({
      depth: 3,
      resolved: { parentId: 'R', anchor: { anchorId: 'R2', side: 'after' } },
    });
    expect(hover(anchor, 9, { getAttachedChildren })).toMatchObject({ depth: 3 });
  });

  it('DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only child', () => {
    const anchor = { anchorId: 'T', side: 'after' } as const;
    expect(hover(anchor, 2)).toMatchObject({ gap: 7, depth: 2 });
    const tabbed = hover(anchor, 3);
    expect(tabbed).toMatchObject({ depth: 3, valid: true, resolved: { parentId: 'T', anchor: null } });
    expect(descendantsReleasePlacement(tabbed, P)).toEqual({ parentId: 'T', slot: 'first' });
    // Pushed on right, no deeper than that.
    expect(hover(anchor, 9)).toMatchObject({ depth: 3, resolved: { parentId: 'T', anchor: null } });
  });

  it('reads an owner that is no row as no row named: below everything', () => {
    expect(hover({ anchorId: overflowRowId('gone'), side: 'before' })).toMatchObject({ gap: 8, depth: 0 });
  });

  // A Stub picked up in the hierarchy modal and pulled back into the section: its own slot may be
  // behind an overflow row, where the section can't draw a ghost.
  describe('a Stub whose own slot the section does not draw', () => {
    const own = (id: string, fields: Partial<ProjectionSample> = {}): ProjectionSample => ({
      ...deepSample({ classification: classifyDragTargets(id, deep, 20), originCardId: P }),
      ...fields,
    });

    it('DRAG-7.6: comes in as an item from outside does: the last gap, as the Card’s last child', () => {
      const { projection } = advanceProjection(NO_PROJECTION, own('R1'));
      expect(projection).toEqual({
        gap: 6,
        depth: 0,
        valid: true,
        resolved: { parentId: P, anchor: { anchorId: 'B', side: 'after' } },
        atOwnSlot: false,
        slotHidden: true,
      });
      // A release right away moves it there.
      expect(descendantsReleasePlacement(projection, P)).toEqual({
        parentId: P,
        slot: { anchorId: 'B', side: 'after' },
      });
    });

    it('DRAG-7.6: stays one when the ghost previews at the Card’s last child, so a release there still writes', () => {
      // After the first sample its ghost is previewed as P's last child, drawn at depth 0.
      const previewed = new Map([['R1', { parentId: P, slot: 'last' as const }]]);
      const getAttachedChildren = (parentId: string) => getAttachedChildrenFrom(deep, parentId, previewed);
      const entered = advanceProjection(NO_PROJECTION, own('R1'));
      const held = advanceProjection(entered, own('R1', { previousContextKey: section, getAttachedChildren }));
      expect(held.projection).toMatchObject({ gap: 6, depth: 0, atOwnSlot: false, slotHidden: true });
      expect(descendantsReleasePlacement(held.projection, P)).not.toBeNull();
    });

    it('DRAG-7.6: a Stub whose slot the section draws starts in its own slot, as before', () => {
      // R is at the last shown level, so its own slot is drawn.
      const { projection } = advanceProjection(NO_PROJECTION, own('R'));
      expect(projection).toMatchObject({ gap: 2, depth: 2, atOwnSlot: true, slotHidden: false });
    });

    it('in the hierarchy modal, which draws every level, its own slot is its own', () => {
      const { projection } = advanceProjection(NO_PROJECTION, own('R1', { sectionLevels: Infinity }));
      expect(projection).toMatchObject({ gap: 3, depth: 3, atOwnSlot: true, slotHidden: false });
    });
  });

  it('shows no overflow row, and clamps nothing, once the levels it holds are all shown', () => {
    // With five levels shown, the gap after R2 offers R2's first child at depth 4; with three it stops at 3.
    const anchor = { anchorId: 'R2', side: 'after' } as const;
    expect(hover(anchor, 9, { sectionLevels: 5 })).toMatchObject({ depth: 4 });
    expect(hover(anchor, 9)).toMatchObject({ depth: 3 });
  });
});

describe('descendantsReleasePlacement', () => {
  it('sends the resolved parent and anchor', () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const { projection } = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    expect(descendantsReleasePlacement(projection, P)).toEqual({
      parentId: P,
      slot: { anchorId: 'S3', side: 'after' },
    });
  });

  it("DRAG-4.29, DRAG-4.30: writes nothing at the Stub's own gap and depth, however it got back there", () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    expect(descendantsReleasePlacement(entered.projection, P)).toBeNull();
    // Away to another gap and back again: its own slot, so still nothing.
    const moved = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    const back = advanceProjection(moved, held({ namedAnchor: { anchorId: 'S1', side: 'after' } }));
    expect(back.projection).toMatchObject({ gap: 1, depth: 0 });
    expect(descendantsReleasePlacement(back.projection, P)).toBeNull();
    // Its own gap at another depth is a real move.
    const tabbed = advanceProjection(entered, held({ pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(descendantsReleasePlacement(tabbed.projection, P)).toEqual({ parentId: 'S1', slot: 'first' });
  });

  it("DRAG-4.9: with no anchor, the resolved parent's first child", () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const { projection } = advanceProjection(entered, held({ pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(descendantsReleasePlacement(projection, P)).toEqual({ parentId: 'S1', slot: 'first' });
  });

  it('DRAG-4.18: writes nothing over the cap, or with no projection', () => {
    const entered = advanceProjection(NO_PROJECTION, sample({ cap: 2 }));
    const { projection } = advanceProjection(entered, held({ cap: 2, pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(descendantsReleasePlacement(projection, P)).toBeNull();
    expect(descendantsReleasePlacement(null, P)).toBeNull();
  });
});

describe('sameProjection', () => {
  it('compares what the projection draws: gap, depth, validity', () => {
    const { projection } = advanceProjection(NO_PROJECTION, sample());
    expect(sameProjection(projection, projection && { ...projection })).toBe(true);
    expect(sameProjection(projection, projection && { ...projection, depth: 1 })).toBe(false);
    expect(sameProjection(null, null)).toBe(true);
    expect(sameProjection(projection, null)).toBe(false);
  });
});
