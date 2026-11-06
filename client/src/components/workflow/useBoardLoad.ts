// The board's load: the selected board read from the server, and what the board shows of it while that
// read runs. Every caller goes through `loadBoard`, so there is one rule for which answer is shown: a
// selection change, a workphase or column change, and a drag's resync (wiki boards-columns-unsorted §3).
// - A load reads the board selected when it starts, from a ref, never from the closure of the handler
//   that asked. A handler begun on board A that reloads after B was selected therefore reloads B: the
//   boards of one `BoardView` share a workflow, so what A's handler changed, B shows too.
// - A load applies its answer, ends the loading state and finishes the drag-stop cue only while it is the
//   latest load and its board is still selected. A late answer for another board, or for a load a later
//   one replaced, changes none of them.
// The cue's two callbacks (`useForcedStop.ts`) are inputs, so the loader needs no drag to be tested.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardWithDetails, Item, Workphase } from '../../types';
import { fetchBoard } from '../../api/boards';
import { useLatest } from './useLatest';

interface BoardLoadDeps {
  activeBoardId: string | null;
  setWorkphases: (workphases: Workphase[]) => void;
  replaceItems: (items: Item[]) => void;
  /** A load is starting: the cue's flash still playing is let go. */
  reloadStarted: () => void;
  /** The loaded board is drawn: the cue's flash that waited for it plays. */
  boardDrawn: () => void;
}

export function useBoardLoad({ activeBoardId, setWorkphases, replaceItems, reloadStarted, boardDrawn }: BoardLoadDeps) {
  const [board, setBoard] = useState<BoardWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // Called first, so its effect runs ahead of the load effect below: a load a selection change starts
  // reads the selection that change made.
  const selected = useLatest(activeBoardId);
  const latestLoad = useRef(0);

  const loadBoard = useCallback(async () => {
    const load = ++latestLoad.current;
    const boardId = selected.current;
    reloadStarted();
    if (!boardId) {
      setBoard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const isCurrent = () => load === latestLoad.current && boardId === selected.current;
    try {
      const data = await fetchBoard(boardId);
      if (!isCurrent()) return;
      setBoard(data);

      // Workphases are workflow-scoped (independent of which board is active) —
      // derived here from the board response instead of a second fetch, since
      // every workphase appears exactly once across columns + unsorted.
      const allWorkphases = [
        ...data.columns.flatMap(c => c.subRows.map(r => r.workphase)),
        ...data.unsorted.uncovered.map(r => r.workphase),
      ].sort((a, b) => a.position - b.position);
      setWorkphases(allWorkphases);

      const allItems = [
        ...data.columns.flatMap(c => c.subRows.flatMap(r => r.items)),
        ...data.unsorted.uncovered.flatMap(r => r.items),
        ...data.unsorted.invalidItems,
      ];
      replaceItems(allItems);
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      if (isCurrent()) {
        setLoading(false);
        boardDrawn();
      }
    }
  }, [selected, setWorkphases, replaceItems, reloadStarted, boardDrawn]);

  useEffect(() => {
    // loadBoard's synchronous setBoard(null)/setLoading(true) at the top is
    // also called imperatively (not from an effect, so unflagged) from the
    // workphase handlers, and by useColumnManagement/useBoardDnd, all of
    // which rely on the same immediate loading flash. Deriving `loading`
    // from state instead would silently drop that flash from those other
    // call sites — a real behavior change, not a lint-only fix.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadBoard's sync loading flash is shared with its imperative callers
    loadBoard();
  }, [activeBoardId, loadBoard]);

  return { board, setBoard, loading, loadBoard };
}
