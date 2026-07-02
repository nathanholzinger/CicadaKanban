import { Router } from 'express';
import { db } from '../db/index.js';
import { boards, columns, workItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

type WorkItemRow = typeof workItems.$inferSelect;

function addDepths(items: WorkItemRow[]): (WorkItemRow & { depth: number })[] {
  const parentMap = new Map(items.map(i => [i.id, i.parentId]));
  const depthCache = new Map<string, number>();

  function getDepth(id: string): number {
    if (depthCache.has(id)) return depthCache.get(id)!;
    const parentId = parentMap.get(id);
    const d = parentId && parentMap.has(parentId) ? getDepth(parentId) + 1 : 0;
    depthCache.set(id, d);
    return d;
  }

  return items.map(item => ({ ...item, depth: getDepth(item.id) }));
}

const router = Router();

// List all boards
router.get('/', (_req, res) => {
  const allBoards = db.select().from(boards).all();
  res.json(allBoards);
});

// Get a single board with columns and work items
router.get('/:id', (req, res) => {
  const board = db.select().from(boards).where(eq(boards.id, req.params.id)).get();
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }

  const boardColumns = db.select().from(columns)
    .where(eq(columns.boardId, board.id))
    .orderBy(columns.position)
    .all();

  const boardItems = db.select().from(workItems)
    .where(eq(workItems.boardId, board.id))
    .all();

  res.json({ ...board, columns: boardColumns, workItems: addDepths(boardItems) });
});

// Create a board (optionally with default columns)
router.post('/', (req, res) => {
  const { name, description, includeDefaultColumns = true } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const now = Date.now();
  const boardId = randomUUID();

  db.insert(boards).values({
    id: boardId,
    name,
    description: description || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  if (includeDefaultColumns) {
    const defaultColumns = [
      { name: 'Backlog',     position: 1.0, triggersNotification: 0, isTerminal: 0 },
      { name: 'Todo',        position: 2.0, triggersNotification: 0, isTerminal: 0 },
      { name: 'In Progress', position: 3.0, triggersNotification: 0, isTerminal: 0 },
      { name: 'Review',      position: 4.0, triggersNotification: 1, isTerminal: 0 },
      { name: 'Done',        position: 5.0, triggersNotification: 0, isTerminal: 1 },
    ];

    for (const col of defaultColumns) {
      db.insert(columns).values({
        id: randomUUID(),
        boardId,
        name: col.name,
        position: col.position,
        triggersNotification: col.triggersNotification,
        isTerminal: col.isTerminal,
        createdAt: now,
      }).run();
    }
  }

  const created = db.select().from(boards).where(eq(boards.id, boardId)).get();
  res.status(201).json(created);
});

// Update a board
router.put('/:id', (req, res) => {
  const board = db.select().from(boards).where(eq(boards.id, req.params.id)).get();
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }

  const { name, description } = req.body;

  db.update(boards)
    .set({
      name: name ?? board.name,
      description: description !== undefined ? description : board.description,
      updatedAt: Date.now(),
    })
    .where(eq(boards.id, req.params.id))
    .run();

  const updated = db.select().from(boards).where(eq(boards.id, req.params.id)).get();
  res.json(updated);
});

// Delete a board and all its columns and work items
router.delete('/:id', (req, res) => {
  const board = db.select().from(boards).where(eq(boards.id, req.params.id)).get();
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }

  // Delete work items belonging to this board
  db.delete(workItems).where(eq(workItems.boardId, req.params.id)).run();
  // Delete columns belonging to this board
  db.delete(columns).where(eq(columns.boardId, req.params.id)).run();
  // Delete the board
  db.delete(boards).where(eq(boards.id, req.params.id)).run();

  res.status(204).send();
});

export default router;
