import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  getDescendantIds,
  computeProjection,
  findPrevSibling,
  findNextSibling,
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

describe('computeProjection', () => {
  // Shared fixture: A(depth0) -> [B(depth1), C(depth1)], D(depth0)
  const items = [flat('A', 0, null), flat('B', 1, 'A'), flat('C', 1, 'A'), flat('D', 0, null)];

  it('resolves the parent by walking backward to the nearest item at projectedDepth - 1', () => {
    const active = flat('C', 1, 'A');
    const result = computeProjection(items, active, 2, 0);
    expect(result).toEqual({ depth: 1, parentId: 'A' });
  });

  it('clamps projected depth to previousItem.depth + 1 (max)', () => {
    const active = flat('C', 1, 'A');
    const result = computeProjection(items, active, 2, 14 * 10); // large rightward drag
    expect(result).toEqual({ depth: 2, parentId: 'B' });
  });

  it('clamps projected depth to nextItem.depth (min) and reports a null parent at depth 0', () => {
    const active = flat('D', 0, null);
    const result = computeProjection(items, active, 3, -14 * 10); // large leftward drag
    expect(result).toEqual({ depth: 0, parentId: null });
  });
});

describe('findPrevSibling / findNextSibling', () => {
  const items = [flat('A', 0, null), flat('B', 1, 'A'), flat('C', 1, 'A'), flat('D', 0, null)];

  it('findPrevSibling finds the nearest match at the same depth/parent', () => {
    expect(findPrevSibling(items, 2, { depth: 1, parentId: 'A' })).toEqual(items[1]);
  });

  it('findPrevSibling returns null after passing a shallower-depth item', () => {
    expect(findPrevSibling(items, 1, { depth: 1, parentId: 'A' })).toBeNull();
  });

  it('findNextSibling finds the nearest match starting at overIndex, skipping deeper items', () => {
    expect(findNextSibling(items, 1, { depth: 0, parentId: null })).toEqual(items[3]);
  });

  it('findNextSibling returns null after passing a shallower-depth item', () => {
    expect(findNextSibling(items, 3, { depth: 1, parentId: 'A' })).toBeNull();
  });

  it('findNextSibling returns null when no sibling exists in range', () => {
    expect(findNextSibling(items, 4, { depth: 0, parentId: null })).toBeNull();
  });
});
