import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { items, workphases } from '../db/schema.js';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { findColumnsMixingTerminalAfterFlip, shrinkColumnsForDeletedWorkphase } from '../lib/columnRanges.js';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { applyReorder } from '../lib/reorder.js';
import { nextPosition, resolveAppendPosition } from "../lib/positionResolver.js";
import { positionScopeFor } from '../lib/itemPositionScope.js';

const router = Router();

// Create a workphase on a workflow
router.post('/', (req, res) => {
  const { workflowId, name, triggersNotification, isTerminal } = req.body;

  if (!workflowId || !name) {
    res.status(400).json({ error: 'workflowId and name are required' });
    return;
  }

  const existing = db.select().from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all();

  const id = randomUUID();

  db.insert(workphases).values({
    id,
    workflowId,
    name,
    position: nextPosition(existing),
    triggersNotification: triggersNotification ? 1 : 0,
    isTerminal: isTerminal ? 1 : 0,
    createdAt: Date.now(),
  }).run();

  const created = db.select().from(workphases).where(eq(workphases.id, id)).get();
  res.status(201).json(created);
});

// Update a workphase (name, agent, notification/terminal flags)
router.put('/:id', (req, res) => {
  const workphase = getByIdOrNotFound(workphases, req.params.id, res, 'Workphase not found');
  if (!workphase) return;

  const { name, triggersNotification, isTerminal } = req.body;
  const isTerminalChanging = isTerminal !== undefined && Boolean(isTerminal) !== Boolean(workphase.isTerminal);

  // A flip can break the "no column spans both a terminal and a
  // non-terminal workphase" invariant validateColumnRange enforces at
  // column create/update time (audit Finding #6) — re-check it here, before
  // writing anything, same as columns.ts's own pre-write validation.
  if (isTerminalChanging) {
    const conflicts = findColumnsMixingTerminalAfterFlip(db, workphase.workflowId, req.params.id, Boolean(isTerminal));
    if (conflicts.length > 0) {
      res.status(400).json({
        error: `Would leave column "${conflicts[0].name ?? conflicts[0].id}" spanning both a terminal (done) and a non-terminal workphase`,
        conflictingColumnId: conflicts[0].id,
      });
      return;
    }
  }

  db.transaction((tx) => {
    tx.update(workphases)
      .set({
        name: name ?? workphase.name,
        triggersNotification: triggersNotification !== undefined
          ? (triggersNotification ? 1 : 0)
          : workphase.triggersNotification,
        isTerminal: isTerminal !== undefined
          ? (isTerminal ? 1 : 0)
          : workphase.isTerminal,
      })
      .where(eq(workphases.id, req.params.id))
      .run();

    // A flip leaves items already sitting in this workphase stale — they
    // keep whichever of position/completedAt matched the *old* status
    // (audit Finding #6). Backfill only detached/root items (attached
    // children never touch position/completedAt regardless of their
    // workphase's terminal status, mirroring items.ts's isAttachedWithParent
    // gate) so their order is preserved rather than collapsing to an
    // arbitrary tie.
    if (isTerminalChanging) {
      backfillItemsForTerminalFlip(tx, req.params.id, Boolean(isTerminal));
    }
  });

  const updated = db.select().from(workphases).where(eq(workphases.id, req.params.id)).get();
  res.json(updated);
});

// See the PUT handler above. `newIsTerminal` is the workphase's new status,
// already committed by the time this runs.
function backfillItemsForTerminalFlip(tx: Tx, workphaseId: string, newIsTerminal: boolean): void {
  const notAttachedWithParent = or(eq(items.isAttached, 0), isNull(items.parentId))!;

  if (newIsTerminal) {
    // Was active, now terminal: assign completedAt in the same relative
    // order as the existing position (ascending), so getWorkphaseItemsFrom's
    // completedAt-ascending sort doesn't collapse every item to the same
    // "0" tie — position is cleared, matching the single-item terminal
    // transition in items.ts's PATCH /:id/move.
    const activeItems = tx.select({ id: items.id })
      .from(items)
      .where(and(eq(items.workphaseId, workphaseId), notAttachedWithParent))
      .orderBy(asc(items.position))
      .all();
    const now = Date.now();
    activeItems.forEach((item, index) => {
      tx.update(items).set({ position: null, completedAt: now + index, updatedAt: now }).where(eq(items.id, item.id)).run();
    });
  } else {
    // Was terminal, now active: give each item a fresh workflow-wide
    // position, appended one at a time in completedAt-ascending order (so
    // the item that "finished" first reopens at the front) — the same
    // append-and-clear-completedAt rule items.ts's PATCH /:id/move applies
    // when reopening a single done item.
    const doneItems = tx.select({ id: items.id })
      .from(items)
      .where(and(eq(items.workphaseId, workphaseId), notAttachedWithParent))
      .orderBy(asc(items.completedAt))
      .all();
    for (const item of doneItems) {
      const position = resolveAppendPosition(
        items,
        positionScopeFor({ isAttached: false, parentId: null, workphaseId }, item.id, tx),
        tx,
      );
      tx.update(items).set({ position, completedAt: null, updatedAt: Date.now() }).where(eq(items.id, item.id)).run();
    }
  }
}

// Reorder workphases — accepts an array of { id, position } pairs
router.patch('/reorder', (req, res) => {
  const { workphaseOrders } = req.body;

  const ok = db.transaction((tx) => applyReorder(workphases, workphaseOrders, tx, res, 'workphase'));
  if (!ok) return;

  res.json({ success: true });
});

// Delete a workphase. Items in it are not blocked or deleted — the FK nulls
// their workphaseId (ON DELETE SET NULL), so they survive and surface as
// "Unknown status" in the board's unsorted bucket until re-filed.
router.delete('/:id', (req, res) => {
  const workphase = getByIdOrNotFound(workphases, req.params.id, res, 'Workphase not found');
  if (!workphase) return;

  const { shrunkColumns, deletedColumns } = db.transaction(tx => {
    const result = shrinkColumnsForDeletedWorkphase(tx, req.params.id, workphase.workflowId);
    tx.delete(workphases).where(eq(workphases.id, req.params.id)).run();
    return result;
  });

  if (shrunkColumns.length > 0 || deletedColumns.length > 0) {
    res.status(200).json({ shrunkColumns, deletedColumns });
    return;
  }
  res.status(204).send();
});

export default router;
