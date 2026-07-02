import { Router } from 'express';
import { db } from '../db/index.js';
import { attachments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/work-item/:workItemId', (req, res) => {
  const rows = db.select().from(attachments)
    .where(eq(attachments.workItemId, req.params.workItemId))
    .all();
  res.json(rows);
});

router.post('/work-item/:workItemId', (req, res) => {
  const { type, label, externalUrl, filePath, metadata } = req.body;
  if (!type || !label) { res.status(400).json({ error: 'type and label are required' }); return; }
  const id = randomUUID();
  db.insert(attachments).values({
    id,
    workItemId: req.params.workItemId,
    type,
    label,
    externalUrl: externalUrl || null,
    filePath: filePath || null,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: Date.now(),
  }).run();
  const created = db.select().from(attachments).where(eq(attachments.id, id)).get();
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  db.delete(attachments).where(eq(attachments.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
