// What the hierarchy tests of more than one file share, and no other item route test needs: an
// item's hierarchy log entries, and a Card with Stubs (items.hierarchy and items.crossProject).

import { expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { activityLog } from '../src/db/schema.js';
import { createItem } from './fixtures.js';

export function hierarchyEntries(itemId: string) {
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.itemId, itemId))
    .all()
    .filter(e => e.type === 'hierarchy_change');
}

// Card P with attached Stubs S1 = 1.0 and S2 = 2.0: a target parent with siblings.
export async function cardWithTwoStubs(projectId: string, workphaseId: string, title = 'P') {
  const p = await createItem({ projectId, workphaseId, title });
  const s1 = await createItem({ projectId, parentId: p.id, title: `${title}-S1` });
  const s2 = await createItem({ projectId, parentId: p.id, title: `${title}-S2` });
  expect([s1.position, s2.position]).toEqual([1.0, 2.0]);
  return { p, s1, s2 };
}
