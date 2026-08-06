import { Router } from 'express';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(notifications)
    .where(eq(notifications.isRead, 0))
    .orderBy(desc(notifications.createdAt))
    .all();
  res.json(rows);
});

router.patch('/read-all', (_req, res) => {
  db.update(notifications).set({ isRead: 1 }).run();
  res.json({ success: true });
});

router.patch('/:id/read', (req, res) => {
  const row = getByIdOrNotFound(notifications, req.params.id, res, 'Notification not found');
  if (!row) return;
  db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, req.params.id)).run();
  res.json({ success: true });
});

export default router;
