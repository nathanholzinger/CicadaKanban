import { Router } from 'express';
import { db } from '../db/index.js';
import { labels, workItemLabels } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', (req, res) => {
  const { boardId } = req.query;
  const rows = boardId
    ? db.select().from(labels).where(eq(labels.boardId, String(boardId))).all()
    : db.select().from(labels).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { boardId, name, color } = req.body;
  if (!name || !color) { res.status(400).json({ error: 'name and color are required' }); return; }
  const id = randomUUID();
  db.insert(labels).values({ id, boardId: boardId || null, name, color, createdAt: Date.now() }).run();
  const created = db.select().from(labels).where(eq(labels.id, id)).get();
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  db.delete(workItemLabels).where(eq(workItemLabels.labelId, req.params.id)).run();
  db.delete(labels).where(eq(labels.id, req.params.id)).run();
  res.status(204).send();
});

// Work-item label assignments
router.get('/work-item/:workItemId', (req, res) => {
  const rows = db.select({ label: labels })
    .from(workItemLabels)
    .innerJoin(labels, eq(workItemLabels.labelId, labels.id))
    .where(eq(workItemLabels.workItemId, req.params.workItemId))
    .all()
    .map(r => r.label);
  res.json(rows);
});

router.post('/work-item/:workItemId', (req, res) => {
  const { labelId } = req.body;
  if (!labelId) { res.status(400).json({ error: 'labelId is required' }); return; }
  try {
    db.insert(workItemLabels).values({ workItemId: req.params.workItemId, labelId }).run();
  } catch {
    // already assigned — ignore duplicate
  }
  res.status(201).json({ success: true });
});

router.delete('/work-item/:workItemId/:labelId', (req, res) => {
  db.delete(workItemLabels)
    .where(and(
      eq(workItemLabels.workItemId, req.params.workItemId),
      eq(workItemLabels.labelId, req.params.labelId),
    ))
    .run();
  res.status(204).send();
});

export default router;
