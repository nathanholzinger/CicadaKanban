// logActivity: one activity_log insert, optionally inside a transaction.

import { randomUUID } from 'crypto';
import { db, type Tx } from '../db/index.js';
import { activityLog } from '../db/schema.js';

// One activity entry on an item. `type` is the app-level enum documented on
// the schema column. Pass `tx` to write inside a caller's transaction.
// Lived in routes/items.ts until Epic 3.5 moved hierarchy/workphase logging
// into lib/itemHierarchy.ts, which routes can't import from.
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
