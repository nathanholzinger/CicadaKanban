import { Router } from 'express';
import { db } from '../db/index.js';
import { items, labels, itemLabels } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(labels).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) {
    res.status(400).json({ error: 'name and color are required' });
    return;
  }
  const id = randomUUID();
  db.insert(labels).values({ id, name, color, createdAt: Date.now() }).run();
  const created = db.select().from(labels).where(eq(labels.id, id)).get();
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  // itemLabels join rows cascade on label delete (FK ON DELETE CASCADE)
  db.delete(labels).where(eq(labels.id, req.params.id)).run();
  res.status(204).send();
});

// Item label assignments
router.get('/item/:itemId', (req, res) => {
  const rows = db
    .select({ label: labels })
    .from(itemLabels)
    .innerJoin(labels, eq(itemLabels.labelId, labels.id))
    .where(eq(itemLabels.itemId, req.params.itemId))
    .all()
    .map(r => r.label);
  res.json(rows);
});

router.post('/item/:itemId', (req, res) => {
  const { labelId } = req.body;
  if (!labelId) {
    res.status(400).json({ error: 'labelId is required' });
    return;
  }
  if (!getByIdOrNotFound(items, req.params.itemId, res, 'Item not found')) return;
  if (!getByIdOrNotFound(labels, labelId, res, 'Label not found')) return;
  try {
    db.insert(itemLabels).values({ itemId: req.params.itemId, labelId }).run();
  } catch (err) {
    if ((err as { code?: string }).code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      console.error('Failed to assign label:', err);
      res.status(500).json({ error: 'Failed to assign label' });
      return;
    }
    // already assigned — idempotent success
  }
  res.status(201).json({ success: true });
});

router.delete('/item/:itemId/:labelId', (req, res) => {
  db.delete(itemLabels)
    .where(and(eq(itemLabels.itemId, req.params.itemId), eq(itemLabels.labelId, req.params.labelId)))
    .run();
  res.status(204).send();
});

export default router;
