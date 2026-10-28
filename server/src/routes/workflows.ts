import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { workflows, workphases, items, workflowTemplates, workflowTemplatePhases, projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createDefaultBoard } from '../lib/defaultBoard.js';
import { getOrderedWorkphases } from '../lib/workphaseOrder.js';
import { copyWorkphases } from '../lib/workflowWorkphases.js';
import { getProjectsUsingWorkflow, getWorkflowItems } from '../lib/workflowItems.js';
import { deleteWorkflowsById } from '../lib/workflowCascade.js';
import { existsById, getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { isTerminalLookup, withPositionScope } from '../lib/itemPositionScope.js';

type ItemRow = typeof items.$inferSelect;

function addDepths(itemRows: ItemRow[]): (ItemRow & { depth: number })[] {
  const parentMap = new Map(itemRows.map(i => [i.id, i.parentId]));
  const depthCache = new Map<string, number>();

  // `visiting` tracks the current recursion stack (distinct from
  // `depthCache`, which only gets a node's entry *after* its recursive call
  // returns) — a corrupted parentId cycle in the data would otherwise
  // recurse into the same ids forever, since the cache
  // can't break a cycle it never gets to write to. Re-entering a node still
  // on the stack means a cycle exists at that point; treating it as a
  // synthetic root (depth 0) there bounds every id's depth instead of
  // hanging, at the cost of an arbitrary (but stable) depth for the
  // cycle's own members.
  function getDepth(id: string, visiting: Set<string> = new Set()): number {
    if (depthCache.has(id)) return depthCache.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const parentId = parentMap.get(id);
    const d = parentId && parentMap.has(parentId) ? getDepth(parentId, visiting) + 1 : 0;
    depthCache.set(id, d);
    return d;
  }

  return itemRows.map(item => ({ ...item, depth: getDepth(item.id) }));
}

// A reference field names a row unless it was left out or is `null` (wiki row-references §2).
const namesARow = (value: unknown): boolean => value !== undefined && value !== null;

// The workphases a new workflow starts with: the named template's, else the named workflow's,
// else none. The route refuses a create that names both, so at most one is named here.
function startingWorkphases(tx: Tx, templateId: unknown, sourceWorkflowId: unknown) {
  if (namesARow(templateId)) {
    return tx
      .select()
      .from(workflowTemplatePhases)
      .where(eq(workflowTemplatePhases.templateId, String(templateId)))
      .orderBy(workflowTemplatePhases.position)
      .all();
  }
  if (namesARow(sourceWorkflowId)) {
    return tx
      .select()
      .from(workphases)
      .where(eq(workphases.workflowId, String(sourceWorkflowId)))
      .orderBy(workphases.position)
      .all();
  }
  return [];
}

const router = Router();

// List all workflows, optionally filtered by project
router.get('/', (req, res) => {
  const { projectId } = req.query;
  const allWorkflows = projectId
    ? db
        .select()
        .from(workflows)
        .where(eq(workflows.projectId, String(projectId)))
        .all()
    : db.select().from(workflows).all();
  res.json(allWorkflows);
});

// Get a single workflow with workphases and items
router.get('/:id', (req, res) => {
  const workflow = getByIdOrNotFound(workflows, req.params.id, res, 'Workflow not found');
  if (!workflow) return;

  const { workphases: workflowWorkphases } = getOrderedWorkphases(workflow.id);

  // All items in any workphase of this workflow (across all projects that inherit it)
  const workflowItems = getWorkflowItems(workflowWorkphases);

  // workflowWorkphases already carries isTerminal for every id an item here
  // could reference, so no extra query is needed to attach positionScope. Only the
  // items of a project that uses this workflow get one: an item filed into these
  // workphases from a project on another workflow has no scope, as on every other
  // read (wiki item-positioning §2).
  const isTerminalOf = isTerminalLookup(workflowWorkphases);
  const usedBy = getProjectsUsingWorkflow(workflow.id);
  const noScope = () => null;
  const scopedItems = workflowItems.map(item =>
    withPositionScope(item, item.projectId && usedBy.has(item.projectId) ? isTerminalOf : noScope),
  );

  res.json({ ...workflow, workphases: workflowWorkphases, items: addDepths(scopedItems) });
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
  // A bogus projectId would otherwise surface as an opaque FK-violation 500.
  if (!existsById(projects, projectId)) {
    res.status(400).json({ error: 'projectId does not reference an existing project' });
    return;
  }
  // A project has at most one workflow of its own (wiki project-tree §10).
  const owned = db.select({ name: workflows.name }).from(workflows).where(eq(workflows.projectId, projectId)).get();
  if (owned) {
    res.status(409).json({ error: `Project already has a workflow: "${owned.name}"` });
    return;
  }
  // A workflow starts from a template or from another workflow, not both: taking either would
  // drop the other without a sign (wiki project-tree §10).
  if (namesARow(templateId) && namesARow(sourceWorkflowId)) {
    res.status(400).json({ error: 'templateId and sourceWorkflowId cannot both be given' });
    return;
  }
  // Neither is an FK, so a bogus id here wouldn't crash — it would just
  // silently produce a zero-workphase workflow, which is just as confusing.
  // Only a field left out or `null` names none; an empty string names no row, so it is
  // refused with the rest (wiki row-references §1, §2). The check is guarded before
  // querying — eq() against an omitted, undefined id would otherwise reach
  // better-sqlite3 as an invalid bind parameter.
  if (namesARow(templateId) && !existsById(workflowTemplates, templateId)) {
    res.status(400).json({ error: 'templateId does not reference an existing template' });
    return;
  }
  if (namesARow(sourceWorkflowId) && !existsById(workflows, sourceWorkflowId)) {
    res.status(400).json({ error: 'sourceWorkflowId does not reference an existing workflow' });
    return;
  }

  const now = Date.now();
  const workflowId = randomUUID();

  // The workflow row, its seeded workphases (template/copy), and the default
  // board bootstrap commit together — a mid-sequence failure must not leave a
  // workflow with only some of its intended workphases, or a workflow with no
  // usable board at all.
  const { created, createdWorkphases } = db.transaction(tx => {
    tx.insert(workflows)
      .values({
        id: workflowId,
        projectId,
        name,
        description: description || null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    copyWorkphases(tx, workflowId, startingWorkphases(tx, templateId, sourceWorkflowId), now);

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
  const workflow = getByIdOrNotFound(workflows, req.params.id, res, 'Workflow not found');
  if (!workflow) return;

  const { name, description } = req.body;

  db.update(workflows)
    .set({
      name: name ?? workflow.name,
      description: description !== undefined ? description : workflow.description,
      updatedAt: Date.now(),
    })
    .where(eq(workflows.id, req.params.id))
    .run();

  const updated = db.select().from(workflows).where(eq(workflows.id, req.params.id)).get();
  res.json(updated);
});

// Delete a workflow and what hangs off it: `workflowCascade.ts::deleteWorkflowsById`.
router.delete('/:id', (req, res) => {
  const workflow = getByIdOrNotFound(workflows, req.params.id, res, 'Workflow not found');
  if (!workflow) return;

  db.transaction(tx => deleteWorkflowsById([req.params.id], tx));

  res.status(204).send();
});

export default router;
