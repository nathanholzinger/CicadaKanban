import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { items, workphases, activityLog, notifications } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getOrNotFound } from '../lib/getOrNotFound.js';
import { cascadeWorkphaseToAttachedDescendants } from '../lib/attachedCascade.js';
import { applyReorder } from '../lib/reorder.js';

const router = Router();

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
  const item = getOrNotFound(db.select().from(items).where(eq(items.id, req.params.id)).get(), res, 'Item not found');
  if (!item) return;

  const depth = computeDepth(req.params.id);

  const children = db.select().from(items)
    .where(eq(items.parentId, req.params.id))
    .all()
    .map(child => ({ ...child, depth: depth + 1 }));

  const activity = db.select().from(activityLog)
    .where(eq(activityLog.itemId, req.params.id))
    .orderBy(activityLog.createdAt)
    .all();

  // Derive workflowId from the item's workphase for MCP tool convenience
  let workflowId: string | null = null;
  if (item.workphaseId) {
    const workphase = db.select({ workflowId: workphases.workflowId }).from(workphases).where(eq(workphases.id, item.workphaseId)).get();
    workflowId = workphase?.workflowId ?? null;
  }

  res.json({ ...item, workflowId, depth, children, activity });
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

  // Calculate position at end of workphase if workphaseId provided
  let position: number | null = null;
  if (resolvedWorkphaseId) {
    const itemsInWorkphase = db.select().from(items).where(eq(items.workphaseId, resolvedWorkphaseId)).all();
    const maxPos = itemsInWorkphase.length > 0
      ? Math.max(...itemsInWorkphase.map(i => i.position ?? 0))
      : 0;
    position = maxPos + 1.0;
  }

  const now = Date.now();
  const id = randomUUID();

  db.insert(items).values({
    id,
    type: type ?? null,
    parentId: parentId || null,
    projectId: resolvedProjectId,
    workphaseId: resolvedWorkphaseId,
    title,
    description: description || null,
    position,
    assigneeType: assigneeType || null,
    agentId: agentId || null,
    isAttached: attached ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  }).run();

  logActivity(id, 'status_change', type ? `Created as ${type}` : 'Created', {
    workphaseId: resolvedWorkphaseId,
  });

  const created = db.select().from(items).where(eq(items.id, id)).get();
  res.status(201).json(created);
});

function isItemDescendant(ofId: string, candidateId: string): boolean {
  const children = db.select({ id: items.id }).from(items).where(eq(items.parentId, ofId)).all();
  for (const child of children) {
    if (child.id === candidateId || isItemDescendant(child.id, candidateId)) return true;
  }
  return false;
}

// Update an item's details (not position/workphase directly — use move for that,
// though reparenting/attaching here can still shift workphaseId to follow the parent)
router.put('/:id', (req, res) => {
  const item = getOrNotFound(db.select().from(items).where(eq(items.id, req.params.id)).get(), res, 'Item not found');
  if (!item) return;

  const { title, description, assigneeType, agentId, parentId, isAttached } = req.body;

  if (parentId !== undefined && parentId !== null) {
    if (parentId === req.params.id) {
      res.status(400).json({ error: 'An item cannot be its own parent' });
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
    if (isItemDescendant(req.params.id, parentId)) {
      res.status(400).json({ error: 'Cannot reparent to a descendant' });
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
    if (parentId !== undefined || isAttached !== undefined) {
      const resultingParentId = parentId !== undefined ? parentId : item.parentId;
      const resultingAttached = isAttached !== undefined ? Boolean(isAttached) : Boolean(item.isAttached);
      if (resultingAttached && resultingParentId) {
        const newParent = tx.select({ workphaseId: items.workphaseId }).from(items).where(eq(items.id, resultingParentId)).get();
        if (newParent) {
          tx.update(items).set({ workphaseId: newParent.workphaseId, updatedAt: Date.now() }).where(eq(items.id, req.params.id)).run();
          cascadeWorkphaseToAttachedDescendants(req.params.id, tx);
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
  res.json(updated);
});

// Move an item to a different workphase and/or reorder within a workphase
router.patch('/:id/move', (req, res) => {
  const item = getOrNotFound(db.select().from(items).where(eq(items.id, req.params.id)).get(), res, 'Item not found');
  if (!item) return;

  const { workphaseId } = req.body;
  const { position } = req.body;

  if (workphaseId === undefined && position === undefined) {
    res.status(400).json({ error: 'workphaseId and/or position required' });
    return;
  }

  if (workphaseId !== undefined && workphaseId !== null && !workphaseExists(workphaseId)) {
    res.status(400).json({ error: 'workphaseId does not reference an existing workphase' });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  const oldWorkphaseId = item.workphaseId;

  if (workphaseId !== undefined) updates.workphaseId = workphaseId;
  if (position !== undefined) updates.position = position;

  // The move, the attached-descendant cascade, the activity log, and the
  // notification insert commit together — a partial failure must not leave the
  // item moved but its children stranded (or vice versa).
  db.transaction((tx) => {
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
  res.json(updated);
});

// Reorder items within a workphase
router.patch('/reorder', (req, res) => {
  const { itemOrders } = req.body;

  const ok = db.transaction((tx) => applyReorder(items, itemOrders, tx, res, 'item', { updatedAt: Date.now() }));
  if (!ok) return;

  res.json({ success: true });
});

// Add a comment to an item's activity log
router.post('/:id/comments', (req, res) => {
  const item = getOrNotFound(db.select().from(items).where(eq(items.id, req.params.id)).get(), res, 'Item not found');
  if (!item) return;

  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  logActivity(req.params.id, 'comment', content.trim());
  res.status(201).json({ success: true });
});

function collectDescendantIds(rootId: string): string[] {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ids.push(id);
    const children = db.select({ id: items.id }).from(items).where(eq(items.parentId, id)).all();
    for (const child of children) queue.push(child.id);
  }
  return ids;
}

// Delete an item and all its descendants. Each item's dependent rows (itemLabels,
// activityLog, notifications, attachments, chat threads/messages) are removed by
// ON DELETE CASCADE; parentId is a soft reference with no FK, so the subtree is
// still collected in app code and deleted in one statement.
router.delete('/:id', (req, res) => {
  const item = getOrNotFound(db.select().from(items).where(eq(items.id, req.params.id)).get(), res, 'Item not found');
  if (!item) return;

  const allIds = collectDescendantIds(req.params.id);
  db.delete(items).where(inArray(items.id, allIds)).run();

  res.status(204).send();
});

export default router;
