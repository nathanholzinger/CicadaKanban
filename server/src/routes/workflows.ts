import { Router } from 'express';
import { db } from '../db/index.js';
import { workflows, workphases, items, workflowTemplatePhases } from '../db/schema.js';
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

// Get a single workflow with workphases and items
router.get('/:id', (req, res) => {
  const workflow = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const workflowWorkphases = db.select().from(workphases)
    .where(eq(workphases.workflowId, workflow.id))
    .orderBy(workphases.position)
    .all();

  // All items in any workphase of this workflow (across all projects that inherit it)
  const workphaseIds = new Set(workflowWorkphases.map(w => w.id));
  const allItems = db.select().from(items).all();
  const workflowItems = allItems.filter(i => i.workphaseId && workphaseIds.has(i.workphaseId));

  res.json({ ...workflow, workphases: workflowWorkphases, items: addDepths(workflowItems) });
});

// Create a workflow
router.post('/', (req, res) => {
  const { name, description, projectId, templateId, sourceWorkflowId } = req.body;

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

  if (templateId) {
    const templatePhases = db.select().from(workflowTemplatePhases)
      .where(eq(workflowTemplatePhases.templateId, templateId))
      .orderBy(workflowTemplatePhases.position)
      .all();

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
  } else if (sourceWorkflowId) {
    const sourcePhases = db.select().from(workphases)
      .where(eq(workphases.workflowId, sourceWorkflowId))
      .orderBy(workphases.position)
      .all();

    for (const phase of sourcePhases) {
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

  const created = db.select().from(workflows).where(eq(workflows.id, workflowId)).get();
  const createdWorkphases = db.select().from(workphases).where(eq(workphases.workflowId, workflowId)).all();
  res.status(201).json({ ...created, workphases: createdWorkphases });
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

// Delete a workflow and its workphases and items
router.delete('/:id', (req, res) => {
  const workflow = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const workflowWorkphases = db.select().from(workphases).where(eq(workphases.workflowId, req.params.id)).all();
  const workphaseIds = new Set(workflowWorkphases.map(w => w.id));

  if (workflow.projectId) {
    const projectItems = db.select().from(items).where(eq(items.projectId, workflow.projectId)).all();
    const workflowItems = projectItems.filter(i => i.workphaseId && workphaseIds.has(i.workphaseId));
    for (const item of workflowItems) {
      db.delete(items).where(eq(items.id, item.id)).run();
    }
  }

  db.delete(workphases).where(eq(workphases.workflowId, req.params.id)).run();
  db.delete(workflows).where(eq(workflows.id, req.params.id)).run();

  res.status(204).send();
});

export default router;
