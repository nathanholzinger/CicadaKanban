import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import {
  getWorkphaseItemsFrom,
  getMergedColumnItemsFrom,
  getAttachedChildrenFrom,
  hierarchyRows,
  descendantsChildrenOf,
  computeChildCounts,
  removeItemAndDescendants,
  applyItemWriteResponse,
  applyPlacements,
  freeItemOrder,
  findInversion,
  completeItemWrite,
  withPlacement,
  workphaseOnlySlot,
  EMPTY_ITEM_LIST_STATE,
  type Placement,
} from './itemListOps';

const item = makeItem;
const placements = (entries: Array<[string, Placement]>) => new Map(entries);

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

  // Wiki–code reconciliation #14: a drop into a done column previews with
  // slot 'existing', so the sort alone decides where the ghost and the
  // pending marker draw. The server stamps completedAt on the write, so the
  // item lands last — the preview has to say the same (drag §10).
  it('draws an item with no completedAt at the end of a done list, where the server will stamp it', () => {
    const done = [
      item('shipped-later', { position: null, completedAt: 200 }),
      item('being-dropped', { position: null, completedAt: null }),
      item('shipped-first', { position: null, completedAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(done, 'todo', undefined, true).map(i => i.id)).toEqual([
      'shipped-first',
      'shipped-later',
      'being-dropped',
    ]);
  });

  it('breaks an exact completedAt tie by createdAt, oldest first', () => {
    const tied = [
      item('newer', { position: null, completedAt: 100, createdAt: 200 }),
      item('older', { position: null, completedAt: 100, createdAt: 100 }),
    ];
    expect(getWorkphaseItemsFrom(tied, 'todo', undefined, true).map(i => i.id)).toEqual(['older', 'newer']);
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

  // Story 5: a Stub previewing detach (`placement.parentId: null`) leaves
  // its section immediately, the moment the drag pops out to the column —
  // not only once the write lands. `renderedIsStub` reads the `parentId`
  // key's presence, not its truthiness (a `null` still means "has an
  // opinion"), which is exactly what this placement relies on.
  it("a Stub previewing detach (parentId: null) leaves the parent's section", () => {
    const detaching = placements([['late', { parentId: null, workphaseId: 'w1', slot: 'last' }]]);
    expect(getAttachedChildrenFrom(items, 'root', detaching).map(i => i.id)).toEqual(['early']);
  });
});

// Epic 3.5 Story 6 Phase B: the whole descendants section as one flat DFS
// list, for KanbanCard.tsx's single SortableContext.
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

  // KanbanCard.tsx's own attach-ghost leaf: a `childrenOf` that returns []
  // for a specific id stops the walk there without needing a real "exclude"
  // set — the same technique it uses to keep the active drag's own preview
  // row non-recursive.
  it('never recurses into an id whose childrenOf callback returns none', () => {
    const stopAtLate = (parentId: string) => (parentId === 'late' ? [] : getAttachedChildrenFrom(items, parentId));
    const rows = hierarchyRows('root', stopAtLate);
    expect(rows.map(r => r.item.id)).toEqual(['early', 'late']);
  });
});

// Story 6 Phase D: the library's own `childrenOf` adapter (ids only), fed
// straight into `flattenHierarchy`/`resolvePlacement` by `useBoardDnd.ts`'s
// live projection — the same `getAttachedChildren`-shaped accessor
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

  // Story 5: the count drops the moment a Stub's placement previews
  // detaching (`parentId: null`) — the same placement-aware read
  // `getAttachedChildrenFrom` uses, so the footer's "N children" and the
  // section's own rendered list can never disagree mid-drag.
  it("a detaching Stub (placement parentId: null) drops out of its former parent's count", () => {
    const items = [item('root'), item('a', { parentId: 'root' }), item('b', { parentId: 'root' })];
    const detaching = placements([['a', { parentId: null, workphaseId: 'w1', slot: 'last' }]]);
    expect(computeChildCounts(items, detaching)).toEqual({ root: 1 });
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

// Epic 3.5 Story 3 — the ordinal placement layer (docs/wiki/item-positioning
// §2 "Client-side role", board-drag-interaction §10). Cross-reference
// TC-2.27–2.30, DRAG-6.1/6.2.
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
  it('a placement with a workphaseId moves the item into that list without changing the item (TC-2.30: position kept, not null)', () => {
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

describe('freeItemOrder / findInversion', () => {
  it('orders Free positioned items board-wide, with placements layered on; Stubs and unpositioned items make no claim', () => {
    const items = [
      item('A', { position: 1 }),
      item('B', { workphaseId: 'doing', position: 2 }),
      item('stub', { parentId: 'A', position: 0 }),
      item('done', { position: null }),
      item('X', { position: 9 }),
    ];
    expect(freeItemOrder(items, new Map())).toEqual(['A', 'B', 'X']);
    expect(freeItemOrder(items, placements([['X', { slot: { anchorId: 'A', side: 'after' } }]]))).toEqual([
      'A',
      'X',
      'B',
    ]);
  });

  it('finds nothing when the sequences agree over their shared ids', () => {
    expect(findInversion(['A', 'X', 'B'], ['A', 'X', 'B'])).toBeNull();
    expect(findInversion(['A', 'X', 'B'], ['A', 'B'])).toBeNull(); // X left the positioned set
  });

  it('reports the expected vs actual sequence when they differ', () => {
    expect(findInversion(['A', 'X', 'B'], ['A', 'B', 'X'])).toEqual({
      expected: ['A', 'X', 'B'],
      actual: ['A', 'B', 'X'],
    });
  });
});

describe('workphaseOnlySlot', () => {
  it('keeps the position sort when there is a position to keep, appends otherwise', () => {
    expect(workphaseOnlySlot(3)).toBe('existing');
    expect(workphaseOnlySlot(null)).toBe('last');
  });
});

// DRAG-6.3 / TC-5a.1–5a.3: the reconciliation step, in order.
describe('completeItemWrite', () => {
  // The exact object `writes.begin` would have stashed for this write — the
  // reducer only clears/tripwires when the item's current placement is
  // still this same object, by reference (audit
  // epic-3-5-story-3-reconciled #1).
  const xPlacement: Placement = { slot: { anchorId: 'A', side: 'after' } };
  const pending = () =>
    withPlacement(
      {
        ...EMPTY_ITEM_LIST_STATE,
        items: [
          item('A', { position: 1.0 }),
          item('C', { position: 1.5 }),
          item('E', { position: 1.75 }),
          item('X', { position: 9 }),
        ],
      },
      'X',
      xPlacement,
    );

  it('TC-5a.2: applies the reindex first, so a correct response is not read as an inversion; clears the placement', () => {
    const response = {
      ...item('X', { position: 2 }),
      reindexed: [
        { id: 'A', position: 1 },
        { id: 'X', position: 2 },
        { id: 'C', position: 3 },
        { id: 'E', position: 4 },
      ],
    };
    const next = completeItemWrite(pending(), response, xPlacement);
    expect(freeItemOrder(next.items, next.placements)).toEqual(['A', 'X', 'C', 'E']);
    expect(next.placements.has('X')).toBe(false);
    expect(next.inversions).toEqual([]);
  });

  it('DRAG-6.4: a response that inverts the previewed order is applied *and* recorded as an inversion', () => {
    // The server put X after E — not where the preview drew it.
    const next = completeItemWrite(pending(), item('X', { position: 1.9 }), xPlacement);
    expect(freeItemOrder(next.items, next.placements)).toEqual(['A', 'C', 'E', 'X']);
    expect(next.inversions).toEqual([{ itemId: 'X', expected: ['A', 'X', 'C', 'E'], actual: ['A', 'C', 'E', 'X'] }]);
  });

  it('a write the board never previewed (a Sheet edit, an inline create) is folded in with no tripwire, even when the id has an unrelated placement', () => {
    const next = completeItemWrite(pending(), item('X', { position: 1.9 }));
    expect(next.inversions).toEqual([]);
    expect(next.items.find(i => i.id === 'X')!.position).toBe(1.9);
    // Untouched — this call never claimed to own X's placement.
    expect(next.placements.get('X')).toBe(xPlacement);
  });

  it('leaves other pending placements alone', () => {
    const state = withPlacement(pending(), 'C', { slot: 'last' });
    const next = completeItemWrite(state, item('X', { position: 1.2 }), xPlacement);
    expect(next.placements.has('C')).toBe(true);
    expect(next.placements.has('X')).toBe(false);
  });

  // audit epic-3-5-story-3-reconciled #1: a response landing while the item
  // is being re-dragged (its placement now the live ghost, not this
  // write's marker) must not clear that ghost or log a false inversion —
  // this write isn't the one that owns the current placement.
  it("a response for a write whose placement has since been replaced (a re-drag's ghost, or a different write) applies the rows but leaves the current placement and the tripwire alone", () => {
    const liveGhost: Placement = { slot: 'first' };
    const state = withPlacement(pending(), 'X', liveGhost);
    const next = completeItemWrite(state, item('X', { position: 1.9 }), xPlacement);
    expect(next.items.find(i => i.id === 'X')!.position).toBe(1.9);
    expect(next.placements.get('X')).toBe(liveGhost);
    expect(next.inversions).toEqual([]);
  });
});
