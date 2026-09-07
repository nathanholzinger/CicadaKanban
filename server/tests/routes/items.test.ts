import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items, activityLog, attachments, notifications, itemLabels, labels, chatThreads, chatMessages } from '../../src/db/schema.js';
import { createProject, createWorkflow, createWorkphase, createItem } from '../fixtures.js';

describe('GET /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('computes depth via the parent chain and derives workflowId from the workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Root' });
    // Attached by default — inherits the parent's current workphase.
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child' });

    const rootRes = await request(app).get(`/api/items/${root.id}`);
    expect(rootRes.body.depth).toBe(0);
    expect(rootRes.body.workflowId).toBe(workflow.id);

    const childRes = await request(app).get(`/api/items/${child.id}`);
    expect(childRes.body.depth).toBe(1);
    expect(childRes.body.workphaseId).toBe(phase.id);
    expect(childRes.body.workflowId).toBe(workflow.id);
  });

  it('a detached child does not inherit the parent workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);
    const root = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child', isAttached: false });

    const childRes = await request(app).get(`/api/items/${child.id}`);
    expect(childRes.body.workphaseId).toBeNull();
    expect(childRes.body.workflowId).toBeNull();
  });

  // Regression coverage for audit Finding #11: computeDepth used to walk
  // the parent chain with no cycle guard — a corrupted parentId cycle in
  // the data would hang this request forever instead of returning.
  it('returns a bounded depth instead of hanging when the data contains a parentId cycle', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id, title: 'A' });
    const b = await createItem({ projectId: project.id, title: 'B' });
    db.update(items).set({ parentId: b.id }).where(eq(items.id, a.id)).run();
    db.update(items).set({ parentId: a.id }).where(eq(items.id, b.id)).run();

    const res = await request(app).get(`/api/items/${a.id}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.depth).toBe('number');
  });
});

describe('POST /api/items', () => {
  it('returns 400 when title is missing', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items').send({ projectId: project.id });
    expect(res.status).toBe(400);
  });

  it('creates a root item given an explicit projectId', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items').send({ title: 'Task', projectId: project.id });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(project.id);
  });

  it('inherits projectId from parentId when projectId is omitted', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const res = await request(app).post('/api/items').send({ title: 'Child', parentId: parent.id });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(project.id);
  });

  it('returns 400 when neither projectId nor a resolvable parentId is given', async () => {
    const res = await request(app).post('/api/items').send({ title: 'Orphan' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-existent workphaseId rather than an opaque FK 500', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items')
      .send({ title: 'Task', projectId: project.id, workphaseId: 'no-such-workphase' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-existent parentId instead of storing an invisible orphan', async () => {
    const project = await createProject();
    const res = await request(app).post('/api/items')
      .send({ title: 'Child', projectId: project.id, parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  it('rejects creating a child whose projectId differs from its parent (finding #11)', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const parent = await createItem({ projectId: projectA.id, title: 'Parent A' });
    const res = await request(app).post('/api/items')
      .send({ title: 'Child', projectId: projectB.id, parentId: parent.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different project/i);
  });

  it('positions the first item in a workphase at 1.0 and the next at max + 1.0', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const first = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'First' });
    expect(first.position).toBe(1.0);

    const second = await createItem({ projectId: project.id, workphaseId: phase.id, title: 'Second' });
    expect(second.position).toBe(2.0);
  });

  it('logs a "Created" activity entry', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.body.activity.some((a: { type: string; content: string }) => a.content === 'Created')).toBe(true);
  });
});

describe('PUT /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/items/does-not-exist').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('updates only the provided fields', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Original', description: 'Original desc' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Renamed');
    expect(res.body.description).toBe('Original desc');
  });

  it('logs an assignment activity entry only when assigneeType or agentId is touched', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });

    await request(app).put(`/api/items/${item.id}`).send({ title: 'No assignment change' });
    const afterTitle = await request(app).get(`/api/items/${item.id}`);
    expect(afterTitle.body.activity.some((a: { type: string }) => a.type === 'assignment')).toBe(false);

    await request(app).put(`/api/items/${item.id}`).send({ assigneeType: 'human' });
    const afterAssign = await request(app).get(`/api/items/${item.id}`);
    expect(afterAssign.body.activity.some((a: { type: string }) => a.type === 'assignment')).toBe(true);
  });
});

describe('PATCH /api/items/:id/move', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).patch('/api/items/does-not-exist/move').send({ position: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when neither workphaseId nor position is given', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when moving to a non-existent workphaseId', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: 'no-such-workphase' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-numeric or non-finite raw position (regression: was written unvalidated)', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    await request(app).patch(`/api/items/${item.id}/move`).send({ position: 5 });

    const nonNumeric = await request(app).patch(`/api/items/${item.id}/move`).send({ position: 'later' });
    expect(nonNumeric.status).toBe(400);

    const notFinite = await request(app).patch(`/api/items/${item.id}/move`).send({ position: Infinity });
    expect(notFinite.status).toBe(400);

    const unchanged = await request(app).get(`/api/items/${item.id}`);
    expect(unchanged.body.position).toBe(5);
  });

  it('a position-only move does not add a new status_change entry beyond the one logged at creation', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const before = await request(app).get(`/api/items/${item.id}`);
    const countBefore = before.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;

    await request(app).patch(`/api/items/${item.id}/move`).send({ position: 5 });

    const after = await request(app).get(`/api/items/${item.id}`);
    const countAfter = after.body.activity.filter((a: { type: string }) => a.type === 'status_change').length;
    expect(countAfter).toBe(countBefore);
  });

  it('a workphase move logs a status_change entry and creates a notification only when the target triggers one', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const quiet = await createWorkphase(workflow.id, { name: 'Todo' });
    const noisy = await createWorkphase(workflow.id, { name: 'Review', triggersNotification: true });
    const item = await createItem({ projectId: project.id, workphaseId: quiet.id });

    const toNoisy = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: noisy.id });
    expect(toNoisy.status).toBe(200);

    const afterNoisy = await request(app).get(`/api/items/${item.id}`);
    expect(afterNoisy.body.activity.some(
      (a: { type: string; content: string }) => a.type === 'status_change' && a.content.includes('Moved'),
    )).toBe(true);

    const notifications = await request(app).get('/api/notifications');
    expect(notifications.body.some((n: { itemId: string }) => n.itemId === item.id)).toBe(true);
  });

  it('a workphaseId-only move (no position given) defaults to the end of the target workphase', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    const existing = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Already done' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(existing.position);
  });

  it('an explicit position on a move is respected as-is, not overridden by the default', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done' });
    await createItem({ projectId: project.id, workphaseId: done.id, title: 'Already done' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: done.id, position: 0.5 });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(0.5);
  });

  it('a workphaseId-only move with no anchor keeps the item\'s existing position exactly unchanged (TC-2.24)', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    const moving = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Moving' });
    // Pinned to a value append-fallback would never naturally produce, so a
    // pass here can't be coincidental the way `toBeGreaterThan` checks
    // elsewhere in this describe block can be.
    await request(app).patch(`/api/items/${moving.id}/move`).send({ position: 7.5 });

    const res = await request(app).patch(`/api/items/${moving.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);
    // Position is workflow-scoped, not workphase-scoped (de80b59) — an
    // existing value is already comparable against everything else in the
    // workflow, so a bare workphaseId change doesn't get a fresh one.
    expect(res.body.position).toBe(7.5);
  });
});

describe('Epic 3.2 — position resolution', () => {
  async function setupTwoPhases(doneOverrides: Record<string, unknown> = {}) {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true, ...doneOverrides });
    return { project, workflow, todo, done };
  }

  it('POST scopes a new attached child to its true siblings, not the whole workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    // Unrelated top-level items sharing the workphase must not pollute the
    // new child's position (the pre-Epic-3.2 bug: nextPosition was scoped
    // only to workphaseId).
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 1' });
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 2' });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children
    expect(typeof child.position).toBe('number'); // TC-2.18: position's shape is unchanged (number|null)
  });

  it('POST into a terminal workphase gets no position, but a completedAt timestamp', async () => {
    const { project, done } = await setupTwoPhases();
    const res = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(res.status).toBe(201);
    expect(res.body.position).toBeNull(); // TC-2.18: the other half of position's number|null shape
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('attaching to a parent reassigns a fresh position scoped to the new siblings', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    await createItem({ projectId: project.id, parentId: parent.id, title: 'Existing sibling' }); // position 1.0
    const detached = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Detached', isAttached: false });

    const res = await request(app).put(`/api/items/${detached.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0); // fresh, past the existing sibling — not its old workphase-scoped value
  });

  it('detaching reassigns a fresh position scoped to the workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing root' }); // position 1.0
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' }); // position 2.0
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, position 1.0 among siblings

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(2.0); // fresh, past the workphase's existing items
  });

  it('detaching into a terminal workphase clears position and sets completedAt', async () => {
    const { project, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Done, keeps a position

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('reparenting while staying attached reassigns a fresh position scoped to the new parent', async () => {
    const { project, todo } = await setupTwoPhases();
    const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
    const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
    await createItem({ projectId: project.id, parentId: parentB.id, title: 'Existing under B' }); // position 1.0
    const child = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0);
  });

  it('a redundant re-attach to the same parent leaves position untouched (TC-2.23)', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(child.position);
  });

  it('move resolves anchorId+side against the true neighbor, not a client-supplied guess', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
    const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0

    const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(a.position);
    expect(res.body.position).toBeLessThan(b.position);
  });

  describe('detached siblings sharing one workphase (TC-X.1 — unaffected pre-feature reorder behavior)', () => {
    // Fresh GET-based reads, not the move response — a genuine persisted-
    // order check on reload, same convention as
    // itemRepositioningAttachedSiblings.spec.ts's siblingOrder helper.
    async function orderOf(items: { id: string; title: string }[]): Promise<string> {
      const fetched = await Promise.all(items.map(i => request(app).get(`/api/items/${i.id}`)));
      return fetched
        .map((res, idx) => ({ title: items[idx].title, position: res.body.position as number }))
        .sort((x, y) => x.position - y.position)
        .map(i => i.title)
        .join('');
    }

    async function seedABC() {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
      const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
      const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0
      return { a, b, c };
    }

    it('C before A — becomes the new true first sibling', async () => {
      const { a, b, c } = await seedABC();
      const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'before' });
      expect(res.status).toBe(200);
      // No true predecessor before A -> floor-anchored coarsest-fit between
      // 0.0 and A's 1.0, not a flat A.position - 1.0.
      expect(res.body.position).toBe(0.5);
      expect(await orderOf([a, b, c])).toBe('CAB');
    });

    it('C after A / C before B — same true-neighbor midpoint from either anchor', async () => {
      const { a, b, c } = await seedABC();
      const afterA = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(afterA.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');

      const beforeB = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: b.id, side: 'before' });
      expect(beforeB.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');
    });

    it('A after C — becomes the new true last sibling', async () => {
      const { a, b, c } = await seedABC();
      const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: c.id, side: 'after' });
      expect(res.status).toBe(200);
      // No true successor after C -> append fallback, C.position + 1.0.
      expect(res.body.position).toBe(4.0);
      expect(await orderOf([a, b, c])).toBe('BCA');
    });
  });

  it('excludes the item itself from its own scope query on reposition (TC-X.6)', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id }); // 1.0
    const x = await createItem({ projectId: project.id, workphaseId: todo.id }); // 2.0
    const b = await createItem({ projectId: project.id, workphaseId: todo.id }); // 3.0
    // Force x to sit numerically between a and b — if x's own (pre-move) row
    // weren't excluded from its scope query, resolving "after a" would find
    // x itself as the closest neighbor and anchor against its stale value.
    await request(app).patch(`/api/items/${x.id}/move`).send({ position: 1.5 });

    const res = await request(app).patch(`/api/items/${x.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    // Correctly resolves against the true next neighbor (b, at 3.0),
    // skipping x's own stale 1.5 — a buggy resolution would land below 1.5.
    expect(res.body.position).toBeGreaterThan(1.5);
    expect(res.body.position).toBeLessThan(3.0);
  });

  it('move rejects an invalid side when anchorId is given', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: a.id, side: 'sideways' });
    expect(res.status).toBe(400);
  });

  it('move rejects a non-existent anchorId', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: 'no-such-item', side: 'after' });
    expect(res.status).toBe(400);
  });

  it('move rejects anchoring to a done item (no position to anchor against) (TC-2.8)', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const active = await createItem({ projectId: project.id, workphaseId: todo.id });
    const doneItem = await request(app).post('/api/items').send({ title: 'Done item', projectId: project.id, workphaseId: done.id });

    const res = await request(app).patch(`/api/items/${active.id}/move`).send({ anchorId: doneItem.body.id, side: 'after' });
    expect(res.status).toBe(400);
  });

  // Regression coverage for audit Finding #7: the anchor's position scope
  // was never checked against the subject's resulting scope.
  describe('move rejects an anchorId outside the subject\'s position scope (Finding #7)', () => {
    it('rejects anchoring a detached item against someone else\'s attached child', async () => {
      const { project, todo } = await setupTwoPhases();
      const detached = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Detached' });
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });

      const res = await request(app).patch(`/api/items/${detached.id}/move`).send({ anchorId: attachedChild.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
    });

    it('rejects anchoring an attached child against an attached child of a different parent', async () => {
      const { project, todo } = await setupTwoPhases();
      const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
      const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
      const childOfA = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child of A' });
      const childOfB = await createItem({ projectId: project.id, parentId: parentB.id, title: 'Child of B' });

      const res = await request(app).patch(`/api/items/${childOfA.id}/move`).send({ anchorId: childOfB.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
    });

    it('rejects anchoring against an item in a different workflow', async () => {
      const { project, todo } = await setupTwoPhases();
      const subject = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Subject' });

      const otherProject = await createProject();
      const otherWorkflow = await createWorkflow(otherProject.id);
      const otherPhase = await createWorkphase(otherWorkflow.id, { name: 'Other Todo' });
      const foreignAnchor = await createItem({ projectId: otherProject.id, workphaseId: otherPhase.id, title: 'Foreign Anchor' });

      const res = await request(app).patch(`/api/items/${subject.id}/move`).send({ anchorId: foreignAnchor.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
    });

    it('still allows anchoring within the same workflow-wide scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id });
      const b = await createItem({ projectId: project.id, workphaseId: todo.id });

      const res = await request(app).patch(`/api/items/${b.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(res.status).toBe(200);
    });

    it('still allows anchoring within the same attached-siblings scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child A' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child B' });

      const res = await request(app).patch(`/api/items/${childB.id}/move`).send({ anchorId: childA.id, side: 'after' });
      expect(res.status).toBe(200);
    });
  });

  it('moving into a terminal workphase clears position and sets completedAt', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('moving out of a terminal workphase clears completedAt and assigns a fresh position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const existing = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing' }); // position 1.0
    const item = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(item.body.completedAt).toBeGreaterThan(0);

    const res = await request(app).patch(`/api/items/${item.body.id}/move`).send({ workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    // TC-6.9: proves the fresh position specifically follows append-fallback
    // (past the true last item in scope) — not just "some non-null value".
    expect(res.body.position).toBeGreaterThan(existing.position);
  });

  it('GET returns positionScope = "attached-siblings" for an attached child (TC-2.13)', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });

    const res = await request(app).get(`/api/items/${child.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('attached-siblings');
  });

  // Regression coverage for audit Finding #17: GET /:id's children array used
  // to compute positionScope with a query per child; exercise two distinct
  // workphases across parent + children in one response to catch a batching
  // regression that only shows up with more than one workphaseId involved.
  it('GET attaches positionScope to the item and to every child in its children array', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });
    const detachedChild = await createItem({
      projectId: project.id, parentId: parent.id, workphaseId: done.id, isAttached: false, title: 'Detached Child',
    });

    const res = await request(app).get(`/api/items/${parent.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');

    const children = res.body.children as Array<{ id: string; positionScope: string }>;
    expect(children.find(c => c.id === attachedChild.id)?.positionScope).toBe('attached-siblings');
    expect(children.find(c => c.id === detachedChild.id)?.positionScope).toBe('none');
  });

  it('GET returns positionScope = "workflow" for a detached item in a non-terminal workphase (TC-2.14)', async () => {
    const { project, todo } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');
  });

  it('GET returns positionScope = "none" for a done item (TC-2.15)', async () => {
    const { project, done } = await setupTwoPhases();
    const item = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });

    const res = await request(app).get(`/api/items/${item.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('none');
  });

  describe('multi-workphase active-scope reindex (TC-5.4/TC-5.6)', () => {
    async function setupThreePhases() {
      const { project, workflow, todo, done } = await setupTwoPhases();
      const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
      return { project, workflow, todo, inProgress, done };
    }

    async function getPosition(id: string) {
      return (await request(app).get(`/api/items/${id}`)).body.position;
    }

    it('reindexes every non-terminal workphase in the workflow together, in one coordinated pass (TC-5.4)', async () => {
      const { project, todo, inProgress } = await setupThreePhases();

      // A tight, unresolvable gap within `todo` — the trigger.
      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      await request(app).patch(`/api/items/${itemT1.id}/move`).send({ position: 1.0 });
      await request(app).patch(`/api/items/${itemT2.id}/move`).send({ position: 1.0 + 1e-13 });

      // A third item in a DIFFERENT non-terminal workphase, same workflow —
      // this is what proves the coordinated (not per-workphase) scope.
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      await request(app).patch(`/api/items/${itemP1.id}/move`).send({ position: 5.0 });

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });
      expect(res.status).toBe(200);

      // Precision exhausted between T1 and T2 -> reindexScope ran over the
      // full workflow-wide scope (positionScopeFor), not just `todo` ->
      // T1/T2/P1 all land as clean sequential integers in one pass, then
      // Mover's insert retries and resolves the now-open T1/T2 gap.
      expect(await getPosition(itemT1.id)).toBe(1);
      expect(await getPosition(itemT2.id)).toBe(2);
      expect(await getPosition(itemP1.id)).toBe(3); // the coordination proof: a different workphase, reindexed together
      expect(res.body.position).toBe(1.5);
    });

    // Regression guard for a real bug found 2026-08-18: positionScopeFor's
    // workflow-wide scope includes terminal workphase ids with no
    // isTerminal filter, so a done item (position: null) was a scope
    // member by workphaseId alone. reindexScope ordered by
    // asc(items.position) with no NULL filter, and SQLite sorts NULL
    // first in ASC order — so a done item sorted first and got a real
    // position written by reindexScope, contradicting Part 6 ("done items
    // get no stored position"). Fixed by filtering
    // isNotNull(items.position) directly in reindexScope (positionResolver.ts)
    // — the one place in the resolution path not already protected by
    // ordinary SQL null comparisons (gt()/lt() against a real value can
    // never match a null position, so the append/anchor neighbor-lookup
    // queries were never at risk; this blind order-and-renumber loop was).
    it('excludes a done item from an active-scope reindex (TC-5.6)', async () => {
      const { project, todo, inProgress, done } = await setupThreePhases();

      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      await request(app).patch(`/api/items/${itemT1.id}/move`).send({ position: 1.0 });
      await request(app).patch(`/api/items/${itemT2.id}/move`).send({ position: 1.0 + 1e-13 });
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      await request(app).patch(`/api/items/${itemP1.id}/move`).send({ position: 5.0 });

      const doneItem = await request(app).post('/api/items').send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
      expect(doneItem.body.position).toBeNull();
      expect(doneItem.body.completedAt).toBeGreaterThan(0);

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });

      const reread = await request(app).get(`/api/items/${doneItem.body.id}`);
      expect(reread.body.position).toBeNull();
      expect(reread.body.completedAt).toBe(doneItem.body.completedAt);
    });
  });

  // positionScopeFor's two branches (attached-siblings: `parentId = X AND
  // isAttached = 1`; workflow-wide: everything else, explicitly excluding
  // `isAttached = 1 AND parentId IS NOT NULL`) are literal complements of
  // each other, so no row can satisfy both — but TC-5.6 (above) is proof
  // that reasoning about a scope predicate isn't the same as verifying it
  // under an actual reindex, so this checks both leak directions directly
  // rather than trusting the construction argument alone.
  describe('reindex scope isolation: attached-siblings vs. workflow-wide', () => {
    it('an attached-siblings reindex does not touch an unrelated workflow-wide item', async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      await request(app).patch(`/api/items/${childA.id}/move`).send({ position: 1.0 });
      await request(app).patch(`/api/items/${childB.id}/move`).send({ position: 1.0 + 1e-13 }); // tight gap -> reindex trigger

      const farAway = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'FarAway' });
      await request(app).patch(`/api/items/${farAway.id}/move`).send({ position: 500.0 });

      const newChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'NewChild' });
      const res = await request(app).patch(`/api/items/${newChild.id}/move`).send({ anchorId: childA.id, side: 'after' });

      // The attached-siblings reindex itself worked (childA/childB got
      // clean sequential positions, newChild resolved into the gap)...
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2);
      expect(res.body.position).toBe(1.5);
      // ...but a workflow-wide item sharing the same workphase, and the
      // parent itself, are both completely untouched by it.
      expect((await request(app).get(`/api/items/${farAway.id}`)).body.position).toBe(500);
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(parent.position);
    });

    it('a workflow-wide reindex does not touch an unrelated parent\'s attached children', async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      await request(app).patch(`/api/items/${childA.id}/move`).send({ position: 1.0 });
      await request(app).patch(`/api/items/${childB.id}/move`).send({ position: 2.0 }); // plenty of room, not a trigger

      const t1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const t2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      await request(app).patch(`/api/items/${t1.id}/move`).send({ position: 10.0 });
      await request(app).patch(`/api/items/${t2.id}/move`).send({ position: 10.0 + 1e-13 }); // tight gap -> reindex trigger

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: t1.id, side: 'after' });

      // The workflow-wide reindex itself worked — `parent` is itself a
      // plain top-level (non-attached) item, so it's a workflow-wide scope
      // member too and gets swept into the same reindex, ahead of T1/T2 by
      // position order.
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${t1.id}`)).body.position).toBe(2);
      expect((await request(app).get(`/api/items/${t2.id}`)).body.position).toBe(3);
      expect(res.body.position).toBe(2.5);
      // ...but the unrelated parent's attached children, sharing the same
      // workphase, are completely untouched by it.
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1.0);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2.0);
    });
  });
});

describe('PATCH /api/items/reorder', () => {
  it('returns 400 when itemOrders is not an array', async () => {
    const res = await request(app).patch('/api/items/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('reorders multiple items', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const b = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 5 }, { id: b.id, position: 1 }],
    });
    expect(res.status).toBe(200);
  });

  it('rejects an entry without a string id and finite numeric position', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 'first' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects a falsy invalid entry (regression: Array.find/truthiness mix-up)', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [null, { id: a.id, position: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 with missingIds when any item does not exist', async () => {
    const project = await createProject();
    const a = await createItem({ projectId: project.id });
    const res = await request(app).patch('/api/items/reorder').send({
      itemOrders: [{ id: a.id, position: 1 }, { id: 'ghost', position: 2 }],
    });
    expect(res.status).toBe(404);
    expect(res.body.missingIds).toEqual(['ghost']);
  });
});

describe('POST /api/items/:id/comments', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).post('/api/items/does-not-exist/comments').send({ content: 'hi' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty or whitespace-only content', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).post(`/api/items/${item.id}/comments`).send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('adds a trimmed comment to the activity log', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const post = await request(app).post(`/api/items/${item.id}/comments`).send({ content: '  hello  ' });
    expect(post.status).toBe(201);

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.body.activity.some((a: { type: string; content: string }) => a.type === 'comment' && a.content === 'hello')).toBe(true);
  });
});

describe('DELETE /api/items/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes a leaf item', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).delete(`/api/items/${item.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/items/${item.id}`)).status).toBe(404);
  });

  it('cascades through a multi-level parent/child/grandchild chain', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).delete(`/api/items/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/items/${parent.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${child.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).status).toBe(404);
  });

  it('deleting a parent also deletes its detached descendants (finding #27 — whole-subtree delete regardless of attach state)', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const detachedChild = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Detached Child', isAttached: false,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: detachedChild.id, title: 'Grandchild' });

    const res = await request(app).delete(`/api/items/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/items/${detachedChild.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).status).toBe(404);
  });

  it('cascades an item\'s dependent rows (labels, activity, notifications, attachments, chat) via ON DELETE CASCADE', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });
    await request(app).post(`/api/items/${item.id}/comments`).send({ content: 'a comment' }); // seeds activityLog

    // Seed the tables without a POST route directly, then assert the DB cascade.
    const label = { id: randomUUID(), name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments).values({
      id: randomUUID(), itemId: item.id, type: 'local_file', label: 'notes.txt', createdAt: Date.now(),
    }).run();
    db.insert(notifications).values({
      id: randomUUID(), itemId: item.id, message: 'hi', type: 'item_in_workphase', createdAt: Date.now(),
    }).run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages).values({
      id: randomUUID(), threadId: thread.id, role: 'user', content: 'hello', createdAt: Date.now(),
    }).run();

    expect((await request(app).delete(`/api/items/${item.id}`)).status).toBe(204);

    // Item's own dependent rows are gone; the global label survives.
    expect(db.select().from(activityLog).where(eq(activityLog.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(attachments).where(eq(attachments.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatThreads).where(eq(chatThreads.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id)).all()).toHaveLength(0);
    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(1);
  });
});

describe('attached children', () => {
  async function setupTwoPhases() {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const todo = await createWorkphase(workflow.id, { name: 'Todo' });
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress };
  }

  it('moving a parent cascades through attached children and grandchildren', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    expect((await request(app).get(`/api/items/${child.id}`)).body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('cascading a non-terminal-to-non-terminal move leaves an attached child\'s position untouched (TC-2.25)', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    // cascadeWorkphaseToAttachedDescendants only ever sets {workphaseId,
    // updatedAt} on a cascaded child — position is a separate, untouched
    // axis regardless of how many times the parent's workphase changes.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(inProgress.id);
    expect(updatedChild.body.position).toBe(child.position);
  });

  it('an attached child keeps its position (and stays out of Part 6 done-tracking) when its parent cascades into a terminal workphase (TC-6.5)', async () => {
    const { project, workflow, todo } = await setupTwoPhases();
    const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0);

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    // The parent itself does go through Part 6's active->done transition...
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);

    // ...but the attached child's own scope is (parentId, isAttached), never
    // workphaseId — Part 6's done-tracking is explicitly detached/root-only
    // (items.ts: "Attached items don't participate in Part 6's
    // done-tracking"), so its position and completedAt are untouched even
    // though its cascaded workphaseId is now terminal.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(done.id);
    expect(updatedChild.body.position).toBe(child.position);
    expect(updatedChild.body.completedAt).toBeNull();
  });

  it('a detached child halts the cascade for its whole branch', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Root' });
    const detached = await createItem({
      projectId: project.id, parentId: root.id, title: 'Detached', isAttached: false, workphaseId: todo.id,
    });
    // Attached under the detached child — inherits its phase, but must not follow the root.
    const branchChild = await createItem({ projectId: project.id, parentId: detached.id, title: 'Branch Child' });

    await request(app).patch(`/api/items/${root.id}/move`).send({ workphaseId: inProgress.id });

    expect((await request(app).get(`/api/items/${detached.id}`)).body.workphaseId).toBe(todo.id);
    expect((await request(app).get(`/api/items/${branchChild.id}`)).body.workphaseId).toBe(todo.id);
  });

  it('reattaching snaps to the parent workphase and cascades to own attached descendants', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent' });
    const child = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Child', isAttached: false, workphaseId: todo.id,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    expect(grandchild.workphaseId).toBe(todo.id);

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('reparenting an attached item shifts it and its attached descendants to the new parent workphase', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent 1' });
    const parent2 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent 2' });
    const item = await createItem({ projectId: project.id, parentId: parent1.id, title: 'Item' });
    const itemChild = await createItem({ projectId: project.id, parentId: item.id, title: 'Item Child' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: parent2.id });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${itemChild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged (finding #10)', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    // Force divergence: the attached child sits in a different workphase than its parent.
    db.update(items).set({ workphaseId: inProgress.id }).where(eq(items.id, child.id)).run();
    db.update(items).set({ workphaseId: inProgress.id }).where(eq(items.id, grandchild.id)).run();

    // A title-only edit must leave workphaseId untouched (no snap back to the parent's Todo).
    const res = await request(app).put(`/api/items/${child.id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('rejects an item becoming its own parent or reparenting to a descendant', async () => {
    const project = await createProject();
    const root = await createItem({ projectId: project.id, title: 'Root' });
    const child = await createItem({ projectId: project.id, parentId: root.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const selfRes = await request(app).put(`/api/items/${root.id}`).send({ parentId: root.id });
    expect(selfRes.status).toBe(400);
    expect(selfRes.body.error).toMatch(/own parent/i);

    const cycleRes = await request(app).put(`/api/items/${root.id}`).send({ parentId: grandchild.id });
    expect(cycleRes.status).toBe(400);
    expect(cycleRes.body.error).toMatch(/descendant/i);
  });

  it('rejects reparenting to a non-existent parentId', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id, title: 'Item' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: 'no-such-parent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/parentId/i);
  });

  it('rejects reparenting an item under a parent in a different project (finding #11)', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const itemA = await createItem({ projectId: projectA.id, title: 'Item A' });
    const parentB = await createItem({ projectId: projectB.id, title: 'Parent B' });

    const res = await request(app).put(`/api/items/${itemA.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/different project/i);
  });

  it('an attached child inherits the parent workphase even when a different one is passed', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, workphaseId: inProgress.id, title: 'Child' });
    expect(child.workphaseId).toBe(todo.id);
  });

  it('an attached child of a parent with no workphase gets a null workphase', async () => {
    const project = await createProject();
    const parent = await createItem({ projectId: project.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.workphaseId).toBeNull();
  });

  it('a detached child keeps its explicitly passed workphase', async () => {
    const { project, todo, inProgress } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({
      projectId: project.id, parentId: parent.id, title: 'Child', isAttached: false, workphaseId: inProgress.id,
    });
    expect(child.workphaseId).toBe(inProgress.id);
    expect(child.isAttached).toBe(0);
  });

  it('creates a parentless item with isAttached true (the default) and respects its explicit workphaseId', async () => {
    const { project, todo } = await setupTwoPhases();
    const res = await request(app).post('/api/items').send({
      title: 'Solo Root', projectId: project.id, workphaseId: todo.id, isAttached: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(1);
    // No parent to override it — the given workphaseId is used as-is.
    expect(res.body.workphaseId).toBe(todo.id);
  });

  it('reparenting to null while attached leaves isAttached flagged, not cleared (finding #27 stored-state note)', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    expect(child.isAttached).toBe(1);

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(1); // flag stays set even though there's no parent to attach to
    expect(res.body.workphaseId).toBe(todo.id); // no resync attempted — nothing to snap to
  });
});

describe('deleting a referenced entity nulls the item FK (SET NULL, not blocked)', () => {
  it('deleting an item type leaves referencing items typeless', async () => {
    const project = await createProject();
    const type = (await request(app).post('/api/item-types').send({ name: 'Bug' })).body;
    const item = await createItem({ projectId: project.id, type: type.id });

    const del = await request(app).delete(`/api/item-types/${type.id}`);
    expect(del.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.type).toBeNull();
  });

  it('deleting an agent unassigns referencing items', async () => {
    const project = await createProject();
    const agent = (await request(app).post('/api/agents')
      .send({ name: 'Claude', claudeProjectId: 'p1', surface: 'code' })).body;
    const item = await createItem({ projectId: project.id, assigneeType: 'agent', agentId: agent.id });

    const del = await request(app).delete(`/api/agents/${agent.id}`);
    expect(del.status).toBe(204);

    const itemRes = await request(app).get(`/api/items/${item.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.agentId).toBeNull();
  });
});
