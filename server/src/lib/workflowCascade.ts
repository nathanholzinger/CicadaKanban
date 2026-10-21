// deleteWorkflowsById: the transactional delete of workflows and what hangs off them.

import { inArray } from 'drizzle-orm';
import type { Tx } from '../db/index.js';
import { boards, notifications, workflows, workphases } from '../db/schema.js';
import { deleteBoardsById } from './boardCascade.js';

// Deletes the given workflows with their boards and columns, their notifications and their
// workphases, in the one order the references allow: columns FK-reference workphases with no
// cascade, so boards and columns go first, and notifications carry a workflowId FK with no
// cascade either, so they go before the workflow. Items are not deleted: removing the
// workphases nulls their workphaseId (ON DELETE SET NULL), so they survive and show as
// "Unknown status" on whatever board their project now resolves to. Runs inside the
// caller's transaction, so the whole cascade commits or rolls back together.
export function deleteWorkflowsById(workflowIds: string[], tx: Tx): void {
  if (workflowIds.length === 0) return;
  const boardIds = tx
    .select({ id: boards.id })
    .from(boards)
    .where(inArray(boards.workflowId, workflowIds))
    .all()
    .map(b => b.id);
  deleteBoardsById(boardIds, tx);
  tx.delete(notifications).where(inArray(notifications.workflowId, workflowIds)).run();
  tx.delete(workphases).where(inArray(workphases.workflowId, workflowIds)).run();
  tx.delete(workflows).where(inArray(workflows.id, workflowIds)).run();
}
