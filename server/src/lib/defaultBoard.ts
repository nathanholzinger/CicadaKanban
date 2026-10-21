// createDefaultBoard: a new board with one column per workphase of its workflow.

import { db, type Tx } from '../db/index.js';
import { boards, columns, workphases } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { nextPosition } from './positionResolver.js';

type Workphase = typeof workphases.$inferSelect;

// Creates one board with 1:1 columns (one per current workphase) for a workflow, so every
// new board starts immediately usable rather than an all-Unsorted blank slate
// (wiki boards-columns-unsorted §1).
// Pass `tx` to fold this into a caller's transaction (e.g. workflow creation, where the
// workflow row + its seeded workphases + this bootstrap must commit together); omit it to
// run standalone in its own transaction.
export function createDefaultBoard(
  workflowId: string,
  name: string,
  workflowWorkphases: Workphase[],
  now: number,
  tx?: Tx,
) {
  const run = (e: Tx) => {
    const existingBoards = e.select().from(boards).where(eq(boards.workflowId, workflowId)).all();

    const boardId = randomUUID();
    e.insert(boards)
      .values({
        id: boardId,
        workflowId,
        name,
        position: nextPosition(existingBoards),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const sorted = [...workflowWorkphases].sort((a, b) => a.position - b.position);
    sorted.forEach((phase, i) => {
      e.insert(columns)
        .values({
          id: randomUUID(),
          boardId,
          name: null,
          startWorkphaseId: phase.id,
          endWorkphaseId: phase.id,
          displayMode: 'merged',
          position: i + 1.0,
          createdAt: now,
        })
        .run();
    });

    return e.select().from(boards).where(eq(boards.id, boardId)).get()!;
  };
  return tx ? run(tx) : db.transaction(run);
}
