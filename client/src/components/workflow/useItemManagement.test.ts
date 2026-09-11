import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import {
  getWorkphaseItemsFrom,
  getMergedColumnItemsFrom,
  getAttachedChildrenFrom,
  computeChildCounts,
  removeItemAndDescendants,
  applyItemWriteResponse,
} from './useItemManagement';

const item = makeItem;

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
    const tied = [item('newer', { position: 1, createdAt: 200 }), item('older', { position: 1, createdAt: 100 })];
    expect(getWorkphaseItemsFrom(tied, 'todo').map(i => i.id)).toEqual(['older', 'newer']);
  });

  it('sorts by completedAt instead of position for a terminal workphase (Epic 3.2 Part 6)', () => {
    const done = [
      item('shipped-later', { position: null, completedAt: 200 }),
      item('shipped-first', { position: null, completedAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(done, 'todo', undefined, true).map(i => i.id)).toEqual([
      'shipped-first',
      'shipped-later',
    ]);
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

// Epic 3.5 Story 2 — the client half of docs/wiki/item-positioning §5/§5a
// (reindex disclosure). Cross-reference TC-5a.1/5a.2 and DRAG-6.3's
// apply-order half.
describe('applyItemWriteResponse', () => {
  const list = () => [
    item('A', { position: 1.0 }),
    item('C', { position: 1.5 }),
    item('E', { position: 1.75 }),
    item('X', { position: 9 }),
  ];

  it('applies every reindexed pair the list holds, then the written item (§5a order)', () => {
    // The wiki's own example: a caller learning only X=2 would sort X last;
    // with the pairs applied first the rendered order is A, X, C, E.
    const response = {
      ...item('X', { position: 2 }),
      reindexed: [
        { id: 'A', position: 1 },
        { id: 'X', position: 2 },
        { id: 'C', position: 3 },
        { id: 'E', position: 4 },
      ],
    };
    const result = applyItemWriteResponse(list(), response);
    const positionOf = (id: string) => result.find(i => i.id === id)!.position;
    expect([positionOf('A'), positionOf('X'), positionOf('C'), positionOf('E')]).toEqual([1, 2, 3, 4]);
    expect(result.find(i => i.id === 'X')).not.toHaveProperty('reindexed');
  });

  it('the written row wins over its own pair when they disagree — it is applied last', () => {
    const response = { ...item('X', { position: 2.5 }), reindexed: [{ id: 'X', position: 2 }] };
    expect(applyItemWriteResponse(list(), response).find(i => i.id === 'X')!.position).toBe(2.5);
  });

  it('ignores pairs for ids not in the list — "not in this view," never missing data', () => {
    const response = { ...item('X', { position: 2 }), reindexed: [{ id: 'unseen', position: 1 }] };
    const result = applyItemWriteResponse(list(), response);
    expect(result).toHaveLength(4);
    expect(result.some(i => i.id === 'unseen')).toBe(false);
  });

  it('with no reindex, replaces the written row by reference and leaves every other row untouched', () => {
    const before = list();
    const written = item('X', { position: 3 });
    const result = applyItemWriteResponse(before, written);
    expect(result.find(i => i.id === 'X')).toBe(written);
    expect(result.find(i => i.id === 'A')).toBe(before[0]);
  });

  it('appends a written item the list does not yet hold (a create)', () => {
    const created = item('N', { position: 10 });
    const result = applyItemWriteResponse(list(), created);
    expect(result).toHaveLength(5);
    expect(result[4]).toBe(created);
  });

  it("keeps a row's reference when its pair matches its current position", () => {
    const before = list();
    const response = { ...item('X', { position: 2 }), reindexed: [{ id: 'A', position: 1.0 }] };
    expect(applyItemWriteResponse(before, response).find(i => i.id === 'A')).toBe(before[0]);
  });
});
