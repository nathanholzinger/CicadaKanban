// validateHierarchyRequest / applyHierarchyRequest — the one reparent/attach/workphase/
// placement implementation behind PUT /items/:id and PATCH /items/:id/move;
// resolveCreate — a create's attachment flag and workphase, checked by the same rules in
// the same order (POST /items), with getParent for the parent row it takes;
// logCreatedUnderParent — the hierarchy entry a create under a parent logs (POST /items).

import { and, eq, inArray, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, type Tx } from '../db/index.js';
import { items, workphases, notifications } from '../db/schema.js';
import { existsById } from './getOrNotFound.js';
import { ancestorsOf, parentRefusal, walkItemDescendants } from './itemTree.js';
import { cascadeWorkphaseToAttachedDescendants } from './attachedCascade.js';
import { positionScopeFor, workflowIdForWorkphase } from './itemPositionScope.js';
import {
  anchorRefusal,
  resolveAppendPosition,
  resolvePositionByAnchorAndSide,
  type AnchorRefusal,
  type ReindexedPosition,
  type Side,
} from './positionResolver.js';
import { effectiveWorkflowIdForProject } from './workflowItems.js';
import { logActivity } from './activityLog.js';

// ============================================================
// The one implementation of "this item changes parent / attachment /
// workphase / position". Two entry points share it — PATCH /items/:id/move
// (the board drag) and PUT /items/:id (the Sheet's checkbox / parent picker
// / MCP update_item) — so the two writes can't enforce different rules.
//
// Two halves: validate against plain `db` *before* the transaction and
// answer 400s from the route; apply inside the transaction with no early
// returns, since a better-sqlite3 transaction rolls back only on a throw
// and an early return would commit whatever it had already written. So
// nothing partial can commit (wiki item-attachment §6).
// ============================================================

export type ItemRow = typeof items.$inferSelect;

// Always a write to the moving item: a request names the item's new parent,
// never a parent's children (wiki item-attachment §3).
export type HierarchyRequest = {
  /** undefined = unchanged, so a detach keeps its parent; null = reparent to root (wiki item-attachment §11). */
  parentId?: string | null;
  /** undefined = keep the current state — nothing attaches by default (wiki item-attachment §4). */
  isAttached?: boolean;
  /** undefined = unchanged, except that an item leaving attachment takes the one it was shown in (wiki item-attachment §2a). Rejected with a 400 when the resulting state is attached and it disagrees with the parent's. */
  workphaseId?: string | null;
  anchorId?: string;
  side?: Side;
};

// Where the item will be once the request is applied — every check and
// every scope below is evaluated against this, never against the row as it
// currently is: reparent first, then resolve (wiki item-attachment §5,
// wiki item-positioning §7.2).
type ResultingState = {
  parentId: string | null;
  /** The stored flag. Cleared whenever the parent is cleared (wiki item-attachment §1's invariant). */
  attachedFlag: boolean;
  /** attachedFlag && parentId — the effective "is a Stub" test the rest of the code uses. */
  isAttachedWithParent: boolean;
  /** Attached before the write and Free after it. */
  leavesAttachment: boolean;
  workphaseId: string | null;
  projectId: string | null;
};

export type ParentRow = { id: string; title: string; projectId: string | null; workphaseId: string | null };

const parentProjection = {
  id: items.id,
  title: items.title,
  projectId: items.projectId,
  workphaseId: items.workphaseId,
};

export function getParent(parentId: string, tx?: Tx): ParentRow | undefined {
  return (tx ?? db).select(parentProjection).from(items).where(eq(items.id, parentId)).get();
}

// The Free item an item is shown with: itself when it's Free, else its
// nearest Free ancestor, since an Attached item shows in that ancestor's
// Card. That item's workphase is where the item is shown, whatever the
// item's own `workphaseId` says (wiki item-attachment §2a). When the chain ends first, at a
// parentId with no row or on a cycle in the data, it's the last item the walk reached.
type ShownWith = { id: string; title: string; workphaseId: string | null };

function shownWith(itemId: string, tx?: Tx): ShownWith | undefined {
  const item = (tx ?? db).select().from(items).where(eq(items.id, itemId)).get();
  if (!item) return undefined;
  const chain = [item, ...ancestorsOf<ItemRow>(items, itemId, tx)];
  return chain.find(link => !link.isAttached || !link.parentId) ?? chain[chain.length - 1];
}

// The 400 for a Free item that must take its shown-with item's workphase when
// that item has none (wiki item-attachment §2a). Doesn't offer `null`: an item
// with no workphase shows in Unsorted.
function noShownWorkphaseError(anchor: ShownWith): string {
  return `"${anchor.title}", the Free ancestor this item is shown with, has no workphase for it to take. Name a workphaseId in the same write, or file "${anchor.title}" into a workphase first`;
}

const ATTACHED_WORKPHASE_ERROR =
  "an attached item inherits its parent's workphase; omit workphaseId or match the parent's";
// A bogus workphaseId would otherwise surface as an opaque FK-violation 500.
const MISSING_WORKPHASE_ERROR = 'workphaseId does not reference an existing workphase';
const PARENTLESS_ATTACH_ERROR = 'isAttached requires a parentId';

// The message for each way a named anchor can fail.
const ANCHOR_ERRORS: Record<AnchorRefusal, string> = {
  self: 'anchorId cannot be the item itself',
  missing: 'anchorId does not reference an existing item',
  'no-position': 'anchorId has no position to anchor against (it may be a done item)',
  'outside-scope': "anchorId is not in this item's resulting position scope",
};

// A Free item's workphase belongs to its project's workflow (wiki item-attachment
// §2a). A project with no workflow has nothing to compare against, so any
// workphase passes there.
function foreignWorkphaseError(projectId: string | null, workphaseId: string): string | null {
  const workflowId = projectId ? effectiveWorkflowIdForProject(projectId) : null;
  if (!workflowId || workflowIdForWorkphase(workphaseId) === workflowId) return null;
  return "workphaseId belongs to a workflow this item's project does not use; name a workphase of that workflow";
}

// A reparent into a project on another workflow can't leave a Free item in the
// moved subtree: it would keep a workphase of the workflow it left, where only
// Unsorted could show it (wiki item-attachment §9). Only an item that ends
// Attached, with no detached descendant, may cross: it and its attached
// descendants take the new parent's workphase. Projects are compared, not
// workphases, so an item already left foreign can still be re-filed.
function crossWorkflowError(item: ItemRow, resulting: ResultingState): string | null {
  if (!item.projectId || !resulting.projectId || resulting.projectId === item.projectId) return null;
  const from = effectiveWorkflowIdForProject(item.projectId);
  const to = effectiveWorkflowIdForProject(resulting.projectId);
  if (!from || !to || from === to) return null;

  if (!resulting.isAttachedWithParent) {
    return `this reparent crosses workflows, and a Free item can't take its workphase with it: attach "${item.title}" to its new parent (isAttached: true), or reparent it within its own workflow`;
  }
  const descendantIds = walkItemDescendants(item.id);
  const detached = descendantIds.length
    ? db
        .select({ title: items.title })
        .from(items)
        .where(and(inArray(items.id, descendantIds), eq(items.isAttached, 0)))
        .get()
    : undefined;
  if (detached) {
    return `this reparent crosses workflows, and "${detached.title}", a detached descendant, would keep a workphase of the workflow it left: attach it to its parent or move it out of the subtree first, or reparent "${item.title}" within its own workflow`;
  }
  return null;
}

// The scope the item's position is resolved in once the request is applied, with the item
// itself left out: what a named anchor is checked against, and where the item is placed.
function resultingScope(item: ItemRow, resulting: ResultingState, tx?: Tx): SQL {
  return positionScopeFor(
    { isAttached: resulting.isAttachedWithParent, parentId: resulting.parentId, workphaseId: resulting.workphaseId },
    item.id,
    tx,
  );
}

function deriveResultingState(
  item: ItemRow,
  req: HierarchyRequest,
  parent: ParentRow | undefined,
  tx?: Tx,
): ResultingState {
  const parentId = req.parentId !== undefined ? req.parentId : item.parentId;
  const parentCleared = req.parentId === null && item.parentId !== null;
  // A write that omits the flag keeps the item's state, so a top-level item,
  // whose flag is clear, becomes a detached child (wiki item-attachment §4).
  // The write that clears the parent clears the flag with it.
  const attachedFlag = parentCleared ? false : req.isAttached !== undefined ? req.isAttached : Boolean(item.isAttached);
  const isAttachedWithParent = attachedFlag && parentId !== null;
  const leavesAttachment = Boolean(item.isAttached) && Boolean(item.parentId) && !isAttachedWithParent;
  // An item that leaves attachment without naming a workphase takes the one it
  // was shown in, not its own stored copy (wiki item-attachment §2a).
  const workphaseId = isAttachedWithParent
    ? (parent?.workphaseId ?? null)
    : req.workphaseId !== undefined
      ? req.workphaseId
      : leavesAttachment
        ? (shownWith(item.id, tx)?.workphaseId ?? null)
        : item.workphaseId;
  const projectId = typeof req.parentId === 'string' ? (parent?.projectId ?? item.projectId) : item.projectId;
  return { parentId, attachedFlag, isAttachedWithParent, leavesAttachment, workphaseId, projectId };
}

// What a create leaves its new item's workphase as, or the 400 that refuses
// the create (wiki item-attachment §2a, §14). `named` is the request's
// `workphaseId`: undefined when omitted, null when it names none on purpose.
function resolveCreateWorkphase(
  parent: { id: string; workphaseId: string | null } | null,
  attached: boolean,
  named: string | null | undefined,
): { workphaseId: string | null } | { error: string } {
  if (parent && attached) {
    if (named !== undefined && named !== parent.workphaseId) return { error: ATTACHED_WORKPHASE_ERROR };
    return { workphaseId: parent.workphaseId };
  }
  if (parent && named === undefined) {
    // A detached child takes the workphase its parent is shown in.
    const anchor = shownWith(parent.id);
    if (anchor && anchor.workphaseId === null) return { error: noShownWorkphaseError(anchor) };
    return { workphaseId: anchor?.workphaseId ?? null };
  }
  return { workphaseId: named ?? null };
}

// A create, once the route has settled what only it can: the parent row (null for a
// top-level item) and the project the item lands in, the parent's when it has one.
export type CreateRequest = {
  parent: ParentRow | null;
  projectId: string;
  /** undefined = attached when there is a parent (wiki item-attachment §14). */
  isAttached?: boolean;
  /** undefined = the workphase the create's rules give; null = none, on purpose (wiki item-attachment §2a). */
  workphaseId?: string | null;
};

// What a create leaves its new item as, or the first 400 message that refuses it: the
// flag and the workphase, under the rules a move or an edit follows and in the order
// validateHierarchyRequest checks them, so a create and a move can't disagree
// (wiki item-attachment §14). The parent's own legality is the route's, with the project.
export function resolveCreate(
  req: CreateRequest,
): { attached: boolean; workphaseId: string | null } | { error: string } {
  const { parent, projectId, workphaseId: named } = req;
  if (named !== undefined && named !== null && !existsById(workphases, named)) {
    return { error: MISSING_WORKPHASE_ERROR };
  }
  // The flag is a child's: a create with no parent and the flag set is refused, and one
  // without stores it clear (wiki item-attachment §1).
  if (!parent && req.isAttached) return { error: PARENTLESS_ATTACH_ERROR };
  const attached = parent ? (req.isAttached !== undefined ? Boolean(req.isAttached) : true) : false;
  const resolution = resolveCreateWorkphase(parent, attached, named);
  if ('error' in resolution) return resolution;
  // A Free item's workphase belongs to its project's workflow (wiki item-attachment §2a).
  if (!attached && typeof named === 'string') {
    const foreignError = foreignWorkphaseError(projectId, named);
    if (foreignError) return { error: foreignError };
  }
  return { attached, workphaseId: resolution.workphaseId };
}

// Hand-rolled request validation. Returns the first 400 message, or null
// when the request is legal. Order: shape → parent legality → resulting-state
// invariants → anchor.
export function validateHierarchyRequest(item: ItemRow, req: HierarchyRequest): string | null {
  if (req.parentId !== undefined && req.parentId !== null && typeof req.parentId !== 'string') {
    return 'parentId must be a string or null';
  }
  if (req.isAttached !== undefined && typeof req.isAttached !== 'boolean') {
    return 'isAttached must be a boolean';
  }
  if (req.workphaseId !== undefined && req.workphaseId !== null && typeof req.workphaseId !== 'string') {
    return 'workphaseId must be a string or null';
  }
  if (req.anchorId !== undefined && req.side !== 'before' && req.side !== 'after') {
    return "side must be 'before' or 'after' when anchorId is given";
  }
  if (typeof req.workphaseId === 'string' && !existsById(workphases, req.workphaseId)) {
    return MISSING_WORKPHASE_ERROR;
  }

  // Exists / not self / not a descendant / within the depth cap — the four
  // legality rules (wiki item-attachment §7), for a parent or the top level. No
  // same-project check: cross-project is not a disqualifier; projectId is derived
  // from the parent below.
  if (req.parentId !== undefined) {
    const parentError = parentRefusal('item', item, req.parentId);
    if (parentError) return parentError;
  }
  const parentId = req.parentId !== undefined ? req.parentId : item.parentId;
  const parent = parentId ? getParent(parentId) : undefined;

  const resulting = deriveResultingState(item, req, parent);

  // "Attached with no parent" is rejected, not ignored (wiki item-attachment §1).
  if (req.isAttached === true && resulting.parentId === null) {
    return PARENTLESS_ATTACH_ERROR;
  }
  // An attached item inherits its parent's workphase, so a request naming a
  // different one is contradictory (wiki item-attachment §2a).
  if (resulting.isAttachedWithParent && req.workphaseId !== undefined && req.workphaseId !== resulting.workphaseId) {
    return ATTACHED_WORKPHASE_ERROR;
  }
  // An item leaving attachment takes the workphase it was shown in, so the
  // write needs one named when that item has none (wiki item-attachment §2a).
  if (resulting.leavesAttachment && req.workphaseId === undefined && resulting.workphaseId === null) {
    const anchor = shownWith(item.id);
    if (anchor) return noShownWorkphaseError(anchor);
  }
  // A Free item's workphase belongs to its project's workflow, with or without
  // a reparent in the same write (wiki item-attachment §2a), and a reparent
  // can't cross workflows with a Free item in the subtree (wiki item-attachment §9).
  if (!resulting.isAttachedWithParent && typeof req.workphaseId === 'string') {
    const foreignError = foreignWorkphaseError(resulting.projectId, req.workphaseId);
    if (foreignError) return foreignError;
  }
  const crossError = crossWorkflowError(item, resulting);
  if (crossError) return crossError;

  if (req.anchorId !== undefined) {
    // Checked against the scope the item ends up in, not its current one: an anchor among
    // the new parent's children is legal although the item isn't one of them yet
    // (wiki positioning §2). A done item has no position, so it can never be an anchor
    // (wiki item-positioning §7.4).
    const refusal = anchorRefusal(items, resultingScope(item, resulting), req.anchorId, item.id);
    if (refusal) return ANCHOR_ERRORS[refusal];
  }

  return null;
}

function isTerminal(workphaseId: string | null, tx: Tx): boolean {
  if (!workphaseId) return false;
  const row = tx
    .select({ isTerminal: workphases.isTerminal })
    .from(workphases)
    .where(eq(workphases.id, workphaseId))
    .get();
  return Boolean(row?.isTerminal);
}

function hierarchyChangeContent(
  item: ItemRow,
  resulting: ResultingState,
  oldParent?: ParentRow,
  newParent?: ParentRow,
): string {
  const wasAttached = Boolean(item.isAttached) && Boolean(item.parentId);
  const oldName = oldParent ? `"${oldParent.title}"` : 'none';
  const newName = newParent ? `"${newParent.title}"` : 'none';
  if (resulting.parentId === null) return `Made top-level (was under ${oldName})`;
  if (resulting.parentId !== item.parentId) {
    const suffix = resulting.isAttachedWithParent ? ' (attached)' : ' (detached)';
    return item.parentId ? `Reparented from ${oldName} to ${newName}${suffix}` : `Parented under ${newName}${suffix}`;
  }
  if (resulting.isAttachedWithParent && !wasAttached) return `Attached to ${newName}`;
  return `Detached from ${newName}`;
}

// Applies a validated request inside `tx`. Returns the reindex disclosure
// (wiki positioning §7) for the caller's response — empty when no
// reindex fired, which is the overwhelmingly common case.
export function applyHierarchyRequest(
  tx: Tx,
  item: ItemRow,
  req: HierarchyRequest,
): { reindexed: ReindexedPosition[] } {
  const now = Date.now();
  const oldParent = item.parentId ? getParent(item.parentId, tx) : undefined;
  const newParent = typeof req.parentId === 'string' ? getParent(req.parentId, tx) : oldParent;
  const resulting = deriveResultingState(item, req, newParent, tx);

  const wasAttachedWithParent = Boolean(item.isAttached) && Boolean(item.parentId);
  const workphaseChanged = resulting.workphaseId !== item.workphaseId;
  const parentChanged = resulting.parentId !== item.parentId;
  const projectChanged = resulting.projectId !== item.projectId;
  // The comparison scope changes on attach↔detach and on a reparent while
  // attached (wiki item-positioning §2.1's table); a redundant re-attach to
  // the same parent is not a scope change and keeps its position.
  const scopeChanged =
    wasAttachedWithParent !== resulting.isAttachedWithParent || (resulting.isAttachedWithParent && parentChanged);

  const updates: Record<string, unknown> = {
    updatedAt: now,
    parentId: resulting.parentId,
    isAttached: resulting.attachedFlag ? 1 : 0,
    workphaseId: resulting.workphaseId,
    projectId: resulting.projectId,
  };

  // --- Position, resolved against the *resulting* scope ---
  const reindexed: ReindexedPosition[] = [];
  const scope = () => resultingScope(item, resulting, tx);
  if (req.anchorId !== undefined) {
    updates.position = resolvePositionByAnchorAndSide(items, scope(), tx, req.side as Side, req.anchorId, reindexed);
  } else if (scopeChanged) {
    // Scope changed with no anchor → append fallback (wiki item-positioning §2.1).
    // "Reparent but keep your position" is not an operation for an attached
    // item (wiki item-attachment §4). A Free item with no workphase at all
    // has no scope to append into (positionScope "none").
    updates.position =
      resulting.isAttachedWithParent || resulting.workphaseId
        ? resolveAppendPosition(items, scope(), tx, reindexed)
        : null;
  } else if (req.workphaseId !== undefined && resulting.workphaseId) {
    // A workphaseId-only move keeps an existing position (wiki item-positioning §2's
    // workphase-only rule — position is workflow-wide, so it's still comparable).
    // A same-workphase "move" with no anchor is a reorder-to-end, and an item
    // with no position to keep (reopened done item, first assignment) needs
    // a fresh one — both take the append fallback.
    if (!(workphaseChanged && item.position !== null))
      updates.position = resolveAppendPosition(items, scope(), tx, reindexed);
  }
  // Otherwise (a Free reparent with no anchor, a no-op re-attach): the scope
  // didn't change and nothing asked for placement — position is left alone.

  // --- Active/done split (wiki item-positioning §6) — Free items only ---
  if (resulting.isAttachedWithParent) {
    // Attached children never carry completedAt and always keep their
    // position, whatever workphase they inherited (wiki item-attachment §2).
    if (item.completedAt !== null) updates.completedAt = null;
  } else if (isTerminal(resulting.workphaseId, tx)) {
    // A Free item in a terminal workphase has no position; it's ordered by
    // completedAt. Overrides whatever was resolved above.
    updates.position = null;
    if (workphaseChanged || wasAttachedWithParent || item.completedAt === null) updates.completedAt = now;
  } else if (item.completedAt !== null) {
    updates.completedAt = null;
  }

  tx.update(items).set(updates).where(eq(items.id, item.id)).run();

  // --- Cascades ---
  if (projectChanged && resulting.projectId) {
    // A hierarchy can't straddle two projects: every descendant follows,
    // detached ones included (wiki item-attachment §9).
    const descendantIds = walkItemDescendants(item.id, { tx });
    if (descendantIds.length > 0) {
      tx.update(items)
        .set({ projectId: resulting.projectId, updatedAt: now })
        .where(inArray(items.id, descendantIds))
        .run();
    }
  }
  if (workphaseChanged) cascadeWorkphaseToAttachedDescendants(item.id, tx);

  // --- Activity log (wiki item-attachment §11a, plus the workphase move's own entry) ---
  const flagChanged = wasAttachedWithParent !== resulting.isAttachedWithParent;
  if (parentChanged || flagChanged) {
    const metadata = {
      fromParentId: item.parentId,
      toParentId: resulting.parentId,
      fromAttached: wasAttachedWithParent,
      toAttached: resulting.isAttachedWithParent,
      ...(projectChanged ? { fromProjectId: item.projectId, toProjectId: resulting.projectId } : {}),
    };
    logActivity(
      item.id,
      'hierarchy_change',
      hierarchyChangeContent(item, resulting, oldParent, newParent),
      metadata,
      tx,
    );
  }
  if (workphaseChanged) {
    const oldWorkphase = item.workphaseId
      ? tx.select().from(workphases).where(eq(workphases.id, item.workphaseId)).get()
      : null;
    const newWorkphase = resulting.workphaseId
      ? tx.select().from(workphases).where(eq(workphases.id, resulting.workphaseId)).get()
      : null;
    logActivity(
      item.id,
      'status_change',
      `Moved from "${oldWorkphase?.name || 'none'}" to "${newWorkphase?.name || 'unknown'}"`,
      { fromWorkphaseId: item.workphaseId, toWorkphaseId: resulting.workphaseId },
      tx,
    );
    if (newWorkphase?.triggersNotification) {
      tx.insert(notifications)
        .values({
          id: randomUUID(),
          itemId: item.id,
          workflowId: newWorkphase.workflowId,
          message: `"${item.title}" moved to "${newWorkphase.name}"`,
          type: 'item_in_workphase',
          isRead: 0,
          createdAt: now,
        })
        .run();
    }
  }

  return { reindexed };
}

// A create under a parent is a hierarchy change too
// (wiki item-attachment §11a): the new item's activity records the parent it
// was created under and whether it's attached to it, in the metadata shape
// applyHierarchyRequest logs. Takes the create's own transaction, so the entry commits with the insert.
export function logCreatedUnderParent(
  tx: Tx,
  itemId: string,
  parent: { id: string; title: string },
  attached: boolean,
): void {
  logActivity(
    itemId,
    'hierarchy_change',
    `Created under "${parent.title}" (${attached ? 'attached' : 'detached'})`,
    { fromParentId: null, toParentId: parent.id, fromAttached: false, toAttached: attached },
    tx,
  );
}
