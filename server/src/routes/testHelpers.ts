// Routes for test setup. Mounted only when ENABLE_TEST_ROUTES=true, so none is ever
// exposed in production.

import { Router, type Response } from 'express';
import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';
import { db } from '../db/index.js';
import { items, projects } from '../db/schema.js';
import { resetTestDb } from '../db/resetTestDb.js';

const router = Router();

type IdTable = SQLiteTable & { id: SQLiteColumn };

// Writes `values` straight to the row `id` names, or answers 404 with `notFound` when there's none.
function writeOrNotFound<T extends IdTable>(
  res: Response,
  table: T,
  id: string,
  values: SQLiteUpdateSetSource<T>,
  notFound: string,
): void {
  const result = db.update(table).set(values).where(eq(table.id, id)).run();
  if (result.changes === 0) {
    res.status(404).json({ error: notFound });
    return;
  }
  res.json({ ok: true });
}

// Truncate all user data and re-seed via the standard migration seed logic.
router.post('/reset', (_req, res) => {
  resetTestDb();
  res.json({ ok: true });
});

// Pin an item to an exact position, for scenarios that need a layout no
// request can produce. The item API takes no final position from any caller
// (wiki positioning §2), so this writes the row directly.
router.patch('/items/:id/position', (req, res) => {
  const { position } = req.body;
  if (typeof position !== 'number' || !Number.isFinite(position)) {
    res.status(400).json({ error: 'position must be a finite number' });
    return;
  }
  writeOrNotFound(res, items, req.params.id, { position }, 'Item not found');
});

// The same for a project, which no request gives a chosen position, or none
// (`null`).
router.patch('/projects/:id/position', (req, res) => {
  const { position } = req.body;
  if (position !== null && (typeof position !== 'number' || !Number.isFinite(position))) {
    res.status(400).json({ error: 'position must be a finite number or null' });
    return;
  }
  writeOrNotFound(res, projects, req.params.id, { position }, 'Project not found');
});

// The same for a project's creation time, so a test of the tie-break (the order
// by position, then creation time) doesn't rest on two creates landing in
// different milliseconds.
router.patch('/projects/:id/created-at', (req, res) => {
  const { createdAt } = req.body;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
    res.status(400).json({ error: 'createdAt must be a finite number' });
    return;
  }
  writeOrNotFound(res, projects, req.params.id, { createdAt }, 'Project not found');
});

// The same for a project's parent, to build a tree deeper than the project cap,
// which no project write produces.
router.patch('/projects/:id/parent', (req, res) => {
  const { parentId } = req.body;
  if (parentId !== null && typeof parentId !== 'string') {
    res.status(400).json({ error: 'parentId must be a string or null' });
    return;
  }
  writeOrNotFound(res, projects, req.params.id, { parentId }, 'Project not found');
});

export default router;
