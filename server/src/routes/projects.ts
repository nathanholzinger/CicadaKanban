import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { projects, workflows, workphases, items, notifications, boards } from '../db/schema.js';
import { eq, inArray, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { deleteBoardsById } from '../lib/boardCascade.js';
import { getOrNotFound } from '../lib/getOrNotFound.js';
import { assertValidReparent } from '../lib/itemTree.js';

const router = Router();

// List all projects ordered by position (NULLS LAST) then createdAt
router.get('/', (_req, res) => {
  const allProjects = db.select().from(projects).orderBy(asc(projects.position), asc(projects.createdAt)).all();
  res.json(allProjects);
});

// Get a single project with its workflows
router.get('/:id', (req, res) => {
  const project = getOrNotFound(db.select().from(projects).where(eq(projects.id, req.params.id)).get(), res, 'Project not found');
  if (!project) return;
  const projectWorkflows = db.select().from(workflows).where(eq(workflows.projectId, req.params.id)).all();
  res.json({ ...project, workflows: projectWorkflows });
});

// Create a project
router.post('/', (req, res) => {
  const { name, description, parentId } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const now = Date.now();
  const id = randomUUID();
  db.insert(projects).values({
    id,
    parentId: parentId || null,
    name,
    description: description || null,
    position: now, // Date.now() places new projects at the end of their sibling group
    createdAt: now,
    updatedAt: now,
  }).run();
  const created = db.select().from(projects).where(eq(projects.id, id)).get();
  res.status(201).json(created);
});

// Update a project
router.put('/:id', (req, res) => {
  const project = getOrNotFound(db.select().from(projects).where(eq(projects.id, req.params.id)).get(), res, 'Project not found');
  if (!project) return;

  const { name, description, parentId, position } = req.body;

  if (parentId !== undefined && parentId !== null) {
    const reparentError = assertValidReparent(projects, req.params.id, parentId, 'project');
    if (reparentError) {
      res.status(400).json({ error: reparentError });
      return;
    }
  }

  db.update(projects).set({
    name: name ?? project.name,
    description: description !== undefined ? description : project.description,
    parentId: 'parentId' in req.body ? (parentId ?? null) : project.parentId,
    position: position !== undefined ? position : project.position,
    updatedAt: Date.now(),
  }).where(eq(projects.id, req.params.id)).run();
  const updated = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  res.json(updated);
});

// Recursively deletes a project subtree. Runs inside a caller-supplied
// transaction (tx) so the whole cascade — descendant projects, items, workflow
// artifacts — commits atomically; a mid-cascade failure rolls the lot back.
function deleteProjectById(id: string, tx: Tx) {
  const children = tx.select().from(projects).where(eq(projects.parentId, id)).all();
  for (const child of children) deleteProjectById(child.id, tx);

  // Gather all workflow/workphase ids for this project upfront
  const workflowIds = tx.select({ id: workflows.id })
    .from(workflows).where(eq(workflows.projectId, id)).all().map(w => w.id);

  const workphaseIds = workflowIds.length > 0
    ? tx.select({ id: workphases.id }).from(workphases).where(inArray(workphases.workflowId, workflowIds)).all().map(w => w.id)
    : [];

  // All items to remove: owned by this project OR sitting in this project's
  // workphases. Each item's dependent rows (itemLabels, activityLog,
  // notifications, attachments, chat threads/messages) are removed by ON DELETE
  // CASCADE, so deleting the items is enough.
  const ownedItemIds = tx.select({ id: items.id })
    .from(items).where(eq(items.projectId, id)).all().map(i => i.id);
  const workphaseItemIds = workphaseIds.length > 0
    ? tx.select({ id: items.id }).from(items).where(inArray(items.workphaseId, workphaseIds)).all().map(i => i.id)
    : [];
  const allItemIds = [...new Set([...ownedItemIds, ...workphaseItemIds])];

  if (allItemIds.length > 0) {
    tx.delete(items).where(inArray(items.id, allItemIds)).run();
  }

  // Workflow-level cleanup before removing workphases/workflows. Labels are
  // global — NOT deleted with a project. Workflow-scoped notifications aren't
  // item-anchored, so they are cleared explicitly here.
  if (workflowIds.length > 0) {
    tx.delete(notifications).where(inArray(notifications.workflowId, workflowIds)).run();

    const workflowBoardIds = tx.select({ id: boards.id })
      .from(boards).where(inArray(boards.workflowId, workflowIds)).all().map(b => b.id);
    deleteBoardsById(workflowBoardIds, tx);

    if (workphaseIds.length > 0) {
      tx.delete(workphases).where(inArray(workphases.workflowId, workflowIds)).run();
    }
  }

  tx.delete(workflows).where(eq(workflows.projectId, id)).run();
  tx.delete(projects).where(eq(projects.id, id)).run();
}

// Reorder projects — atomically set parentId + position for one or more projects
router.patch('/reorder', (req, res) => {
  const { projectOrders } = req.body;
  if (!Array.isArray(projectOrders)) {
    res.status(400).json({ error: 'projectOrders array is required' });
    return;
  }

  // Validate every entry before writing any — otherwise a mid-loop reject would
  // leave earlier rows already updated (the loop used to interleave the two).
  for (const { id, parentId } of projectOrders) {
    if (parentId != null) {
      const reparentError = assertValidReparent(projects, id, parentId, 'project');
      if (reparentError) {
        res.status(400).json({ error: reparentError });
        return;
      }
    }
  }

  db.transaction((tx) => {
    for (const { id, parentId, position } of projectOrders) {
      tx.update(projects).set({
        parentId: parentId ?? null,
        position,
        updatedAt: Date.now(),
      }).where(eq(projects.id, id)).run();
    }
  });

  res.json({ success: true });
});

// Delete a project — recursively cascades through descendants → workflows → workphases → items
router.delete('/:id', (req, res) => {
  const project = getOrNotFound(db.select().from(projects).where(eq(projects.id, req.params.id)).get(), res, 'Project not found');
  if (!project) return;

  try {
    db.transaction((tx) => deleteProjectById(req.params.id, tx));
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
