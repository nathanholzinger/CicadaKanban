import { Router, type Response } from 'express';
import { db } from '../db/index.js';
import { items, workphases, activityLog, projects, itemTypes, agents } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { existsById, getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { hierarchyDepth, parentRefusal, walkItemDescendants } from '../lib/itemTree.js';
import { resolveAppendPosition, withReindexDisclosure, type ReindexedPosition } from '../lib/positionResolver.js';
import { isTerminalLookup, positionScopeFor, withPositionScope } from '../lib/itemPositionScope.js';
import {
  applyHierarchyRequest,
  getParent,
  logCreatedUnderParent,
  resolveCreate,
  validateHierarchyRequest,
  type HierarchyRequest,
} from '../lib/itemHierarchy.js';
import { effectiveWorkflowIdForProject } from '../lib/workflowItems.js';
import { logActivity } from '../lib/activityLog.js';

const router = Router();

// The `isTerminalOf` withPositionScope needs, for the single-item routes
// below — a plain per-call lookup, since each only ever scopes one row. It
// answers for the workphases of the workflow the item's project uses, and null
// for any other: an item in another workflow's workphase has no position scope
// (wiki item-positioning §2). GET /:id looks up its own item+children batch
// instead (see below).
function isTerminalOfProject(projectId: string | null): (workphaseId: string) => boolean | null {
  const workflowId = projectId ? effectiveWorkflowIdForProject(projectId) : null;
  return workphaseId => {
    const workphase = db
      .select({ isTerminal: workphases.isTerminal, workflowId: workphases.workflowId })
      .from(workphases)
      .where(eq(workphases.id, workphaseId))
      .get();
    return workphase && workphase.workflowId === workflowId ? Boolean(workphase.isTerminal) : null;
  };
}

// Every item write responds with the fresh row, and with the reindex it triggered when
// one fired (wiki item-positioning §5.1).
function respondWithItem(res: Response, id: string, reindexed: ReindexedPosition[], status = 200): void {
  const row = db.select().from(items).where(eq(items.id, id)).get()!;
  res.status(status).json(withReindexDisclosure(withPositionScope(row, isTerminalOfProject(row.projectId)), reindexed));
}

// Get a single item with its children and activity log
router.get('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  // The API's `depth` is 0-based (root = 0); hierarchyDepth counts from 1.
  const depth = hierarchyDepth(req.params.id) - 1;

  const rawChildren = db.select().from(items).where(eq(items.parentId, req.params.id)).all();

  // One batched lookup covering the item's own workphase and every child's,
  // instead of a query per row — also folds in the workflowId derivation
  // below, which needs the same rows.
  const workphaseIds = [item.workphaseId, ...rawChildren.map(c => c.workphaseId)].filter(
    (id): id is string => id !== null,
  );
  const workphaseRows = workphaseIds.length
    ? db
        .select({ id: workphases.id, isTerminal: workphases.isTerminal, workflowId: workphases.workflowId })
        .from(workphases)
        .where(inArray(workphases.id, workphaseIds))
        .all()
    : [];
  // Only the workphases of the workflow the item's project uses count: a child
  // shares its parent's project.
  const projectWorkflowId = item.projectId ? effectiveWorkflowIdForProject(item.projectId) : null;
  const isTerminalOf = isTerminalLookup(workphaseRows.filter(w => w.workflowId === projectWorkflowId));

  const children = rawChildren.map(child => ({ ...withPositionScope(child, isTerminalOf), depth: depth + 1 }));

  const activity = db
    .select()
    .from(activityLog)
    .where(eq(activityLog.itemId, req.params.id))
    .orderBy(activityLog.createdAt)
    .all();

  // Derive workflowId from the item's workphase for MCP tool convenience
  const workflowId = item.workphaseId ? (workphaseRows.find(w => w.id === item.workphaseId)?.workflowId ?? null) : null;

  res.json({ ...withPositionScope(item, isTerminalOf), workflowId, depth, children, activity });
});

// Create an item, in the project it names or its parent's (wiki item-attachment §14). The
// parent and the project are checked here; the flag and the workphase go through
// `itemHierarchy.ts::resolveCreate`, so a create answers as a move does.
router.post('/', (req, res) => {
  const { type, parentId, projectId, workphaseId, title, description, assigneeType, agentId, isAttached } = req.body;

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // The parent is a legal one for a new item, which has height 0 (wiki item-attachment §7).
  // A non-existent parentId would otherwise be stored silently, leaving an attached
  // child invisible on every board (no parent card to nest under).
  const parentError = parentRefusal('item', null, parentId || null);
  if (parentError) {
    res.status(400).json({ error: parentError });
    return;
  }

  const parent = parentId ? (getParent(parentId) ?? null) : null;
  const resolvedProjectId = projectId || parent?.projectId;
  if (!resolvedProjectId) {
    res.status(400).json({ error: 'projectId is required (or provide a parentId to inherit it)' });
    return;
  }
  // A project that names no row would otherwise surface as an opaque FK-violation 500.
  if (!existsById(projects, resolvedProjectId)) {
    res.status(400).json({ error: 'projectId does not reference an existing project' });
    return;
  }

  // A child lives in its parent's project — a hierarchy can't straddle two
  // (wiki item-attachment §9). Only triggers when projectId is passed
  // explicitly and disagrees; omit it to inherit the parent's.
  if (parent && resolvedProjectId !== parent.projectId) {
    res.status(400).json({ error: 'parentId belongs to a different project' });
    return;
  }

  // So would a type or an agent that names no row.
  if (type !== undefined && type !== null && !existsById(itemTypes, type)) {
    res.status(400).json({ error: 'type does not reference an existing item type' });
    return;
  }
  if (agentId && !existsById(agents, agentId)) {
    res.status(400).json({ error: 'agentId does not reference an existing agent' });
    return;
  }

  const resolution = resolveCreate({ parent, projectId: resolvedProjectId, isAttached, workphaseId });
  if ('error' in resolution) {
    res.status(400).json({ error: resolution.error });
    return;
  }
  const { attached, workphaseId: resolvedWorkphaseId } = resolution;

  const now = Date.now();
  const id = randomUUID();
  const reindexed: ReindexedPosition[] = [];

  // Position/completedAt: an attached child is scoped to (parentId,
  // isAttached) — its true siblings, whatever its workphase, so a parent with
  // none leaves it as positioned as any other (wiki item-positioning §3). A
  // root/detached item is scoped to its workflow, unless its workphase is
  // terminal, in which case it gets no stored position at all — ordering is
  // derived from completedAt instead (wiki item-positioning §6).
  //
  // Wrapped in a transaction: resolveAppendPosition can trigger a reindex of
  // the whole scope, which writes one row at a time — without an enclosing
  // transaction each of those writes would auto-commit individually.
  db.transaction(tx => {
    let position: number | null = null;
    let completedAt: number | null = null;
    if (attached && parentId) {
      const scopeInput = { isAttached: true, parentId, workphaseId: resolvedWorkphaseId };
      position = resolveAppendPosition(items, positionScopeFor(scopeInput, undefined, tx), tx, reindexed);
    } else if (resolvedWorkphaseId) {
      const targetWorkphase = tx
        .select({ isTerminal: workphases.isTerminal })
        .from(workphases)
        .where(eq(workphases.id, resolvedWorkphaseId))
        .get();
      if (targetWorkphase?.isTerminal) {
        completedAt = now;
      } else {
        const scopeInput = { isAttached: false, parentId: null, workphaseId: resolvedWorkphaseId };
        position = resolveAppendPosition(items, positionScopeFor(scopeInput, undefined, tx), tx, reindexed);
      }
    }
    // Note: append here is workflow-wide (see positionScopeFor), not narrowed
    // to resolvedWorkphaseId — a brand-new item lands after the workflow's
    // true last active item, not just the last item in its own workphase.

    tx.insert(items)
      .values({
        id,
        type: type ?? null,
        parentId: parentId || null,
        projectId: resolvedProjectId,
        workphaseId: resolvedWorkphaseId,
        title,
        description: description || null,
        position,
        completedAt,
        assigneeType: assigneeType || null,
        agentId: agentId || null,
        isAttached: attached ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    logActivity(
      id,
      'status_change',
      type ? `Created as ${type}` : 'Created',
      {
        workphaseId: resolvedWorkphaseId,
      },
      tx,
    );
    if (parent) logCreatedUnderParent(tx, id, parent, attached);
  });

  respondWithItem(res, id, reindexed, 201);
});

// Update an item's details. This is the Sheet's edit endpoint: title,
// description, assignment — and, via `parentId`/`isAttached`, the same
// hierarchy change PATCH /:id/move performs, through the same primitive
// (lib/itemHierarchy.ts) so the two can't drift. Workphase and anchor
// placement aren't accepted here.
router.put('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { title, description, assigneeType, agentId, parentId, isAttached } = req.body;

  // Rejects an empty title, as POST does.
  if (title !== undefined && !title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // Only run the hierarchy primitive when the parent link or attach flag is
  // actually in the request. A title/description-only PUT must NOT: it
  // would silently relocate an attached child whose workphase has diverged
  // from its parent's, dragging its subtree along.
  const hierarchyReq: HierarchyRequest | null =
    parentId !== undefined || isAttached !== undefined ? { parentId, isAttached } : null;
  if (hierarchyReq) {
    const error = validateHierarchyRequest(item, hierarchyReq);
    if (error) {
      res.status(400).json({ error });
      return;
    }
  }

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (assigneeType !== undefined) updates.assigneeType = assigneeType;
  if (agentId !== undefined) updates.agentId = agentId;

  // The field edits, the hierarchy change with its cascades, and the
  // activity log form one atomic unit — a mid-sequence failure must not
  // leave a half-reparented subtree.
  let reindexed: ReindexedPosition[] = [];
  db.transaction(tx => {
    tx.update(items).set(updates).where(eq(items.id, req.params.id)).run();

    if (hierarchyReq) reindexed = applyHierarchyRequest(tx, item, hierarchyReq).reindexed;

    if (assigneeType !== undefined || agentId !== undefined) {
      logActivity(
        req.params.id,
        'assignment',
        `Assigned to ${assigneeType || 'unassigned'}`,
        {
          assigneeType: assigneeType || null,
          agentId: agentId || null,
        },
        tx,
      );
    }
  });

  respondWithItem(res, req.params.id, reindexed);
});

// Move an item: workphase, parent, attachment, and placement, in any
// combination, committed as one transaction. Placement is `{anchorId, side}`,
// resolved server-side against true current data, never a client-computed
// value (see positionResolver.ts); no caller names a final position
// (wiki positioning §2).
// `projectId` is never sent: a cross-project reparent derives it from the
// new parent and cascades it to the subtree (wiki item-attachment §9).
router.patch('/:id/move', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { workphaseId, position, anchorId, side, scopeWorkphaseIds, parentId, isAttached } = req.body;

  // Refused rather than ignored: the API says what to do instead.
  if (position !== undefined) {
    res.status(400).json({ error: 'position is not accepted: name an anchorId and side to place the item instead' });
    return;
  }

  // scopeWorkphaseIds is accepted so a bare same-column reorder-to-append
  // request — no anchor, no workphaseId change, just "this merged group" —
  // doesn't 400. It has no effect on scope resolution (position is
  // workflow-wide, not workphase-narrow — see positionScopeFor), and is
  // mapped below onto the equivalent same-workphase move.
  const hasScopeWorkphaseIds = Array.isArray(scopeWorkphaseIds) && scopeWorkphaseIds.length > 0;
  const hasIntent = [workphaseId, anchorId, parentId, isAttached].some(v => v !== undefined);
  if (!hasIntent && !hasScopeWorkphaseIds) {
    res.status(400).json({ error: 'workphaseId, parentId, isAttached, and/or anchorId+side required' });
    return;
  }

  const hierarchyReq: HierarchyRequest = { parentId, isAttached, workphaseId, anchorId, side };
  if (!hasIntent) hierarchyReq.workphaseId = item.workphaseId;

  const error = validateHierarchyRequest(item, hierarchyReq);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  let reindexed: ReindexedPosition[] = [];
  db.transaction(tx => {
    reindexed = applyHierarchyRequest(tx, item, hierarchyReq).reindexed;
  });

  respondWithItem(res, req.params.id, reindexed);
});

// Add a comment to an item's activity log
router.post('/:id/comments', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  logActivity(req.params.id, 'comment', content.trim());
  res.status(201).json({ success: true });
});

// Delete an item and all its descendants, detached ones included
// (wiki item-attachment §13). Each item's dependent rows (itemLabels,
// activityLog, notifications, attachments, chat threads/messages) are removed by
// ON DELETE CASCADE; parentId is a soft reference with no FK, so the subtree is
// still collected in app code and deleted in one statement.
router.delete('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const allIds = walkItemDescendants(req.params.id, { includeRoot: true });
  db.delete(items).where(inArray(items.id, allIds)).run();

  res.status(204).send();
});

export default router;
