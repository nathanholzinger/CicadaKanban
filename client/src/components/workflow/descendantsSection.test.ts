// A Card's descendants section: its flat rows, what it draws cut at the last shown level, the overflow
// rows' ids, and the branch a carried Stub takes with it, read through the section's children.

import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { overflowTree } from '../../test/overflowTreeFixture';
import { carriedBranchOf } from '../../lib/hierarchyPlacement';
import {
  EVERY_LEVEL,
  descendantsChildrenOf,
  hierarchyRows,
  overflowOwnerOf,
  overflowRowId,
  sectionEntries,
  shownLevels,
} from './descendantsSection';
import { getAttachedChildrenFrom, type Placement } from './itemListOps';

const item = makeItem;
const placements = (entries: Array<[string, Placement]>) => new Map(entries);

// The whole descendants section as one flat DFS list, for the SortableContext of
// KanbanCard.tsx's section and of HierarchyModal.tsx.
describe('hierarchyRows', () => {
  const items = [
    item('root'),
    item('late', { parentId: 'root', position: 2 }),
    item('early', { parentId: 'root', position: 1 }),
    item('grandchild', { parentId: 'late' }),
  ];
  const childrenOf = (parentId: string) => getAttachedChildrenFrom(items, parentId);

  it('walks every depth, parents before children, in position order', () => {
    const rows = hierarchyRows('root', childrenOf);
    expect(rows.map(r => ({ id: r.item.id, parentId: r.parentId, depth: r.depth }))).toEqual([
      { id: 'early', parentId: 'root', depth: 0 },
      { id: 'late', parentId: 'root', depth: 0 },
      { id: 'grandchild', parentId: 'late', depth: 1 },
    ]);
  });

  it('returns no rows for a card with no attached children', () => {
    expect(hierarchyRows('detached-leaf', childrenOf)).toEqual([]);
  });

  // A `childrenOf` that returns [] for a specific id stops the walk there
  // without needing a real "exclude" set.
  it('never recurses into an id whose childrenOf callback returns none', () => {
    const stopAtLate = (parentId: string) => (parentId === 'late' ? [] : getAttachedChildrenFrom(items, parentId));
    const rows = hierarchyRows('root', stopAtLate);
    expect(rows.map(r => r.item.id)).toEqual(['early', 'late']);
  });
});

describe('shownLevels', () => {
  it('keeps EVERY_LEVEL past any depth', () => {
    expect(EVERY_LEVEL).toBeGreaterThan(1000);
    expect(shownLevels(EVERY_LEVEL)).toBe(EVERY_LEVEL);
  });
});

describe('overflowRowId', () => {
  it("names its owner, and no item's id reads as an overflow row's", () => {
    expect(overflowOwnerOf(overflowRowId('r'))).toBe('r');
    expect(overflowOwnerOf('r')).toBeNull();
    expect(overflowOwnerOf('0c1f8c1e-uuid-like-id')).toBeNull();
  });

  it('is a different id from its owner’s', () => {
    expect(overflowRowId('r')).not.toBe('r');
  });
});

// A Card's section as drawn: cut at the last shown level, with an overflow row for the
// children it hides. The tree: Card P holds A (then Q, which holds R and T) and B. R holds
// R1 (which holds R1a) and R2, and has a Free child F. T has only a Free child G.
describe('sectionEntries', () => {
  const items = overflowTree();
  const rowsOf = (list = items) => hierarchyRows('P', parentId => getAttachedChildrenFrom(list, parentId));
  const shape = (levels: number, activeId?: string, list = items) =>
    sectionEntries(rowsOf(list), levels, activeId).map(e =>
      e.kind === 'item' ? `${e.row.item.id}@${e.row.depth}` : `${e.row.id}@${e.row.depth}×${e.row.count}`,
    );

  it('shows every level down to the last, and an overflow row one level under the row whose children are hidden', () => {
    expect(shape(3)).toEqual(['A@0', 'Q@1', 'R@2', 'overflow:R@3×2', 'T@2', 'B@0']);
  });

  it('counts the owner’s attached children, not their descendants or its Free children', () => {
    const entries = sectionEntries(rowsOf(), 3);
    const overflow = entries.find(e => e.kind === 'overflow');
    expect(overflow?.kind === 'overflow' && overflow.row).toMatchObject({ ownerId: 'R', depth: 3, count: 2 });
  });

  it('draws no overflow row under a last-level row with no attached children, a Free child apart', () => {
    expect(shape(3)).not.toContain('overflow:T@3×1');
    expect(shape(3).filter(s => s.startsWith('overflow'))).toEqual(['overflow:R@3×2']);
  });

  it('shows more, and moves the overflow row, as the level count rises', () => {
    expect(shape(4)).toEqual(['A@0', 'Q@1', 'R@2', 'R1@3', 'overflow:R1@4×1', 'R2@3', 'T@2', 'B@0']);
  });

  it('draws no overflow row once every level shows', () => {
    expect(shape(5)).toEqual(['A@0', 'Q@1', 'R@2', 'R1@3', 'R1a@4', 'R2@3', 'T@2', 'B@0']);
    expect(shape(12)).toEqual(shape(5));
    expect(shape(EVERY_LEVEL)).toEqual(shape(5));
  });

  it('puts the overflow row under a first-level row when one level shows', () => {
    expect(shape(1)).toEqual(['A@0', 'overflow:A@1×1', 'B@0']);
  });

  it('DRAG-7.2: leaves the dragged item out of the count, and draws none when it was the only child', () => {
    expect(shape(3, 'R1')).toEqual(['A@0', 'Q@1', 'R@2', 'overflow:R@3×1', 'T@2', 'B@0']);
    const onlyChild = items.filter(i => i.id !== 'R2');
    expect(shape(3, 'R1', onlyChild)).toEqual(['A@0', 'Q@1', 'R@2', 'T@2', 'B@0']);
  });

  it('draws a section with no rows as none', () => {
    expect(sectionEntries([], 3)).toEqual([]);
  });

  describe('with the branch a carried Stub takes with it', () => {
    const branchShape = (levels: number, activeId: string, branchIds: string[], list = items) =>
      sectionEntries(rowsOf(list), levels, activeId, new Set(branchIds)).map(e =>
        e.kind === 'item' ? `${e.row.item.id}@${e.row.depth}` : `${e.row.id}@${e.row.depth}×${e.row.count}`,
      );

    it('DRAG-4.8, DRAG-7.27, DRAG-8.1: draws none of its rows, and none of the overflow rows they owned', () => {
      // Q carries R and T (R1, R2 and R1a under R). R's overflow row went with R.
      expect(branchShape(3, 'Q', ['R', 'T', 'R1', 'R2', 'R1a'])).toEqual(['A@0', 'Q@1', 'B@0']);
      expect(branchShape(4, 'Q', ['R', 'T', 'R1', 'R2', 'R1a'])).toEqual(['A@0', 'Q@1', 'B@0']);
    });

    it('DRAG-4.8, DRAG-7.27, DRAG-8.1: draws no overflow row for the carried Stub itself when all its children travel', () => {
      // R is at the last shown level: without the branch it has an overflow row of 2.
      expect(shape(3, 'R')).toEqual(['A@0', 'Q@1', 'R@2', 'overflow:R@3×2', 'T@2', 'B@0']);
      expect(branchShape(3, 'R', ['R1', 'R2', 'R1a'])).toEqual(['A@0', 'Q@1', 'R@2', 'T@2', 'B@0']);
    });

    it('DRAG-4.8, DRAG-7.27, DRAG-8.1: keeps every other row, and every other overflow row with its count', () => {
      // A and B each hold a child with a child; the section shows two levels, so each child's
      // overflow row counts one.
      const two = [
        item('P'),
        item('A', { parentId: 'P', position: 1 }),
        item('B', { parentId: 'P', position: 2 }),
        item('A1', { parentId: 'A' }),
        item('B1', { parentId: 'B' }),
        item('A1a', { parentId: 'A1' }),
        item('B1a', { parentId: 'B1' }),
      ];
      expect(shape(2, undefined, two)).toEqual(['A@0', 'A1@1', 'overflow:A1@2×1', 'B@0', 'B1@1', 'overflow:B1@2×1']);
      expect(branchShape(2, 'A', ['A1', 'A1a'], two)).toEqual(['A@0', 'B@0', 'B1@1', 'overflow:B1@2×1']);
    });

    it('draws a carried row that sits past the shown levels as it does without one', () => {
      // R1 is at depth 3, so it is not drawn; it takes R1a, and R's overflow row counts R2 alone.
      expect(branchShape(3, 'R1', ['R1a'])).toEqual(shape(3, 'R1'));
      expect(branchShape(3, 'R1', ['R1a'])).toEqual(['A@0', 'Q@1', 'R@2', 'overflow:R@3×1', 'T@2', 'B@0']);
    });

    it('is the same as no branch for an empty set', () => {
      expect(branchShape(3, 'R1', [])).toEqual(shape(3, 'R1'));
    });
  });
});

// The branch a carried Stub takes with it, as the board reads the tree: through its placement-aware
// attached children. The walk itself is `hierarchyPlacement.test.ts`'s. The tree: Card P holds the
// carried Stub S, and T. S holds S1 (then S1a, then S1a1) and S2, and has a Free child F, which holds a
// Stub FS. T holds only a Free child G.
describe('carriedBranchOf, over the board’s attached children', () => {
  const items = [
    item('P'),
    item('S', { parentId: 'P', position: 1 }),
    item('T', { parentId: 'P', position: 2 }),
    item('S1', { parentId: 'S', position: 1 }),
    item('S2', { parentId: 'S', position: 2 }),
    item('S1a', { parentId: 'S1' }),
    item('S1a1', { parentId: 'S1a' }),
    item('F', { parentId: 'S', isAttached: 0 }),
    item('FS', { parentId: 'F' }),
    item('G', { parentId: 'T', isAttached: 0 }),
  ];
  const branchOf = (id: string, pending = placements([])) =>
    carriedBranchOf(
      id,
      descendantsChildrenOf(parentId => getAttachedChildrenFrom(items, parentId, pending)),
    );

  it('DRAG-8.2, DRAG-8.3, DRAG-8.8: counts the rows past the levels a section shows, as the walk is not cut there', () => {
    // From P, S1a1 is at depth 3: the fourth level, which a section of three levels hides.
    const rows = hierarchyRows('P', parentId => getAttachedChildrenFrom(items, parentId));
    expect(rows.find(r => r.id === 'S1a1')?.depth).toBe(3);
    expect(branchOf('S')?.ids.has('S1a1')).toBe(true);
  });

  it('DRAG-8.2, DRAG-8.3, DRAG-8.8: leaves a Free child out, with everything under it', () => {
    const branch = branchOf('S')!;

    expect(branch.ids.has('F')).toBe(false);
    expect(branch.ids.has('FS')).toBe(false);
    // The two attached children and the two rows under them, nothing of the Free child's.
    expect([branch.children, branch.descendants]).toEqual([2, 4]);
  });

  it('DRAG-8.2, DRAG-8.3, DRAG-8.8: is null for a Stub with no attached descendants, a Free child apart', () => {
    expect(branchOf('T')).toBeNull();
    expect(branchOf('S2')).toBeNull();
  });

  it('DRAG-8.2, DRAG-8.3, DRAG-8.8: holds a row where the board draws it: a pending attach joins the branch, and a pending detach leaves it', () => {
    const branch = branchOf(
      'S',
      placements([
        ['T', { parentId: 'S2', slot: 'last' }],
        ['S1a', { parentId: null, slot: 'last' }],
      ]),
    )!;

    // T is drawn under S2, and S1a is drawn Free, with S1a1 under it.
    expect([...branch.ids].sort()).toEqual(['S1', 'S2', 'T']);
    expect([branch.children, branch.descendants]).toEqual([2, 3]);
  });
});

// The placement library's own `childrenOf` adapter (ids only), fed straight
// into the gap + depth resolution by `descendantsProjection.ts`'s live
// projection — the same `getAttachedChildren`-shaped accessor
// `hierarchyRows` above wraps for rendering, just without resolving back
// to Items.
describe('descendantsChildrenOf', () => {
  const items = [
    item('root'),
    item('late', { parentId: 'root', position: 2 }),
    item('early', { parentId: 'root', position: 1 }),
    item('grandchild', { parentId: 'late' }),
  ];
  const getAttachedChildren = (parentId: string) => getAttachedChildrenFrom(items, parentId);

  it("maps a real parentId to its children's ids, in the same order getAttachedChildren gives them", () => {
    expect(descendantsChildrenOf(getAttachedChildren)('root')).toEqual(['early', 'late']);
    expect(descendantsChildrenOf(getAttachedChildren)('late')).toEqual(['grandchild']);
  });

  it("a null parentId (flattenHierarchy's own root-of-nothing convention) is always empty, never a lookup", () => {
    expect(descendantsChildrenOf(getAttachedChildren)(null)).toEqual([]);
  });
});
