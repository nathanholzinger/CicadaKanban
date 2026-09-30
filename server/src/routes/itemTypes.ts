import { Router } from 'express';
import { db } from '../db/index.js';
import { itemTypes } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';

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

  db.insert(itemTypes)
    .values({
      id,
      name: name.trim(),
      color: color ?? null,
      createdAt: now,
    })
    .run();

  const created = db.select().from(itemTypes).where(eq(itemTypes.id, id)).get();
  res.status(201).json(created);
});

// Update an item type
router.put('/:id', (req, res) => {
  const existing = getByIdOrNotFound(itemTypes, req.params.id, res, 'Item type not found');
  if (!existing) return;

  const { name, color } = req.body;
  const updates: Record<string, unknown> = {};
  // Rejects an empty or whitespace name, as POST does, and a non-string
  // `name` (or `null`) too, which `name.trim()` would otherwise throw on as
  // a 500.
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name must be a non-empty string' });
      return;
    }
    updates.name = name.trim();
  }
  if (color !== undefined) updates.color = color ?? null;

  if (Object.keys(updates).length === 0) {
    res.json(existing);
    return;
  }

  db.update(itemTypes).set(updates).where(eq(itemTypes.id, req.params.id)).run();

  const updated = db.select().from(itemTypes).where(eq(itemTypes.id, req.params.id)).get();
  res.json(updated);
});

// Delete an item type. Items using it are not blocked — the FK nulls their
// `type` (ON DELETE SET NULL), leaving them typeless.
router.delete('/:id', (req, res) => {
  const existing = getByIdOrNotFound(itemTypes, req.params.id, res, 'Item type not found');
  if (!existing) return;

  db.delete(itemTypes).where(eq(itemTypes.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
