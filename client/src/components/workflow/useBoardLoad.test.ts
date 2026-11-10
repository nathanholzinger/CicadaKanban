// The board's load: which answer the board shows when loads overlap and the selection changes between
// them (wiki boards-columns-unsorted §3). The server is held, so each test lands the answers in the order
// it names, and the drag-stop cue's two callbacks stand in for the cue.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { BoardWithDetails, Item, Workphase } from '../../types';
import { fetchBoard } from '../../api/boards';
import { makeItem } from '../../test/itemFixture';
import { useBoardLoad } from './useBoardLoad';
import { useItemManagement } from './useItemManagement';

vi.mock('../../api/boards');

function held<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const phase = (id: string, name: string, position: number): Workphase => ({
  id,
  workflowId: 'wf',
  name,
  position,
  triggersNotification: 0,
  isTerminal: 0,
  createdAt: 0,
});

// A board of one workflow with workphases W1 and W2 and the items X1 (in W1) and X2 (in W2): board A's one
// column covers both, board B has a column for each.
const x1 = (title: string) => makeItem('X1', { title, workphaseId: 'W1' });
const x2 = makeItem('X2', { title: 'Second', workphaseId: 'W2' });
const boardOf = (id: string, columns: Array<{ id: string; rows: Array<{ workphase: Workphase; items: Item[] }> }>) =>
  ({
    id,
    columns: columns.map(c => ({ id: c.id, subRows: c.rows })),
    unsorted: { uncovered: [], invalidItems: [], needsAttention: false },
    itemDepthCap: 4,
  }) as unknown as BoardWithDetails;
const boardA = (x1Title = 'Old') =>
  boardOf('A', [
    {
      id: 'CA',
      rows: [
        { workphase: phase('W1', 'Ready', 1), items: [x1(x1Title)] },
        { workphase: phase('W2', 'Review', 2), items: [x2] },
      ],
    },
  ]);
const boardB = (w1Name = 'Ready', x1Title = 'Current') =>
  boardOf('B', [
    { id: 'CB1', rows: [{ workphase: phase('W1', w1Name, 1), items: [x1(x1Title)] }] },
    { id: 'CB2', rows: [{ workphase: phase('W2', 'Review', 2), items: [x2] }] },
  ]);

// What a board draws, column by column: the workphases each covers and the items under them. Board B's, as
// the case lays it out: CB1 is W1 with X1, and CB2 is W2 with X2.
const placedIn = (board: BoardWithDetails | null) =>
  Object.fromEntries(
    (board?.columns ?? []).map(c => [c.id, c.subRows.map(r => [r.workphase.id, r.items.map(item => item.id)])]),
  );
const B_PLACED = { CB1: [['W1', ['X1']]], CB2: [['W2', ['X2']]] };
// The items the board was handed, each with the workphase it sits in and its title.
const handedOver = (items: Item[] | undefined) => (items ?? []).map(item => [item.id, item.workphaseId, item.title]);

// The loader with board `first` selected, and the cue's callbacks and the board's state as spies.
function mountLoader(first: string | null) {
  const setWorkphases = vi.fn<(workphases: Workphase[]) => void>();
  const replaceItems = vi.fn<(items: Item[]) => void>();
  const reloadStarted = vi.fn();
  const boardDrawn = vi.fn();
  // No item answer is applied during these tests' loads. Stable, like the item state's own.
  const answersApplied = () => 0;
  const hook = renderHook(
    ({ activeBoardId }: { activeBoardId: string | null }) =>
      useBoardLoad({ activeBoardId, setWorkphases, replaceItems, answersApplied, reloadStarted, boardDrawn }),
    { initialProps: { activeBoardId: first } },
  );
  const select = (activeBoardId: string | null) => hook.rerender({ activeBoardId });
  const shown = () => hook.result.current.board;
  const columnIds = () => shown()?.columns.map(c => c.id);
  return { hook, select, shown, columnIds, setWorkphases, replaceItems, reloadStarted, boardDrawn };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('BCU-1.7: a late load for another board cannot replace the selected board or complete its loading or cue', () => {
  // A's load is held, the user selects B, and B loads.
  async function selectBWhileAIsHeld(bAnswer: Promise<BoardWithDetails>) {
    const a = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(a.promise).mockReturnValueOnce(bAnswer);
    const loader = mountLoader('A');
    loader.select('B');
    return { ...loader, a };
  }

  it('keeps B selected, showing CB1 with X1 and CB2 with X2, when A’s answer lands', async () => {
    const { a, shown, columnIds, replaceItems } = await selectBWhileAIsHeld(Promise.resolve(boardB()));
    await waitFor(() => expect(shown()?.id).toBe('B'));

    await act(async () => a.resolve(boardA()));

    expect(shown()?.id).toBe('B');
    expect(columnIds()).toEqual(['CB1', 'CB2']);
    // CB1 holds W1 with X1 and CB2 holds W2 with X2, and the items the board holds sit in those workphases.
    expect(placedIn(shown())).toEqual(B_PLACED);
    expect(replaceItems).toHaveBeenCalledOnce();
    expect(handedOver(replaceItems.mock.calls[0][0])).toEqual([
      ['X1', 'W1', 'Current'],
      ['X2', 'W2', 'Second'],
    ]);
  });

  it('keeps B’s items, not A’s older snapshot of them: X1 stays Current', async () => {
    const { a, shown, replaceItems } = await selectBWhileAIsHeld(Promise.resolve(boardB()));
    await waitFor(() => expect(shown()?.id).toBe('B'));

    await act(async () => a.resolve(boardA('Old')));

    expect(replaceItems.mock.lastCall?.[0].find(item => item.id === 'X1')?.title).toBe('Current');
    expect(replaceItems.mock.calls.flatMap(([items]) => items).map(item => item.title)).not.toContain('Old');
  });

  it('leaves B loading when its own load is unanswered, and shows no board of A’s', async () => {
    const b = held<BoardWithDetails>();
    const { hook, a, shown } = await selectBWhileAIsHeld(b.promise);

    await act(async () => a.resolve(boardA()));

    expect(hook.result.current.loading).toBe(true);
    expect(shown()).toBeNull();

    await act(async () => b.resolve(boardB()));
    expect(hook.result.current.loading).toBe(false);
    expect(shown()?.id).toBe('B');
  });

  it('keeps the stop cue waiting for B’s own reload, which A’s late answer neither ends nor draws', async () => {
    // B has loaded; a forced stop on B starts its reload, and the cue waits for it to draw.
    const { hook, a, shown, boardDrawn, reloadStarted } = await selectBWhileAIsHeld(Promise.resolve(boardB()));
    await waitFor(() => expect(shown()?.id).toBe('B'));
    const reload = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(reload.promise);
    boardDrawn.mockClear();
    reloadStarted.mockClear();
    act(() => void hook.result.current.loadBoard());
    expect(reloadStarted).toHaveBeenCalledOnce();
    expect(hook.result.current.loading).toBe(true);

    await act(async () => a.resolve(boardA()));

    expect(boardDrawn).not.toHaveBeenCalled();
    expect(hook.result.current.loading).toBe(true);

    await act(async () => reload.resolve(boardB()));
    expect(boardDrawn).toHaveBeenCalledOnce();
    expect(hook.result.current.loading).toBe(false);
    expect(shown()?.id).toBe('B');
  });

  it('finishes the cue and the loading state for the selected board’s load that fails', async () => {
    vi.mocked(fetchBoard).mockRejectedValueOnce(new Error('down'));
    const { hook, boardDrawn } = mountLoader('A');

    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    expect(boardDrawn).toHaveBeenCalledOnce();
    expect(hook.result.current.board).toBeNull();
  });
});

describe('BCU-1.8: a shared change begun on another board refreshes the board currently selected', () => {
  // The Ready workphase is renamed to Doing while A is selected: the handler holds the loader it had on A,
  // and asks for the reload when the rename succeeds, after B was selected.
  async function renamedWhileBIs(bState: 'loaded' | 'loading') {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardA('Current'));
    const loader = mountLoader('A');
    await waitFor(() => expect(loader.shown()?.id).toBe('A'));
    const handlersLoader = loader.hook.result.current.loadBoard;
    const firstB = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(bState === 'loaded' ? Promise.resolve(boardB('Ready')) : firstB.promise);
    loader.select('B');
    if (bState === 'loaded') await waitFor(() => expect(loader.shown()?.id).toBe('B'));
    return { ...loader, handlersLoader, firstB };
  }

  it('reads B again when the follow-up load starts after B loaded, and B shows CB1 as Doing', async () => {
    const { handlersLoader, shown, columnIds, setWorkphases, replaceItems } = await renamedWhileBIs('loaded');
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardB('Doing'));

    await act(async () => handlersLoader());

    expect(fetchBoard).toHaveBeenLastCalledWith('B');
    expect(shown()?.id).toBe('B');
    expect(columnIds()).toEqual(['CB1', 'CB2']);
    expect(setWorkphases.mock.lastCall?.[0].map(w => w.name)).toEqual(['Doing', 'Review']);
    expect(shown()?.columns[0].subRows[0].workphase.name).toBe('Doing');
    // CB1 still holds W1 with X1 and CB2 holds W2 with X2, and the board's items are still in those workphases.
    expect(placedIn(shown())).toEqual(B_PLACED);
    expect(handedOver(replaceItems.mock.lastCall?.[0])).toEqual([
      ['X1', 'W1', 'Current'],
      ['X2', 'W2', 'Second'],
    ]);
  });

  it('shows B with the new name when B was still loading, whichever read lands last', async () => {
    const { handlersLoader, firstB, shown, hook, columnIds, replaceItems } = await renamedWhileBIs('loading');
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardB('Doing'));

    await act(async () => handlersLoader());
    expect(fetchBoard).toHaveBeenLastCalledWith('B');
    await act(async () => firstB.resolve(boardB('Ready')));

    expect(hook.result.current.loading).toBe(false);
    expect(shown()?.id).toBe('B');
    expect(columnIds()).toEqual(['CB1', 'CB2']);
    expect(shown()?.columns[0].subRows[0].workphase.name).toBe('Doing');
    // The older read, landing last, leaves B as the follow-up drew it: the same columns, workphases and items.
    expect(placedIn(shown())).toEqual(B_PLACED);
    expect(handedOver(replaceItems.mock.lastCall?.[0])).toEqual([
      ['X1', 'W1', 'Current'],
      ['X2', 'W2', 'Second'],
    ]);
  });

  it('never returns the selection to A: the handler’s load asks for the board selected now', async () => {
    const { handlersLoader } = await renamedWhileBIs('loaded');
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardB('Doing'));

    await act(async () => handlersLoader());

    expect(vi.mocked(fetchBoard).mock.calls.map(([id]) => id)).toEqual(['A', 'B', 'B']);
  });
});

describe('BCU-1.9: a failed switch cannot show the previous board under the selected board’s name or controls', () => {
  // A is loaded, B is selected, and B's read fails.
  async function bFailsAfterALoaded() {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardA()).mockRejectedValueOnce(new Error('down'));
    const loader = mountLoader('A');
    await waitFor(() => expect(loader.shown()?.id).toBe('A'));
    loader.select('B');
    expect(loader.hook.result.current.loading).toBe(true);
    await waitFor(() => expect(loader.hook.result.current.loading).toBe(false));
    return loader;
  }

  it('ends B’s loading with no board drawn: A’s columns are gone, not shown under B', async () => {
    const { shown, columnIds } = await bFailsAfterALoaded();

    expect(shown()).toBeNull();
    expect(columnIds()).toBeUndefined();
  });

  it('leaves the selection with B: no read of A follows the failure', async () => {
    const { hook } = await bFailsAfterALoaded();

    expect(vi.mocked(fetchBoard).mock.calls.map(([id]) => id)).toEqual(['A', 'B']);
    expect(hook.result.current.board).toBeNull();
  });

  it('draws B’s board when a later load of B succeeds', async () => {
    const { hook, shown } = await bFailsAfterALoaded();
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardB());

    await act(async () => hook.result.current.loadBoard());

    expect(shown()?.id).toBe('B');
    expect(placedIn(shown())).toEqual(B_PLACED);
  });
});

// Outside the catalog: the loader's own rule for a failed load of the board already drawn.
describe('a failed reload of the board already drawn', () => {
  it('keeps that board drawn, ends loading and finishes the cue', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardA()).mockRejectedValueOnce(new Error('down'));
    const { hook, shown, boardDrawn } = mountLoader('A');
    await waitFor(() => expect(shown()?.id).toBe('A'));
    boardDrawn.mockClear();

    await act(async () => hook.result.current.loadBoard());

    expect(hook.result.current.loading).toBe(false);
    expect(shown()?.id).toBe('A');
    expect(boardDrawn).toHaveBeenCalledOnce();
  });
});

// The loader composed with the board's item state, as `BoardView` wires them. The workflow has W1 and W2 and
// the Free items X (in W1) and Y (in W2). Board A's one column CA covers both; board B has CB1 for W1 and
// CB2 for W2. A read that predates the move of X to W2 has X in W1; one that follows it has X in W2.
const itemX = (workphaseId: 'W1' | 'W2') => makeItem('X', { title: 'X', workphaseId });
const itemY = makeItem('Y', { title: 'Y', workphaseId: 'W2' });
const boardAWith = (xIn: 'W1' | 'W2') =>
  boardOf('A', [
    {
      id: 'CA',
      rows: [
        { workphase: phase('W1', 'Ready', 1), items: xIn === 'W1' ? [itemX('W1')] : [] },
        { workphase: phase('W2', 'Review', 2), items: xIn === 'W1' ? [itemY] : [itemX('W2'), itemY] },
      ],
    },
  ]);
const boardBWith = (xIn: 'W1' | 'W2') =>
  boardOf('B', [
    { id: 'CB1', rows: [{ workphase: phase('W1', 'Ready', 1), items: xIn === 'W1' ? [itemX('W1')] : [] }] },
    {
      id: 'CB2',
      rows: [{ workphase: phase('W2', 'Review', 2), items: xIn === 'W1' ? [itemY] : [itemX('W2'), itemY] }],
    },
  ]);
const B_BEFORE_THE_MOVE = { CB1: [['W1', ['X']]], CB2: [['W2', ['Y']]] };
const B_AFTER_THE_MOVE = { CB1: [['W1', []]], CB2: [['W2', ['X', 'Y']]] };

function mountBoard(first: string) {
  const setWorkphases = vi.fn<(workphases: Workphase[]) => void>();
  const reloadStarted = vi.fn();
  const boardDrawn = vi.fn();
  const hook = renderHook(
    ({ activeBoardId }: { activeBoardId: string | null }) => {
      const list = useItemManagement('p1', undefined);
      const load = useBoardLoad({
        activeBoardId,
        setWorkphases,
        replaceItems: list.replaceItems,
        reloadStarted,
        boardDrawn,
        answersApplied: list.answersApplied,
      });
      return { list, load };
    },
    { initialProps: { activeBoardId: first } },
  );
  const select = (activeBoardId: string) => hook.rerender({ activeBoardId });
  const shown = () => hook.result.current.load.board;
  const loading = () => hook.result.current.load.loading;
  const workphases = () => Object.fromEntries(hook.result.current.list.items.map(item => [item.id, item.workphaseId]));
  const reload = () => act(() => void hook.result.current.load.loadBoard());
  // The move of X to W2: sent now, and its successful answer applied when the returned function is called.
  const sendMove = () => {
    let seq = 0;
    act(() => {
      seq = hook.result.current.list.writes.begin('X', null);
    });
    return () =>
      act(() => {
        hook.result.current.list.writes.complete('X', seq, itemX('W2'));
      });
  };
  const fetched = () => vi.mocked(fetchBoard).mock.calls.map(([id]) => id);
  return { hook, select, shown, loading, workphases, reload, sendMove, fetched, reloadStarted, boardDrawn };
}

describe('BCU-1.10: a board read cannot undo a write whose answer was applied while it ran', () => {
  it('on a switch to B, applies nothing from B’s older read and keeps B loading until the read made again shows X in W2', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardAWith('W1'));
    const board = mountBoard('A');
    await waitFor(() => expect(board.shown()?.id).toBe('A'));
    const answerMove = board.sendMove();
    const older = held<BoardWithDetails>();
    const again = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(older.promise).mockReturnValueOnce(again.promise);
    board.boardDrawn.mockClear();
    board.select('B');

    answerMove();
    expect(board.workphases()).toEqual({ X: 'W2', Y: 'W2' });
    await act(async () => older.resolve(boardBWith('W1')));

    // The older read had X in W1: it neither restored that nor drew it, and B is still loading.
    expect(board.workphases()).toEqual({ X: 'W2', Y: 'W2' });
    expect(placedIn(board.shown())).not.toEqual(B_BEFORE_THE_MOVE);
    expect(board.loading()).toBe(true);
    expect(board.boardDrawn).not.toHaveBeenCalled();
    expect(board.fetched()).toEqual(['A', 'B', 'B']);

    await act(async () => again.resolve(boardBWith('W2')));

    expect(board.loading()).toBe(false);
    expect(board.shown()?.id).toBe('B');
    expect(placedIn(board.shown())).toEqual(B_AFTER_THE_MOVE);
    expect(board.workphases()).toEqual({ X: 'W2', Y: 'W2' });
    expect(board.boardDrawn).toHaveBeenCalledOnce();
    expect(board.fetched()).toEqual(['A', 'B', 'B']);
  });

  it('on a reload of the selected B, ends with X and Y in CB2 the same way', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardBWith('W1'));
    const board = mountBoard('B');
    await waitFor(() => expect(placedIn(board.shown())).toEqual(B_BEFORE_THE_MOVE));
    const answerMove = board.sendMove();
    const older = held<BoardWithDetails>();
    const again = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(older.promise).mockReturnValueOnce(again.promise);
    board.reload();

    answerMove();
    await act(async () => older.resolve(boardBWith('W1')));

    expect(board.workphases()).toEqual({ X: 'W2', Y: 'W2' });
    expect(placedIn(board.shown())).toEqual(B_BEFORE_THE_MOVE);
    expect(board.loading()).toBe(true);

    await act(async () => again.resolve(boardBWith('W2')));

    expect(board.loading()).toBe(false);
    expect(placedIn(board.shown())).toEqual(B_AFTER_THE_MOVE);
    expect(board.workphases()).toEqual({ X: 'W2', Y: 'W2' });
    expect(board.fetched()).toEqual(['B', 'B', 'B']);
  });

  it('leaves the stop cue to the one reload: it is neither completed by the older read nor started again by the read made again', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardBWith('W1'));
    const board = mountBoard('B');
    await waitFor(() => expect(board.shown()?.id).toBe('B'));
    const answerMove = board.sendMove();
    const older = held<BoardWithDetails>();
    const again = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(older.promise).mockReturnValueOnce(again.promise);
    board.reloadStarted.mockClear();
    board.boardDrawn.mockClear();
    board.reload();
    expect(board.reloadStarted).toHaveBeenCalledOnce();

    answerMove();
    await act(async () => older.resolve(boardBWith('W1')));

    expect(board.loading()).toBe(true);
    expect(board.boardDrawn).not.toHaveBeenCalled();
    expect(board.reloadStarted).toHaveBeenCalledOnce();

    await act(async () => again.resolve(boardBWith('W2')));

    expect(board.boardDrawn).toHaveBeenCalledOnce();
    expect(board.reloadStarted).toHaveBeenCalledOnce();
    expect(placedIn(board.shown())).toEqual(B_AFTER_THE_MOVE);
  });
});

// Outside the catalog: when a read is made again, and how it ends.
describe('a board read made again', () => {
  it('is not made when the answer was applied before the read began', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardAWith('W1'));
    const board = mountBoard('A');
    await waitFor(() => expect(board.shown()?.id).toBe('A'));
    board.sendMove()();
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardBWith('W2'));

    board.select('B');

    await waitFor(() => expect(board.shown()?.id).toBe('B'));
    expect(board.fetched()).toEqual(['A', 'B']);
  });

  it('is made again while answers keep landing, until a read lands with none applied since it began', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardBWith('W1'));
    const board = mountBoard('B');
    await waitFor(() => expect(board.shown()?.id).toBe('B'));
    const reads = [held<BoardWithDetails>(), held<BoardWithDetails>(), held<BoardWithDetails>()];
    for (const read of reads) vi.mocked(fetchBoard).mockReturnValueOnce(read.promise);
    board.reload();

    // An answer lands during each of the first two reads.
    board.sendMove()();
    await act(async () => reads[0].resolve(boardBWith('W1')));
    board.sendMove()();
    await act(async () => reads[1].resolve(boardBWith('W1')));
    expect(board.loading()).toBe(true);

    await act(async () => reads[2].resolve(boardBWith('W2')));

    expect(board.loading()).toBe(false);
    expect(placedIn(board.shown())).toEqual(B_AFTER_THE_MOVE);
    expect(board.fetched()).toEqual(['B', 'B', 'B', 'B']);
  });

  it('that fails ends the loading and finishes the cue once, leaving the board that was drawn', async () => {
    vi.mocked(fetchBoard).mockResolvedValueOnce(boardBWith('W1'));
    const board = mountBoard('B');
    await waitFor(() => expect(board.shown()?.id).toBe('B'));
    const older = held<BoardWithDetails>();
    vi.mocked(fetchBoard).mockReturnValueOnce(older.promise).mockRejectedValueOnce(new Error('down'));
    board.boardDrawn.mockClear();
    board.reload();

    board.sendMove()();
    await act(async () => older.resolve(boardBWith('W1')));

    await waitFor(() => expect(board.loading()).toBe(false));
    expect(board.boardDrawn).toHaveBeenCalledOnce();
    expect(board.shown()?.id).toBe('B');
  });
});
