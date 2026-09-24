import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  getDescendantIds,
  eligibleRows,
  fullChildrenOf,
  resolveGap,
  computeProjection,
  siblingIdsFromAnchor,
  type FlatItem,
} from './projectTreeUtils';
import type { Project } from '../../types';

function project(overrides: Partial<Project> & { id: string }): Project {
  return {
    parentId: null,
    name: overrides.id,
    description: null,
    position: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function flat(id: string, depth: number, parentId: string | null, overrides: Partial<FlatItem> = {}): FlatItem {
  return {
    id,
    depth,
    parentId,
    project: project({ id }),
    hasChildren: false,
    collapsed: false,
    ...overrides,
  };
}

describe('flattenTree', () => {
  it('sorts siblings by position, tie-breaking by createdAt when position is null', () => {
    const r1 = project({ id: 'r1', position: 2, createdAt: 100 });
    const r2 = project({ id: 'r2', position: 1, createdAt: 200 });
    const result = flattenTree([r1, r2], new Set());
    expect(result.map(i => i.id)).toEqual(['r2', 'r1']);
  });

  it('falls back to createdAt ordering when position is null for both siblings', () => {
    const c1 = project({ id: 'c1', position: null, createdAt: 50 });
    const c2 = project({ id: 'c2', position: null, createdAt: 10 });
    const result = flattenTree([c1, c2], new Set());
    expect(result.map(i => i.id)).toEqual(['c2', 'c1']);
  });

  it('nests children depth-first under their parent and sets hasChildren', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => ({ id: i.id, depth: i.depth, parentId: i.parentId }))).toEqual([
      { id: 'root', depth: 0, parentId: null },
      { id: 'child', depth: 1, parentId: 'root' },
    ]);
    expect(result[0].hasChildren).toBe(true);
  });

  it('collapses a project (excludes its descendants) when its id is absent from expandedIds', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const result = flattenTree([root, child], new Set()); // root not expanded
    expect(result.map(i => i.id)).toEqual(['root']);
    expect(result[0].collapsed).toBe(true);
  });

  it('expands a project (includes its descendants) when its id is present in expandedIds', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const result = flattenTree([root, child], new Set(['root']));
    expect(result.map(i => i.id)).toEqual(['root', 'child']);
    expect(result[0].collapsed).toBe(false);
  });
});

describe('getDescendantIds', () => {
  it('returns an empty set for a leaf project', () => {
    const leaf = project({ id: 'leaf' });
    expect(getDescendantIds('leaf', [leaf])).toEqual(new Set());
  });

  it('returns children and grandchildren, excluding the project itself and unrelated siblings', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const grandchild = project({ id: 'grandchild', parentId: 'child' });
    const unrelated = project({ id: 'unrelated' });

    const result = getDescendantIds('root', [root, child, grandchild, unrelated]);
    expect(result).toEqual(new Set(['child', 'grandchild']));
  });
});

// Shared fixture: A(depth0) -> [B(depth1), C(depth1)], D(depth0)
const items = [flat('A', 0, null), flat('B', 1, 'A'), flat('C', 1, 'A'), flat('D', 0, null)];

describe('eligibleRows', () => {
  it('is the flat list minus the excluded ids, still depth/parentId-correct', () => {
    const rows = eligibleRows(items, new Set());
    expect(rows).toEqual([
      { id: 'A', parentId: null, depth: 0 },
      { id: 'B', parentId: 'A', depth: 1 },
      { id: 'C', parentId: 'A', depth: 1 },
      { id: 'D', parentId: null, depth: 0 },
    ]);
  });

  // Story 6 decision 5 (fixes difference 2): dragging A excludes it and its
  // whole subtree from candidacy, even though B/C still render (dimmed).
  it('excludes the active project and its descendants', () => {
    const rows = eligibleRows(items, new Set(['A', 'B', 'C']));
    expect(rows.map(r => r.id)).toEqual(['D']);
  });
});

describe('resolveGap', () => {
  const rows = eligibleRows(items, new Set());

  it('an eligible over id resolves the ordinary before/after gap', () => {
    expect(resolveGap(items, rows, new Set(), 'B', 'before')).toBe(1);
    expect(resolveGap(items, rows, new Set(), 'C', 'after')).toBe(3);
  });

  // Story 6 decision 5: dragging A, hovering over its own dimmed descendant
  // B resolves to the single gap the whole A/B/C block collapsed to — not a
  // dead zone (the old "nulls the projection" behavior).
  it('an excluded (dimmed descendant) over id resolves to the gap the whole dragged block collapsed to', () => {
    const excludeA = new Set(['A', 'B', 'C']);
    const rowsWithoutA = eligibleRows(items, excludeA);
    expect(resolveGap(items, rowsWithoutA, excludeA, 'B', 'before')).toBe(0);
    expect(resolveGap(items, rowsWithoutA, excludeA, 'C', 'after')).toBe(0);
  });

  it('falls back to gap 0 when the dragged block has no eligible predecessor', () => {
    // Drag D itself (imagine D were first and had descendants) — no row
    // precedes it, so nothing eligible comes before the block.
    const soloItems = [flat('D', 0, null), flat('D1', 1, 'D')];
    const excludeD = new Set(['D', 'D1']);
    const rowsWithoutD = eligibleRows(soloItems, excludeD);
    expect(resolveGap(soloItems, rowsWithoutD, excludeD, 'D1', 'before')).toBe(0);
  });
});

// A `childrenOf` over the fixture's real tree (A -> B, C; D), for
// `computeProjection`'s `resolvePlacement` calls — same shape
// `fullChildrenOf(projects)` returns, spelled directly since none of these
// cases involve a collapsed node.
function childrenOf(id: string | null): readonly string[] {
  if (id === null) return ['A', 'D'];
  if (id === 'A') return ['B', 'C'];
  return [];
}

describe('computeProjection', () => {
  const rows = eligibleRows(items, new Set());

  it('resolves the parent by walking up to the ancestor at the projected depth', () => {
    const gap = resolveGap(items, rows, new Set(), 'D', 'before'); // between C and D
    const result = computeProjection(rows, gap, 1, 0, childrenOf, new Set());
    expect(result).toEqual({ depth: 1, placement: { parentId: 'A', anchor: { id: 'C', side: 'after' } } });
  });

  it('clamps projected depth to the gap’s own hi (tabbing far right)', () => {
    const gap = resolveGap(items, rows, new Set(), 'D', 'before');
    const result = computeProjection(rows, gap, 1, 14 * 10, childrenOf, new Set()); // large rightward drag
    expect(result).toEqual({ depth: 2, placement: { parentId: 'C', anchor: null } });
  });

  it('clamps projected depth to the gap’s own lo (tabbing far left) and resolves the root parent', () => {
    const gap = resolveGap(items, rows, new Set(), 'D', 'after'); // below everything
    const result = computeProjection(rows, gap, 0, -14 * 10, childrenOf, new Set()); // large leftward drag
    expect(result).toEqual({ depth: 0, placement: { parentId: null, anchor: { id: 'D', side: 'after' } } });
  });
});

describe('fullChildrenOf — sidebar difference 6 (a collapsed Top)', () => {
  it('returns a project’s real children regardless of collapse state', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const childrenOfReal = fullChildrenOf([root, child]);
    expect(childrenOfReal('root')).toEqual(['child']);
  });

  // The bug found 2026-09-23: `root` collapsed means `child` never enters
  // `flatItems`/`eligibleRows`, so the gap right after `root` (Top + 1,
  // "root's first child") has no next row to read a first child off of.
  // `computeProjection` must still resolve `child` as the anchor, using
  // `fullChildrenOf`, not `eligibleRows`' own map.
  it('a collapsed Top still resolves Top + 1 to its real first child', () => {
    const root = project({ id: 'root' });
    const child = project({ id: 'child', parentId: 'root' });
    const sibling = project({ id: 'sibling' });
    const flatCollapsed = flattenTree([root, child, sibling], new Set()); // root collapsed
    expect(flatCollapsed.map(i => i.id)).toEqual(['root', 'sibling']); // child never rendered

    const rows = eligibleRows(flatCollapsed, new Set());
    const childrenOfReal = fullChildrenOf([root, child, sibling]);
    const gap = resolveGap(flatCollapsed, rows, new Set(), 'sibling', 'before'); // between root (Top) and sibling (Bottom)
    const result = computeProjection(rows, gap, 0, 14, childrenOfReal, new Set()); // one tab right of root

    expect(result).toEqual({ depth: 1, placement: { parentId: 'root', anchor: { id: 'child', side: 'before' } } });
  });
});

describe('siblingIdsFromAnchor', () => {
  it('an "after" anchor is the previous sibling; "before" is the next', () => {
    expect(siblingIdsFromAnchor({ id: 'A', side: 'after' })).toEqual({ prevId: 'A', nextId: null });
    expect(siblingIdsFromAnchor({ id: 'B', side: 'before' })).toEqual({ prevId: null, nextId: 'B' });
  });

  it('no anchor (the sole child of its parent) is neither', () => {
    expect(siblingIdsFromAnchor(null)).toEqual({ prevId: null, nextId: null });
  });
});
