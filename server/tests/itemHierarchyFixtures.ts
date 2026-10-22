// Shared by the item route tests that change an item's parent, attachment or workphase
// (items.hierarchy, items.crossProject and items.workphase).

import { expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/index.js';
import { db } from '../src/db/index.js';
import { items, activityLog } from '../src/db/schema.js';
import { createItem, workflowWithPhases } from './fixtures.js';

type Row = typeof items.$inferSelect;

export function getRow(id: string): Row {
  return db.select().from(items).where(eq(items.id, id)).get()!;
}

export function hierarchyEntries(itemId: string) {
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.itemId, itemId))
    .all()
    .filter(e => e.type === 'hierarchy_change');
}

export const move = (id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/items/${id}/move`).send(body);
export const put = (id: string, body: Record<string, unknown>) => request(app).put(`/api/items/${id}`).send(body);

export const countItems = () => db.select().from(items).all().length;

// One project owning a three-phase workflow (Todo, In Progress, Done*).
export async function setupWorkflow(name = 'P') {
  const {
    project,
    workflow,
    phases: [todo, inProgress, done],
  } = await workflowWithPhases(['Todo', 'In Progress', { name: 'Done', isTerminal: true }], { name });
  return { project, workflow, todo, inProgress, done };
}

// Card P with attached Stubs S1 = 1.0 and S2 = 2.0: a target parent with siblings.
export async function cardWithTwoStubs(projectId: string, workphaseId: string, title = 'P') {
  const p = await createItem({ projectId, workphaseId, title });
  const s1 = await createItem({ projectId, parentId: p.id, title: `${title}-S1` });
  const s2 = await createItem({ projectId, parentId: p.id, title: `${title}-S2` });
  expect([s1.position, s2.position]).toEqual([1.0, 2.0]);
  return { p, s1, s2 };
}
