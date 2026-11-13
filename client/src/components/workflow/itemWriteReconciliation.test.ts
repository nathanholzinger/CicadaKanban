import { describe, it, expect } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { workedList, workedResponse } from '../../test/reindexFixtures';
import type { MoveItemInput } from '../../api/items';
import { sendItemMove, toRequest } from './dragRequest';
import { getWorkphaseItemsFrom, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import {
  EMPTY_ITEM_LIST_STATE,
  completeItemWrite,
  findInversion,
  freeItemOrder,
  withPlacement,
} from './itemWriteReconciliation';

const item = makeItem;
const placements = (entries: Array<[string, Placement]>) => new Map(entries);

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

// The reconciliation step, in order: the response's rows applied, then the placement
// cleared and the order checked.
describe('completeItemWrite', () => {
  // The exact object `writes.begin` would have stashed for this write —
  // `completeItemWrite` only clears the placement and checks the order when
  // the item's current placement is still this same object, by reference.
  const xPlacement: Placement = { slot: { anchorId: 'A', side: 'after' } };
  const pending = () => withPlacement({ ...EMPTY_ITEM_LIST_STATE, items: workedList() }, 'X', xPlacement);

  it('TC-5a.2: applies the reindex first, so the list reads A, X, C, E after the response, with X unmarked', () => {
    const next = completeItemWrite(pending(), workedResponse, xPlacement);
    expect(freeItemOrder(next.items, next.placements)).toEqual(['A', 'X', 'C', 'E']);
    expect(next.placements.has('X')).toBe(false);
  });

  it('DRAG-6.4: a response that sorts the item after E is shown as the server saved it, never adjusted to the preview', () => {
    // The server put X after E — not where the preview drew it.
    const next = completeItemWrite(pending(), item('X', { position: 1.9 }), xPlacement);
    expect(freeItemOrder(next.items, next.placements)).toEqual(['A', 'C', 'E', 'X']);
    expect(next.items.find(i => i.id === 'X')!.position).toBe(1.9);
    expect(next.placements.has('X')).toBe(false);
  });

  it('leaves other pending placements alone', () => {
    const state = withPlacement(pending(), 'C', { slot: 'last' });
    const next = completeItemWrite(state, item('X', { position: 1.2 }), xPlacement);
    expect(next.placements.has('C')).toBe(true);
    expect(next.placements.has('X')).toBe(false);
  });

  // A response landing while the item is being re-dragged (its placement
  // now the live ghost, not this write's marker) must not clear that ghost —
  // this write isn't the one that owns the current placement.
  it("DRAG-6.9: a response for a write whose placement has since been replaced (a re-drag's ghost, or a different write) applies the rows but leaves the current placement alone", () => {
    const liveGhost: Placement = { slot: 'first' };
    const state = withPlacement(pending(), 'X', liveGhost);
    const next = completeItemWrite(state, item('X', { position: 1.9 }), xPlacement);
    expect(next.items.find(i => i.id === 'X')!.position).toBe(1.9);
    expect(next.placements.get('X')).toBe(liveGhost);
  });
});

// The server answers a write that changes an item's workphase with that row alone, having moved its
// attached descendants to it. The loaded copies follow, as far as the server's walk goes.
describe('completeItemWrite: the workphase cascade', () => {
  // P holds C (attached), which holds G (attached), and F (detached), which holds FG (attached). Y is apart.
  const branch = () => [
    item('P', { workphaseId: 'todo' }),
    item('C', { parentId: 'P', workphaseId: 'todo' }),
    item('G', { parentId: 'C', workphaseId: 'todo' }),
    item('F', { parentId: 'P', isAttached: 0, workphaseId: 'todo' }),
    item('FG', { parentId: 'F', workphaseId: 'todo' }),
    item('Y', { workphaseId: 'todo' }),
  ];
  const workphases = (items: readonly { id: string; workphaseId: string | null }[]) =>
    Object.fromEntries(items.map(i => [i.id, i.workphaseId]));

  it('moves the attached descendants of an item whose workphase the write changed, at any depth', () => {
    const next = completeItemWrite({ ...EMPTY_ITEM_LIST_STATE, items: branch() }, item('P', { workphaseId: 'doing' }));

    expect(workphases(next.items)).toMatchObject({ P: 'doing', C: 'doing', G: 'doing' });
  });

  it('stops at a detached child, which keeps its workphase with everything under it, and leaves other items', () => {
    const next = completeItemWrite({ ...EMPTY_ITEM_LIST_STATE, items: branch() }, item('P', { workphaseId: 'doing' }));

    expect(workphases(next.items)).toMatchObject({ F: 'todo', FG: 'todo', Y: 'todo' });
  });

  it('moves nothing when the write left the workphase as it was, so an Attached item with its own stays put', () => {
    const items = branch().map(i => (i.id === 'C' ? { ...i, workphaseId: 'doing' } : i));

    const next = completeItemWrite(
      { ...EMPTY_ITEM_LIST_STATE, items },
      item('P', { workphaseId: 'todo', position: 3 }),
    );

    expect(workphases(next.items)).toMatchObject({ P: 'todo', C: 'doing', G: 'todo' });
  });

  it('gives them no workphase when the write took the item out of one', () => {
    const next = completeItemWrite({ ...EMPTY_ITEM_LIST_STATE, items: branch() }, item('P', { workphaseId: null }));

    expect(workphases(next.items)).toMatchObject({ P: null, C: null, G: null });
  });
});

// Which write last set each row's workphase, by the number it was sent with. An answer for write `sent` leaves
// the workphase of a row that a later-sent write set, and cascades nothing from it.
describe('completeItemWrite: workphase currency', () => {
  const branch = () => [
    item('P', { workphaseId: 'todo' }),
    item('C', { parentId: 'P', workphaseId: 'todo' }),
    item('G', { parentId: 'C', workphaseId: 'todo' }),
    item('S', { parentId: 'P', workphaseId: 'todo' }),
  ];
  const workphases = (items: readonly { id: string; workphaseId: string | null }[]) =>
    Object.fromEntries(items.map(i => [i.id, i.workphaseId]));
  const setBy = (state: { workphaseSetBy: ReadonlyMap<string, number> }) => Object.fromEntries(state.workphaseSetBy);

  it('records the written row and the rows its cascade moved as the write’s', () => {
    const next = completeItemWrite(
      { ...EMPTY_ITEM_LIST_STATE, items: branch() },
      item('P', { workphaseId: 'doing' }),
      undefined,
      undefined,
      2,
    );

    expect(setBy(next)).toEqual({ P: 2, C: 2, G: 2, S: 2 });
  });

  it('records nothing for an answer that carries the workphase the row already holds', () => {
    const next = completeItemWrite(
      { ...EMPTY_ITEM_LIST_STATE, items: branch() },
      item('P', { workphaseId: 'todo', position: 3 }),
      undefined,
      undefined,
      2,
    );

    expect(setBy(next)).toEqual({});
  });

  it('lets an older write’s cascade reach a row whose later-sent answer carried the workphase it held', () => {
    // C's reorder, sent second, is answered first with the workphase C holds; P's move, sent first, then lands.
    const afterReorder = completeItemWrite(
      { ...EMPTY_ITEM_LIST_STATE, items: branch() },
      item('C', { parentId: 'P', workphaseId: 'todo', position: 3 }),
      undefined,
      undefined,
      2,
    );

    const next = completeItemWrite(afterReorder, item('P', { workphaseId: 'doing' }), undefined, undefined, 1);

    expect(workphases(next.items)).toEqual({ P: 'doing', C: 'doing', G: 'doing', S: 'doing' });
  });

  it('records nothing for an answer with no number', () => {
    const next = completeItemWrite({ ...EMPTY_ITEM_LIST_STATE, items: branch() }, item('P', { workphaseId: 'doing' }));

    expect(setBy(next)).toEqual({});
    expect(workphases(next.items)).toMatchObject({ P: 'doing', C: 'doing', G: 'doing' });
  });

  describe('an older answer for a row a later-sent write set', () => {
    // P's move, sent second, is answered first: P, C, G and S are in `doing`, all set by write 2.
    const afterMove = () =>
      completeItemWrite(
        { ...EMPTY_ITEM_LIST_STATE, items: branch() },
        item('P', { workphaseId: 'doing' }),
        undefined,
        undefined,
        2,
      );

    it('keeps the row’s workphase and cascades nothing from it, taking the rest of the answer', () => {
      const next = completeItemWrite(
        afterMove(),
        item('C', { parentId: 'P', workphaseId: 'todo', title: 'Reordered' }),
        undefined,
        undefined,
        1,
      );

      expect(workphases(next.items)).toEqual({ P: 'doing', C: 'doing', G: 'doing', S: 'doing' });
      expect(next.items.find(i => i.id === 'C')!.title).toBe('Reordered');
      expect(setBy(next)).toEqual({ P: 2, C: 2, G: 2, S: 2 });
    });

    it('keeps a missing workphase from returning', () => {
      const next = completeItemWrite(
        afterMove(),
        item('C', { parentId: 'P', workphaseId: null }),
        undefined,
        undefined,
        1,
      );

      expect(next.items.find(i => i.id === 'C')!.workphaseId).toBe('doing');
    });

    it('is applied in full when no later-sent write set the row', () => {
      const next = completeItemWrite(
        afterMove(),
        item('C', { parentId: 'P', workphaseId: 'review' }),
        undefined,
        undefined,
        3,
      );

      expect(workphases(next.items)).toEqual({ P: 'doing', C: 'review', G: 'review', S: 'doing' });
      expect(setBy(next)).toEqual({ P: 2, C: 3, G: 3, S: 2 });
    });
  });

  it('leaves a cascaded row that a later-sent write set, and everything under it', () => {
    // C was set by write 5, a later-sent write than P's 4: P's answer moves S, and neither C nor G under it.
    const state = { ...EMPTY_ITEM_LIST_STATE, items: branch(), workphaseSetBy: new Map([['C', 5]]) };

    const next = completeItemWrite(state, item('P', { workphaseId: 'doing' }), undefined, undefined, 4);

    expect(workphases(next.items)).toEqual({ P: 'doing', C: 'todo', G: 'todo', S: 'doing' });
    expect(setBy(next)).toEqual({ C: 5, P: 4, S: 4 });
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
    }
  });

  it("DRAG-6.1, TC-2.28: a top or bottom band drop is marked pending as the anchor it sends, so the board draws the same order before the server's answer and after it", async () => {
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
      // While the write is pending, X is drawn at the anchor the request carries, and no position
      // is given to it to get there.
      expect(freeItemOrder(state.items, state.placements), band).toEqual(order);
      expect(state.items.find(i => i.id === 'X')!.position, band).toBe(4);
      const next = completeItemWrite(state, response, marker);
      expect(freeItemOrder(next.items, next.placements), band).toEqual(order);
    }
  });

  // The case's own column, A, C and E, with X carried in from Doing: a drop beside A, and a release in the top
  // and the bottom band. What the board draws is read as the request leaves, before any answer.
  it('DRAG-6.1: in a column of A, C and E, a drop beside A is drawn A, X, C, E before the request leaves, and the top and bottom bands send before A and after E', async () => {
    const items = () => [
      item('A', { workphaseId: 'todo', position: 1 }),
      item('C', { workphaseId: 'todo', position: 3 }),
      item('E', { workphaseId: 'todo', position: 5 }),
      item('X', { workphaseId: 'doing', position: 9 }),
    ];
    const origin: Placement = { workphaseId: 'doing', slot: 'existing' };
    const column = [{ id: 'A' }, { id: 'C' }, { id: 'E' }];
    type Anchor = { anchorId: string; side: 'before' | 'after' };
    const cases: Array<[string, Placement, Anchor, number, string[]]> = [
      [
        'beside A',
        { workphaseId: 'todo', slot: { anchorId: 'A', side: 'after' } },
        { anchorId: 'A', side: 'after' },
        2,
        ['A', 'X', 'C', 'E'],
      ],
      [
        'top band',
        { workphaseId: 'todo', slot: 'first' },
        { anchorId: 'A', side: 'before' },
        0.5,
        ['X', 'A', 'C', 'E'],
      ],
      ['bottom band', { workphaseId: 'todo', slot: 'last' }, { anchorId: 'E', side: 'after' }, 6, ['A', 'C', 'E', 'X']],
    ];
    for (const [drop, ghost, anchor, resolved, order] of cases) {
      const response = item('X', { workphaseId: 'todo', position: resolved });
      const request = toRequest({ workphaseId: 'doing' }, origin, ghost, column)!;
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
      const sent: MoveItemInput[] = [];
      let drawn: string[] = [];
      let position: number | null | undefined;
      const moveItem = async (_id: string, data: MoveItemInput) => {
        sent.push(data);
        const state = withPlacement({ ...EMPTY_ITEM_LIST_STATE, items: items() }, 'X', marker);
        drawn = freeItemOrder(state.items, state.placements);
        position = state.items.find(i => i.id === 'X')!.position;
        return response;
      };
      await sendItemMove(moveItem, 'X', request, ghost, writes, () => {});

      // The request carries the workphase and the anchor, the board drew that same anchor as it left, and no
      // position was given to X to get there.
      expect(sent, drop).toEqual([{ workphaseId: 'todo', ...anchor }]);
      expect(drawn, drop).toEqual(order);
      expect(position, drop).toBe(9);
      // Once the answer is applied, the picture is the one already drawn.
      const pendingState = withPlacement({ ...EMPTY_ITEM_LIST_STATE, items: items() }, 'X', marker);
      const next = completeItemWrite(pendingState, response, marker);
      expect(freeItemOrder(next.items, next.placements), drop).toEqual(order);
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
  });

  it("TC-2.30, DRAG-6.2: a pending item keeps its position and its place when another item's response re-sorts the list", () => {
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
