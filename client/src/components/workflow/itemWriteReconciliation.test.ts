import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import type { Placement } from './itemListOps';
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
