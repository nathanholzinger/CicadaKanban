import { Router, type Response } from 'express';
import { db } from '../db/index.js';
import { items, workphases, activityLog } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { existsById, getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { applyReorderEntries, validateReorder } from '../lib/reorder.js';
import { assertWithinDepthCap, hierarchyDepth, walkItemDescendants } from '../lib/itemTree.js';
import { resolveAppendPosition, type ReindexedPosition } from '../lib/positionResolver.js';
import {
  isTerminalLookup,
  positionScopeFor,
  withPositionScope,
  workflowIdForWorkphase,
} from '../lib/itemPositionScope.js';
import { applyHierarchyRequest, validateHierarchyRequest, type HierarchyRequest } from '../lib/itemHierarchy.js';
import { effectiveWorkflowIdForProject } from '../lib/workflowItems.js';
import { logActivity } from '../lib/activityLog.js';

const router = Router();

// The `isTerminalOf` withPositionScope needs, for the single-item routes
// below — a plain per-call lookup, since each only ever scopes one row. GET
// /:id looks up its own item+children batch instead (see below), the same
// N+1-avoiding shape boards.ts uses for a whole board's worth of items.
function isTerminalOf(workphaseId: string): boolean | null {
  const workphase = db
    .select({ isTerminal: workphases.isTerminal })
    .from(workphases)
    .where(eq(workphases.id, workphaseId))
    .get();
  return workphase ? Boolean(workphase.isTerminal) : null;
}

// PATCH /:id/move is the board's endpoint, and a board renders exactly one
// workflow — its items may span projects but never workflows — so a
// `workphaseId` that would change the item's workflow can only come from a
// non-board caller. Rejected here rather than mis-placed: the primitive's
// keep-position rule assumes same-workflow (positioning §2 addendum).
// Deliberately a route-level guard and not part of validateHierarchyRequest
// — PUT shares the primitive and will carry legitimate cross-workflow moves
// in Epic 7 (audit epic-3-5-story-1 #1). Only fires when the request names
// a workphase explicitly; an attached child's inherited workphase is its
// parent's concern. Skipped when a project resolves to no workflow at all —
// nothing to compare against.
function crossWorkflowMoveError(item: typeof items.$inferSelect, req: HierarchyRequest): string | null {
  if (typeof req.workphaseId !== 'string') return null;
  // Mirrors deriveResultingState's projectId rule: a new parent's project,
  // else the item's own. The parent is known to exist — validation ran.
  const parentProjectId =
    typeof req.parentId === 'string'
      ? db.select({ projectId: items.projectId }).from(items).where(eq(items.id, req.parentId)).get()?.projectId
      : undefined;
  const resultingProjectId = parentProjectId ?? item.projectId;
  const targetWorkflowId = resultingProjectId ? effectiveWorkflowIdForProject(resultingProjectId) : null;
  if (!targetWorkflowId) return null;
  // A reparent into a project on a different workflow may not also name a
  // workphase in the same step (the one-step shape that keeps an old-scope
  // position). Compared project-to-project, not against the item's stored
  // workphase, so re-filing an item already left foreign by an earlier
  // reparent (positioning §7.3) still goes through.
  const currentWorkflowId = item.projectId ? effectiveWorkflowIdForProject(item.projectId) : null;
  if (currentWorkflowId && currentWorkflowId !== targetWorkflowId) {
    return 'a reparent into a project with a different workflow cannot also set workphaseId on this endpoint; reparent first, then re-file';
  }
  if (workflowIdForWorkphase(req.workphaseId) !== targetWorkflowId) {
    return "workphaseId belongs to a workflow the item's project does not use; cross-workflow moves are not supported on this endpoint";
  }
  return null;
}

// Every item write responds with the fresh row plus, when a reindex fired,
// the renumbered `{id, position}` pairs (docs/wiki/item-positioning §5,
// "Reindexing must be disclosed") — absent otherwise, so the common case
// costs nothing. The written item is appended so a caller has one rule:
// apply every pair.
function respondWithItem(res: Response, id: string, reindexed: ReindexedPosition[], status = 200): void {
  const row = db.select().from(items).where(eq(items.id, id)).get()!;
  const body: Record<string, unknown> = withPositionScope(row, isTerminalOf);
  if (reindexed.length > 0) {
    body.reindexed = row.position === null ? reindexed : [...reindexed, { id, position: row.position }];
  }
  res.status(status).json(body);
}

// Get a single item with its children and activity log
router.get('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  // The API's `depth` is 0-based (root = 0); hierarchyDepth counts from 1.
  const depth = hierarchyDepth(req.params.id) - 1;

  const rawChildren = db.select().from(items).where(eq(items.parentId, req.params.id)).all();

  // One batched lookup covering the item's own workphase and every child's,
  // instead of a query per row (audit Finding #17's N+1) — also folds in
  // the workflowId derivation below, which needs the same rows.
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
  const isTerminalOf = isTerminalLookup(workphaseRows);

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

// Create an item
router.post('/', (req, res) => {
  const { type, parentId, projectId, workphaseId, title, description, assigneeType, agentId, isAttached } = req.body;

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // Resolve projectId from parent if not provided
  let resolvedProjectId = projectId;
  const parentProjection = { projectId: items.projectId, workphaseId: items.workphaseId };
  const parent = parentId ? db.select(parentProjection).from(items).where(eq(items.id, parentId)).get() : null;
  // A non-existent parentId would otherwise be stored silently, leaving an
  // attached child invisible on every board (no parent card to nest under).
  if (parentId && !parent) {
    res.status(400).json({ error: 'parentId does not reference an existing item' });
    return;
  }
  if (parentId && !projectId && parent) resolvedProjectId = parent.projectId;

  if (!resolvedProjectId) {
    res.status(400).json({ error: 'projectId is required (or provide a parentId to inherit it)' });
    return;
  }

  // A child lives in its parent's project — a hierarchy can't straddle two
  // (docs/wiki/item-attachment §9). Only triggers when projectId is passed
  // explicitly and disagrees; omit it to inherit the parent's.
  if (parent && resolvedProjectId !== parent.projectId) {
    res.status(400).json({ error: 'parentId belongs to a different project' });
    return;
  }

  // The depth cap gates every parent-giving write, creation included (wiki
  // §7 "on the write means every write", §8). A new item has height 0.
  if (parentId) {
    const depthError = assertWithinDepthCap(parentId, null);
    if (depthError) {
      res.status(400).json({ error: depthError });
      return;
    }
  }

  const attached = isAttached !== undefined ? Boolean(isAttached) : true;
  // Attached children (the default) mirror the parent's current workphase.
  const resolvedWorkphaseId = attached && parent ? parent.workphaseId : workphaseId;

  // A bogus workphaseId would otherwise surface as an opaque FK-violation 500.
  if (resolvedWorkphaseId && !existsById(workphases, resolvedWorkphaseId)) {
    res.status(400).json({ error: 'workphaseId does not reference an existing workphase' });
    return;
  }

  const now = Date.now();
  const id = randomUUID();
  const reindexed: ReindexedPosition[] = [];

  // Position/completedAt (Epic 3.2): an attached child is scoped to
  // (parentId, isAttached) — its true siblings, not the whole workphase
  // (Part 3). A root/detached item is scoped to workphaseId, unless that
  // workphase is terminal, in which case it gets no stored position at
  // all — ordering is derived from completedAt instead (Part 6).
  //
  // Wrapped in a transaction: resolveAppendPosition can trigger a reindex of
  // the whole scope (positionResolver.ts's magnitude-threshold trigger),
  // which writes one row at a time — without an enclosing transaction each
  // of those writes would auto-commit individually.
  db.transaction(tx => {
    let position: number | null = null;
    let completedAt: number | null = null;
    if (attached && parentId && resolvedWorkphaseId) {
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
  });

  respondWithItem(res, id, reindexed, 201);
});

// Update an item's details. This is the Sheet's edit endpoint: title,
// description, assignment — and, via `parentId`/`isAttached`, the same
// hierarchy change PATCH /:id/move performs, through the same primitive
// (lib/itemHierarchy.ts) so the two can't drift. Workphase and anchor
// placement aren't accepted here yet; when the Sheet grows those controls
// (Epic 7) they're passed straight through to the primitive.
router.put('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { title, description, assigneeType, agentId, parentId, isAttached } = req.body;

  // Mirrors POST's `!title` rejection (audit Finding #18) — PUT previously
  // let a title update through unvalidated, including an empty string.
  if (title !== undefined && !title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // Only run the hierarchy primitive when the parent link or attach flag is
  // actually in the request. A title/description-only PUT must NOT: it
  // would silently relocate an attached child whose workphase has diverged
  // from its parent's, dragging its subtree along (finding #10).
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
// combination, committed as one transaction (Epic 3.5 — "one gesture, one
// call"). Placement prefers `{anchorId, side}` (resolved server-side against
// true current data, never a client-computed value — see
// positionResolver.ts) over a raw `position`, which is kept only as a
// direct-control escape hatch for non-drag callers (MCP, scripts, tests).
// `projectId` is never sent: a cross-project reparent derives it from the
// new parent and cascades it to the subtree (docs/wiki/item-attachment §9).
router.patch('/:id/move', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { workphaseId, position, anchorId, side, scopeWorkphaseIds, parentId, isAttached } = req.body;

  // scopeWorkphaseIds is accepted so a bare same-column reorder-to-append
  // request — no anchor, no workphaseId change, just "this merged group" —
  // doesn't 400. It no longer affects scope resolution (position is
  // workflow-wide, not workphase-narrow — see positionScopeFor); it's kept
  // only so this legacy request shape stays valid, and is mapped below onto
  // the equivalent same-workphase move.
  const hasScopeWorkphaseIds = Array.isArray(scopeWorkphaseIds) && scopeWorkphaseIds.length > 0;
  const hasIntent = [workphaseId, position, anchorId, parentId, isAttached].some(v => v !== undefined);
  if (!hasIntent && !hasScopeWorkphaseIds) {
    res.status(400).json({ error: 'workphaseId, parentId, isAttached, position, and/or anchorId+side required' });
    return;
  }

  const hierarchyReq: HierarchyRequest = { parentId, isAttached, workphaseId, anchorId, side, position };
  if (!hasIntent) hierarchyReq.workphaseId = item.workphaseId;

  const error = validateHierarchyRequest(item, hierarchyReq) ?? crossWorkflowMoveError(item, hierarchyReq);
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

// Reorder items within a workphase
router.patch('/reorder', (req, res) => {
  const { itemOrders } = req.body;

  const validation = validateReorder(items, itemOrders, 'item');
  if (!validation.ok) {
    res.status(validation.status).json(validation.body);
    return;
  }

  db.transaction(tx => applyReorderEntries(items, validation.entries, tx, { updatedAt: Date.now() }));
  res.json({ success: true });
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

// Delete an item and all its descendants. Each item's dependent rows (itemLabels,
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
