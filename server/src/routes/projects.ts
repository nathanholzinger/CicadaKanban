import { Router } from 'express';
import { db } from '../db/index.js';
import { projects, workflows, columns, items, activityLog, itemLabels, chatThreads, chatMessages, attachments, notifications, labels } from '../db/schema.js';
import { eq, inArray, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// List all projects ordered by position (NULLS LAST) then createdAt
router.get('/', (_req, res) => {
  const allProjects = db.select().from(projects).orderBy(asc(projects.position), asc(projects.createdAt)).all();
  res.json(allProjects);
});

// Get a single project with its workflows
router.get('/:id', (req, res) => {
  const project = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
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

function isDescendant(ofId: string, candidateId: string): boolean {
  const children = db.select({ id: projects.id }).from(projects).where(eq(projects.parentId, ofId)).all();
  for (const child of children) {
    if (child.id === candidateId || isDescendant(child.id, candidateId)) return true;
  }
  return false;
}

// Update a project
router.put('/:id', (req, res) => {
  const project = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { name, description, parentId, position } = req.body;

  if (parentId !== undefined && parentId !== null) {
    if (parentId === req.params.id) {
      res.status(400).json({ error: 'A project cannot be its own parent' });
      return;
    }
    if (isDescendant(req.params.id, parentId)) {
      res.status(400).json({ error: 'Cannot reparent to a descendant' });
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

function deleteProjectById(id: string) {
  const children = db.select().from(projects).where(eq(projects.parentId, id)).all();
  for (const child of children) deleteProjectById(child.id);

  // Gather all workflow/column ids for this project upfront
  const workflowIds = db.select({ id: workflows.id })
    .from(workflows).where(eq(workflows.projectId, id)).all().map(w => w.id);

  const columnIds = workflowIds.length > 0
    ? db.select({ id: columns.id }).from(columns).where(inArray(columns.workflowId, workflowIds)).all().map(c => c.id)
    : [];

  // All items to clean up: owned by this project OR sitting in this project's columns
  const ownedItemIds = db.select({ id: items.id })
    .from(items).where(eq(items.projectId, id)).all().map(i => i.id);
  const columnItemIds = columnIds.length > 0
    ? db.select({ id: items.id }).from(items).where(inArray(items.columnId, columnIds)).all().map(i => i.id)
    : [];
  const allItemIds = [...new Set([...ownedItemIds, ...columnItemIds])];

  // Per-item cleanup (chatMessages must come before chatThreads)
  for (const itemId of allItemIds) {
    const threadIds = db.select({ id: chatThreads.id })
      .from(chatThreads).where(eq(chatThreads.itemId, itemId)).all().map(t => t.id);
    if (threadIds.length > 0) {
      db.delete(chatMessages).where(inArray(chatMessages.threadId, threadIds)).run();
    }
    db.delete(notifications).where(eq(notifications.itemId, itemId)).run();
    db.delete(activityLog).where(eq(activityLog.itemId, itemId)).run();
    db.delete(itemLabels).where(eq(itemLabels.itemId, itemId)).run();
    db.delete(chatThreads).where(eq(chatThreads.itemId, itemId)).run();
    db.delete(attachments).where(eq(attachments.itemId, itemId)).run();
  }

  // Delete itemLabels that reference this project's labels regardless of which item
  // holds them — covers cross-project label assignments (itemLabels.labelId → labels.id)
  if (workflowIds.length > 0) {
    const labelIds = db.select({ id: labels.id })
      .from(labels).where(inArray(labels.workflowId, workflowIds)).all().map(l => l.id);
    if (labelIds.length > 0) {
      db.delete(itemLabels).where(inArray(itemLabels.labelId, labelIds)).run();
    }
  }

  // Delete items
  if (allItemIds.length > 0) {
    db.delete(items).where(inArray(items.id, allItemIds)).run();
  }

  // Workflow-level cleanup before removing columns/workflows
  if (workflowIds.length > 0) {
    db.delete(labels).where(inArray(labels.workflowId, workflowIds)).run();
    db.delete(notifications).where(inArray(notifications.workflowId, workflowIds)).run();
    if (columnIds.length > 0) {
      db.delete(columns).where(inArray(columns.workflowId, workflowIds)).run();
    }
  }

  db.delete(workflows).where(eq(workflows.projectId, id)).run();
  db.delete(projects).where(eq(projects.id, id)).run();
}

// Reorder projects — atomically set parentId + position for one or more projects
router.patch('/reorder', (req, res) => {
  const { projectOrders } = req.body;
  if (!Array.isArray(projectOrders)) {
    res.status(400).json({ error: 'projectOrders array is required' });
    return;
  }

  for (const { id, parentId, position } of projectOrders) {
    if (parentId != null) {
      if (parentId === id) {
        res.status(400).json({ error: 'A project cannot be its own parent' });
        return;
      }
      if (isDescendant(id, parentId)) {
        res.status(400).json({ error: 'Cannot reparent to a descendant' });
        return;
      }
    }
    db.update(projects).set({
      parentId: parentId ?? null,
      position,
      updatedAt: Date.now(),
    }).where(eq(projects.id, id)).run();
  }

  res.json({ success: true });
});

// Delete a project — recursively cascades through descendants → workflows → columns → items
router.delete('/:id', (req, res) => {
  const project = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    deleteProjectById(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
