import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { items } from '../db/schema.js';
import { resetTestDb } from '../db/resetTestDb.js';

const router = Router();

// Truncate all user data and re-seed via the standard migration seed logic.
// Only mounted when ENABLE_TEST_ROUTES=true — never exposed in production.
router.post('/reset', (_req, res) => {
  resetTestDb();
  res.json({ ok: true });
});

// Pin an item to an exact position, for scenarios that need a layout no
// request can produce. The item API takes no final position from any caller
// (wiki item-positioning §2), so this writes the row directly. Mounted with
// the rest of this file, only when ENABLE_TEST_ROUTES=true.
router.patch('/items/:id/position', (req, res) => {
  const { position } = req.body;
  if (typeof position !== 'number' || !Number.isFinite(position)) {
    res.status(400).json({ error: 'position must be a finite number' });
    return;
  }
  const result = db.update(items).set({ position }).where(eq(items.id, req.params.id)).run();
  if (result.changes === 0) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
