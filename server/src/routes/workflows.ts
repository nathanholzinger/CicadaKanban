import { Router } from 'express';
import { db } from '../db/index.js';
import { workflows, columns, items, workflowTemplateColumns } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

type ItemRow = typeof items.$inferSelect;

function addDepths(itemRows: ItemRow[]): (ItemRow & { depth: number })[] {
  const parentMap = new Map(itemRows.map(i => [i.id, i.parentId]));
  const depthCache = new Map<string, number>();

  function getDepth(id: string): number {
    if (depthCache.has(id)) return depthCache.get(id)!;
    const parentId = parentMap.get(id);
    const d = parentId && parentMap.has(parentId) ? getDepth(parentId) + 1 : 0;
    depthCache.set(id, d);
    return d;
  }

  return itemRows.map(item => ({ ...item, depth: getDepth(item.id) }));
}

const router = Router();

// List all workflows, optionally filtered by project
router.get('/', (req, res) => {
  const { projectId } = req.query;
  const allWorkflows = projectId
    ? db.select().from(workflows).where(eq(workflows.projectId, String(projectId))).all()
    : db.select().from(workflows).all();
  res.json(allWorkflows);
});

// Get a single workflow with columns and items
router.get('/:id', (req, res) => {
  const workflow = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const workflowColumns = db.select().from(columns)
    .where(eq(columns.workflowId, workflow.id))
    .orderBy(columns.position)
    .all();

  // Items whose column belongs to this workflow
  const columnIds = new Set(workflowColumns.map(c => c.id));
  const allProjectItems = workflow.projectId
    ? db.select().from(items).where(eq(items.projectId, workflow.projectId)).all()
    : [];
  const workflowItems = allProjectItems.filter(i => i.columnId && columnIds.has(i.columnId));

  res.json({ ...workflow, columns: workflowColumns, items: addDepths(workflowItems) });
});

// Create a workflow
router.post('/', (req, res) => {
  const { name, description, projectId, templateId } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const now = Date.now();
  const workflowId = randomUUID();

  db.insert(workflows).values({
    id: workflowId,
    projectId,
    name,
    description: description || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  // Apply template columns if a templateId was provided
  if (templateId) {
    const templateCols = db.select().from(workflowTemplateColumns)
      .where(eq(workflowTemplateColumns.templateId, templateId))
      .orderBy(workflowTemplateColumns.position)
      .all();

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

  const created = db.select().from(workflows).where(eq(workflows.id, workflowId)).get();
  const createdColumns = db.select().from(columns).where(eq(columns.workflowId, workflowId)).all();
  res.status(201).json({ ...created, columns: createdColumns });
});

// Update a workflow
router.put('/:id', (req, res) => {
  const workflow = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const { name, description } = req.body;

  db.update(workflows).set({
    name: name ?? workflow.name,
    description: description !== undefined ? description : workflow.description,
    updatedAt: Date.now(),
  }).where(eq(workflows.id, req.params.id)).run();

  const updated = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  res.json(updated);
});

// Delete a workflow and its columns and items
router.delete('/:id', (req, res) => {
  const workflow = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const workflowColumns = db.select().from(columns).where(eq(columns.workflowId, req.params.id)).all();
  const columnIds = new Set(workflowColumns.map(c => c.id));

  if (workflow.projectId) {
    const projectItems = db.select().from(items).where(eq(items.projectId, workflow.projectId)).all();
    const workflowItems = projectItems.filter(i => i.columnId && columnIds.has(i.columnId));
    for (const item of workflowItems) {
      db.delete(items).where(eq(items.id, item.id)).run();
    }
  }

  db.delete(columns).where(eq(columns.workflowId, req.params.id)).run();
  db.delete(workflows).where(eq(workflows.id, req.params.id)).run();

  res.status(204).send();
});

export default router;
