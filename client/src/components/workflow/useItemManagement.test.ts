// The board's item state through its write entry points: an answer that lands after a later-sent write's
// leaves the positions that write set, whichever item each write was for. The answers are applied by hand, in
// the order each test names, and the board's order is read through `getWorkphaseItems`.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Item } from '../../types';
import { createItem, type ItemWriteResponse } from '../../api/items';
import { makeItem } from '../../test/itemFixture';
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
