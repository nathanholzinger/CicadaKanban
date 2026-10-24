import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  fullChildrenOf,
  resolveGap,
  siblingIdsFromAnchor,
  INDENT_WIDTH,
  type FlatItem,
} from './projectTreeUtils';
import { computeProjection, toRows } from '../../lib/hierarchyPlacement';
import { makeProject } from '../../test/projectFixture';

function flat(id: string, depth: number, parentId: string | null, overrides: Partial<FlatItem> = {}): FlatItem {
  return {
    id,
    depth,
    parentId,
    project: makeProject(id),
    hasChildren: false,
    collapsed: false,
    ...overrides,
  };
}

describe('flattenTree', () => {
  it('sorts siblings by position, then by createdAt on a tie', () => {
    const r1 = makeProject('r1', { position: 2, createdAt: 100 });
    const r2 = makeProject('r2', { position: 1, createdAt: 200 });
    const tied = makeProject('tied', { position: 2, createdAt: 50 });
    const result = flattenTree([r1, r2, tied], new Set());
    expect(result.map(i => i.id)).toEqual(['r2', 'tied', 'r1']);
  });

  it('counts a missing position as 0, ahead of a positive one whatever its createdAt', () => {
    const a = makeProject('a', { position: 0.5, createdAt: 1 });
    const n = makeProject('n', { position: null, createdAt: 999 });
    const b = makeProject('b', { position: 2, createdAt: 2 });
    expect(flattenTree([a, b, n], new Set()).map(i => i.id)).toEqual(['n', 'a', 'b']);
  });

  it('falls back to createdAt ordering when position is null for both siblings', () => {
    const c1 = makeProject('c1', { position: null, createdAt: 50 });
    const c2 = makeProject('c2', { position: null, createdAt: 10 });
    const result = flattenTree([c1, c2], new Set());
    expect(result.map(i => i.id)).toEqual(['c2', 'c1']);
  });

  it('nests children depth-first under their parent and sets hasChildren', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => ({ id: i.id, depth: i.depth, parentId: i.parentId }))).toEqual([
      { id: 'root', depth: 0, parentId: null },
      { id: 'child', depth: 1, parentId: 'root' },
    ]);
    expect(result[0].hasChildren).toBe(true);
  });

  it('collapses a project (excludes its descendants) when its id is absent from expandedIds', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set()); // root not expanded
    expect(result.map(i => i.id)).toEqual(['root']);
    expect(result[0].collapsed).toBe(true);
  });

  it('expands a project (includes its descendants) when its id is present in expandedIds', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => i.id)).toEqual(['root', 'child']);
    expect(result[0].collapsed).toBe(false);
  });
});

// Shared fixture: A(depth0) -> [B(depth1), C(depth1)], D(depth0)
const items = [flat('A', 0, null), flat('B', 1, 'A'), flat('C', 1, 'A'), flat('D', 0, null)];

describe('resolveGap', () => {
  const rows = toRows(items);

  it('an eligible over id resolves the ordinary before/after gap', () => {
    expect(resolveGap(items, rows, new Set(), 'B', 'before')).toBe(1);
    expect(resolveGap(items, rows, new Set(), 'C', 'after')).toBe(3);
  });

  // Dragging A, hovering over its own dimmed descendant B resolves to the
  // single gap the whole A/B/C block collapsed to — never a dead zone.
  it('an excluded (dimmed descendant) over id resolves to the gap the whole dragged block collapsed to', () => {
    const excludeA = new Set(['A', 'B', 'C']);
    const rowsWithoutA = toRows(items, excludeA);
    expect(resolveGap(items, rowsWithoutA, excludeA, 'B', 'before')).toBe(0);
    expect(resolveGap(items, rowsWithoutA, excludeA, 'C', 'after')).toBe(0);
  });

  it('falls back to gap 0 when the dragged block has no eligible predecessor', () => {
    // Drag D, which is first and has a descendant — no row precedes it, so
    // nothing eligible comes before the block.
    const soloItems = [flat('D', 0, null), flat('D1', 1, 'D')];
    const excludeD = new Set(['D', 'D1']);
    const rowsWithoutD = toRows(soloItems, excludeD);
    expect(resolveGap(soloItems, rowsWithoutD, excludeD, 'D1', 'before')).toBe(0);
  });
});

describe('TREE-1.5: fullChildrenOf — a collapsed Top', () => {
  it('returns a project’s real children regardless of collapse state', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const childrenOfReal = fullChildrenOf([root, child]);
    expect(childrenOfReal('root')).toEqual(['child']);
  });

  // `root` collapsed means `child` never enters `flatItems`, or the rows made
  // from it, so the gap right after `root` (Top + 1, "root's first child") has
  // no next row to read a first child off of. `computeProjection` must still
  // resolve `child` as the anchor, using `fullChildrenOf`, not the rows.
  it('a collapsed Top still resolves Top + 1 to its real first child', () => {
    const root = makeProject('root');
    const child = makeProject('child', { parentId: 'root' });
    const sibling = makeProject('sibling');
    const flatCollapsed = flattenTree([root, child, sibling], new Set()); // root collapsed
    expect(flatCollapsed.map(i => i.id)).toEqual(['root', 'sibling']); // child never rendered

    const rows = toRows(flatCollapsed);
    const childrenOfReal = fullChildrenOf([root, child, sibling]);
    const gap = resolveGap(flatCollapsed, rows, new Set(), 'sibling', 'before'); // between root (Top) and sibling (Bottom)
    const result = computeProjection(rows, gap, 0, 14, INDENT_WIDTH, null, childrenOfReal, new Set()); // one tab right of root

    expect(result).toEqual({
      depth: 1,
      placement: { parentId: 'root', anchor: { anchorId: 'child', side: 'before' } },
    });
  });
});

describe('siblingIdsFromAnchor', () => {
  it('an "after" anchor is the previous sibling; "before" is the next', () => {
    expect(siblingIdsFromAnchor({ anchorId: 'A', side: 'after' })).toEqual({ prevId: 'A', nextId: null });
    expect(siblingIdsFromAnchor({ anchorId: 'B', side: 'before' })).toEqual({ prevId: null, nextId: 'B' });
  });

  it('no anchor (the sole child of its parent) is neither', () => {
    expect(siblingIdsFromAnchor(null)).toEqual({ prevId: null, nextId: null });
  });
});
