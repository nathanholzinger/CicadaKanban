import { Router } from 'express';
import { db, sqlite } from '../db/index.js';
import {
  projects, workflows, workflowTemplates, workflowTemplateColumns,
  columns, items, itemLabels, labels, attachments, activityLog,
  notifications, chatThreads, chatMessages, agents,
} from '../db/schema.js';
import { runMigrations } from '../db/runMigrations.js';

const router = Router();

// Truncate all user data and re-seed via the standard migration seed logic.
// Only mounted when ENABLE_TEST_ROUTES=true — never exposed in production.
router.post('/reset', (_req, res) => {
  sqlite.pragma('foreign_keys = OFF');

  db.delete(itemLabels).run();
  db.delete(attachments).run();
  db.delete(activityLog).run();
  db.delete(notifications).run();
  db.delete(chatMessages).run();
  db.delete(chatThreads).run();
  db.delete(items).run();
  db.delete(columns).run();
  db.delete(labels).run();
  db.delete(workflows).run();
  db.delete(projects).run();
  db.delete(workflowTemplateColumns).run();
  db.delete(workflowTemplates).run();
  db.delete(agents).run();

  sqlite.pragma('foreign_keys = ON');

  // Re-seed via the standard seed logic (Phase 1 + Phase 3 will run)
  runMigrations();

  res.json({ ok: true });
});

export default router;
