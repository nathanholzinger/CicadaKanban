import { eq, gt, lt, asc, desc, and, isNotNull, type SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Tx } from '../db/index.js';
import { db } from '../db/index.js';
import { coarsestFit } from './coarsestFit.js';

const MAX_REINDEX_TRIES = 1; // Reindexing should always allow for a new position to be placed. If it doesn't then something else went wrong that retries shouldn't fix
const SOFT_MAX_POSITION = 1000; // We will reindex if a position value exceeds this soft max, unless the row count is also greater than the soft max
const MAX_OVER_POSITION = 100; // If there are more rows than the soft max then max will be caluclated as (rows + MAX_OVER)


// TODO: chose one entry shape anchorId+side or targetOptions and depricate the other one

// for defining anchorId + side.
export type Side = 'before' | 'after';

// Table Generic that defines a minimum structure for a table that can be ordered by 'position'
export type PositionedTable = SQLiteTable & {
  id: SQLiteColumn;
  position: SQLiteColumn;
  createdAt: SQLiteColumn;
  updatedAt: SQLiteColumn;
};

// Used to bundle the query context so functions have fewer params to handoff
export type PositionQueryContext = {
  table: PositionedTable, 
  scopeWhere: SQL, 
  tx: Tx 
}

// Special case instruction to place the row as 'first in scope' or 'last in scope'
export type Edge = 'first' | 'last';

/**
 * @param prevId the id for the row that should be immediately before this row
 * @param nextId the id for the row that should be immediately after this row
 * @param edge used to place the row as first or last in the entire scope
 * @remarks allowed combinations: 
 *    "prevId only" - nextInScope will be found; position calculated as midpoint between prevId and nextInScope
 *    "nextId only" - prevInScope will be found; position calculated as midpoint between nextId and prevInScope
 *    "edge only" - position calculated so that it is 'first' in scope or 'last' in scope
 * @remarks special cases:
 *    if prevId is the last in scope this resolves to appendToEnd, same as edge = 'last'
 *    if nextId is the first in scope this resolves to betweenZeroAndFirst, same as edge = 'first'
 */
export type TargetOptions =
  | { prevId: string; nextId?: never; edge?: never }
  | { nextId: string; prevId?: never; edge?: never }
  | { edge: Edge; prevId?: never; nextId?: never };

type IdPos = {id: string, pos: number};
/**
 * Core Resolve Position entry point. Uses TargetOptions (see type TargetOption for params and valid combos).
 * Identifies which parameter has been given and determines the appropriate resolution strategy 
 * 
 * @param table
 * @param TargetOptions 
 * @param scopeWhere 
 * @param tx 
 * @returns the position value that is handed back by the resolving method (along with table context)
 */
export function resolvePositionByTarget(
  table: PositionedTable,
  TargetOptions: TargetOptions,
  scopeWhere: SQL,
  tx: Tx,
): number {
  const e = tx ?? db;
  const { prevId, nextId, edge } = TargetOptions;
  const queryContext: PositionQueryContext = {table: table, scopeWhere: scopeWhere, tx: e}

  if (prevId && !nextId && !edge) {
    return resolveAfterTarget(prevId, queryContext)
  } else if (nextId && !prevId && !edge) {
    return resolveBeforeTarget(nextId, queryContext)
  } else if (edge && !prevId && !nextId) {
    switch (edge) {
      case 'first': return resolvePrependAsFirst(queryContext); break;
      case 'last': return resolveAppendAsLast(queryContext); break;
      default: throw new Error(`positionResolver: 'edge' must be 'first' or 'last'`);
    }
  } else {
    throw new Error('positionResolver: resolvePositionByTarget requires only one param (prevId, nextId, edge) to be populated');
  }
}

/**
 * Transforms an anchorId + side style payload into TargetOptions payload
 * 
 * @param table 
 * @param anchorId - the targetId that the new id will be placed alongside
 * @param side - whether the new id will be placed immediately 'before' or 'after' the anchor
 * @param scopeWhere 
 * @param tx 
 * @returns 
 */
export function resolvePositionByAnchorAndSide(
  table: PositionedTable, 
  anchorId: string, 
  side: Side, 
  scopeWhere: SQL, 
  tx: Tx
): number {
  let targetOptions: TargetOptions;
  switch (side) {
    case 'after': targetOptions = { prevId: anchorId }; break;
    case 'before': targetOptions = { nextId: anchorId }; break;
    default: throw new Error(`positionResolver: side must be 'before' or 'after'`)
  }
  return resolvePositionByTarget(table, targetOptions, scopeWhere, tx);
}

// TODO: depreciate this passthrough function
export function resolveAppendPosition(
  table: PositionedTable, 
  scopeWhere: SQL, 
  tx: Tx
): number {
  const context: PositionQueryContext = {table: table, scopeWhere: scopeWhere, tx: tx}
  return resolveAppendAsLast(context)
}

function getTargetPosition(targetId: string, context: PositionQueryContext): number {
  const {table, scopeWhere, tx} = context;
  const row = (tx
          .select({ position: table.position })
          .from(table)
          .where(and(scopeWhere, eq(table.id, targetId)))
          .get()
  ) as { position: number | null } | undefined;
  if (row === undefined) {
    throw new Error(`positionResolver: could not find id ${targetId} at table ${table} within scope ${scopeWhere}`)
  } else if (!row?.position) {
    throw new Error(`positionResolver: id ${targetId} at table ${table} does not have a position`)
  }
  return row.position;
}

function getLastPositionInScope(context: PositionQueryContext): number | null {
  const {table, scopeWhere, tx} = context;
  const row = (tx
          .select({ position: table.position })
          .from(table)
          .where(scopeWhere)
          .orderBy(desc(table.position))
          .limit(1)
          .get()
  ) as { position: number | null } | undefined;
  if (row === undefined) {
    return null;
  } else if (!row?.position) {
    throw new Error(`positionResolver: a row was found with no position. (this shouldn't happen)`)
  }
  return row.position;
}

function getFirstIdInScope(context: PositionQueryContext): string | null {
  const {table, scopeWhere, tx} = context;
  const row = (tx
          .select({ id: table.id })
          .from(table)
          .where(scopeWhere)
          .orderBy(asc(table.position))
          .limit(1)
          .get()
  ) as { id: string | null } | undefined;
  if (row === undefined) {
    return null;
  } else if (!row?.id) {
    throw new Error(`positionResolver: a row was found with no id. (this shouldn't happen)`)
  }
  return row.id;
}

function resolveAfterTarget(prevId: string, context: PositionQueryContext): number {
  const {table, scopeWhere, tx} = context;
  const prevPosition = getTargetPosition(prevId, context);

  const nextRow = (tx
    .select({ position: table.position })
    .from(table)
    .where(and(scopeWhere, gt(table.position, prevPosition)))
    .orderBy(asc(table.position))
    .limit(1)
    .get()
  ) as { position: number | null } | undefined;

  if (nextRow === undefined) return resolveAppendAsLast(context, prevPosition);

  const resolveBounds = () => {
    const prev = getTargetPosition(prevId, context);
    const next = (tx
      .select({ position: table.position })
      .from(table)
      .where(and(scopeWhere, gt(table.position, prev)))
      .orderBy(asc(table.position))
      .limit(1)
      .get()) as { position: number | null } | undefined;
    if (next === undefined) {
      throw new Error(`positionResolver: expected a next neighbor after reindex but found none (this shouldn't happen)`);
    }
    return { prev, next: next.position! };
  };

  return fitOrReindexAndRetry(resolveBounds, context);
}

function resolveBeforeTarget(nextId: string, context: PositionQueryContext): number {
  const {table, scopeWhere, tx} = context;
  
  const resolveBounds = () => {
    const nextPos = getTargetPosition(nextId, context);
    const prev = (tx
          .select({ position: table.position })
          .from(table)
          .where(and(scopeWhere, lt(table.position, nextPos)))
          .orderBy(desc(table.position))
          .limit(1)
          .get()
    ) as { position: number | null } | undefined;
    return { prev: prev?.position ?? 0.0, next: nextPos };
  };
  return fitOrReindexAndRetry(resolveBounds, context);
}

function resolveAppendAsLast(context: PositionQueryContext, lastPosition?: number): number {
  lastPosition = lastPosition ?? getLastPositionInScope(context) ?? 0.0;
  return appendOrReindexAndRetry(lastPosition, context);
}

function resolvePrependAsFirst(context: PositionQueryContext): number {
  const firstId = getFirstIdInScope(context)
  if (!firstId) {
    return resolveAppendAsLast(context, 0.0);
  }
  return resolveBeforeTarget(firstId, context);
}

function fitOrReindexAndRetry(
  resolveBounds: () => { prev: number; next: number },
  context: PositionQueryContext, 
  retryCount: number = 0
): number {
  const { prev, next } = resolveBounds();
  const fit = coarsestFit(prev, next);
  if (fit !== null) return fit;

  if (retryCount >= MAX_REINDEX_TRIES) {
    throw new Error('positionResolver: precision exhausted even after a reindex - this should not happen');
  }
  reindexPositionsInScope(context);
  return fitOrReindexAndRetry(resolveBounds, context, retryCount+1)
}

function appendOrReindexAndRetry(
  lastPosition: number,
  context: PositionQueryContext,
  retryCount: number = 0
): number {
  const candidate = Math.round(lastPosition + 1.0)
  if (exceedsMagnitudeThreshold(candidate, context)) {
    if (retryCount >= MAX_REINDEX_TRIES) {
      throw new Error('positionResolver: new position exceeded threshold even after a reindex - this should not happen');
    }
    reindexPositionsInScope(context)
    const newLast = getLastPositionInScope(context);
    if (!newLast) {
      throw new Error(`positionResolver: last position was ${newLast} after a reindex - this should not happen`);
    }
    return appendOrReindexAndRetry(newLast, context, retryCount+1)
  }
  return candidate;
}

function reindexPositionsInScope(queryContext: PositionQueryContext): void {
  const {table, scopeWhere, tx} = queryContext;
  const rows = tx
    .select({ id: table.id, position: table.position, createdAt: table.createdAt })
    .from(table)
    .where(and(scopeWhere, isNotNull(table.position)))
    .orderBy(asc(table.position), asc(table.createdAt))
    .all() as { id: string; position: number | null; createdAt: number }[];

  const now = Date.now();
  rows.forEach((row, index) => {
    tx.update(table).set({ position: index + 1, updatedAt: now }).where(eq(table.id, row.id)).run();
  });
}

function exceedsMagnitudeThreshold(candidate: number, context: PositionQueryContext): boolean {
  if (candidate >= SOFT_MAX_POSITION) {
    const {table, scopeWhere, tx} = context;
    const rows = tx.select({ id: table.id }).from(table).where(scopeWhere).all().length;
    if (candidate >= rows + MAX_OVER_POSITION) {
      return true;
    }
  }
  return false;
}

// "Append at end" position math — max(existing positions) + 1.0, with an
// empty-list base case of 1.0. `position` may be null (items.position is
// nullable); a null counts as 0 for the max, matching what every call site
// already did ad hoc. Was hand-written identically in 4 POST handlers plus
// MCP's move_item tool (audit finding #25).

export function nextPosition(rows: { position: number | null; }[]): number {
  if (rows.length === 0) return 1.0;
  return Math.max(...rows.map(r => r.position ?? 0)) + 1.0;
}