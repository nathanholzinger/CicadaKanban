import { Router } from 'express';
import { db } from '../db/index.js';
import { itemTypes, workItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// List all item types
router.get('/', (_req, res) => {
  const types = db.select().from(itemTypes).all();
  res.json(types);
});

// Create an item type
router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const id = randomUUID();
  const now = Date.now();

  db.insert(itemTypes).values({
    id,
    name: name.trim(),
    color: color ?? null,
    createdAt: now,
  }).run();

  const created = db.select().from(itemTypes).where(eq(itemTypes.id, id)).get();
  res.status(201).json(created);
});

// Update an item type
router.put('/:id', (req, res) => {
  const existing = db.select().from(itemTypes).where(eq(itemTypes.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Item type not found' });
    return;
  }

  const { name, color } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (color !== undefined) updates.color = color ?? null;

  if (Object.keys(updates).length === 0) {
    res.json(existing);
    return;
  }

  db.update(itemTypes).set(updates).where(eq(itemTypes.id, req.params.id)).run();

  const updated = db.select().from(itemTypes).where(eq(itemTypes.id, req.params.id)).get();
  res.json(updated);
});

// Delete an item type (blocked if any work items use it)
router.delete('/:id', (req, res) => {
  const existing = db.select().from(itemTypes).where(eq(itemTypes.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Item type not found' });
    return;
  }

  const inUse = db.select().from(workItems).where(eq(workItems.type, req.params.id)).get();
  if (inUse) {
    res.status(409).json({ error: 'Cannot delete item type that is in use by work items' });
    return;
  }

  db.delete(itemTypes).where(eq(itemTypes.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
