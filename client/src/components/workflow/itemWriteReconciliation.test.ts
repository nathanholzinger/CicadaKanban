import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { sendItemMove, toRequest } from './dragRequest';
import { getWorkphaseItemsFrom, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import {
  EMPTY_ITEM_LIST_STATE,
  applyItemWriteResponse,
  completeItemWrite,
  findInversion,
  freeItemOrder,
  withPlacement,
} from './itemWriteReconciliation';

const item = makeItem;
const placements = (entries: Array<[string, Placement]>) => new Map(entries);

// The client half of reindex disclosure. Cross-reference TC-5a.1 and
// TC-5a.2.
describe('applyItemWriteResponse', () => {
  const list = () => [
    item('A', { position: 1.0 }),
    item('C', { position: 1.5 }),
    item('E', { position: 1.75 }),
    item('X', { position: 9 }),
  ];

  it('TC-5a.1, TC-5a.4: applies every reindexed pair the list holds, then the written item', () => {
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

  it('TC-5a.4: ignores pairs for ids not in the list — "not in this view," never missing data', () => {
    const response = { ...item('X', { position: 2 }), reindexed: [{ id: 'unseen', position: 1 }] };
    const result = applyItemWriteResponse(list(), response);
    expect(result).toHaveLength(4);
    expect(result.some(i => i.id === 'unseen')).toBe(false);
  });

  it('TC-5a.1: with no reindex, replaces the written row by reference and leaves every other row untouched', () => {
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

// TC-5a.1, TC-5a.2: the reconciliation step, in order.
describe('completeItemWrite', () => {
  // The exact object `writes.begin` would have stashed for this write — the
  // reducer only clears/tripwires when the item's current placement is
  // still this same object, by reference.
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

  it('DRAG-6.14: a write the board never previewed (a Sheet edit, an inline create) is folded in with no tripwire, even when the id has an unrelated placement', () => {
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

  // A response landing while the item is being re-dragged (its placement
  // now the live ghost, not this write's marker) must not clear that ghost
  // or log a false inversion — this write isn't the one that owns the
  // current placement.
  it("a response for a write whose placement has since been replaced (a re-drag's ghost, or a different write) applies the rows but leaves the current placement and the tripwire alone", () => {
    const liveGhost: Placement = { slot: 'first' };
    const state = withPlacement(pending(), 'X', liveGhost);
    const next = completeItemWrite(state, item('X', { position: 1.9 }), xPlacement);
    expect(next.items.find(i => i.id === 'X')!.position).toBe(1.9);
    expect(next.placements.get('X')).toBe(liveGhost);
    expect(next.inversions).toEqual([]);
  });
});

// The preview against the responses: what the list reads before a write
// lands, and after it's folded in.
describe('the preview through its responses', () => {
  const todoList = (state: typeof EMPTY_ITEM_LIST_STATE) =>
    getWorkphaseItemsFrom(state.items, 'todo', undefined, undefined, state.placements).map(i => i.id);

  it("TC-2.28: under a narrow view, the server's answer sorts into the order the preview drew", () => {
    // The client holds A, C and E. The true order also has B at 2 and D at 4, unseen here.
    const view = () => [
      item('A', { position: 1 }),
      item('C', { position: 3 }),
      item('E', { position: 5 }),
      item('X', { position: 9 }),
    ];
    const cases: Array<[Placement, number]> = [
      [{ slot: { anchorId: 'A', side: 'after' } }, 1.5], // between A and the unseen B
      [{ slot: { anchorId: 'C', side: 'before' } }, 2.5], // between the unseen B and C
    ];
    for (const [placement, resolved] of cases) {
      const state = withPlacement({ ...EMPTY_ITEM_LIST_STATE, items: view() }, 'X', placement);
      expect(todoList(state)).toEqual(['A', 'X', 'C', 'E']);
      const next = completeItemWrite(state, item('X', { position: resolved }), placement);
      expect(todoList(next)).toEqual(['A', 'X', 'C', 'E']);
      expect(next.inversions).toEqual([]);
    }
  });

  it("TC-2.28: a top or bottom band drop is marked pending as the anchor it sends, so the server's answer is no inversion", async () => {
    // Positions run across the workphases: Todo holds A and C, Doing holds B.
    const items = () => [
      item('A', { workphaseId: 'todo', position: 1 }),
      item('B', { workphaseId: 'doing', position: 2 }),
      item('C', { workphaseId: 'todo', position: 3 }),
      item('X', { workphaseId: 'todo', position: 4 }),
    ];
    const origin: Placement = { workphaseId: 'todo', slot: 'existing' };
    // X popped out of Todo and released in Doing's band, whose list holds only B.
    const cases: Array<[string, Placement, number, string[]]> = [
      ['top', { workphaseId: 'doing', slot: 'first' }, 1.5, ['A', 'X', 'B', 'C']], // before B
      ['bottom', { workphaseId: 'doing', slot: 'last' }, 2.5, ['A', 'B', 'X', 'C']], // after B
    ];
    for (const [band, ghost, resolved, order] of cases) {
      const response = item('X', { workphaseId: 'doing', position: resolved });
      const request = toRequest({ workphaseId: 'todo' }, origin, ghost, [{ id: 'B' }])!;
      // The marker the send block records for the write, as the board would hold it.
      let marker: Placement | null = null;
      const writes: ItemWriteTracker = {
        begin: (_id, pending) => {
          marker = pending;
          return 1;
        },
        complete: () => ({ applied: true, needsResync: false }),
        fail: () => {},
        isPending: () => true,
      };
      const moveItem = async () => response;
      await sendItemMove(moveItem, 'X', request, ghost, writes, () => {});

      const state = withPlacement({ ...EMPTY_ITEM_LIST_STATE, items: items() }, 'X', marker);
      const next = completeItemWrite(state, response, marker);
      expect(freeItemOrder(next.items, next.placements), band).toEqual(order);
      expect(next.inversions, band).toEqual([]);
    }
  });

  it('TC-2.29: an item placed after a still-pending one stays right after it once both responses land', () => {
    const yPlacement: Placement = { slot: { anchorId: 'A', side: 'after' } };
    const xPlacement: Placement = { slot: { anchorId: 'Y', side: 'after' } };
    let state = withPlacement(
      {
        ...EMPTY_ITEM_LIST_STATE,
        items: [
          item('A', { position: 1 }),
          item('C', { position: 3 }),
          item('E', { position: 5 }),
          item('Y', { position: 8 }),
          item('X', { position: 9 }),
        ],
      },
      'Y',
      yPlacement,
    );
    state = withPlacement(state, 'X', xPlacement);
    expect(todoList(state)).toEqual(['A', 'Y', 'X', 'C', 'E']);

    // Y lands first, between A and C. X, still pending, follows it there.
    state = completeItemWrite(state, item('Y', { position: 2 }), yPlacement);
    expect(todoList(state)).toEqual(['A', 'Y', 'X', 'C', 'E']);
    // X's own write resolved after Y's new position.
    state = completeItemWrite(state, item('X', { position: 2.5 }), xPlacement);
    expect(todoList(state)).toEqual(['A', 'Y', 'X', 'C', 'E']);
    expect(state.inversions).toEqual([]);
  });

  it("TC-2.30: a pending item keeps its position and its place when another item's response re-sorts the list", () => {
    // X is moving into this workphase, with its position left as it was.
    const xPlacement: Placement = { workphaseId: 'todo', slot: 'existing' };
    let state = withPlacement(
      {
        ...EMPTY_ITEM_LIST_STATE,
        items: [
          item('A', { position: 1 }),
          item('C', { position: 3 }),
          item('E', { position: 5 }),
          item('X', { workphaseId: 'doing', position: 4 }),
        ],
      },
      'X',
      xPlacement,
    );
    expect(todoList(state)).toEqual(['A', 'C', 'X', 'E']);

    // E's own write lands, moving it to the front. X is still pending, after C.
    state = completeItemWrite(state, item('E', { position: 0.5 }));
    expect(todoList(state)).toEqual(['E', 'A', 'C', 'X']);
    expect(state.items.find(i => i.id === 'X')!.position).toBe(4);
    expect(state.placements.get('X')).toBe(xPlacement);
  });
});
