import { Router } from 'express';
import { db } from '../db/index.js';
import { workphases, items } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { shrinkColumnsForDeletedWorkphase } from '../lib/columnRanges.js';
import { getOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

// Create a workphase on a workflow
router.post('/', (req, res) => {
  const { workflowId, name, agentId, triggersNotification, isTerminal } = req.body;

  if (!workflowId || !name) {
    res.status(400).json({ error: 'workflowId and name are required' });
    return;
  }

  const existing = db.select().from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all();

  const maxPosition = existing.length > 0
    ? Math.max(...existing.map(w => w.position))
    : 0;

  const id = randomUUID();

  db.insert(workphases).values({
    id,
    workflowId,
    agentId: agentId || null,
    name,
    position: maxPosition + 1.0,
    triggersNotification: triggersNotification ? 1 : 0,
    isTerminal: isTerminal ? 1 : 0,
    createdAt: Date.now(),
  }).run();

  const created = db.select().from(workphases).where(eq(workphases.id, id)).get();
  res.status(201).json(created);
});

// Update a workphase (name, agent, notification/terminal flags)
router.put('/:id', (req, res) => {
  const workphase = getOrNotFound(db.select().from(workphases).where(eq(workphases.id, req.params.id)).get(), res, 'Workphase not found');
  if (!workphase) return;

  const { name, agentId, triggersNotification, isTerminal } = req.body;

  db.update(workphases)
    .set({
      name: name ?? workphase.name,
      agentId: agentId !== undefined ? agentId : workphase.agentId,
      triggersNotification: triggersNotification !== undefined
        ? (triggersNotification ? 1 : 0)
        : workphase.triggersNotification,
      isTerminal: isTerminal !== undefined
        ? (isTerminal ? 1 : 0)
        : workphase.isTerminal,
    })
    .where(eq(workphases.id, req.params.id))
    .run();

  const updated = db.select().from(workphases).where(eq(workphases.id, req.params.id)).get();
  res.json(updated);
});

// Reorder workphases — accepts an array of { id, position } pairs
router.patch('/reorder', (req, res) => {
  const { workphaseOrders } = req.body;

  if (!Array.isArray(workphaseOrders)) {
    res.status(400).json({ error: 'workphaseOrders array is required' });
    return;
  }

  for (const { id, position } of workphaseOrders) {
    db.update(workphases).set({ position }).where(eq(workphases.id, id)).run();
  }

  res.json({ success: true });
});

// Delete a workphase
router.delete('/:id', (req, res) => {
  const workphase = getOrNotFound(db.select().from(workphases).where(eq(workphases.id, req.params.id)).get(), res, 'Workphase not found');
  if (!workphase) return;

  const itemsInWorkphase = db.select().from(items).where(eq(items.workphaseId, req.params.id)).all();
  if (itemsInWorkphase.length > 0) {
    res.status(409).json({
      error: 'Workphase has items. Move or delete them first.',
      itemCount: itemsInWorkphase.length,
    });
    return;
  }

  const { shrunkColumns, deletedColumns } = db.transaction(tx => {
    const result = shrinkColumnsForDeletedWorkphase(tx, req.params.id, workphase.workflowId);
    tx.delete(workphases).where(eq(workphases.id, req.params.id)).run();
    return result;
  });

  if (shrunkColumns.length > 0 || deletedColumns.length > 0) {
    res.status(200).json({ shrunkColumns, deletedColumns });
    return;
  }
  res.status(204).send();
});

export default router;
