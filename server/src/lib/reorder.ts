import type { Response } from 'express';
import { eq, inArray } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Tx } from '../db/index.js';

interface ReorderEntry {
  id: string;
  position: number;
}

type ReorderableTable = SQLiteTable & { id: SQLiteColumn; position: SQLiteColumn };

// Shared validation + apply step for the four `PATCH /reorder` endpoints
// (items, workphases, columns, projects' id/position pairing). Was
// previously two different rigor levels hand-rolled per route — see Epic 3
// audit finding #15. Validates the array shape, each entry's id/position
// types, and that every id exists, before writing anything; only then
// applies the position updates inside the caller's transaction. `extraSet`
// is merged into every row's update (e.g. items also bumps `updatedAt`).
//
// Returns `false` if validation failed — the error response has already been
// sent, so the caller must return immediately. Returns `true` on success.
export function applyReorder(
  table: ReorderableTable,
  orders: unknown,
  tx: Tx,
  res: Response,
  entityLabel: string,
  extraSet: Record<string, unknown> = {},
): boolean {
  if (!Array.isArray(orders)) {
    res.status(400).json({ error: `${entityLabel}Orders array is required` });
    return false;
  }

  const invalidEntry = orders.find(
    (o) => typeof o?.id !== 'string' || typeof o?.position !== 'number' || !Number.isFinite(o.position),
  );
  if (invalidEntry) {
    res.status(400).json({ error: 'Each entry must have a string id and a finite numeric position' });
    return false;
  }

  const entries = orders as ReorderEntry[];
  const existingIds = new Set(
    tx.select({ id: table.id }).from(table).where(inArray(table.id, entries.map((o) => o.id))).all().map((r) => r.id),
  );
  const missingIds = entries.map((o) => o.id).filter((id) => !existingIds.has(id));
  if (missingIds.length > 0) {
    res.status(404).json({ error: `One or more ${entityLabel}s not found`, missingIds });
    return false;
  }

  for (const { id, position } of entries) {
    tx.update(table).set({ position, ...extraSet }).where(eq(table.id, id)).run();
  }

  return true;
}
