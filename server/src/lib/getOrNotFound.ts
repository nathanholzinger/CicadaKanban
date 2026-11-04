// getByIdOrNotFound: fetch-by-id-or-404 helper used across the route files; existsById;
// referenceShapeError and namesARow, the checks a reference field takes before a lookup.

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

// The "fetch a row by id, 404 if missing" idiom. Pass `tx` to run inside a
// caller's transaction; omit it to query standalone.
export function getByIdOrNotFound<T extends IdTable>(table: T, id: string, res: Response, error: string, tx?: Tx) {
  const e = tx ?? db;
  return getOrNotFound(e.select().from(table).where(eq(table.id, id)).get(), res, error);
}

// The "does a row with this id exist" check — the FK-existence guard a
// route runs before an insert/update so a bogus reference surfaces as a
// 400 instead of an opaque FK-violation 500. Selects only the id.
export function existsById<T extends IdTable>(table: T, id: string, tx?: Tx): boolean {
  const e = tx ?? db;
  return !!e.select({ id: table.id }).from(table).where(eq(table.id, id)).get();
}

// A reference field names a row unless it was left out or is `null` (wiki row-references §2).
export const namesARow = <T>(value: T | null | undefined): value is T => value !== undefined && value !== null;

// The 400's message for a reference field that is not a string, or null when it is one
// (wiki row-references §1). An id is a string: better-sqlite3 throws on binding most other
// values (a 500), and flattens an array to the id it holds, so that would pass `existsById` and
// name a row the request never meant to. `nullable` lets it be `null`, and `optional` lets it be
// left out. A route checks that a required field is present first, with its own message, and
// looks the row up after this.
export function referenceShapeError(
  field: string,
  value: unknown,
  { nullable = false, optional = false }: { nullable?: boolean; optional?: boolean } = {},
): string | null {
  if (typeof value === 'string' || (nullable && value === null) || (optional && value === undefined)) return null;
  return `${field} must be a string${nullable ? ' or null' : ''}`;
}
