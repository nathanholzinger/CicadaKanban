import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema.js';

// Read once at import time. Vitest sets DB_PATH via its `test.env` config
// before any app code runs, and dotenv/config (loaded in index.ts) never
// overwrites an already-set env var — so this correctly picks up the test
// DB path during test runs. Breaks if dotenv is ever called with
// `{ override: true }` anywhere in the import graph.
const dbPath = process.env.DB_PATH || './data/kanban.db';

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite: InstanceType<typeof Database> = new Database(dbPath);

// Enable foreign key enforcement (off by default in SQLite)
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };

// A drizzle transaction handle — the argument better-sqlite3 passes to the
// `db.transaction(tx => …)` callback. Helpers that need to run inside a caller's
// transaction accept this so their writes join the same atomic unit.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
