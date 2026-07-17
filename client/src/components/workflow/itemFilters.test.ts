import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import { getWorkphaseItemsFrom, getAttachedChildrenFrom, computeChildCounts } from './useItemManagement';

function item(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    type: null,
    parentId: null,
    projectId: 'p1',
    workphaseId: 'todo',
    title: `Item ${id}`,
    description: null,
    position: null,
    assigneeType: null,
    agentId: null,
    isAttached: 1,
    createdAt: 0,
    updatedAt: 0,
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
