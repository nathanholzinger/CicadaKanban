import { Router } from 'express';
import { db } from '../db/index.js';
import { workItems, columns, activityLog, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// Helper: log an activity entry for a work item
function logActivity(
  workItemId: string,
  type: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  db.insert(activityLog).values({
    id: randomUUID(),
    workItemId,
    type,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: Date.now(),
  }).run();
}

function computeDepth(itemId: string): number {
  let depth = 0;
  let current = db.select({ parentId: workItems.parentId }).from(workItems).where(eq(workItems.id, itemId)).get();
  while (current?.parentId) {
    depth++;
    current = db.select({ parentId: workItems.parentId }).from(workItems).where(eq(workItems.id, current.parentId)).get();
  }
  return depth;
}

// Get a single work item with its children
router.get('/:id', (req, res) => {
  const item = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Work item not found' });
    return;
  }

  const depth = computeDepth(req.params.id);

  const children = db.select().from(workItems)
    .where(eq(workItems.parentId, req.params.id))
    .all()
    .map(child => ({ ...child, depth: depth + 1 }));

  const activity = db.select().from(activityLog)
    .where(eq(activityLog.workItemId, req.params.id))
    .orderBy(activityLog.createdAt)
    .all();

  res.json({ ...item, depth, children, activity });
});

// Create a work item
router.post('/', (req, res) => {
  const {
    type,
    parentId,
    boardId,
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

  // If a columnId is provided, calculate position at the end of that column
  let position: number | null = null;
  if (columnId) {
    const itemsInColumn = db.select().from(workItems)
      .where(eq(workItems.columnId, columnId))
      .all();

    const maxPos = itemsInColumn.length > 0
      ? Math.max(...itemsInColumn.map(i => i.position ?? 0))
      : 0;

    position = maxPos + 1.0;
  }

  // If parentId is provided, inherit boardId from parent
  let resolvedBoardId = boardId;
  if (parentId && !boardId) {
    const parent = db.select().from(workItems).where(eq(workItems.id, parentId)).get();
    if (parent) {
      resolvedBoardId = parent.boardId;
    }
  }

  const now = Date.now();
  const id = randomUUID();

  db.insert(workItems).values({
    id,
    type: type ?? null,
    parentId: parentId || null,
    boardId: resolvedBoardId || null,
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

  const created = db.select().from(workItems).where(eq(workItems.id, id)).get();
  res.status(201).json(created);
});

// Update a work item's details (not position/column — use move for that)
router.put('/:id', (req, res) => {
  const item = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Work item not found' });
    return;
  }

  const { title, description, assigneeType, agentId, parentId } = req.body;

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (assigneeType !== undefined) updates.assigneeType = assigneeType;
  if (agentId !== undefined) updates.agentId = agentId;
  if (parentId !== undefined) updates.parentId = parentId;

  db.update(workItems)
    .set(updates)
    .where(eq(workItems.id, req.params.id))
    .run();

  // Log if assignment changed
  if (assigneeType !== undefined || agentId !== undefined) {
    logActivity(req.params.id, 'assignment', `Assigned to ${assigneeType || 'unassigned'}`, {
      assigneeType: assigneeType || null,
      agentId: agentId || null,
    });
  }

  const updated = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  res.json(updated);
});

// Move a work item to a different column and/or reorder within a column
// This is the drag-and-drop endpoint
router.patch('/:id/move', (req, res) => {
  const item = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Work item not found' });
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

  db.update(workItems)
    .set(updates)
    .where(eq(workItems.id, req.params.id))
    .run();

  // Log column change if it actually changed
  if (columnId !== undefined && columnId !== oldColumnId) {
    // Look up column names for the log
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
        workItemId: req.params.id,
        boardId: item.boardId ?? null,
        message: `"${item.title}" moved to "${newCol.name}"`,
        type: 'card_in_column',
        isRead: 0,
        createdAt: Date.now(),
      }).run();
    }
  }

  const updated = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  res.json(updated);
});

// Reorder work items within a column — accepts array of { id, position }
router.patch('/reorder', (req, res) => {
  const { itemOrders } = req.body;

  if (!Array.isArray(itemOrders)) {
    res.status(400).json({ error: 'itemOrders array is required' });
    return;
  }

  for (const { id, position } of itemOrders) {
    db.update(workItems)
      .set({ position, updatedAt: Date.now() })
      .where(eq(workItems.id, id))
      .run();
  }

  res.json({ success: true });
});

// Add a comment to a work item's activity log
router.post('/:id/comments', (req, res) => {
  const item = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Work item not found' });
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

// Delete a work item and its children
router.delete('/:id', (req, res) => {
  const item = db.select().from(workItems).where(eq(workItems.id, req.params.id)).get();
  if (!item) {
    res.status(404).json({ error: 'Work item not found' });
    return;
  }

  // Delete children first (tasks under a story, stories under an epic)
  const children = db.select().from(workItems)
    .where(eq(workItems.parentId, req.params.id))
    .all();

  for (const child of children) {
    // Recursively delete grandchildren
    db.delete(activityLog).where(eq(activityLog.workItemId, child.id)).run();
    db.delete(workItems).where(eq(workItems.id, child.id)).run();
  }

  // Delete activity log for this item
  db.delete(activityLog).where(eq(activityLog.workItemId, req.params.id)).run();

  // Delete the item itself
  db.delete(workItems).where(eq(workItems.id, req.params.id)).run();

  res.status(204).send();
});

export default router;
