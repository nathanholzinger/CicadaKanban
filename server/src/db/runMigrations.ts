// Migration runner + seed data + the backfills that follow it: workflows and items with no
// project move into a "Default Project", a project with no position takes its creation time
// as one, and a workflow with no board gets a 1:1 default board.

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';
import { projects, workflows, workflowTemplates, workflowTemplatePhases, workphases, boards } from './schema.js';
import { isNull, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import { createDefaultBoard } from '../lib/defaultBoard.js';

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

function seedWorkflowTemplates(now: number) {
  const quickId = randomUUID();
  db.insert(workflowTemplates)
    .values({
      id: quickId,
      name: 'quick',
      description: 'Simple two-step workflow for quick tasks',
      createdAt: now,
    })
    .run();
  db.insert(workflowTemplatePhases)
    .values([
      {
        id: randomUUID(),
        templateId: quickId,
        name: 'Todo',
        position: 1.0,
        triggersNotification: 0,
        isTerminal: 0,
        createdAt: now,
      },
      {
        id: randomUUID(),
        templateId: quickId,
        name: 'Done',
        position: 2.0,
        triggersNotification: 0,
        isTerminal: 1,
        createdAt: now,
      },
    ])
    .run();

  const flowId = randomUUID();
  db.insert(workflowTemplates)
    .values({
      id: flowId,
      name: 'flow',
      description: 'Standard development workflow',
      createdAt: now,
    })
    .run();
  db.insert(workflowTemplatePhases)
    .values([
      {
        id: randomUUID(),
        templateId: flowId,
        name: 'Todo',
        position: 1.0,
        triggersNotification: 0,
        isTerminal: 0,
        createdAt: now,
      },
      {
        id: randomUUID(),
        templateId: flowId,
        name: 'In Progress',
        position: 2.0,
        triggersNotification: 0,
        isTerminal: 0,
        createdAt: now,
      },
      {
        id: randomUUID(),
        templateId: flowId,
        name: 'Review',
        position: 3.0,
        triggersNotification: 1,
        isTerminal: 0,
        createdAt: now,
      },
      {
        id: randomUUID(),
        templateId: flowId,
        name: 'Done',
        position: 4.0,
        triggersNotification: 0,
        isTerminal: 1,
        createdAt: now,
      },
    ])
    .run();

  console.log('Seeded workflow templates: "quick" and "flow"');
  return { quickId, flowId };
}

export function runMigrations() {
  sqlite.pragma('foreign_keys = OFF');
  migrate(db, { migrationsFolder });
  sqlite.pragma('foreign_keys = ON');

  const now = Date.now();

  // ── Seed workflow templates if not yet seeded ───────────────────────────────
  const existingTemplates = db.select().from(workflowTemplates).all();
  if (existingTemplates.length === 0) {
    seedWorkflowTemplates(now);
  }

  // ── Move workflows and items without a project_id into a default project ───
  const unassignedWorkflows = db.select().from(workflows).where(isNull(workflows.projectId)).all();
  if (unassignedWorkflows.length > 0) {
    const defaultProjectId = randomUUID();
    db.insert(projects)
      .values({
        id: defaultProjectId,
        parentId: null,
        name: 'Default Project',
        description: 'Auto-created to house pre-existing workflows',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    sqlite.prepare(`UPDATE workflows SET project_id = ? WHERE project_id IS NULL`).run(defaultProjectId);

    sqlite.prepare(`UPDATE items SET project_id = ? WHERE project_id IS NULL`).run(defaultProjectId);

    console.log(`Migrated ${unassignedWorkflows.length} existing workflow(s) into "Default Project"`);
  }

  // ── Initialize project positions from created_at for any without one ────────
  const updated = sqlite.prepare(`UPDATE projects SET position = created_at WHERE position IS NULL`).run();
  if (updated.changes > 0) {
    console.log(`Initialized position for ${updated.changes} project(s)`);
  }

  // ── Bootstrap a default board for any workflow that has none ────────────────
  const allWorkflows = db.select().from(workflows).all();
  let boardsCreated = 0;
  for (const workflow of allWorkflows) {
    const existingBoards = db.select().from(boards).where(eq(boards.workflowId, workflow.id)).all();
    if (existingBoards.length > 0) continue;

    const workflowWorkphases = db.select().from(workphases).where(eq(workphases.workflowId, workflow.id)).all();
    createDefaultBoard(workflow.id, 'Default Board', workflowWorkphases, now);
    boardsCreated++;
  }
  if (boardsCreated > 0) {
    console.log(`Backfilled a default board for ${boardsCreated} workflow(s)`);
  }
}
