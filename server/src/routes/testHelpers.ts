import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { items, projects } from '../db/schema.js';
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
// (wiki positioning §2), so this writes the row directly. Mounted with
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

// The same for a project, which no request gives a chosen position, or none
// (`null`). Mounted with the rest of this file, only when ENABLE_TEST_ROUTES=true.
router.patch('/projects/:id/position', (req, res) => {
  const { position } = req.body;
  if (position !== null && (typeof position !== 'number' || !Number.isFinite(position))) {
    res.status(400).json({ error: 'position must be a finite number or null' });
    return;
  }
  const result = db.update(projects).set({ position }).where(eq(projects.id, req.params.id)).run();
  if (result.changes === 0) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ ok: true });
});

// The same for a project's parent, to build a tree deeper than the project cap,
// which no project write produces. Mounted with the rest of this file, only
// when ENABLE_TEST_ROUTES=true.
router.patch('/projects/:id/parent', (req, res) => {
  const { parentId } = req.body;
  if (parentId !== null && typeof parentId !== 'string') {
    res.status(400).json({ error: 'parentId must be a string or null' });
    return;
  }
  const result = db.update(projects).set({ parentId }).where(eq(projects.id, req.params.id)).run();
  if (result.changes === 0) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
