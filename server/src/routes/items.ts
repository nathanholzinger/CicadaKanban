import { Router } from 'express';
import { db } from '../db/index.js';
import { items, columns, activityLog, notifications, itemLabels, chatThreads, chatMessages, attachments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

function logActivity(
  itemId: string,
  type: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  db.insert(activityLog).values({
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

// Get a single item with its children and activity log
router.get('/:id', (req, res) => {
  const item = db.select().from(items).where(eq(items.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const depth = computeDepth(req.params.id);

  const children = db.select().from(items)
    .where(eq(items.parentId, req.params.id))
    .all()
    .map(child => ({ ...child, depth: depth + 1 }));

  const activity = db.select().from(activityLog)
    .where(eq(activityLog.itemId, req.params.id))
    .orderBy(activityLog.createdAt)
    .all();

  // Derive workflowId from the item's column for MCP tool convenience
  let workflowId: string | null = null;
  if (item.columnId) {
    const col = db.select({ workflowId: columns.workflowId }).from(columns).where(eq(columns.id, item.columnId)).get();
    workflowId = col?.workflowId ?? null;
  }

  res.json({ ...item, workflowId, depth, children, activity });
});

// Create an item
router.post('/', (req, res) => {
  const {
    type,
    parentId,
    projectId,
    columnId,
    title,
    description,
    assigneeType,
    agentId,
  } = req.body;

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  // Resolve projectId from parent if not provided
  let resolvedProjectId = projectId;
  if (parentId && !projectId) {
    const parent = db.select({ projectId: items.projectId }).from(items).where(eq(items.id, parentId)).get();
    if (parent) resolvedProjectId = parent.projectId;
  }

  if (!resolvedProjectId) {
    res.status(400).json({ error: 'projectId is required (or provide a parentId to inherit it)' });
    return;
  }

  // Calculate position at end of column if columnId provided
  let position: number | null = null;
  if (columnId) {
    const itemsInColumn = db.select().from(items).where(eq(items.columnId, columnId)).all();
    const maxPos = itemsInColumn.length > 0
      ? Math.max(...itemsInColumn.map(i => i.position ?? 0))
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
    columnId: columnId || null,
    title,
    description: description || null,
    position,
    assigneeType: assigneeType || null,
    agentId: agentId || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  logActivity(id, 'status_change', type ? `Created as ${type}` : 'Created', {
    columnId: columnId || null,
  });

  const created = db.select().from(items).where(eq(items.id, id)).get();
  res.status(201).json(created);
});

// Update an item's details (not position/column — use move for that)
router.put('/:id', (req, res) => {
  const item = db.select().from(items).where(eq(items.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const { title, description, assigneeType, agentId, parentId } = req.body;

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (assigneeType !== undefined) updates.assigneeType = assigneeType;
  if (agentId !== undefined) updates.agentId = agentId;
  if (parentId !== undefined) updates.parentId = parentId;

  db.update(items).set(updates).where(eq(items.id, req.params.id)).run();

  if (assigneeType !== undefined || agentId !== undefined) {
    logActivity(req.params.id, 'assignment', `Assigned to ${assigneeType || 'unassigned'}`, {
      assigneeType: assigneeType || null,
      agentId: agentId || null,
    });
  }

  const updated = db.select().from(items).where(eq(items.id, req.params.id)).get();
  res.json(updated);
});

// Move an item to a different column and/or reorder within a column
router.patch('/:id/move', (req, res) => {
  const item = db.select().from(items).where(eq(items.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const { columnId, position } = req.body;

  if (columnId === undefined && position === undefined) {
    res.status(400).json({ error: 'columnId and/or position required' });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  const oldColumnId = item.columnId;

  if (columnId !== undefined) updates.columnId = columnId;
  if (position !== undefined) updates.position = position;

  db.update(items).set(updates).where(eq(items.id, req.params.id)).run();

  if (columnId !== undefined && columnId !== oldColumnId) {
    const oldCol = oldColumnId
      ? db.select().from(columns).where(eq(columns.id, oldColumnId)).get()
      : null;
    const newCol = db.select().from(columns).where(eq(columns.id, columnId)).get();

    logActivity(req.params.id, 'status_change',
      `Moved from "${oldCol?.name || 'none'}" to "${newCol?.name || 'unknown'}"`, {
        fromColumnId: oldColumnId,
        toColumnId: columnId,
      });

    if (newCol?.triggersNotification) {
      db.insert(notifications).values({
        id: randomUUID(),
        itemId: req.params.id,
        workflowId: newCol.workflowId,
        message: `"${item.title}" moved to "${newCol.name}"`,
        type: 'item_in_column',
        isRead: 0,
        createdAt: Date.now(),
      }).run();
    }
  }

  const updated = db.select().from(items).where(eq(items.id, req.params.id)).get();
  res.json(updated);
});

// Reorder items within a column
router.patch('/reorder', (req, res) => {
  const { itemOrders } = req.body;

  if (!Array.isArray(itemOrders)) {
    res.status(400).json({ error: 'itemOrders array is required' });
    return;
  }

  for (const { id, position } of itemOrders) {
    db.update(items)
      .set({ position, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .run();
  }

  res.json({ success: true });
});

// Add a comment to an item's activity log
router.post('/:id/comments', (req, res) => {
  const item = db.select().from(items).where(eq(items.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

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

function deleteItemById(id: string): void {
  db.delete(itemLabels).where(eq(itemLabels.itemId, id)).run();
  db.delete(activityLog).where(eq(activityLog.itemId, id)).run();
  db.delete(notifications).where(eq(notifications.itemId, id)).run();
  db.delete(attachments).where(eq(attachments.itemId, id)).run();
  const threads = db.select({ id: chatThreads.id }).from(chatThreads).where(eq(chatThreads.itemId, id)).all();
  for (const thread of threads) {
    db.delete(chatMessages).where(eq(chatMessages.threadId, thread.id)).run();
  }
  db.delete(chatThreads).where(eq(chatThreads.itemId, id)).run();
  db.delete(items).where(eq(items.id, id)).run();
}

// Delete an item and all its descendants
router.delete('/:id', (req, res) => {
  const item = db.select().from(items).where(eq(items.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  // BFS collects root-first; reversing gives leaves-first, satisfying the self-ref FK
  const allIds = collectDescendantIds(req.params.id);
  for (const id of [...allIds].reverse()) {
    deleteItemById(id);
  }

  res.status(204).send();
});

export default router;
