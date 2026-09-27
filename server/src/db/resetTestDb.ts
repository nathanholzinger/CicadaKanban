import { db, sqlite } from './index.js';
import {
  projects,
  workflows,
  workflowTemplates,
  workflowTemplatePhases,
  workphases,
  items,
  itemLabels,
  labels,
  attachments,
  activityLog,
  notifications,
  chatThreads,
  chatMessages,
  agents,
  boards,
  columns,
} from './schema.js';
import { runMigrations } from './runMigrations.js';

// Shared by /api/test/reset (ENABLE_TEST_ROUTES=true, used by Playwright over
// HTTP) and the Vitest test setup (called in-process). NOT related to
// server/src/db/reset-test.ts, a separate older CLI script — don't confuse them.
export function resetTestDb(): void {
  sqlite.pragma('foreign_keys = OFF');

  db.delete(itemLabels).run();
  db.delete(attachments).run();
  db.delete(activityLog).run();
  db.delete(notifications).run();
  db.delete(chatMessages).run();
  db.delete(chatThreads).run();
  db.delete(items).run();
  db.delete(columns).run();
  db.delete(boards).run();
  db.delete(workphases).run();
  db.delete(labels).run();
  db.delete(workflows).run();
  db.delete(projects).run();
  db.delete(workflowTemplatePhases).run();
  db.delete(workflowTemplates).run();
  db.delete(agents).run();

  sqlite.pragma('foreign_keys = ON');

  // Note: workflowTemplates/workflowTemplatePhases get *new* random UUIDs
  // every call — tests must look templates up by name, never hardcode an id.
  runMigrations();
}
