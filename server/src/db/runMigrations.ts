// Migration runner + seed data + board backfill (1:1 board per pre-existing workflow).

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';
import { projects, workflows, workflowTemplates, workflowTemplatePhases, workphases, boards } from './schema.js';
import { isNull, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import { createDefaultBoard } from '../routes/boards.js';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../drizzle',
);

function seedWorkflowTemplates(now: number) {
  const quickId = randomUUID();
  db.insert(workflowTemplates).values({
    id: quickId,
    name: 'quick',
    description: 'Simple two-step workflow for quick tasks',
    createdAt: now,
  }).run();
  db.insert(workflowTemplatePhases).values([
    { id: randomUUID(), templateId: quickId, name: 'Todo',  position: 1.0, triggersNotification: 0, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: quickId, name: 'Done',  position: 2.0, triggersNotification: 0, isTerminal: 1, createdAt: now },
  ]).run();

  const flowId = randomUUID();
  db.insert(workflowTemplates).values({
    id: flowId,
    name: 'flow',
    description: 'Standard development workflow',
    createdAt: now,
  }).run();
  db.insert(workflowTemplatePhases).values([
    { id: randomUUID(), templateId: flowId, name: 'Todo',        position: 1.0, triggersNotification: 0, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'In Progress', position: 2.0, triggersNotification: 0, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'Review',      position: 3.0, triggersNotification: 1, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'Done',        position: 4.0, triggersNotification: 0, isTerminal: 1, createdAt: now },
  ]).run();

  console.log('Seeded workflow templates: "quick" and "flow"');
  return { quickId, flowId };
}

function applyTemplateToWorkflow(workflowId: string, templateId: string, now: number) {
  const templatePhases = db.select().from(workflowTemplatePhases).all()
    .filter(p => p.templateId === templateId);

  for (const phase of templatePhases) {
    db.insert(workphases).values({
      id: randomUUID(),
      workflowId,
      name: phase.name,
      position: phase.position,
      triggersNotification: phase.triggersNotification,
      isTerminal: phase.isTerminal,
      createdAt: now,
    }).run();
  }
}

export function runMigrations() {
  sqlite.pragma('foreign_keys = OFF');
  migrate(db, { migrationsFolder });
  sqlite.pragma('foreign_keys = ON');

  const now = Date.now();

  // ── Phase 1: Seed workflow templates if not yet seeded ──────────────────────
  const existingTemplates = db.select().from(workflowTemplates).all();
  if (existingTemplates.length === 0) {
    seedWorkflowTemplates(now);
  }

  // ── Phase 2: Migrate existing data (workflows without a project_id) ─────────
  const unassignedWorkflows = db.select().from(workflows).where(isNull(workflows.projectId)).all();
  if (unassignedWorkflows.length > 0) {
    const defaultProjectId = randomUUID();
    db.insert(projects).values({
      id: defaultProjectId,
      parentId: null,
      name: 'Default Project',
      description: 'Auto-created to house pre-existing workflows',
      createdAt: now,
      updatedAt: now,
    }).run();

    sqlite.prepare(
      `UPDATE workflows SET project_id = ? WHERE project_id IS NULL`
    ).run(defaultProjectId);

    sqlite.prepare(
      `UPDATE items SET project_id = ? WHERE project_id IS NULL`
    ).run(defaultProjectId);

    console.log(`Migrated ${unassignedWorkflows.length} existing workflow(s) into "Default Project"`);
  }

  // ── Phase 3: Initialize project positions from created_at for any without one ─
  const updated = sqlite.prepare(
    `UPDATE projects SET position = created_at WHERE position IS NULL`
  ).run();
  if (updated.changes > 0) {
    console.log(`Initialized position for ${updated.changes} project(s)`);
  }

  // ── Phase 4: Bootstrap a default board for any workflow that has none ───────
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
