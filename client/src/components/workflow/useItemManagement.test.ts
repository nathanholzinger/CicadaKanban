import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import {
  getWorkphaseItemsFrom,
  getMergedColumnItemsFrom,
  getAttachedChildrenFrom,
  computeChildCounts,
  removeItemAndDescendants,
} from './useItemManagement';

// positionScope is server-computed in production (never hand-set by a
// caller) — mirror that here from isAttached/parentId so these fixtures
// stay consistent with real API data instead of needing every test to
// separately track two things that always agree in practice.
function item(id: string, overrides: Partial<Item> = {}): Item {
  const isAttached = overrides.isAttached ?? 1;
  const parentId = overrides.parentId ?? null;
  return {
    id,
    type: null,
    parentId,
    projectId: 'p1',
    workphaseId: 'todo',
    title: `Item ${id}`,
    description: null,
    position: null,
    assigneeType: null,
    agentId: null,
    isAttached,
    createdAt: 0,
    updatedAt: 0,
    completedAt: null,
    positionScope: isAttached && parentId ? 'attached-siblings' : 'workflow',
    ...overrides,
  };
}

describe('getWorkphaseItemsFrom', () => {
  const items = [
    item('root', { position: 2 }),
    item('first', { position: 1 }),
    item('attached-child', { parentId: 'root', position: 3 }),
    item('detached-child', { parentId: 'root', position: 4, isAttached: 0 }),
    item('elsewhere', { workphaseId: 'done' }),
    item('other-project', { projectId: 'p2', position: 5 }),
  ];

  it('excludes attached children but keeps detached ones, sorted by position', () => {
    const result = getWorkphaseItemsFrom(items, 'todo');
    expect(result.map(i => i.id)).toEqual(['first', 'root', 'detached-child', 'other-project']);
  });

  it('applies the project filter when given', () => {
    const result = getWorkphaseItemsFrom(items, 'todo', 'p1');
    expect(result.map(i => i.id)).toEqual(['first', 'root', 'detached-child']);
  });

  it('breaks an exact position tie by createdAt, oldest first', () => {
    const tied = [
      item('newer', { position: 1, createdAt: 200 }),
      item('older', { position: 1, createdAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(tied, 'todo').map(i => i.id)).toEqual(['older', 'newer']);
  });

  it('sorts by completedAt instead of position for a terminal workphase (Epic 3.2 Part 6)', () => {
    const done = [
      item('shipped-later', { position: null, completedAt: 200 }),
      item('shipped-first', { position: null, completedAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(done, 'todo', undefined, true).map(i => i.id)).toEqual(['shipped-first', 'shipped-later']);
  });
});

describe('getMergedColumnItemsFrom', () => {
  const items = [
    item('todo-2', { workphaseId: 'todo', position: 2 }),
    item('todo-1', { workphaseId: 'todo', position: 1 }),
    item('review-1', { workphaseId: 'review', position: 1.5 }), // interleaves between todo-1 and todo-2
    item('elsewhere', { workphaseId: 'done' }),
    item('attached-child', { workphaseId: 'todo', parentId: 'todo-1', position: 0.5 }),
    item('other-project', { workphaseId: 'review', projectId: 'p2', position: 0.1 }),
  ];

  it('union-sorts across the covered workphases, allowing genuine interleaving', () => {
    // Scoped to p1 so other-project's tiny position doesn't also need
    // accounting for here — that's covered separately below.
    const result = getMergedColumnItemsFrom(items, ['todo', 'review'], 'p1');
    expect(result.map(i => i.id)).toEqual(['todo-1', 'review-1', 'todo-2']);
  });

  it('excludes attached children and workphases outside the covered set', () => {
    const result = getMergedColumnItemsFrom(items, ['todo', 'review']).map(i => i.id);
    expect(result).not.toContain('attached-child');
    expect(result).not.toContain('elsewhere');
  });

  it('applies the project filter when given', () => {
    const result = getMergedColumnItemsFrom(items, ['todo', 'review'], 'p1').map(i => i.id);
    expect(result).not.toContain('other-project');
  });

  it('sorts by completedAt instead of position when the covered set is terminal', () => {
    const done = [
      item('a', { workphaseId: 'done1', position: null, completedAt: 200 }),
      item('b', { workphaseId: 'done2', position: null, completedAt: 100 }),
    ];
    expect(getMergedColumnItemsFrom(done, ['done1', 'done2'], undefined, true).map(i => i.id)).toEqual(['b', 'a']);
  });
});

describe('getAttachedChildrenFrom', () => {
  const items = [
    item('root'),
    item('late', { parentId: 'root', position: 2 }),
    item('early', { parentId: 'root', position: 1 }),
    item('detached', { parentId: 'root', isAttached: 0 }),
    item('grandchild', { parentId: 'late' }),
  ];

  it('returns only attached direct children, sorted by position', () => {
    expect(getAttachedChildrenFrom(items, 'root').map(i => i.id)).toEqual(['early', 'late']);
  });

  it('returns an empty list for an item with no attached children', () => {
    expect(getAttachedChildrenFrom(items, 'detached')).toEqual([]);
  });
});

// Regression coverage for audit Finding #15: deleting an item previously
// left its descendants stale in client state, rendering as live top-level
// cards until a reload.
describe('removeItemAndDescendants', () => {
  const items = [
    item('root'),
    item('attached-child', { parentId: 'root' }),
    item('grandchild', { parentId: 'attached-child' }),
    item('detached-child', { parentId: 'root', isAttached: 0 }),
    item('unrelated'),
  ];

  it('removes the item and every descendant, attached or detached, at any depth', () => {
    const result = removeItemAndDescendants(items, 'root').map(i => i.id);
    expect(result).toEqual(['unrelated']);
  });

  it('leaves unrelated items untouched when the deleted item has no descendants', () => {
    const result = removeItemAndDescendants(items, 'unrelated').map(i => i.id);
    expect(result).toEqual(['root', 'attached-child', 'grandchild', 'detached-child']);
  });
});

describe('computeChildCounts', () => {
  it('counts attached children only, per parent', () => {
    const counts = computeChildCounts([
      item('root'),
      item('a', { parentId: 'root' }),
      item('b', { parentId: 'root' }),
      item('c', { parentId: 'root', isAttached: 0 }),
      item('a1', { parentId: 'a' }),
    ]);
    expect(counts).toEqual({ root: 2, a: 1 });
  });
});
