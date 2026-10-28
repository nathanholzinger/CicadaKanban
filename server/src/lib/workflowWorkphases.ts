// copyWorkphases: a new workflow's workphases, copied from a list of another's.

import { randomUUID } from 'crypto';
import type { Tx } from '../db/index.js';
import { workphases } from '../db/schema.js';

// What a workphase is copied by. A template's phase and a workflow's own both have these.
type WorkphaseSource = Pick<
  typeof workphases.$inferSelect,
  'name' | 'position' | 'triggersNotification' | 'isTerminal'
>;

// Inserts a copy of each of `source` into `workflowId`, in the order given, each with an id of
// its own. The one place a new workflow's workphases are made from a template's or another
// workflow's, so the create route's two branches and the deep seed can't drift apart on a field.
// Runs in the caller's transaction, since a workflow's row, its workphases and its default board
// commit together.
export function copyWorkphases(tx: Tx, workflowId: string, source: readonly WorkphaseSource[], createdAt: number) {
  for (const phase of source) {
    tx.insert(workphases)
      .values({
        id: randomUUID(),
        workflowId,
        name: phase.name,
        position: phase.position,
        triggersNotification: phase.triggersNotification,
        isTerminal: phase.isTerminal,
        createdAt,
      })
      .run();
  }
}
