import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { items, workphases, activityLog, notifications } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { cascadeWorkphaseToAttachedDescendants } from '../lib/attachedCascade.js';
import { applyReorderEntries, validateReorder } from '../lib/reorder.js';
import { assertValidReparent, walkItemDescendants } from '../lib/itemTree.js';
import { resolvePositionByAnchorAndSide, resolveAppendPosition, type Side } from '../lib/positionResolver.js';
import { isTerminalLookup, positionScopeFor, sharesPositionScope, withPositionScope } from '../lib/itemPositionScope.js';

const router = Router();

// The `isTerminalOf` withPositionScope needs, for the single-item routes
// below — a plain per-call lookup, since each only ever scopes one row. GET
// /:id looks up its own item+children batch instead (see below), the same
// N+1-avoiding shape boards.ts uses for a whole board's worth of items.
function isTerminalOf(workphaseId: string): boolean | null {
  const workphase = db.select({ isTerminal: workphases.isTerminal }).from(workphases).where(eq(workphases.id, workphaseId)).get();
  return workphase ? Boolean(workphase.isTerminal) : null;
}

function logActivity(
  itemId: string,
  type: string,
  content: string,
  metadata?: Record<string, unknown>,
  tx?: Tx,
) {
  (tx ?? db).insert(activityLog).values({
    id: randomUUID(),
    itemId,
    type,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: Date.now(),
  }).run();
}

function computeDepth(itemId: string): number {
  let depth = 0;
  let current = db.select({ parentId: items.parentId }).from(items).where(eq(items.id, itemId)).get();
  while (current?.parentId) {
    depth++;
    current = db.select({ parentId: items.parentId }).from(items).where(eq(items.id, current.parentId)).get();
  }
  return depth;
}

function workphaseExists(id: string): boolean {
  return !!db.select({ id: workphases.id }).from(workphases).where(eq(workphases.id, id)).get();
}

// Get a single item with its children and activity log
router.get('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const depth = computeDepth(req.params.id);

  const rawChildren = db.select().from(items)
    .where(eq(items.parentId, req.params.id))
    .all();

  // One batched lookup covering the item's own workphase and every child's,
  // instead of a query per row (audit Finding #17's N+1) — also folds in
  // the workflowId derivation below, which needs the same rows.
  const workphaseIds = [item.workphaseId, ...rawChildren.map(c => c.workphaseId)]
    .filter((id): id is string => id !== null);
  const workphaseRows = workphaseIds.length
    ? db.select({ id: workphases.id, isTerminal: workphases.isTerminal, workflowId: workphases.workflowId })
        .from(workphases)
        .where(inArray(workphases.id, workphaseIds))
        .all()
    : [];
  const isTerminalOf = isTerminalLookup(workphaseRows);

  const children = rawChildren.map(child => ({ ...withPositionScope(child, isTerminalOf), depth: depth + 1 }));

  const activity = db.select().from(activityLog)
    .where(eq(activityLog.itemId, req.params.id))
    .orderBy(activityLog.createdAt)
    .all();

  // Derive workflowId from the item's workphase for MCP tool convenience
  const workflowId = item.workphaseId
    ? workphaseRows.find(w => w.id === item.workphaseId)?.workflowId ?? null
    : null;

  res.json({ ...withPositionScope(item, isTerminalOf), workflowId, depth, children, activity });
});

// Create an item
router.post('/', (req, res) => {
  const {
    type,
    parentId,
    projectId,
    workphaseId,
    title,
    description,
    assigneeType,
    agentId,
    isAttached,
  } = req.body;

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // Resolve projectId from parent if not provided
  let resolvedProjectId = projectId;
  const parent = parentId
    ? db.select({ projectId: items.projectId, workphaseId: items.workphaseId }).from(items).where(eq(items.id, parentId)).get()
    : null;
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

  // A child must share its parent's project (the UI only offers same-project
  // parents; a cross-project parent would leave projectId and the parent's board
  // disagreeing — finding #11). Only triggers when projectId is passed explicitly.
  if (parent && resolvedProjectId !== parent.projectId) {
    res.status(400).json({ error: 'parentId belongs to a different project' });
    return;
  }

  const attached = isAttached !== undefined ? Boolean(isAttached) : true;
  // Attached children (the default) mirror the parent's current workphase.
  const resolvedWorkphaseId = attached && parent ? parent.workphaseId : workphaseId;

  // A bogus workphaseId would otherwise surface as an opaque FK-violation 500.
  if (resolvedWorkphaseId && !workphaseExists(resolvedWorkphaseId)) {
    res.status(400).json({ error: 'workphaseId does not reference an existing workphase' });
    return;
  }

  const now = Date.now();
  const id = randomUUID();

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
  db.transaction((tx) => {
    let position: number | null = null;
    let completedAt: number | null = null;
    if (attached && parentId && resolvedWorkphaseId) {
      position = resolveAppendPosition(items, positionScopeFor({ isAttached: true, parentId, workphaseId: resolvedWorkphaseId }, undefined, tx), tx);
    } else if (resolvedWorkphaseId) {
      const targetWorkphase = tx.select({ isTerminal: workphases.isTerminal }).from(workphases).where(eq(workphases.id, resolvedWorkphaseId)).get();
      if (targetWorkphase?.isTerminal) {
        completedAt = now;
      } else {
        position = resolveAppendPosition(items, positionScopeFor({ isAttached: false, parentId: null, workphaseId: resolvedWorkphaseId }, undefined, tx), tx);
      }
    }
    // Note: append here is workflow-wide (see positionScopeFor), not narrowed
    // to resolvedWorkphaseId — a brand-new item lands after the workflow's
    // true last active item, not just the last item in its own workphase.

    tx.insert(items).values({
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
    }).run();

    logActivity(id, 'status_change', type ? `Created as ${type}` : 'Created', {
      workphaseId: resolvedWorkphaseId,
    }, tx);
  });

  const created = db.select().from(items).where(eq(items.id, id)).get();
  res.status(201).json(withPositionScope(created!, isTerminalOf));
});

// Update an item's details (not position/workphase directly — use move for that,
// though reparenting/attaching here can still shift workphaseId to follow the parent)
router.put('/:id', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { title, description, assigneeType, agentId, parentId, isAttached } = req.body;

  if (parentId !== undefined && parentId !== null) {
    const reparentError = assertValidReparent(items, req.params.id, parentId, 'item');
    if (reparentError) {
      res.status(400).json({ error: reparentError });
      return;
    }
    const parent = db.select({ projectId: items.projectId }).from(items).where(eq(items.id, parentId)).get();
    if (!parent) {
      res.status(400).json({ error: 'parentId does not reference an existing item' });
      return;
    }
    // Parent and child must live in the same project (finding #11).
    if (parent.projectId !== item.projectId) {
      res.status(400).json({ error: 'parentId belongs to a different project' });
      return;
    }
  }

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (assigneeType !== undefined) updates.assigneeType = assigneeType;
  if (agentId !== undefined) updates.agentId = agentId;
  if (parentId !== undefined) updates.parentId = parentId;
  if (isAttached !== undefined) updates.isAttached = isAttached ? 1 : 0;

  // The base update, the parent-sync, its cascade, and the activity log form one
  // atomic unit — a mid-sequence failure must not leave a half-reparented subtree.
  db.transaction((tx) => {
    tx.update(items).set(updates).where(eq(items.id, req.params.id)).run();

    // Re-sync workphase to the parent only when the parent link or attach flag
    // actually changed in this request — covers "just attached" and "reparented
    // while already attached". A title/description-only PUT must NOT run this: it
    // would silently relocate an attached child whose workphase has diverged from
    // its parent's, dragging its subtree along (finding #10).
    //
    // Epic 3.2: attach/detach and reparent-while-attached also change the
    // item's position-comparison scope — assign a fresh position in the new
    // scope (the "scope changed -> reassign, scope unchanged -> leave alone"
    // principle), but only when the scope genuinely changed, not on a
    // redundant re-attach to the same parent.
    if (parentId !== undefined || isAttached !== undefined) {
      const resultingParentId = parentId !== undefined ? parentId : item.parentId;
      const resultingAttached = isAttached !== undefined ? Boolean(isAttached) : Boolean(item.isAttached);
      const wasAttachedWithParent = Boolean(item.isAttached) && Boolean(item.parentId);
      const isNowAttachedWithParent = resultingAttached && Boolean(resultingParentId);

      if (isNowAttachedWithParent) {
        const newParent = tx.select({ workphaseId: items.workphaseId }).from(items).where(eq(items.id, resultingParentId!)).get();
        if (newParent) {
          const scopeUnchanged = wasAttachedWithParent && resultingParentId === item.parentId;
          const scopeUpdates: Record<string, unknown> = { workphaseId: newParent.workphaseId, updatedAt: Date.now() };
          if (!scopeUnchanged) {
            scopeUpdates.position = resolveAppendPosition(
              items,
              positionScopeFor({ isAttached: true, parentId: resultingParentId, workphaseId: newParent.workphaseId }, req.params.id, tx),
              tx,
            );
            // Attached items don't participate in Part 6's done-tracking.
            scopeUpdates.completedAt = null;
          }
          tx.update(items).set(scopeUpdates).where(eq(items.id, req.params.id)).run();
          cascadeWorkphaseToAttachedDescendants(req.params.id, tx);
        }
      } else if (wasAttachedWithParent) {
        // Just detached (or lost its parent) — scope changes from the old
        // parent's attached siblings to workphase-scoped. Detaching itself
        // doesn't change workphaseId (only attaching re-syncs it), so this
        // is still the item's existing workphaseId.
        const currentWorkphaseId = item.workphaseId;
        if (!currentWorkphaseId) {
          tx.update(items).set({ position: null, updatedAt: Date.now() }).where(eq(items.id, req.params.id)).run();
        } else {
          const currentWorkphase = tx.select({ isTerminal: workphases.isTerminal }).from(workphases).where(eq(workphases.id, currentWorkphaseId)).get();
          if (currentWorkphase?.isTerminal) {
            // Becomes a done item the moment it starts being independently
            // tracked (Part 6) — its "doneness" was irrelevant while nested
            // under its parent.
            tx.update(items).set({ position: null, completedAt: Date.now(), updatedAt: Date.now() }).where(eq(items.id, req.params.id)).run();
          } else {
            const newPosition = resolveAppendPosition(
              items,
              positionScopeFor({ isAttached: false, parentId: null, workphaseId: currentWorkphaseId }, req.params.id, tx),
              tx,
            );
            tx.update(items).set({ position: newPosition, updatedAt: Date.now() }).where(eq(items.id, req.params.id)).run();
          }
        }
      }
    }

    if (assigneeType !== undefined || agentId !== undefined) {
      logActivity(req.params.id, 'assignment', `Assigned to ${assigneeType || 'unassigned'}`, {
        assigneeType: assigneeType || null,
        agentId: agentId || null,
      }, tx);
    }
  });

  const updated = db.select().from(items).where(eq(items.id, req.params.id)).get();
  res.json(withPositionScope(updated!, isTerminalOf));
});

// Move an item to a different workphase and/or reorder. Epic 3.2: prefers
// `{anchorId, side}` (resolved server-side against true current data, never
// a client-computed value — see positionResolver.ts) over a raw `position`,
// which is kept only as a direct-control escape hatch for non-drag callers
// (MCP, scripts, tests) — the board drag path no longer sends it.
router.patch('/:id/move', (req, res) => {
  const item = getByIdOrNotFound(items, req.params.id, res, 'Item not found');
  if (!item) return;

  const { workphaseId, position, anchorId, side, scopeWorkphaseIds } = req.body;

  // scopeWorkphaseIds is accepted (not just workphaseId/position/anchorId)
  // so a bare same-column reorder-to-append request — no anchor, no
  // workphaseId change, just "this merged group" — doesn't 400. It no
  // longer affects scope resolution below, though (position is
  // workflow-wide, not workphase-narrow — see positionScopeFor); it's kept
  // only so this legacy request shape stays valid.
  const hasScopeWorkphaseIds = Array.isArray(scopeWorkphaseIds) && scopeWorkphaseIds.length > 0;
  if (workphaseId === undefined && position === undefined && anchorId === undefined && !hasScopeWorkphaseIds) {
    res.status(400).json({ error: 'workphaseId, position, and/or anchorId+side required' });
    return;
  }
  if (anchorId !== undefined && side !== 'before' && side !== 'after') {
    res.status(400).json({ error: "side must be 'before' or 'after' when anchorId is given" });
    return;
  }
  if (workphaseId !== undefined && workphaseId !== null && !workphaseExists(workphaseId)) {
    res.status(400).json({ error: 'workphaseId does not reference an existing workphase' });
    return;
  }
  if (position !== undefined && (typeof position !== 'number' || !Number.isFinite(position))) {
    res.status(400).json({ error: 'position must be a finite number' });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  const oldWorkphaseId = item.workphaseId;
  const targetWorkphaseId = workphaseId !== undefined ? workphaseId : oldWorkphaseId;
  if (workphaseId !== undefined) updates.workphaseId = workphaseId;

  // Anchor existence/position/scope are validated here, against plain `db`,
  // rather than inside the transaction below — this handler doesn't insert
  // or delete the anchor row, only (maybe) update the subject, so nothing
  // between this check and the transaction that uses it can change what it
  // saw (audit Finding #12: a db.transaction callback only rolls back on
  // throw, so a validation bail-out signaled by returning false from inside
  // it — after some other write had already run — would still commit; the
  // fix is to not need that convention at all).
  let anchor: { isAttached: number; parentId: string | null; workphaseId: string | null; position: number | null } | undefined;
  if (anchorId !== undefined) {
    anchor = db
      .select({ isAttached: items.isAttached, parentId: items.parentId, workphaseId: items.workphaseId, position: items.position })
      .from(items)
      .where(eq(items.id, anchorId))
      .get();
    if (!anchor) {
      res.status(400).json({ error: 'anchorId does not reference an existing item' });
      return;
    }
    if (anchor.position === null) {
      res.status(400).json({ error: 'anchorId has no position to anchor against (it may be a done item)' });
      return;
    }
    // The anchor's position is only meaningful to compare against if it
    // lives in the same comparison space the subject is about to end up
    // in — an attached child's siblings space and a workflow-wide space
    // are deliberately isolated, and two different workflows each have
    // their own workflow-wide space (audit Finding #7). Without this,
    // e.g. anchoring a detached item against someone else's attached
    // child, or against an item in a different workflow, silently wrote
    // a number from the wrong comparison space.
    if (!sharesPositionScope(
      { isAttached: Boolean(anchor.isAttached), parentId: anchor.parentId, workphaseId: anchor.workphaseId },
      { isAttached: Boolean(item.isAttached), parentId: item.parentId, workphaseId: targetWorkphaseId },
    )) {
      res.status(400).json({ error: "anchorId is not in this item's position scope" });
      return;
    }
  }

  // The move, the attached-descendant cascade, the activity log, and the
  // notification insert commit together — a partial failure must not leave the
  // item moved but its children stranded (or vice versa).
  db.transaction((tx) => {
    if (anchor) {
      const scope = positionScopeFor(
        { isAttached: Boolean(anchor.isAttached), parentId: anchor.parentId, workphaseId: anchor.workphaseId },
        req.params.id,
        tx,
      );
      updates.position = resolvePositionByAnchorAndSide(items, scope, tx, side as Side, anchorId);
    } else if (position !== undefined) {
      updates.position = position;
    } else if (targetWorkphaseId) {
      // No anchor and no explicit position. Two distinct cases:
      //
      // Epic 3.2 addendum #2 — a plain workphaseId-only move (no other
      // reorder signal) where the item already has a real position: since
      // position is workflow-scoped, not workphase-scoped, its existing
      // value is already comparable against everything else in the (same)
      // workflow — no new number needed just because workphaseId changed.
      // Leave `position` untouched. This is also what the request shape the
      // MCP move_item tool already sends (`{workphaseId}` alone) hits.
      //
      // Otherwise — a same-workphase reorder/append with no specific anchor
      // card (e.g. dropped in empty column space), or the item has no
      // existing position to keep (reopening a done item, or a first-time
      // workphase assignment) — it needs a fresh one: append past the true
      // last item in its (workflow-wide, or parent-wide for an attached
      // child) comparison scope, the same "append" rule every create
      // endpoint uses (finding #25).
      const isGenuineWorkphaseChange = workphaseId !== undefined && workphaseId !== oldWorkphaseId;
      if (!(isGenuineWorkphaseChange && item.position !== null)) {
        const isAttachedNow = Boolean(item.isAttached) && Boolean(item.parentId);
        const scope = positionScopeFor({ isAttached: isAttachedNow, parentId: item.parentId, workphaseId: targetWorkphaseId }, req.params.id, tx);
        updates.position = resolveAppendPosition(items, scope, tx);
      }
    }

    // Terminal transition (Epic 3.2 Part 6): only relevant for detached/root
    // items — attached children keep their position/never touch completedAt
    // regardless of their (cascaded) workphase's status. Overrides whatever
    // position was just resolved above: a done item never has one.
    const isAttachedWithParent = Boolean(item.isAttached) && Boolean(item.parentId);
    if (!isAttachedWithParent && workphaseId !== undefined && workphaseId !== oldWorkphaseId) {
      const newWorkphaseStatus = workphaseId
        ? tx.select({ isTerminal: workphases.isTerminal }).from(workphases).where(eq(workphases.id, workphaseId)).get()
        : null;
      if (newWorkphaseStatus?.isTerminal) {
        updates.position = null;
        updates.completedAt = Date.now();
      } else if (item.completedAt) {
        updates.completedAt = null;
      }
    }

    tx.update(items).set(updates).where(eq(items.id, req.params.id)).run();

    if (workphaseId !== undefined && workphaseId !== oldWorkphaseId) {
      cascadeWorkphaseToAttachedDescendants(req.params.id, tx);

      const oldWorkphase = oldWorkphaseId
        ? tx.select().from(workphases).where(eq(workphases.id, oldWorkphaseId)).get()
        : null;
      const newWorkphase = tx.select().from(workphases).where(eq(workphases.id, workphaseId)).get();

      logActivity(req.params.id, 'status_change',
        `Moved from "${oldWorkphase?.name || 'none'}" to "${newWorkphase?.name || 'unknown'}"`, {
          fromWorkphaseId: oldWorkphaseId,
          toWorkphaseId: workphaseId,
        }, tx);

      if (newWorkphase?.triggersNotification) {
        tx.insert(notifications).values({
          id: randomUUID(),
          itemId: req.params.id,
          workflowId: newWorkphase.workflowId,
          message: `"${item.title}" moved to "${newWorkphase.name}"`,
          type: 'item_in_workphase',
          isRead: 0,
          createdAt: Date.now(),
        }).run();
      }
    }
  });

  const updated = db.select().from(items).where(eq(items.id, req.params.id)).get();
  res.json(withPositionScope(updated!, isTerminalOf));
});

// Reorder items within a workphase
router.patch('/reorder', (req, res) => {
  const { itemOrders } = req.body;

  const validation = validateReorder(items, itemOrders, 'item');
  if (!validation.ok) {
    res.status(validation.status).json(validation.body);
    return;
  }

  db.transaction((tx) => applyReorderEntries(items, validation.entries, tx, { updatedAt: Date.now() }));
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
