import { db } from '../db/index.js';
import { boards, columns } from '../db/schema.js';
import { inArray } from 'drizzle-orm';

// Deletes every column belonging to the given boards, then the boards
// themselves, in one transaction. Shared by boards.ts (deleting a single
// board), workflows.ts (deleting one workflow's boards), and projects.ts
// (deleting every board across a project's descendant workflows) — the same
// two-step cascade was previously hand-rolled three times with three
// different call shapes.
export function deleteBoardsById(boardIds: string[]): void {
  if (boardIds.length === 0) return;
  db.transaction(tx => {
    tx.delete(columns).where(inArray(columns.boardId, boardIds)).run();
    tx.delete(boards).where(inArray(boards.id, boardIds)).run();
  });
}
