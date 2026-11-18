import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import { makeItem } from '../../test/itemFixture';
import {
  getWorkphaseItemsFrom,
  getMergedColumnItemsFrom,
  getAttachedChildrenFrom,
  getUnknownStatusItemsFrom,
  hasUnknownStatusItem,
  computeChildCounts,
  removeItemAndDescendants,
  applyPlacements,
  workphaseOnlySlot,
  renderedIsStub,
  renderedParentId,
  renderedWorkphaseId,
  withPendingParents,
  type Placement,
} from './itemListOps';

const item = makeItem;
const placements = (entries: Array<[string, Placement]>) => new Map(entries);

// A drag starts from these, the same reads the render draws with, so a re-drag of an item whose
// write is still in flight starts from where it's drawn rather than its stored row.
describe('rendered reads (what a drag starts from)', () => {
  const free = item('x', { isAttached: 0, workphaseId: 'w1' });
  const stub = item('s', { parentId: 'p', workphaseId: 'w1' });

  it('with no placement, the stored row', () => {
    const none = placements([]);
    expect([renderedIsStub(free, none), renderedParentId(free, none), renderedWorkphaseId(free, none)]).toEqual([
      false,
      null,
      'w1',
    ]);
    expect([renderedIsStub(stub, none), renderedParentId(stub, none)]).toEqual([true, 'p']);
  });

  it('a pending move to another workphase: that workphase', () => {
    expect(renderedWorkphaseId(free, placements([['x', { workphaseId: 'w2', slot: 'last' }]]))).toBe('w2');
  });

  it('a pending attach: a Stub of the new parent', () => {
    const attaching = placements([['x', { parentId: 'y', slot: 'last' }]]);
    expect([renderedIsStub(free, attaching), renderedParentId(free, attaching)]).toEqual([true, 'y']);
  });

  it('a pending detach (parentId: null): Free, under the workphase it detaches to', () => {
    const detaching = placements([['s', { parentId: null, workphaseId: 'w2', slot: 'last' }]]);
    expect([renderedIsStub(stub, detaching), renderedWorkphaseId(stub, detaching)]).toEqual([false, 'w2']);
  });
});

// The tree the drag's depths and cycles are counted over: each item's parent once its pending write
// has landed, which is not the parent it is drawn under for a detach.
describe('withPendingParents', () => {
  const parents = (items: ReturnType<typeof item>[], pending: Array<[string, Placement]>) =>
    Object.fromEntries(withPendingParents(items, placements(pending)).map(i => [i.id, i.parentId]));

  it('with no placement, the stored parents', () => {
    expect(parents([item('a'), item('b', { parentId: 'a' })], [])).toEqual({ a: null, b: 'a' });
  });

  it('a pending attach: the new parent', () => {
    expect(parents([item('a'), item('b')], [['b', { parentId: 'a', slot: 'last' }]])).toEqual({ a: null, b: 'a' });
  });

  it('a pending reparent: the new parent, not the stored one', () => {
    const items = [item('a'), item('c'), item('b', { parentId: 'a' })];
    expect(parents(items, [['b', { parentId: 'c', slot: 'last' }]])).toEqual({ a: null, c: null, b: 'c' });
  });

  it('a pending detach: the stored parent, which a detach keeps', () => {
    const items = [item('a'), item('b', { parentId: 'a' })];
    expect(parents(items, [['b', { parentId: null, slot: 'last' }]])).toEqual({ a: null, b: 'a' });
  });

  it('a placement with no opinion about the parent: the stored parent', () => {
    const items = [item('a'), item('b', { parentId: 'a' })];
    expect(parents(items, [['b', { workphaseId: 'w2', slot: 'last' }]])).toEqual({ a: null, b: 'a' });
  });

  it('changes the parent and nothing else, and leaves the stored items as they were', () => {
    const items = [item('a'), item('b', { workphaseId: 'w1' })];
    const [, moved] = withPendingParents(items, placements([['b', { parentId: 'a', slot: 'last' }]]));

    expect(moved).toEqual({ ...items[1], parentId: 'a' });
    expect(items[1].parentId).toBeNull();
  });
});

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

  it('TC-5a.5: breaks an exact position tie by createdAt, oldest first', () => {
    const tied = [item('newer', { position: 1, createdAt: 200 }), item('older', { position: 1, createdAt: 100 })];
    expect(getWorkphaseItemsFrom(tied, 'todo').map(i => i.id)).toEqual(['older', 'newer']);
  });

  it('TC-5a.5: sorts a missing position as 0, tie-break included', () => {
    const items = [
      item('one', { position: 1, createdAt: 10 }),
      item('zero-newer', { position: 0, createdAt: 300 }),
      item('missing', { position: null, createdAt: 200 }),
      item('zero-older', { position: 0, createdAt: 100 }),
    ];
    // Among the zeros by creation time, and ahead of 1: not first, not last.
    expect(getWorkphaseItemsFrom(items, 'todo').map(i => i.id)).toEqual(['zero-older', 'missing', 'zero-newer', 'one']);
  });

  it('sorts by completedAt instead of position for a terminal workphase', () => {
    const done = [
      item('shipped-later', { position: null, completedAt: 200 }),
      item('shipped-first', { position: null, completedAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(done, 'todo', undefined, true).map(i => i.id)).toEqual([
      'shipped-first',
      'shipped-later',
    ]);
  });

  // A drop into a done column previews with slot 'existing', so the sort
  // alone decides where the ghost and the pending marker draw. The server
  // stamps completedAt on the write, so the item lands last — the preview
  // has to say the same.
  it('DRAG-6.11: draws an item with no completedAt at the end of a done list, where the server will stamp it, and keeps it there once it is stamped', () => {
    const done = [
      item('shipped-later', { position: null, completedAt: 200 }),
      item('being-dropped', { position: null, completedAt: null }),
      item('shipped-first', { position: null, completedAt: 100 }),
    ];
    const order = (list: typeof done) => getWorkphaseItemsFrom(list, 'todo', undefined, true).map(i => i.id);
    expect(order(done)).toEqual(['shipped-first', 'shipped-later', 'being-dropped']);

    // The response stamps it later than the rest: it stays where it was drawn.
    const stamped = done.map(i => (i.id === 'being-dropped' ? { ...i, completedAt: 300 } : i));
    expect(order(stamped)).toEqual(['shipped-first', 'shipped-later', 'being-dropped']);
  });

  it('TC-6.10: breaks an exact completedAt tie by createdAt, oldest first', () => {
    // A completed at 10:00, and B and C both at 10:05.
    const done = (bCreatedAt: number, cCreatedAt: number) => [
      item('c', { position: null, completedAt: 300, createdAt: cCreatedAt }),
      item('a', { position: null, completedAt: 100, createdAt: 50 }),
      item('b', { position: null, completedAt: 300, createdAt: bCreatedAt }),
    ];
    const order = (list: ReturnType<typeof done>) =>
      getWorkphaseItemsFrom(list, 'todo', undefined, true).map(i => i.id);

    expect(order(done(1, 2))).toEqual(['a', 'b', 'c']); // B created before C
    expect(order(done(2, 1))).toEqual(['a', 'c', 'b']); // C created before B
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

  it('TC-4.1: union-sorts across the covered workphases, allowing genuine interleaving', () => {
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

// Unsorted's Unknown-status list: the live items whose workphase is none, or not one of the workflow's.
describe('getUnknownStatusItemsFrom', () => {
  const WORKFLOW = ['todo', 'doing'];
  const items = [
    item('none', { workphaseId: null, position: 2 }),
    item('foreign', { workphaseId: 'gone', position: 1 }),
    item('known', { workphaseId: 'doing', position: 3 }),
    item('stub', { parentId: 'foreign', workphaseId: null, position: 4 }),
    item('other-project', { projectId: 'p2', workphaseId: 'gone', position: 5 }),
  ];
  const ids = (list: Item[]) => list.map(i => i.id);

  it('lists an item with no workphase and one with a foreign workphase, by position, and no known one', () => {
    expect(ids(getUnknownStatusItemsFrom(items, WORKFLOW))).toEqual(['foreign', 'none', 'other-project']);
  });

  it('leaves out a Stub, which nests in its parent’s Card', () => {
    expect(ids(getUnknownStatusItemsFrom(items, WORKFLOW))).not.toContain('stub');
  });

  it('applies the project filter when given', () => {
    expect(ids(getUnknownStatusItemsFrom(items, WORKFLOW, 'p1'))).toEqual(['foreign', 'none']);
  });

  it('reads the live items: an edit shows, and a deleted item is gone', () => {
    const edited = items.map(i => (i.id === 'none' ? { ...i, title: 'Renamed' } : i));
    expect(getUnknownStatusItemsFrom(edited, WORKFLOW).find(i => i.id === 'none')?.title).toBe('Renamed');

    const deleted = items.filter(i => i.id !== 'none');
    expect(ids(getUnknownStatusItemsFrom(deleted, WORKFLOW))).toEqual(['foreign', 'other-project']);
  });

  it('drops an item once it has a workphase of the workflow, and once a pending move places it in a column', () => {
    const given = items.map(i => (i.id === 'none' ? { ...i, workphaseId: 'todo' } : i));
    expect(ids(getUnknownStatusItemsFrom(given, WORKFLOW))).toEqual(['foreign', 'other-project']);

    const pending = placements([['foreign', { workphaseId: 'doing', slot: 'last' }]]);
    expect(ids(getUnknownStatusItemsFrom(items, WORKFLOW, undefined, pending))).toEqual(['none', 'other-project']);
  });
});

describe('hasUnknownStatusItem', () => {
  const WORKFLOW = ['todo', 'doing'];

  it('is true for an item with no workphase or a foreign one, whichever project it is in', () => {
    expect(hasUnknownStatusItem([item('a'), item('b', { workphaseId: null })], WORKFLOW)).toBe(true);
    expect(hasUnknownStatusItem([item('a'), item('b', { projectId: 'p2', workphaseId: 'gone' })], WORKFLOW)).toBe(true);
  });

  it('counts an Attached item, which the list leaves out', () => {
    const items = [item('a'), item('s', { parentId: 'a', workphaseId: null })];
    expect(hasUnknownStatusItem(items, WORKFLOW)).toBe(true);
    expect(getUnknownStatusItemsFrom(items, WORKFLOW)).toEqual([]);
  });

  it('is false when every item has one of the workflow’s workphases, and when there are no items', () => {
    expect(hasUnknownStatusItem([item('a'), item('b', { workphaseId: 'doing' })], WORKFLOW)).toBe(false);
    expect(hasUnknownStatusItem([], WORKFLOW)).toBe(false);
  });

  it('turns false when the only unknown item is deleted or given a status', () => {
    const items = [item('a'), item('b', { workphaseId: null })];
    expect(
      hasUnknownStatusItem(
        items.filter(i => i.id !== 'b'),
        WORKFLOW,
      ),
    ).toBe(false);
    expect(
      hasUnknownStatusItem(
        items.map(i => ({ ...i, workphaseId: 'todo' })),
        WORKFLOW,
      ),
    ).toBe(false);
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

  // A Stub previewing detach (`placement.parentId: null`) leaves its
  // section immediately, the moment the drag pops out to the column —
  // not only once the write lands. `renderedIsStub` reads the `parentId`
  // key's presence, not its truthiness (a `null` still means "has an
  // opinion"), which is exactly what this placement relies on.
  it("a Stub previewing detach (parentId: null) leaves the parent's section", () => {
    const detaching = placements([['late', { parentId: null, workphaseId: 'w1', slot: 'last' }]]);
    expect(getAttachedChildrenFrom(items, 'root', detaching).map(i => i.id)).toEqual(['early']);
  });
});

// Deleting an item removes its descendants from client state too: left
// behind, they'd render as live top-level cards until a reload.
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

  // The count drops the moment a Stub's placement previews
  // detaching (`parentId: null`) — the same placement-aware read
  // `getAttachedChildrenFrom` uses, so the footer's "N children" and the
  // section's own rendered list can never disagree mid-drag.
  it("a detaching Stub (placement parentId: null) drops out of its former parent's count", () => {
    const items = [item('root'), item('a', { parentId: 'root' }), item('b', { parentId: 'root' })];
    const detaching = placements([['a', { parentId: null, workphaseId: 'w1', slot: 'last' }]]);
    expect(computeChildCounts(items, detaching)).toEqual({ root: 1 });
  });
});

// The ordinal placement layer.
describe('applyPlacements', () => {
  const sorted = () => [item('A', { position: 1 }), item('C', { position: 3 }), item('E', { position: 5 })];
  const x = () => item('X', { position: 9 });

  it('TC-2.27: places an item after its anchor by index — its position is untouched', () => {
    const list = [...sorted(), x()];
    const result = applyPlacements(list, placements([['X', { slot: { anchorId: 'A', side: 'after' } }]]));
    expect(result.map(i => i.id)).toEqual(['A', 'X', 'C', 'E']);
    expect(result.find(i => i.id === 'X')!.position).toBe(9);
  });

  it('places before an anchor, first, and last', () => {
    const list = [...sorted(), x()];
    const ids = (p: Placement) => applyPlacements(list, placements([['X', p]])).map(i => i.id);
    expect(ids({ slot: { anchorId: 'C', side: 'before' } })).toEqual(['A', 'X', 'C', 'E']);
    expect(ids({ slot: 'first' })).toEqual(['X', 'A', 'C', 'E']);
    expect(ids({ slot: 'last' })).toEqual(['A', 'C', 'E', 'X']);
  });

  it("DRAG-1.23, DRAG-3.11: 'append' draws at the end, as 'last' does, whatever the position sort says", () => {
    const [a, c, e] = sorted();
    const list = [a, item('X', { position: 2 }), c, e];
    expect(applyPlacements(list, placements([['X', { slot: 'append' }]])).map(i => i.id)).toEqual(['A', 'C', 'E', 'X']);
  });

  it("'existing' leaves the sort alone, and a list with no placed items comes back as-is", () => {
    const list = [...sorted(), x()];
    expect(applyPlacements(list, placements([['X', { slot: 'existing' }]])).map(i => i.id)).toEqual([
      'A',
      'C',
      'E',
      'X',
    ]);
    expect(applyPlacements(list, new Map()).map(i => i.id)).toEqual(['A', 'C', 'E', 'X']);
  });

  it('TC-2.29: an item anchored against a still-pending item follows that item wherever it was placed', () => {
    const list = [...sorted(), item('Y', { position: 8 }), x()];
    const result = applyPlacements(
      list,
      placements([
        ['Y', { slot: { anchorId: 'A', side: 'after' } }],
        ['X', { slot: { anchorId: 'Y', side: 'after' } }],
      ]),
    );
    expect(result.map(i => i.id)).toEqual(['A', 'Y', 'X', 'C', 'E']);
  });

  it('falls back to where the sort had the item when its anchor is not in this list (a narrowed view)', () => {
    const list = [item('A', { position: 1 }), item('X', { position: 2 }), item('E', { position: 5 })];
    const result = applyPlacements(list, placements([['X', { slot: { anchorId: 'unseen', side: 'after' } }]]));
    expect(result.map(i => i.id)).toEqual(['A', 'X', 'E']);
  });

  it('a placement on an item outside the list has no effect on it', () => {
    const result = applyPlacements(sorted(), placements([['X', { slot: 'first' }]]));
    expect(result.map(i => i.id)).toEqual(['A', 'C', 'E']);
  });
});

describe('selectors with placements', () => {
  it('TC-2.30, DRAG-3.11: a placement with a workphaseId moves the item into that list without changing the item (position kept, not null)', () => {
    const items = [
      item('A', { position: 1 }),
      item('X', { position: 3 }),
      item('Q', { workphaseId: 'doing', position: 2 }),
    ];
    const p = placements([['X', { workphaseId: 'doing', slot: 'first' }]]);
    expect(getWorkphaseItemsFrom(items, 'todo', undefined, undefined, p).map(i => i.id)).toEqual(['A']);
    const doing = getWorkphaseItemsFrom(items, 'doing', undefined, undefined, p);
    expect(doing.map(i => i.id)).toEqual(['X', 'Q']);
    expect(doing[0].position).toBe(3);
    expect(doing[0].workphaseId).toBe('todo');
  });

  it("a merged column honours the placement's workphase for membership", () => {
    const items = [item('A', { position: 1 }), item('X', { workphaseId: 'done', position: null })];
    const p = placements([['X', { workphaseId: 'review', slot: 'last' }]]);
    expect(getMergedColumnItemsFrom(items, ['todo', 'review'], undefined, undefined, p).map(i => i.id)).toEqual([
      'A',
      'X',
    ]);
  });

  it('Stub lists apply anchor placements the same way', () => {
    const items = [
      item('root'),
      item('s1', { parentId: 'root', position: 1 }),
      item('s2', { parentId: 'root', position: 2 }),
    ];
    const p = placements([['s2', { slot: { anchorId: 's1', side: 'before' } }]]);
    expect(getAttachedChildrenFrom(items, 'root', p).map(i => i.id)).toEqual(['s2', 's1']);
  });
});

describe('workphaseOnlySlot', () => {
  it('DRAG-6.10: keeps the position sort when there is a position to keep, appends otherwise', () => {
    expect(workphaseOnlySlot(3)).toBe('existing');
    expect(workphaseOnlySlot(null)).toBe('append');
  });
});

// ATT-9.3's chain: D is Free in w2, A is attached to D, and X to A, with X's
// own workphaseId drifted, to w3 or to none.
describe('ATT-9.3: an attached item shows with its parent, whatever its own workphaseId says', () => {
  const items = [
    item('d', { workphaseId: 'w2', position: 1 }),
    item('a', { parentId: 'd', workphaseId: 'w2', position: 1 }),
    item('x-w3', { parentId: 'a', workphaseId: 'w3', position: 2 }),
    item('x-none', { parentId: 'a', workphaseId: null, position: 3 }),
  ];

  it('is a Stub in its parent’s list and a Card in no column', () => {
    expect(getAttachedChildrenFrom(items, 'a').map(i => i.id)).toEqual(['x-w3', 'x-none']);
    expect(getWorkphaseItemsFrom(items, 'w3')).toEqual([]);
    expect(getMergedColumnItemsFrom(items, ['w2', 'w3']).map(i => i.id)).toEqual(['d']);
  });
});
