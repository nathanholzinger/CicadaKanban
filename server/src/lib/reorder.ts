import { eq, inArray } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, type Tx } from '../db/index.js';

interface ReorderEntry {
  id: string;
  position: number;
}

type ReorderableTable = SQLiteTable & { id: SQLiteColumn; position: SQLiteColumn };

export type ReorderValidation =
  | { ok: true; entries: ReorderEntry[] }
  | { ok: false; status: number; body: { error: string; missingIds?: string[] } };

// Shared validation step for the four `PATCH /reorder` endpoints (items,
// workphases, columns, projects' id/position pairing). Was previously two
// different rigor levels hand-rolled per route — see Epic 3 audit finding
// #15. Validates the array shape, each entry's id/position types, and that
// every id exists — against plain `db`, deliberately *not* a transaction.
//
// Was previously folded into one `applyReorder(table, orders, tx, res, ...)`
// that wrote `res` directly and returned a boolean the caller had to check
// (`db.transaction((tx) => applyReorder(...)); if (!ok) return;`) — a
// db.transaction callback in better-sqlite3 only rolls back on *throw*, so
// returning false after a write had already run would still commit it. Safe
// in practice only because every bail-out happened to sit before the write
// loop; nothing enforced that (audit Finding #12). Splitting validation out
// to run *before* the transaction opens removes the need for that
// convention entirely: none of these four routes' reorder transactions
// insert or delete rows, only update existing ones' `position`, so an id's
// existence here can't change between this call and the transaction that
// applies it (single-threaded, synchronous better-sqlite3 — nothing else
// can interleave a write in between).
export function validateReorder(table: ReorderableTable, orders: unknown, entityLabel: string): ReorderValidation {
  if (!Array.isArray(orders)) {
    return { ok: false, status: 400, body: { error: `${entityLabel}Orders array is required` } };
  }

  const hasInvalid = orders.some(
    (o) => typeof o?.id !== 'string' || typeof o?.position !== 'number' || !Number.isFinite(o.position),
  );
  if (hasInvalid) {
    return { ok: false, status: 400, body: { error: 'Each entry must have a string id and a finite numeric position' } };
  }

  const entries = orders as ReorderEntry[];
  const existingIds = new Set(
    db.select({ id: table.id }).from(table).where(inArray(table.id, entries.map((o) => o.id))).all().map((r) => r.id),
  );
  const missingIds = entries.map((o) => o.id).filter((id) => !existingIds.has(id));
  if (missingIds.length > 0) {
    return { ok: false, status: 404, body: { error: `One or more ${entityLabel}s not found`, missingIds } };
  }

  return { ok: true, entries };
}

// Applies already-validated entries inside the caller's transaction — call
// only after validateReorder returns `{ ok: true }`. `extraSet` is merged
// into every row's update (e.g. items also bumps `updatedAt`).
export function applyReorderEntries(
  table: ReorderableTable,
  entries: ReorderEntry[],
  tx: Tx,
  extraSet: Record<string, unknown> = {},
): void {
  for (const { id, position } of entries) {
    tx.update(table).set({ position, ...extraSet }).where(eq(table.id, id)).run();
  }
}
