import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';
import { boards, columns } from './schema.js';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../drizzle',
);

export function runMigrations() {
  sqlite.pragma('foreign_keys = OFF');
  migrate(db, { migrationsFolder });
  sqlite.pragma('foreign_keys = ON');

  const existingBoards = db.select().from(boards).all();
  if (existingBoards.length === 0) {
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

    console.log('Seeded default board: "My First Board" with 5 columns');
  }
}
