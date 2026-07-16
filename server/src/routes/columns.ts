import { Router } from 'express';
import { db } from '../db/index.js';
import { boards, columns } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getOrderedWorkphases, columnsOverlap } from '../lib/columnRanges.js';
import { getOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

// Create a column on a board — start/end define a contiguous workphase range
router.post('/', (req, res) => {
  const { boardId, startWorkphaseId, endWorkphaseId, displayMode, name } = req.body;

  if (!boardId || !startWorkphaseId || !endWorkphaseId) {
    res.status(400).json({ error: 'boardId, startWorkphaseId and endWorkphaseId are required' });
    return;
  }

  const board = getOrNotFound(db.select().from(boards).where(eq(boards.id, boardId)).get(), res, 'Board not found');
  if (!board) return;

  const { rankMap } = getOrderedWorkphases(board.workflowId);

  if (!rankMap.has(startWorkphaseId) || !rankMap.has(endWorkphaseId)) {
    res.status(400).json({ error: "startWorkphaseId and endWorkphaseId must belong to this board's workflow" });
    return;
  }
  if (rankMap.get(startWorkphaseId)! > rankMap.get(endWorkphaseId)!) {
    res.status(400).json({ error: 'startWorkphaseId must not come after endWorkphaseId' });
    return;
  }

  const siblingColumns = db.select().from(columns).where(eq(columns.boardId, boardId)).all();
  const range = { startWorkphaseId, endWorkphaseId };
  const conflict = siblingColumns.find(c => columnsOverlap(range, c, rankMap));
  if (conflict) {
    res.status(400).json({
      error: `Range overlaps existing column "${conflict.name ?? conflict.id}"`,
      conflictingColumnId: conflict.id,
    });
    return;
  }

  const maxPosition = siblingColumns.length > 0 ? Math.max(...siblingColumns.map(c => c.position)) : 0;
  const id = randomUUID();

  db.insert(columns).values({
    id,
    boardId,
    name: name || null,
    startWorkphaseId,
    endWorkphaseId,
    displayMode: displayMode === 'expanded' ? 'expanded' : 'merged',
    position: maxPosition + 1.0,
    createdAt: Date.now(),
  }).run();

  const created = db.select().from(columns).where(eq(columns.id, id)).get();
  res.status(201).json(created);
});

// Update a column's range, display mode, or name override
router.put('/:id', (req, res) => {
  const column = getOrNotFound(db.select().from(columns).where(eq(columns.id, req.params.id)).get(), res, 'Column not found');
  if (!column) return;

  const { startWorkphaseId, endWorkphaseId, displayMode, name } = req.body;
  const nextStart = startWorkphaseId ?? column.startWorkphaseId;
  const nextEnd = endWorkphaseId ?? column.endWorkphaseId;

  const board = db.select().from(boards).where(eq(boards.id, column.boardId)).get()!;
  const { rankMap } = getOrderedWorkphases(board.workflowId);

  if (!rankMap.has(nextStart) || !rankMap.has(nextEnd)) {
    res.status(400).json({ error: "startWorkphaseId and endWorkphaseId must belong to this board's workflow" });
    return;
  }
  if (rankMap.get(nextStart)! > rankMap.get(nextEnd)!) {
    res.status(400).json({ error: 'startWorkphaseId must not come after endWorkphaseId' });
    return;
  }

  const siblingColumns = db.select().from(columns).where(eq(columns.boardId, column.boardId)).all()
    .filter(c => c.id !== column.id);
  const range = { startWorkphaseId: nextStart, endWorkphaseId: nextEnd };
  const conflict = siblingColumns.find(c => columnsOverlap(range, c, rankMap));
  if (conflict) {
    res.status(400).json({
      error: `Range overlaps existing column "${conflict.name ?? conflict.id}"`,
      conflictingColumnId: conflict.id,
    });
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

  if (!Array.isArray(columnOrders)) {
    res.status(400).json({ error: 'columnOrders array is required' });
    return;
  }
  const invalidEntry = columnOrders.find(
    (o) => typeof o?.id !== 'string' || typeof o?.position !== 'number' || !Number.isFinite(o.position),
  );
  if (invalidEntry) {
    res.status(400).json({ error: 'Each entry must have a string id and a finite numeric position' });
    return;
  }

  const existingIds = new Set(
    db.select({ id: columns.id }).from(columns).where(inArray(columns.id, columnOrders.map(o => o.id))).all().map(c => c.id),
  );
  const missingIds = columnOrders.map(o => o.id).filter(id => !existingIds.has(id));
  if (missingIds.length > 0) {
    res.status(404).json({ error: 'One or more columns not found', missingIds });
    return;
  }

  for (const { id, position } of columnOrders) {
    db.update(columns).set({ position }).where(eq(columns.id, id)).run();
  }

  res.json({ success: true });
});

// Delete a column — always safe, items never reference columns directly
router.delete('/:id', (req, res) => {
  const column = getOrNotFound(db.select().from(columns).where(eq(columns.id, req.params.id)).get(), res, 'Column not found');
  if (!column) return;

  db.delete(columns).where(eq(columns.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
