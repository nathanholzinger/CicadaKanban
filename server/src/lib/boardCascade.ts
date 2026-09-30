// deleteBoardsById: transactional columns→boards delete, shared by all 3 board-delete paths.

import { db, type Tx } from '../db/index.js';
import { boards, columns } from '../db/schema.js';
import { inArray } from 'drizzle-orm';

// Deletes every column belonging to the given boards, then the boards
// themselves. Shared by boards.ts (deleting a single board), workflows.ts
// (deleting one workflow's boards), and projects.ts (deleting every board
// across a project's descendant workflows). Pass `tx` to run inside a caller's transaction (e.g. workflow delete, where
// columns must be removed before the workphases they reference); omit it to run
// standalone in its own transaction.
export function deleteBoardsById(boardIds: string[], tx?: Tx): void {
  if (boardIds.length === 0) return;
  const run = (e: Tx) => {
    e.delete(columns).where(inArray(columns.boardId, boardIds)).run();
    e.delete(boards).where(inArray(boards.id, boardIds)).run();
  };
  if (tx) run(tx);
  else db.transaction(run);
}
