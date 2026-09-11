import type { Response } from 'express';
import { eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, type Tx } from '../db/index.js';

// Fetches a row already looked up via `.get()`; if it's undefined, sends a
// 404 with `{ error }` and returns undefined so the caller can bail out with
// a single `if (!row) return;` instead of repeating the same
// select-then-check-then-respond block at every route.
function getOrNotFound<T>(row: T | undefined, res: Response, error: string): T | undefined {
  if (!row) {
    res.status(404).json({ error });
    return undefined;
  }
  return row;
}

type IdTable = SQLiteTable & { id: SQLiteColumn };

// The "fetch a row by id, 404 if missing" idiom — was hand-copied 26 times
// across every route file as `getOrNotFound(db.select().from(table)
// .where(eq(table.id, id)).get(), res, message)`. Pass `tx` to run inside a
// caller's transaction; omit it to query standalone.
export function getByIdOrNotFound<T extends IdTable>(table: T, id: string, res: Response, error: string, tx?: Tx) {
  const e = tx ?? db;
  return getOrNotFound(e.select().from(table).where(eq(table.id, id)).get(), res, error);
}

// The "does a row with this id exist" check — the FK-existence guard a
// route runs before an insert/update so a bogus reference surfaces as a
// 400 instead of an opaque FK-violation 500 (audit Finding #13's
// convention). Selects only the id. Was `workphaseExists` copied verbatim
// into items.ts and itemHierarchy.ts (audit epic-3-5-story-1 #3).
export function existsById<T extends IdTable>(table: T, id: string, tx?: Tx): boolean {
  const e = tx ?? db;
  return !!e.select({ id: table.id }).from(table).where(eq(table.id, id)).get();
}
