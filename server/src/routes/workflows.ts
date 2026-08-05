import { Router } from 'express';
import { db } from '../db/index.js';
import { workflows, workphases, items, workflowTemplatePhases, boards, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createDefaultBoard } from './boards.js';
import { getOrderedWorkphases } from '../lib/columnRanges.js';
import { getWorkflowItems } from '../lib/workflowItems.js';
import { deleteBoardsById } from '../lib/boardCascade.js';
import { getOrNotFound } from '../lib/getOrNotFound.js';

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
  const workflow = getOrNotFound(db.select().from(workflows).where(eq(workflows.id, req.params.id)).get(), res, 'Workflow not found');
  if (!workflow) return;

  const { workphases: workflowWorkphases } = getOrderedWorkphases(workflow.id);

  // All items in any workphase of this workflow (across all projects that inherit it)
  const workflowItems = getWorkflowItems(workflowWorkphases);

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

  // The workflow row, its seeded workphases (template/copy), and the default
  // board bootstrap commit together — a mid-sequence failure must not leave a
  // workflow with only some of its intended workphases, or a workflow with no
  // usable board at all.
  const { created, createdWorkphases } = db.transaction((tx) => {
    tx.insert(workflows).values({
      id: workflowId,
      projectId,
      name,
      description: description || null,
      createdAt: now,
      updatedAt: now,
    }).run();

    if (templateId) {
      const templatePhases = tx.select().from(workflowTemplatePhases)
        .where(eq(workflowTemplatePhases.templateId, templateId))
        .orderBy(workflowTemplatePhases.position)
        .all();

      for (const phase of templatePhases) {
        tx.insert(workphases).values({
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
      const sourcePhases = tx.select().from(workphases)
        .where(eq(workphases.workflowId, sourceWorkflowId))
        .orderBy(workphases.position)
        .all();

      for (const phase of sourcePhases) {
        tx.insert(workphases).values({
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

    const createdWorkphases = tx.select().from(workphases).where(eq(workphases.workflowId, workflowId)).all();

    // Every workflow needs at least one valid board to be usable — bootstrap a
    // default one with 1:1 columns matching whatever workphases now exist
    // (possibly none, for the "Custom" no-template/no-source path).
    createDefaultBoard(workflowId, 'Default Board', createdWorkphases, now, tx);

    const created = tx.select().from(workflows).where(eq(workflows.id, workflowId)).get()!;
    return { created, createdWorkphases };
  });

  res.status(201).json({ ...created, workphases: createdWorkphases });
});

// Update a workflow
router.put('/:id', (req, res) => {
  const workflow = getOrNotFound(db.select().from(workflows).where(eq(workflows.id, req.params.id)).get(), res, 'Workflow not found');
  if (!workflow) return;

  const { name, description } = req.body;

  db.update(workflows).set({
    name: name ?? workflow.name,
    description: description !== undefined ? description : workflow.description,
    updatedAt: Date.now(),
  }).where(eq(workflows.id, req.params.id)).run();

  const updated = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  res.json(updated);
});

// Delete a workflow. Its boards/columns and workphases are removed in one
// transaction; items are NOT deleted — removing the workphases nulls their
// workphaseId (ON DELETE SET NULL), so items survive (across every project that
// inherited this workflow) and surface as "Unknown status" on whatever board
// their project now resolves to.
router.delete('/:id', (req, res) => {
  const workflow = getOrNotFound(db.select().from(workflows).where(eq(workflows.id, req.params.id)).get(), res, 'Workflow not found');
  if (!workflow) return;

  db.transaction(tx => {
    // Columns FK-reference workphases (no cascade), so boards/columns must go
    // before the workphases.
    const workflowBoardIds = tx.select({ id: boards.id }).from(boards).where(eq(boards.workflowId, req.params.id)).all().map(b => b.id);
    deleteBoardsById(workflowBoardIds, tx);

    // Interim until the Epic 8 events rework: notifications carry a workflowId FK.
    tx.delete(notifications).where(eq(notifications.workflowId, req.params.id)).run();
    tx.delete(workphases).where(eq(workphases.workflowId, req.params.id)).run();
    tx.delete(workflows).where(eq(workflows.id, req.params.id)).run();
  });

  res.status(204).send();
});

export default router;
