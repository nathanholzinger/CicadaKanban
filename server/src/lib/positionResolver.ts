// Table-generic anchor+side position resolution, coarsest-fit, lazy reindex — shared by
// items and projects. Resolution against a fresh query, with its append and bootstrap
// fallbacks: wiki positioning §3. Both reindex triggers, and every reindex, run
// through reindexPositionsInScope: wiki positioning §6.
// Also home to nextPosition: simple append-at-end math for workphases/boards/columns
// (non-nullable fields, no anchor/reindex needed).

import { eq, gt, lt, asc, desc, and, isNotNull, type SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Tx } from '../db/index.js';
import { coarsestFit } from './coarsestFit.js';

const MAX_REINDEX_TRIES = 1; // Reindexing should always allow for a new position to be placed. If it doesn't then something else went wrong that retries shouldn't fix
const SOFT_MAX_POSITION = 1000; // We will reindex if a position value exceeds this soft max, unless the row count is also greater than the soft max
const MAX_OVER_POSITION = 100; // If there are more rows than the soft max then max will be caluclated as (rows + MAX_OVER)

// Table Generic that defines a minimum structure for a table that can be ordered by 'position'
export type PositionedTable = SQLiteTable & {
  id: SQLiteColumn;
  position: SQLiteColumn;
  createdAt: SQLiteColumn;
  updatedAt: SQLiteColumn;
};

// One renumbered row from a reindex — `{id, position}` and nothing more,
// since a reindex changes positions and never any other field
// (wiki positioning §7).
export type ReindexedPosition = { id: string; position: number };

// Used to bundle the query context so functions have fewer params to handoff
type PositionQueryContext = {
  table: PositionedTable;
  scopeWhere: SQL;
  tx: Tx;
  // Where a reindex reports the rows it renumbered. Optional: only callers
  // that surface the disclosure to their response (the item writes) pass
  // one; projects/workphases don't and the pairs are simply dropped.
  reindexed?: ReindexedPosition[];
};

// for defining anchorId + side.
export type Side = 'before' | 'after';

/**
 * finds a postion as it relates to an anchor
 *
 * @param table - the table that defines what type of list we're ordering (items, projects, etc)
 * @param scopeWhere - the SQL that scopes the list appropriately (position relative to fellow siblings, postion relative to all items in project, etc)
 * @param tx - the transaction handler
 * @param side - whether the new id will be placed immediately 'before' or 'after' the anchor. if anchorId is null then side functions as "before all" or "after all"
 * @param anchorId - nullable. the targetId that the new id will be placed alongside
 * @param reindexed - optional collector; if a reindex fires, every renumbered `{id, position}` is pushed here so the caller can disclose it (wiki positioning §7)

 * @returns number value of the position
 */
export function resolvePositionByAnchorAndSide(
  table: PositionedTable,
  scopeWhere: SQL,
  tx: Tx,
  side: Side,
  anchorId?: string,
  reindexed?: ReindexedPosition[],
): number {
  const context: PositionQueryContext = { table, scopeWhere, tx, reindexed };

  if (anchorId) {
    if (side === 'before') return resolveBeforeTarget(anchorId, context);
    if (side === 'after') return resolveAfterTarget(anchorId, context);
  } else {
    if (side === 'before') return resolvePrependAsFirst(context);
    if (side === 'after') return resolveAppendAsLast(context);
  }

  throw new Error(`positionResolver: failed to parse anchor + side`);
}

// Kept as its own named export rather than folded away: every call site is a
// pure "put this at the end" append (item and project creation, a scope
// change with no anchor, a workphase's terminal-transition backfill) with no
// anchor/side to express, so spelling them as `resolvePositionByAnchorAndSide(table,
// scope, tx, 'after')` would read as if a side/anchor choice were actually being made.
export function resolveAppendPosition(
  table: PositionedTable,
  scopeWhere: SQL,
  tx: Tx,
  reindexed?: ReindexedPosition[],
): number {
  const context: PositionQueryContext = { table, scopeWhere, tx, reindexed };
  return resolveAppendAsLast(context);
}

function getTargetPosition(targetId: string, context: PositionQueryContext): number {
  const { table, scopeWhere, tx } = context;
  const row = tx
    .select({ position: table.position })
    .from(table)
    .where(and(scopeWhere, eq(table.id, targetId)))
    .get() as { position: number | null } | undefined;
  if (row === undefined) {
    throw new Error(`positionResolver: could not find id ${targetId} at table ${table} within scope ${scopeWhere}`);
  } else if (!row?.position) {
    throw new Error(`positionResolver: id ${targetId} at table ${table} does not have a position`);
  }
  return row.position;
}

function getLastPositionInScope(context: PositionQueryContext): number | null {
  const { table, scopeWhere, tx } = context;
  // isNotNull guard: an item scope can legitimately contain done items with a
  // null position, and SQLite sorts NULLs first in ASC / last in
  // DESC — so a real position always outranks a null one here *unless every
  // row in scope happens to be null* (e.g. reopening the only non-empty
  // workphase in a workflow), in which case an unguarded DESC query would
  // return a null-positioned row instead of falling through to the "no rows"
  // case below.
  const row = tx
    .select({ position: table.position })
    .from(table)
    .where(and(scopeWhere, isNotNull(table.position)))
    .orderBy(desc(table.position))
    .limit(1)
    .get() as { position: number | null } | undefined;
  if (row === undefined) {
    return null;
  } else if (!row?.position) {
    throw new Error(`positionResolver: a row was found with no position. (this shouldn't happen)`);
  }
  return row.position;
}

function getFirstIdInScope(context: PositionQueryContext): string | null {
  const { table, scopeWhere, tx } = context;
  // Same isNotNull guard as getLastPositionInScope above, mirrored for ASC.
  const row = tx
    .select({ id: table.id })
    .from(table)
    .where(and(scopeWhere, isNotNull(table.position)))
    .orderBy(asc(table.position))
    .limit(1)
    .get() as { id: string | null } | undefined;
  if (row === undefined) {
    return null;
  } else if (!row?.id) {
    throw new Error(`positionResolver: a row was found with no id. (this shouldn't happen)`);
  }
  return row.id;
}

function resolveAfterTarget(prevId: string, context: PositionQueryContext): number {
  const { table, scopeWhere, tx } = context;
  const prevPosition = getTargetPosition(prevId, context);

  const nextRow = tx
    .select({ position: table.position })
    .from(table)
    .where(and(scopeWhere, gt(table.position, prevPosition)))
    .orderBy(asc(table.position))
    .limit(1)
    .get() as { position: number | null } | undefined;

  if (nextRow === undefined) return resolveAppendAsLast(context, prevPosition);

  const resolveBounds = () => {
    const prev = getTargetPosition(prevId, context);
    const next = tx
      .select({ position: table.position })
      .from(table)
      .where(and(scopeWhere, gt(table.position, prev)))
      .orderBy(asc(table.position))
      .limit(1)
      .get() as { position: number | null } | undefined;
    if (next === undefined) {
      throw new Error(
        `positionResolver: expected a next neighbor after reindex but found none (this shouldn't happen)`,
      );
    }
    return { prev, next: next.position! };
  };

  return fitOrReindexAndRetry(resolveBounds, context);
}

function resolveBeforeTarget(nextId: string, context: PositionQueryContext): number {
  const { table, scopeWhere, tx } = context;

  const resolveBounds = () => {
    const nextPos = getTargetPosition(nextId, context);
    const prev = tx
      .select({ position: table.position })
      .from(table)
      .where(and(scopeWhere, lt(table.position, nextPos)))
      .orderBy(desc(table.position))
      .limit(1)
      .get() as { position: number | null } | undefined;
    return { prev: prev?.position ?? 0.0, next: nextPos };
  };
  return fitOrReindexAndRetry(resolveBounds, context);
}

function resolveAppendAsLast(context: PositionQueryContext, lastPosition?: number): number {
  lastPosition = lastPosition ?? getLastPositionInScope(context) ?? 0.0;
  return appendOrReindexAndRetry(lastPosition, context);
}

function resolvePrependAsFirst(context: PositionQueryContext): number {
  const firstId = getFirstIdInScope(context);
  if (!firstId) {
    return resolveAppendAsLast(context, 0.0);
  }
  return resolveBeforeTarget(firstId, context);
}

function fitOrReindexAndRetry(
  resolveBounds: () => { prev: number; next: number },
  context: PositionQueryContext,
  retryCount: number = 0,
): number {
  const { prev, next } = resolveBounds();
  const fit = coarsestFit(prev, next);
  if (fit !== null) return fit;

  if (retryCount >= MAX_REINDEX_TRIES) {
    throw new Error('positionResolver: precision exhausted even after a reindex - this should not happen');
  }
  reindexPositionsInScope(context);
  return fitOrReindexAndRetry(resolveBounds, context, retryCount + 1);
}

function appendOrReindexAndRetry(lastPosition: number, context: PositionQueryContext, retryCount: number = 0): number {
  const candidate = Math.round(lastPosition + 1.0);
  if (exceedsMagnitudeThreshold(candidate, context)) {
    if (retryCount >= MAX_REINDEX_TRIES) {
      throw new Error(
        'positionResolver: new position exceeded threshold even after a reindex - this should not happen',
      );
    }
    reindexPositionsInScope(context);
    const newLast = getLastPositionInScope(context);
    if (!newLast) {
      throw new Error(`positionResolver: last position was ${newLast} after a reindex - this should not happen`);
    }
    return appendOrReindexAndRetry(newLast, context, retryCount + 1);
  }
  return candidate;
}

function reindexPositionsInScope(queryContext: PositionQueryContext): void {
  const { table, scopeWhere, tx, reindexed } = queryContext;
  const rows = tx
    .select({ id: table.id, position: table.position, createdAt: table.createdAt })
    .from(table)
    .where(and(scopeWhere, isNotNull(table.position)))
    .orderBy(asc(table.position), asc(table.createdAt))
    .all() as { id: string; position: number | null; createdAt: number }[];

  const now = Date.now();
  rows.forEach((row, index) => {
    const position = index + 1;
    tx.update(table).set({ position, updatedAt: now }).where(eq(table.id, row.id)).run();
    reindexed?.push({ id: row.id, position });
  });
}

function exceedsMagnitudeThreshold(candidate: number, context: PositionQueryContext): boolean {
  if (candidate >= SOFT_MAX_POSITION) {
    const { table, scopeWhere, tx } = context;
    const rows = tx.select({ id: table.id }).from(table).where(scopeWhere).all().length;
    if (candidate >= rows + MAX_OVER_POSITION) {
      return true;
    }
  }
  return false;
}

// "Append at end" position math — max(existing positions) + 1.0, with an
// empty-list base case of 1.0. A null position counts as 0 for the max.

export function nextPosition(rows: { position: number | null }[]): number {
  if (rows.length === 0) return 1.0;
  return Math.max(...rows.map(r => r.position ?? 0)) + 1.0;
}
