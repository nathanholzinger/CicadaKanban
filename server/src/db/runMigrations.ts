import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';
import { projects, workflows, workflowTemplates, workflowTemplateColumns, columns } from './schema.js';
import { isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

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
  db.insert(workflowTemplateColumns).values([
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
  db.insert(workflowTemplateColumns).values([
    { id: randomUUID(), templateId: flowId, name: 'Todo',        position: 1.0, triggersNotification: 0, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'In Progress', position: 2.0, triggersNotification: 0, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'Review',      position: 3.0, triggersNotification: 1, isTerminal: 0, createdAt: now },
    { id: randomUUID(), templateId: flowId, name: 'Done',        position: 4.0, triggersNotification: 0, isTerminal: 1, createdAt: now },
  ]).run();

  console.log('Seeded workflow templates: "quick" and "flow"');
  return { quickId, flowId };
}

function applyTemplateToWorkflow(workflowId: string, templateId: string, now: number) {
  const templateCols = db.select().from(workflowTemplateColumns).all()
    .filter(c => c.templateId === templateId);

  for (const col of templateCols) {
    db.insert(columns).values({
      id: randomUUID(),
      workflowId,
      name: col.name,
      position: col.position,
      triggersNotification: col.triggersNotification,
      isTerminal: col.isTerminal,
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

}
