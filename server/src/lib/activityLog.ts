// logActivity: one activity_log insert, optionally inside a transaction.

import { randomUUID } from 'crypto';
import { db, type Tx } from '../db/index.js';
import { activityLog } from '../db/schema.js';

// One activity entry on an item. `type` is the app-level enum documented on
// the schema column. Pass `tx` to write inside a caller's transaction.
// In lib/ because itemHierarchy.ts logs too, and lib/ never imports from routes/.
export function logActivity(
  itemId: string,
  type: string,
  content: string,
  metadata?: Record<string, unknown>,
  tx?: Tx,
): void {
  (tx ?? db)
    .insert(activityLog)
    .values({
      id: randomUUID(),
      itemId,
      type,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: Date.now(),
    })
    .run();
}
