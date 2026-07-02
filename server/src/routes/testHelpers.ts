import { Router } from 'express';
import { db, sqlite } from '../db/index.js';
import { boards, columns, workItems, workItemLabels, labels, attachments, activityLog, notifications, chatThreads, chatMessages, agents } from '../db/schema.js';
import { randomUUID } from 'crypto';

const router = Router();

// Truncate all user data and re-seed the default board.
// Only mounted when ENABLE_TEST_ROUTES=true — never exposed in production.
router.post('/reset', (_req, res) => {
  sqlite.pragma('foreign_keys = OFF');

  db.delete(workItemLabels).run();
  db.delete(attachments).run();
  db.delete(activityLog).run();
  db.delete(notifications).run();
  db.delete(chatMessages).run();
  db.delete(chatThreads).run();
  db.delete(workItems).run();
  db.delete(columns).run();
  db.delete(labels).run();
  db.delete(boards).run();
  db.delete(agents).run();

  sqlite.pragma('foreign_keys = ON');

  // Re-seed default board
  const now = Date.now();
  const boardId = randomUUID();
  db.insert(boards).values({
    id: boardId,
    name: 'My First Board',
    description: 'Default board to get started',
    createdAt: now,
    updatedAt: now,
  }).run();

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

  res.json({ ok: true });
});

export default router;
