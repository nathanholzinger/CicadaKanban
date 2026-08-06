import { Router } from 'express';
import { db } from '../db/index.js';
import { boards, columns } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getOrderedWorkphases, validateColumnRange } from '../lib/columnRanges.js';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { applyReorder } from '../lib/reorder.js';
import { nextPosition } from '../lib/positions.js';

const router = Router();

// Create a column on a board — start/end define a contiguous workphase range
router.post('/', (req, res) => {
  const { boardId, startWorkphaseId, endWorkphaseId, displayMode, name } = req.body;

  if (!boardId || !startWorkphaseId || !endWorkphaseId) {
    res.status(400).json({ error: 'boardId, startWorkphaseId and endWorkphaseId are required' });
    return;
  }

  const board = getByIdOrNotFound(boards, boardId, res, 'Board not found');
  if (!board) return;

  const { rankMap } = getOrderedWorkphases(board.workflowId);

  const siblingColumns = db.select().from(columns).where(eq(columns.boardId, boardId)).all();
  const range = { startWorkphaseId, endWorkphaseId };
  const validation = validateColumnRange(range, rankMap, siblingColumns);
  if (!validation.ok) {
    res.status(validation.status).json(validation.body);
    return;
  }

  const id = randomUUID();

  db.insert(columns).values({
    id,
    boardId,
    name: name || null,
    startWorkphaseId,
    endWorkphaseId,
    displayMode: displayMode === 'expanded' ? 'expanded' : 'merged',
    position: nextPosition(siblingColumns),
    createdAt: Date.now(),
  }).run();

  const created = db.select().from(columns).where(eq(columns.id, id)).get();
  res.status(201).json(created);
});

// Update a column's range, display mode, or name override
router.put('/:id', (req, res) => {
  const column = getByIdOrNotFound(columns, req.params.id, res, 'Column not found');
  if (!column) return;

  const { startWorkphaseId, endWorkphaseId, displayMode, name } = req.body;
  const nextStart = startWorkphaseId ?? column.startWorkphaseId;
  const nextEnd = endWorkphaseId ?? column.endWorkphaseId;

  const board = db.select().from(boards).where(eq(boards.id, column.boardId)).get()!;
  const { rankMap } = getOrderedWorkphases(board.workflowId);

  const siblingColumns = db.select().from(columns).where(eq(columns.boardId, column.boardId)).all()
    .filter(c => c.id !== column.id);
  const range = { startWorkphaseId: nextStart, endWorkphaseId: nextEnd };
  const validation = validateColumnRange(range, rankMap, siblingColumns);
  if (!validation.ok) {
    res.status(validation.status).json(validation.body);
    return;
  }

  db.update(columns).set({
    name: name !== undefined ? name : column.name,
    startWorkphaseId: nextStart,
    endWorkphaseId: nextEnd,
    displayMode: displayMode === 'expanded' ? 'expanded' : displayMode === 'merged' ? 'merged' : column.displayMode,
  }).where(eq(columns.id, req.params.id)).run();

  const updated = db.select().from(columns).where(eq(columns.id, req.params.id)).get();
  res.json(updated);
});

// Reorder columns — accepts an array of { id, position } pairs
router.patch('/reorder', (req, res) => {
  const { columnOrders } = req.body;

  const ok = db.transaction((tx) => applyReorder(columns, columnOrders, tx, res, 'column'));
  if (!ok) return;

  res.json({ success: true });
});

// Delete a column — always safe, items never reference columns directly
router.delete('/:id', (req, res) => {
  const column = getByIdOrNotFound(columns, req.params.id, res, 'Column not found');
  if (!column) return;

  db.delete(columns).where(eq(columns.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
