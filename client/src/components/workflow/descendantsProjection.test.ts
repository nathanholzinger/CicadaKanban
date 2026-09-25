import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { DESCENDANTS_INDENT_PX } from '../cardMetrics';
import { classifyDragTargets } from './dragClassification';
import { cardRegionKey, descendantsRegionKey } from './dragRegions';
import { getAttachedChildrenFrom } from './itemListOps';
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
    });
  });

  it("a foreign item enters at the section's last gap, at the last row's depth", () => {
    const foreign = sample({ classification: classifyDragTargets('X', items, 10), originCardId: null });
    expect(advanceProjection(NO_PROJECTION, foreign).projection).toEqual({
      gap: 3,
      depth: 0,
      valid: true,
      resolved: { parentId: P, anchor: { anchorId: 'S3', side: 'after' } },
    });
  });

  it("while held, the depth is the pointer's travel since entry, in indents", () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const tabbed = advanceProjection(entered, held({ pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(tabbed.projection).toMatchObject({ gap: 1, depth: 1, resolved: { parentId: 'S1', anchor: null } });
    expect(tabbed.seed).toBe(entered.seed);
  });

  it('the named row moves the gap; a sample naming none keeps it', () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const moved = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    expect(moved.projection?.gap).toBe(2);
    expect(advanceProjection(moved, held()).projection?.gap).toBe(2);
  });

  it('over the cap the state is still offered, marked invalid', () => {
    // S1 sits at depth 2, so S2 under it would be at depth 3.
    const entered = advanceProjection(NO_PROJECTION, sample({ cap: 2 }));
    expect(entered.projection?.valid).toBe(true);
    const tabbed = advanceProjection(entered, held({ cap: 2, pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(tabbed.projection).toMatchObject({ depth: 1, valid: false });
  });

  it('leaving the section clears it; coming back reseeds at the own slot, wherever the pointer is now', () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const moved = advanceProjection(entered, held({ namedAnchor: { anchorId: 'S3', side: 'after' } }));
    const left = advanceProjection(moved, held({ contextKey: cardRegionKey(P) }));
    expect(left).toEqual(NO_PROJECTION);
    const back = advanceProjection(left, sample({ previousContextKey: cardRegionKey(P), pointerX: START_X + 300 }));
    expect(back.projection).toMatchObject({ gap: 1, depth: 0 });
  });
});

describe('descendantsReleasePlacement', () => {
  it('sends the resolved parent and anchor', () => {
    const { projection } = advanceProjection(NO_PROJECTION, sample());
    expect(descendantsReleasePlacement(projection, P)).toEqual({
      parentId: P,
      slot: { anchorId: 'S1', side: 'after' },
    });
  });

  it("with no anchor, the resolved parent's first child", () => {
    const entered = advanceProjection(NO_PROJECTION, sample());
    const { projection } = advanceProjection(entered, held({ pointerX: START_X + DESCENDANTS_INDENT_PX }));
    expect(descendantsReleasePlacement(projection, P)).toEqual({ parentId: 'S1', slot: 'first' });
  });

  it('writes nothing over the cap, or with no projection', () => {
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
