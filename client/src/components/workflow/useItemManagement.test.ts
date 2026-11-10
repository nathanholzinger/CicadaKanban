// The board's item state through its write entry points: an answer that lands after a later-sent write's
// leaves the positions that write set, whichever item each write was for. The answers are applied by hand, in
// the order each test names, and the board's order is read through `getWorkphaseItems`.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Item } from '../../types';
import { createItem, type ItemWriteResponse } from '../../api/items';
import { makeItem } from '../../test/itemFixture';
import { hasUnknownStatusItem } from './itemListOps';
import { useItemManagement } from './useItemManagement';

vi.mock('../../api/items');

// Active Free items in one workphase, X at 1, Y at 998 and Z at 999.
const START = () => [
  makeItem('X', { position: 1 }),
  makeItem('Y', { position: 998 }),
  makeItem('Z', { position: 999 }),
];

function openBoard(items: Item[] = START()) {
  const hook = renderHook(() => useItemManagement('p1', undefined));
  act(() => hook.result.current.replaceItems(items));
  const board = () => hook.result.current;
  const order = () =>
    board()
      .getWorkphaseItems('todo')
      .map(item => item.id);
  const positions = () => Object.fromEntries(board().items.map(item => [item.id, item.position]));
  // A drag's write: sent now, and answered when the test says.
  const sendMove = (id: string) => {
    let seq = 0;
    act(() => {
      seq = board().writes.begin(id, null);
    });
    return (response: ItemWriteResponse) =>
      act(() => {
        board().writes.complete(id, seq, response);
      });
  };
  return { board, order, positions, sendMove };
}

const withPairs = (item: Item, ...pairs: Array<[string, number]>): ItemWriteResponse => ({
  ...item,
  reindexed: pairs.map(([id, position]) => ({ id, position })),
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('DRAG-6.29: answers for different items preserve positions set by the later write', () => {
  describe('given X moved after Z (Y = 1, Z = 2, X = 3 disclosed), then Y moved after X (Y = 4)', () => {
    const xAnswer = () => withPairs(makeItem('X', { position: 3 }), ['Y', 1], ['Z', 2], ['X', 3]);
    const yAnswer = () => makeItem('Y', { position: 4 });

    it('keeps Y at 4 when X’s older answer lands second, with Z = 2 and X = 3 applied: Z, X, Y', () => {
      const { order, positions, sendMove } = openBoard();
      const answerX = sendMove('X');
      const answerY = sendMove('Y');

      answerY(yAnswer());
      answerX(xAnswer());

      expect(positions()).toEqual({ X: 3, Y: 4, Z: 2 });
      expect(order()).toEqual(['Z', 'X', 'Y']);
    });

    it('ends the same when the answers land in the order the writes were sent', () => {
      const { order, positions, sendMove } = openBoard();
      const answerX = sendMove('X');
      const answerY = sendMove('Y');

      answerX(xAnswer());
      answerY(yAnswer());

      expect(positions()).toEqual({ X: 3, Y: 4, Z: 2 });
      expect(order()).toEqual(['Z', 'X', 'Y']);
    });
  });

  describe('given X saved between Y and Z (X = 998.5), then Y after Z (X = 1, Z = 2, Y = 3 disclosed)', () => {
    const xAnswer = () => makeItem('X', { position: 998.5 });
    const yAnswer = () => withPairs(makeItem('Y', { position: 3 }), ['X', 1], ['Z', 2], ['Y', 3]);

    it('keeps X at 1 when its older written row lands second: X, Z, Y', () => {
      const { order, positions, sendMove } = openBoard();
      const answerX = sendMove('X');
      const answerY = sendMove('Y');

      answerY(yAnswer());
      answerX(xAnswer());

      expect(positions()).toEqual({ X: 1, Y: 3, Z: 2 });
      expect(order()).toEqual(['X', 'Z', 'Y']);
    });

    it('ends the same when the answers land in the order the writes were sent', () => {
      const { order, positions, sendMove } = openBoard();
      const answerX = sendMove('X');
      const answerY = sendMove('Y');

      answerX(xAnswer());
      answerY(yAnswer());

      expect(positions()).toEqual({ X: 1, Y: 3, Z: 2 });
      expect(order()).toEqual(['X', 'Z', 'Y']);
    });
  });

  it('takes the rest of an older answer: its own row’s other fields, though not its position', () => {
    const { board, sendMove } = openBoard();
    const answerX = sendMove('X');
    const answerY = sendMove('Y');

    answerY(withPairs(makeItem('Y', { position: 4 }), ['X', 2], ['Y', 4]));
    answerX(makeItem('X', { position: 3, title: 'Saved by the older write' }));

    expect(board().items.find(item => item.id === 'X')).toMatchObject({
      position: 2,
      title: 'Saved by the older write',
    });
  });

  describe('an inline create', () => {
    // N is created at the end, which reindexes every row; Y is then moved after N.
    const nAnswer = () => withPairs(makeItem('N', { position: 4 }), ['X', 1], ['Y', 2], ['Z', 3], ['N', 4]);
    const yAnswer = () => makeItem('Y', { position: 5 });

    async function createThenMove(landing: 'create-last' | 'create-first') {
      const board = openBoard();
      let answerCreate!: (response: ItemWriteResponse) => void;
      vi.mocked(createItem).mockReturnValueOnce(new Promise(resolve => (answerCreate = resolve)));
      let created!: Promise<void>;
      act(() => {
        created = board.board().handleCreateItem('todo', 'New', null);
      });
      const answerY = board.sendMove('Y');

      if (landing === 'create-last') {
        answerY(yAnswer());
        await act(async () => {
          answerCreate(nAnswer());
          await created;
        });
      } else {
        await act(async () => {
          answerCreate(nAnswer());
          await created;
        });
        answerY(yAnswer());
      }
      return board;
    }

    it('leaves the position of a row a later-sent drag set, when its answer lands after the drag’s', async () => {
      const { order, positions } = await createThenMove('create-last');

      expect(positions()).toEqual({ X: 1, Y: 5, Z: 3, N: 4 });
      expect(order()).toEqual(['X', 'Z', 'N', 'Y']);
    });

    it('ends the same when the answers land in the order the writes were sent', async () => {
      const { order, positions } = await createThenMove('create-first');

      expect(positions()).toEqual({ X: 1, Y: 5, Z: 3, N: 4 });
      expect(order()).toEqual(['X', 'Z', 'N', 'Y']);
    });
  });

  describe('an answer the Sheet passes up', () => {
    it('is the latest write: a drag sent before it, answered after, leaves what it set', () => {
      const { order, positions, board, sendMove } = openBoard();
      const answerX = sendMove('X');

      // The Sheet's edit of Y lands first and sets Y at 4.
      act(() => board().handleItemUpdated(makeItem('Y', { position: 4 })));
      answerX(withPairs(makeItem('X', { position: 3 }), ['Y', 1], ['Z', 2], ['X', 3]));

      expect(positions()).toEqual({ X: 3, Y: 4, Z: 2 });
      expect(order()).toEqual(['Z', 'X', 'Y']);
    });

    it('holds a child the Sheet created to the same rule', () => {
      const { positions, board, sendMove } = openBoard();
      const answerX = sendMove('X');

      act(() => board().handleChildCreated(withPairs(makeItem('N', { parentId: 'Z' }), ['Y', 2])));
      answerX(withPairs(makeItem('X', { position: 3 }), ['Y', 1], ['Z', 2], ['X', 3]));

      expect(positions()).toMatchObject({ X: 3, Y: 2, Z: 2 });
    });

    it('applies a drag’s answer in full when no Sheet write came after it', () => {
      const { positions, board, sendMove } = openBoard();
      act(() => board().handleItemUpdated(makeItem('Y', { position: 4 })));
      const answerX = sendMove('X');

      answerX(withPairs(makeItem('X', { position: 3 }), ['Y', 1], ['Z', 2], ['X', 3]));

      expect(positions()).toEqual({ X: 3, Y: 1, Z: 2 });
    });
  });
});

describe('ATT-1.15: an older child answer cannot undo a later parent workphase cascade', () => {
  // P is Free; C and S are its attached children, in that order, and G is attached under C. The workflow's
  // workphases are W1 and W2, and the board's columns cover both.
  const WORKFLOW = ['W1', 'W2'];
  const family = (workphaseId: string | null) => [
    makeItem('P', { workphaseId }),
    makeItem('C', { parentId: 'P', position: 1, workphaseId }),
    makeItem('S', { parentId: 'P', position: 2, workphaseId }),
    makeItem('G', { parentId: 'C', workphaseId }),
  ];

  // C is reordered after S, and then P is moved to W2. C's answer carries the workphase C had when it was sent.
  function reorderThenMove(from: string | null, landing: 'older-last' | 'in-order') {
    const { board, sendMove } = openBoard(family(from));
    const answerC = sendMove('C');
    const answerP = sendMove('P');
    const cAnswer = () => makeItem('C', { parentId: 'P', position: 3, workphaseId: from });
    const pAnswer = () => makeItem('P', { workphaseId: 'W2' });

    if (landing === 'older-last') {
      answerP(pAnswer());
      answerC(cAnswer());
    } else {
      answerC(cAnswer());
      answerP(pAnswer());
    }
    const ids = (items: Item[]) => items.map(item => item.id);
    return {
      workphases: () => Object.fromEntries(board().items.map(item => [item.id, item.workphaseId])),
      cards: (workphaseId: string) => ids(board().getWorkphaseItems(workphaseId)),
      stubsOf: (parentId: string) => ids(board().getAttachedChildren(parentId)),
      unknown: () => ({
        badge: hasUnknownStatusItem(board().items, WORKFLOW),
        items: ids(board().getUnknownStatusItems(WORKFLOW)),
      }),
    };
  }

  describe.each(['older-last', 'in-order'] as const)(
    'given P, C, S and G in W1, with C’s answer landing %s',
    landing => {
      it('leaves P, C, S and G in W2, with P’s Card in W2’s column holding C and G as Stubs', () => {
        const { workphases, cards, stubsOf } = reorderThenMove('W1', landing);

        expect(workphases()).toEqual({ P: 'W2', C: 'W2', S: 'W2', G: 'W2' });
        expect(cards('W2')).toEqual(['P']);
        expect(cards('W1')).toEqual([]);
        expect(stubsOf('P')).toEqual(['S', 'C']);
        expect(stubsOf('C')).toEqual(['G']);
      });
    },
  );

  describe.each(['older-last', 'in-order'] as const)(
    'given a hierarchy with no workphase, with the reorder’s answer landing %s',
    landing => {
      it('gives every item W2, with no item in Unknown status and no attention raised again', () => {
        const { workphases, unknown } = reorderThenMove(null, landing);

        expect(workphases()).toEqual({ P: 'W2', C: 'W2', S: 'W2', G: 'W2' });
        expect(unknown()).toEqual({ badge: false, items: [] });
      });
    },
  );
});

// The Sheet numbers its answers as they land, so a write the board sent before one is the older.
describe('an answer the Sheet passes up, for a row’s workphase', () => {
  const family = () => [makeItem('P', { workphaseId: 'W1' }), makeItem('C', { parentId: 'P', workphaseId: 'W1' })];

  it('is the latest write: a move sent before it, answered after, leaves the workphases it set', () => {
    const { board, sendMove } = openBoard(family());
    const answerP = sendMove('P');

    // The Sheet's move of P to W2 lands first, cascading to its attached child.
    act(() => board().handleItemUpdated(makeItem('P', { workphaseId: 'W2' })));
    // P's older answer carries the workphase P held when it was sent.
    answerP(makeItem('P', { workphaseId: 'W1', position: 3 }));

    const workphases = Object.fromEntries(board().items.map(item => [item.id, item.workphaseId]));
    expect(workphases).toEqual({ P: 'W2', C: 'W2' });
  });
});

// The Unsorted bucket's "needs attention" badge counts an Attached item whose own workphase is unknown, as
// the API's `needsAttention` does (wiki boards-columns-unsorted §10). The server gives an Attached item its
// parent's workphase, so filing a parent files them too, and the badge goes with the answer.
describe('filing a parent out of Unknown status', () => {
  // P has no workphase, and nor do C under it and G under C, as the server leaves them.
  const unknownBranch = () => [
    makeItem('P', { workphaseId: null }),
    makeItem('C', { parentId: 'P', workphaseId: null }),
    makeItem('G', { parentId: 'C', workphaseId: null }),
  ];

  it('takes the badge down once P’s answer lands, with its Attached descendants no longer unknown', () => {
    const { board, sendMove } = openBoard(unknownBranch());
    const badge = () => hasUnknownStatusItem(board().items, ['todo']);
    expect(badge()).toBe(true);

    sendMove('P')(makeItem('P', { workphaseId: 'todo' }));

    expect(badge()).toBe(false);
  });
});
