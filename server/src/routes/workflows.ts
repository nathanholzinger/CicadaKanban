import { Router } from 'express';
import { db } from '../db/index.js';
import {
  workflows,
  workphases,
  items,
  workflowTemplates,
  workflowTemplatePhases,
  projects,
  boards,
  notifications,
} from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createDefaultBoard } from './boards.js';
import { getOrderedWorkphases } from '../lib/workphaseOrder.js';
import { getProjectsUsingWorkflow, getWorkflowItems } from '../lib/workflowItems.js';
import { deleteBoardsById } from '../lib/boardCascade.js';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
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
  // could reference, so no extra query is needed to attach positionScope. It
  // answers only for the items of a project that uses this workflow: one filed
  // into these workphases from a project on another workflow has no scope, as
  // on every other read (wiki item-positioning §2).
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
  const projectExists = Boolean(db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).get());
  if (!projectExists) {
    res.status(400).json({ error: 'projectId does not reference an existing project' });
    return;
  }
  // A project has at most one workflow of its own (wiki project-tree §10).
  const owned = db.select({ name: workflows.name }).from(workflows).where(eq(workflows.projectId, projectId)).get();
  if (owned) {
    res.status(409).json({ error: `Project already has a workflow: "${owned.name}"` });
    return;
  }
  // Neither is an FK, so a bogus id here wouldn't crash — it would just
  // silently produce a zero-workphase workflow, which is just as confusing.
  // Guarded by `templateId &&`/`sourceWorkflowId &&` before querying (not just
  // before checking the result) — eq() against an omitted, undefined id would
  // otherwise reach better-sqlite3 as an invalid bind parameter.
  const templateExists =
    !templateId ||
    Boolean(
      db.select({ id: workflowTemplates.id }).from(workflowTemplates).where(eq(workflowTemplates.id, templateId)).get(),
    );
  if (!templateExists) {
    res.status(400).json({ error: 'templateId does not reference an existing template' });
    return;
  }
  const sourceWorkflowExists =
    !sourceWorkflowId ||
    Boolean(db.select({ id: workflows.id }).from(workflows).where(eq(workflows.id, sourceWorkflowId)).get());
  if (!sourceWorkflowExists) {
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

    if (templateId) {
      const templatePhases = tx
        .select()
        .from(workflowTemplatePhases)
        .where(eq(workflowTemplatePhases.templateId, templateId))
        .orderBy(workflowTemplatePhases.position)
        .all();

      for (const phase of templatePhases) {
        tx.insert(workphases)
          .values({
            id: randomUUID(),
            workflowId,
            name: phase.name,
            position: phase.position,
            triggersNotification: phase.triggersNotification,
            isTerminal: phase.isTerminal,
            createdAt: now,
          })
          .run();
      }
    } else if (sourceWorkflowId) {
      const sourcePhases = tx
        .select()
        .from(workphases)
        .where(eq(workphases.workflowId, sourceWorkflowId))
        .orderBy(workphases.position)
        .all();

      for (const phase of sourcePhases) {
        tx.insert(workphases)
          .values({
            id: randomUUID(),
            workflowId,
            name: phase.name,
            position: phase.position,
            triggersNotification: phase.triggersNotification,
            isTerminal: phase.isTerminal,
            createdAt: now,
          })
          .run();
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

// Delete a workflow. Its boards/columns and workphases are removed in one
// transaction; items are NOT deleted — removing the workphases nulls their
// workphaseId (ON DELETE SET NULL), so items survive (across every project that
// inherited this workflow) and surface as "Unknown status" on whatever board
// their project now resolves to.
router.delete('/:id', (req, res) => {
  const workflow = getByIdOrNotFound(workflows, req.params.id, res, 'Workflow not found');
  if (!workflow) return;

  db.transaction(tx => {
    // Columns FK-reference workphases (no cascade), so boards/columns must go
    // before the workphases.
    const workflowBoardIds = tx
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.workflowId, req.params.id))
      .all()
      .map(b => b.id);
    deleteBoardsById(workflowBoardIds, tx);

    // Notifications carry a workflowId FK with no cascade, so they go before the workflow.
    tx.delete(notifications).where(eq(notifications.workflowId, req.params.id)).run();
    tx.delete(workphases).where(eq(workphases.workflowId, req.params.id)).run();
    tx.delete(workflows).where(eq(workflows.id, req.params.id)).run();
  });

  res.status(204).send();
});

export default router;
