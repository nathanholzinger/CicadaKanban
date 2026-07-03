import { Router } from 'express';
import { db } from '../db/index.js';
import { projects, workflows, columns, items, activityLog, itemLabels, chatThreads, attachments, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// List all projects (flat; parentId allows client to build tree)
router.get('/', (_req, res) => {
  const allProjects = db.select().from(projects).all();
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

  const { name, description, parentId } = req.body;

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
    updatedAt: Date.now(),
  }).where(eq(projects.id, req.params.id)).run();
  const updated = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  res.json(updated);
});

function deleteProjectById(id: string) {
  // Recursively delete children first (satisfies the parent_id FK constraint)
  const children = db.select().from(projects).where(eq(projects.parentId, id)).all();
  for (const child of children) {
    deleteProjectById(child.id);
  }

  const projectWorkflows = db.select().from(workflows).where(eq(workflows.projectId, id)).all();

  for (const workflow of projectWorkflows) {
    const projectItems = db.select().from(items).where(eq(items.projectId, id)).all();
    for (const item of projectItems) {
      db.delete(notifications).where(eq(notifications.itemId, item.id)).run();
      db.delete(activityLog).where(eq(activityLog.itemId, item.id)).run();
      db.delete(itemLabels).where(eq(itemLabels.itemId, item.id)).run();
      db.delete(chatThreads).where(eq(chatThreads.itemId, item.id)).run();
      db.delete(attachments).where(eq(attachments.itemId, item.id)).run();
    }
    db.delete(items).where(eq(items.projectId, id)).run();
    db.delete(notifications).where(eq(notifications.workflowId, workflow.id)).run();
    db.delete(columns).where(eq(columns.workflowId, workflow.id)).run();
  }

  db.delete(workflows).where(eq(workflows.projectId, id)).run();
  db.delete(projects).where(eq(projects.id, id)).run();
}

// Delete a project — recursively cascades through descendants → workflows → columns → items
router.delete('/:id', (req, res) => {
  const project = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  deleteProjectById(req.params.id);
  res.status(204).send();
});

export default router;
