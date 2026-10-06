import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { projects, workflows, workphases, items, notifications, boards } from '../db/schema.js';
import { eq, inArray, asc, isNull, and, not, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { deleteBoardsById } from '../lib/boardCascade.js';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { assertValidReparent } from '../lib/itemTree.js';
import { resolveAppendPosition, resolvePositionByAnchorAndSide } from '../lib/positionResolver.js';

const router = Router();

// A project's position-comparison scope: its siblings — same parentId, or
// every root project when parentId is null (wiki project-tree §4). Simpler than
// `itemPositionScope.ts::positionScopeFor` since projects have no
// attach/workphase dimension, just one flat "children of X" bucket per parent.
function projectPositionScope(parentId: string | null, excludeId?: string): SQL {
  const base: SQL = parentId ? eq(projects.parentId, parentId) : isNull(projects.parentId);
  return excludeId ? and(base, not(eq(projects.id, excludeId)))! : base;
}

// Lists projects by position, then createdAt. SQLite sorts a missing position
// first, the same order as counting it as 0 (wiki project-tree §4).
router.get('/', (_req, res) => {
  const allProjects = db.select().from(projects).orderBy(asc(projects.position), asc(projects.createdAt)).all();
  res.json(allProjects);
});

// Get a single project with its workflows
router.get('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;
  const projectWorkflows = db.select().from(workflows).where(eq(workflows.projectId, req.params.id)).all();
  res.json({ ...project, workflows: projectWorkflows });
});

// Create a project, top-level or under `parentId`, after its siblings' true last
// (wiki project-tree §5).
router.post('/', (req, res) => {
  const { name, description, parentId } = req.body;
  // A project always has a name (wiki project-tree §8).
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const now = Date.now();
  const id = randomUUID();
  const resolvedParentId = parentId || null;

  // Wrapped in a transaction: resolveAppendPosition can trigger a reindex of
  // the whole scope, which writes one row at a time — without an enclosing
  // transaction each of those writes would auto-commit individually.
  db.transaction(tx => {
    // Resolved via the shared positioning library, so a brand-new sibling in
    // a group whose positions have grown past the magnitude threshold
    // triggers that group's reindex.
    const scope = projectPositionScope(parentId);
    const position = resolveAppendPosition(projects, scope, tx);
    tx.insert(projects)
      .values({
        id,
        parentId: resolvedParentId,
        name,
        description: description || null,
        position,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  const created = db.select().from(projects).where(eq(projects.id, id)).get();
  res.status(201).json(created);
});

// Update a project, its parent included (wiki project-tree §7).
router.put('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  const { name, description, parentId } = req.body;

  // The new parent must exist, and be neither the project nor in its subtree
  // (wiki project-tree §3).
  if (parentId !== undefined && parentId !== null) {
    const reparentError = assertValidReparent(projects, req.params.id, parentId, 'project');
    if (reparentError) {
      res.status(400).json({ error: reparentError });
      return;
    }
    const parent = db.select({ id: projects.id }).from(projects).where(eq(projects.id, parentId)).get();
    if (!parent) {
      res.status(400).json({ error: 'parentId does not reference an existing project' });
      return;
    }
  }

  // No `position` field here — positions are only ever resolved through
  // PATCH /:id/move (never a raw client-supplied number, see positionResolver.ts).
  db.update(projects)
    .set({
      name: name ?? project.name,
      description: description !== undefined ? description : project.description,
      parentId: 'parentId' in req.body ? (parentId ?? null) : project.parentId,
      updatedAt: Date.now(),
    })
    .where(eq(projects.id, req.params.id))
    .run();
  const updated = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  res.json(updated);
});

// Recursively deletes a project subtree (wiki project-tree §9). Runs inside a caller-supplied
// transaction (tx) so the whole cascade — descendant projects, items, workflow
// artifacts — commits atomically; a mid-cascade failure rolls the lot back.
function deleteProjectById(id: string, tx: Tx) {
  const children = tx.select().from(projects).where(eq(projects.parentId, id)).all();
  for (const child of children) deleteProjectById(child.id, tx);

  // Gather this project's workflow ids upfront
  const workflowIds = tx
    .select({ id: workflows.id })
    .from(workflows)
    .where(eq(workflows.projectId, id))
    .all()
    .map(w => w.id);

  // Items to remove: owned by this project ONLY — not also every item merely
  // sitting in one of this project's workphases. A project that was
  // reparented away, or had its own workflow assigned, after filing items
  // into this project's workphases still points its workphaseId here;
  // sweeping those up too would silently delete another project's items.
  // Removing the workphases below already nulls their workphaseId (ON DELETE
  // SET NULL) — they survive and surface as "Unknown status" on whatever
  // board their real project now resolves to. Each deleted item's dependent rows (itemLabels,
  // activityLog, notifications, attachments, chat threads/messages) are
  // removed by ON DELETE CASCADE, so deleting the items is enough.
  const allItemIds = tx
    .select({ id: items.id })
    .from(items)
    .where(eq(items.projectId, id))
    .all()
    .map(i => i.id);

  if (allItemIds.length > 0) {
    tx.delete(items).where(inArray(items.id, allItemIds)).run();
  }

  // Workflow-level cleanup before removing workphases/workflows. Labels are
  // global — NOT deleted with a project. Workflow-scoped notifications aren't
  // item-anchored, so they are cleared explicitly here.
  if (workflowIds.length > 0) {
    tx.delete(notifications).where(inArray(notifications.workflowId, workflowIds)).run();

    const workflowBoardIds = tx
      .select({ id: boards.id })
      .from(boards)
      .where(inArray(boards.workflowId, workflowIds))
      .all()
      .map(b => b.id);
    deleteBoardsById(workflowBoardIds, tx);

    tx.delete(workphases).where(inArray(workphases.workflowId, workflowIds)).run();
  }

  tx.delete(workflows).where(eq(workflows.projectId, id)).run();
  tx.delete(projects).where(eq(projects.id, id)).run();
}

// Move/reorder a project — reposition among siblings and/or reparent, in
// one atomic step (wiki project-tree §6). One project per request, not a batch: a batch's
// per-entry cycle check would run against pre-transaction DB state, so a
// same-request A<->B parent swap could commit a cycle undetected. With a
// single-item endpoint there's no second entry in the same request to
// collude with.
//
// Body: { parentId?, prevId?, nextId? }. `prevId`/`nextId` name the
// project's resulting *predecessor*/*successor* — the project that should
// end up immediately before/after the moved project (not "the project I go
// before/after," which reads ambiguously either direction; prevId/nextId
// describes a position in the sequence). Both omitted/null means "no
// positioning info, append to the true end of the resulting scope," never
// "trust me, the scope is empty": even if the client guessed wrong because
// a collapsed parent's real children were hidden, the server always
// re-derives the true current children here. Any given prevId/nextId is
// independently verified as a real, current sibling in the resulting scope
// before its position is trusted for the midpoint math.
router.patch('/:id/move', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  const { parentId, prevId, nextId } = req.body;

  if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
    res.status(400).json({ error: 'parentId must be a string or null' });
    return;
  }
  if (prevId !== undefined && prevId !== null && typeof prevId !== 'string') {
    res.status(400).json({ error: 'prevId must be a string or null' });
    return;
  }
  if (nextId !== undefined && nextId !== null && typeof nextId !== 'string') {
    res.status(400).json({ error: 'nextId must be a string or null' });
    return;
  }

  const targetParentId: string | null = 'parentId' in req.body ? (parentId ?? null) : project.parentId;

  if (parentId !== undefined && parentId !== null) {
    const reparentError = assertValidReparent(projects, req.params.id, parentId, 'project');
    if (reparentError) {
      res.status(400).json({ error: reparentError });
      return;
    }
    const parent = db.select({ id: projects.id }).from(projects).where(eq(projects.id, parentId)).get();
    if (!parent) {
      res.status(400).json({ error: 'parentId does not reference an existing project' });
      return;
    }
  }

  // Verifies a claimed prevId/nextId is a real, current sibling in the
  // *resulting* scope before trusting it for the midpoint math — rejects a
  // stale/false claim rather than silently falling back (wiki positioning §2).
  // Validated here,
  // against plain `db`, before the transaction below opens: this handler's
  // only write is to the subject project itself, so nothing about a
  // sibling's existence/scope/position can change between this check and
  // the transaction that uses it. Validating first keeps every bail-out
  // outside the transaction: a db.transaction callback in better-sqlite3
  // only rolls back on throw, so a bail-out inside it, after some other
  // write had already run, would still commit that write.
  function verifyAnchor(anchorId: string, label: 'prevId' | 'nextId'): string | null {
    const sibling = db
      .select({ parentId: projects.parentId, position: projects.position })
      .from(projects)
      .where(eq(projects.id, anchorId))
      .get();
    if (!sibling) return `${label} does not reference an existing project`;
    if ((sibling.parentId ?? null) !== targetParentId) return `${label} is not a sibling in the target scope`;
    if (sibling.position === null) return `${label} has no position to anchor against`;
    return null;
  }

  if (prevId) {
    const error = verifyAnchor(prevId, 'prevId');
    if (error) {
      res.status(400).json({ error });
      return;
    }
  } else if (nextId) {
    const error = verifyAnchor(nextId, 'nextId');
    if (error) {
      res.status(400).json({ error });
      return;
    }
  }

  db.transaction(tx => {
    const scope = projectPositionScope(targetParentId, req.params.id);

    let position: number;
    if (prevId) {
      // prevId is the project's resulting predecessor — insert immediately after it.
      position = resolvePositionByAnchorAndSide(projects, scope, tx, 'after', prevId);
    } else if (nextId) {
      // nextId is the project's resulting successor — insert immediately before it.
      position = resolvePositionByAnchorAndSide(projects, scope, tx, 'before', nextId);
    } else {
      // Both omitted/null — never trust "empty"; always re-derive the true
      // append position against current children.
      position = resolveAppendPosition(projects, scope, tx);
    }

    tx.update(projects)
      .set({
        parentId: targetParentId,
        position,
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, req.params.id))
      .run();
  });

  const updated = db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  res.json(updated);
});

// Delete a project — recursively cascades through descendants → workflows → workphases → items
router.delete('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  try {
    db.transaction(tx => deleteProjectById(req.params.id, tx));
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
