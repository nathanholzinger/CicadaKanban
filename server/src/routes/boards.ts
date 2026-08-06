import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { boards, columns, workflows, workphases, items } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getOrderedWorkphases, isColumnBroken, getCoveredWorkphases, computeUnsorted } from '../lib/columnRanges.js';
import { getBoardScopeItems } from '../lib/workflowItems.js';
import { deleteBoardsById } from '../lib/boardCascade.js';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { nextPosition } from '../lib/positions.js';

type Workphase = typeof workphases.$inferSelect;
type ItemRow = typeof items.$inferSelect;

// Creates one board with 1:1 columns (one per current workphase) for a
// workflow. Shared by POST /api/workflows (new-workflow bootstrap), POST
// /api/boards (additional boards), and runMigrations' backfill phase — every
// new board starts immediately usable rather than an all-Unsorted blank slate.
// Pass `tx` to fold this into a caller's transaction (e.g. workflow creation,
// where the workflow row + its seeded workphases + this bootstrap must commit
// together); omit it to run standalone in its own transaction.
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
    e.insert(boards).values({
      id: boardId,
      workflowId,
      name,
      position: nextPosition(existingBoards),
      createdAt: now,
      updatedAt: now,
    }).run();

    const sorted = [...workflowWorkphases].sort((a, b) => a.position - b.position);
    sorted.forEach((phase, i) => {
      e.insert(columns).values({
        id: randomUUID(),
        boardId,
        name: null,
        startWorkphaseId: phase.id,
        endWorkphaseId: phase.id,
        displayMode: 'merged',
        position: i + 1.0,
        createdAt: now,
      }).run();
    });

    return e.select().from(boards).where(eq(boards.id, boardId)).get()!;
  };
  return tx ? run(tx) : db.transaction(run);
}

function displayNameFor(name: string | null, covered: Workphase[]): string {
  if (name) return name;
  if (covered.length === 0) return '(empty range)';
  if (covered.length === 1) return covered[0].name;
  return `${covered[0].name} – ${covered[covered.length - 1].name}`;
}

function subRowsFor(phases: Workphase[], itemsByWorkphase: Map<string, ItemRow[]>) {
  return phases.map(w => ({ workphase: w, items: itemsByWorkphase.get(w.id) ?? [] }));
}

const router = Router();

// List all boards, optionally filtered by workflow
router.get('/', (req, res) => {
  const { workflowId } = req.query;
  const allBoards = workflowId
    ? db.select().from(boards).where(eq(boards.workflowId, String(workflowId))).all()
    : db.select().from(boards).all();
  res.json(allBoards);
});

// Get a board with its columns (resolved to sub-rows) and unsorted bucket
router.get('/:id', (req, res) => {
  const board = getByIdOrNotFound(boards, req.params.id, res, 'Board not found');
  if (!board) return;

  const { workphases: workflowWorkphases, rankMap } = getOrderedWorkphases(board.workflowId);

  const boardColumns = db.select().from(columns)
    .where(eq(columns.boardId, board.id))
    .orderBy(columns.position)
    .all();

  // Every item whose project's effective workflow is this one — scoped by
  // project (not by workphase membership) so that items with a null/misaligned
  // workphase are surfaced as "Unknown status" instead of silently dropped.
  // Per-project narrowing for inherited/read-only views is left to the client.
  const scopeItems = getBoardScopeItems(board.workflowId);

  const workphaseIdSet = new Set(workflowWorkphases.map(w => w.id));
  const itemsByWorkphase = new Map<string, ItemRow[]>();
  for (const item of scopeItems) {
    if (item.workphaseId && workphaseIdSet.has(item.workphaseId)) {
      const list = itemsByWorkphase.get(item.workphaseId) ?? [];
      list.push(item);
      itemsByWorkphase.set(item.workphaseId, list);
    }
  }

  const resolvedColumns = boardColumns.map(col => {
    const covered = getCoveredWorkphases(col, workflowWorkphases, rankMap);
    return {
      ...col,
      displayName: displayNameFor(col.name, covered),
      broken: isColumnBroken(col, rankMap),
      entryWorkphaseId: covered[0]?.id ?? col.startWorkphaseId,
      subRows: subRowsFor(covered, itemsByWorkphase),
    };
  });

  const { uncovered, invalidItems } = computeUnsorted(workflowWorkphases, boardColumns, rankMap, scopeItems);

  res.json({
    ...board,
    columns: resolvedColumns,
    unsorted: {
      uncovered: subRowsFor(uncovered, itemsByWorkphase),
      invalidItems,
      needsAttention: uncovered.length > 0 || invalidItems.length > 0,
    },
  });
});

// Create a board — bootstrapped with 1:1 columns from the workflow's current workphases
router.post('/', (req, res) => {
  const { workflowId, name } = req.body;

  if (!workflowId || !name) {
    res.status(400).json({ error: 'workflowId and name are required' });
    return;
  }

  const workflow = getByIdOrNotFound(workflows, workflowId, res, 'Workflow not found');
  if (!workflow) return;

  const { workphases: workflowWorkphases } = getOrderedWorkphases(workflowId);
  const board = createDefaultBoard(workflowId, name, workflowWorkphases, Date.now());
  res.status(201).json(board);
});

// Rename a board and/or update its display settings
router.put('/:id', (req, res) => {
  const board = getByIdOrNotFound(boards, req.params.id, res, 'Board not found');
  if (!board) return;

  const { name, showAttachedChildren } = req.body;

  let nextShowAttachedChildren = board.showAttachedChildren;
  if (showAttachedChildren !== undefined) nextShowAttachedChildren = showAttachedChildren ? 1 : 0;

  db.update(boards).set({
    name: name ?? board.name,
    showAttachedChildren: nextShowAttachedChildren,
    updatedAt: Date.now(),
  }).where(eq(boards.id, req.params.id)).run();

  const updated = db.select().from(boards).where(eq(boards.id, req.params.id)).get();
  res.json(updated);
});

// Delete a board and its columns — blocked if it's the workflow's last board
router.delete('/:id', (req, res) => {
  const board = getByIdOrNotFound(boards, req.params.id, res, 'Board not found');
  if (!board) return;

  const siblingBoards = db.select().from(boards).where(eq(boards.workflowId, board.workflowId)).all();
  if (siblingBoards.length <= 1) {
    res.status(409).json({ error: "Cannot delete a workflow's last remaining board" });
    return;
  }

  deleteBoardsById([board.id]);
  res.status(204).send();
});

export default router;
