import { Router } from 'express';
import { db } from '../db/index.js';
import { columns, workItems } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// Create a column on a board
router.post('/', (req, res) => {
  const { boardId, name, agentId, triggersNotification, isTerminal } = req.body;

  if (!boardId || !name) {
    res.status(400).json({ error: 'boardId and name are required' });
    return;
  }

  // Find the highest position in this board's columns to append at the end
  const existing = db.select().from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(columns.position)
    .all();

  const maxPosition = existing.length > 0
    ? Math.max(...existing.map(c => c.position))
    : 0;

  const id = randomUUID();

  db.insert(columns).values({
    id,
    boardId,
    agentId: agentId || null,
    name,
    position: maxPosition + 1.0,
    triggersNotification: triggersNotification ? 1 : 0,
    isTerminal: isTerminal ? 1 : 0,
    createdAt: Date.now(),
  }).run();

  const created = db.select().from(columns).where(eq(columns.id, id)).get();
  res.status(201).json(created);
});

// Update a column (name, agent, notification/terminal flags)
router.put('/:id', (req, res) => {
  const col = db.select().from(columns).where(eq(columns.id, req.params.id)).get();
  if (!col) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  const { name, agentId, triggersNotification, isTerminal } = req.body;

  db.update(columns)
    .set({
      name: name ?? col.name,
      agentId: agentId !== undefined ? agentId : col.agentId,
      triggersNotification: triggersNotification !== undefined
        ? (triggersNotification ? 1 : 0)
        : col.triggersNotification,
      isTerminal: isTerminal !== undefined
        ? (isTerminal ? 1 : 0)
        : col.isTerminal,
    })
    .where(eq(columns.id, req.params.id))
    .run();

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

  for (const { id, position } of columnOrders) {
    db.update(columns)
      .set({ position })
      .where(eq(columns.id, id))
      .run();
  }

  res.json({ success: true });
});

// Delete a column
router.delete('/:id', (req, res) => {
  const col = db.select().from(columns).where(eq(columns.id, req.params.id)).get();
  if (!col) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  // Check for work items in this column
  const itemsInColumn = db.select().from(workItems)
    .where(eq(workItems.columnId, req.params.id))
    .all();

  if (itemsInColumn.length > 0) {
    res.status(409).json({
      error: 'Column has work items. Move or delete them first.',
      workItemCount: itemsInColumn.length,
    });
    return;
  }

  db.delete(columns).where(eq(columns.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
