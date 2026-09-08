import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import {
  labels,
  itemLabels,
  attachments,
  notifications,
  chatThreads,
  chatMessages,
  boards,
  columns,
} from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { createProject, createWorkflow, createWorkphase, createItem, createColumn } from '../fixtures.js';

describe('GET /api/projects', () => {
  it('returns an empty list when no projects exist', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns projects ordered by position then createdAt', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B' });
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.map((p: { id: string }) => p.id)).toEqual([a.id, b.id]);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a project with its nested workflows array', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const res = await request(app).get(`/api/projects/${project.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(res.body.workflows).toHaveLength(1);
    expect(res.body.workflows[0].id).toBe(workflow.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/projects/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/projects', () => {
  it('creates a root project with parentId null and description null by default', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Root' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Root');
    expect(res.body.parentId).toBeNull();
    expect(res.body.description).toBeNull();
  });

  it('creates a child project when parentId is given', async () => {
    const parent = await createProject();
    const res = await request(app).post('/api/projects').send({ name: 'Child', parentId: parent.id });
    expect(res.status).toBe(201);
    expect(res.body.parentId).toBe(parent.id);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates only the provided fields', async () => {
    const project = await createProject({ name: 'Original', description: 'Original desc' });
    const res = await request(app).put(`/api/projects/${project.id}`).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.description).toBe('Original desc');
  });

  it('clears parentId to null only when explicitly included in the body', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });

    const unchanged = await request(app).put(`/api/projects/${child.id}`).send({ name: 'Still child' });
    expect(unchanged.body.parentId).toBe(parent.id);

    const cleared = await request(app).put(`/api/projects/${child.id}`).send({ parentId: null });
    expect(cleared.body.parentId).toBeNull();
  });

  it('reparents to a valid new parent', async () => {
    const parentA = await createProject();
    const parentB = await createProject();
    const child = await createProject({ parentId: parentA.id });

    const res = await request(app).put(`/api/projects/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(parentB.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/projects/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it("returns 400 when parentId equals the project's own id", async () => {
    const project = await createProject();
    const res = await request(app).put(`/api/projects/${project.id}`).send({ parentId: project.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when reparenting would create a cycle', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });
    const res = await request(app).put(`/api/projects/${parent.id}`).send({ parentId: child.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when parentId does not reference an existing project', async () => {
    const project = await createProject();
    const res = await request(app).put(`/api/projects/${project.id}`).send({ parentId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('ignores a supplied position field entirely — positions only change via PATCH /:id/move', async () => {
    const project = await createProject();
    const before = await request(app).get(`/api/projects/${project.id}`);
    const res = await request(app).put(`/api/projects/${project.id}`).send({ position: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(before.body.position);
  });
});

describe('PATCH /api/projects/:id/move', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).patch('/api/projects/does-not-exist/move').send({});
    expect(res.status).toBe(404);
  });

  it('with no body fields, appends the project past the true current last sibling', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B' });
    const c = await createProject({ name: 'C' });

    const res = await request(app).patch(`/api/projects/${a.id}/move`).send({});
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();

    const list = await request(app).get('/api/projects');
    expect(list.body.map((p: { id: string }) => p.id)).toEqual([b.id, c.id, a.id]);
  });

  it("reparents and appends at the end of the new parent's children when no anchor is given", async () => {
    const parent = await createProject();
    const existingChild = await createProject({ parentId: parent.id });
    const mover = await createProject();

    const res = await request(app).patch(`/api/projects/${mover.id}/move`).send({ parentId: parent.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(parent.id);

    const list = await request(app).get('/api/projects');
    const childIds = list.body
      .filter((p: { parentId: string | null }) => p.parentId === parent.id)
      .map((p: { id: string }) => p.id);
    expect(childIds).toEqual([existingChild.id, mover.id]);
  });

  it('reorders within the same parent via prevId', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B' });
    const c = await createProject({ name: 'C' });

    // Move C to sit immediately after A (A, C, B) — A becomes C's predecessor.
    const res = await request(app).patch(`/api/projects/${c.id}/move`).send({ prevId: a.id });
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/projects');
    expect(list.body.map((p: { id: string }) => p.id)).toEqual([a.id, c.id, b.id]);
  });

  it('reorders within the same parent via nextId', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B' });
    const c = await createProject({ name: 'C' });

    // Move A to sit immediately before C (B, A, C) — C becomes A's successor.
    const res = await request(app).patch(`/api/projects/${a.id}/move`).send({ nextId: c.id });
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/projects');
    expect(list.body.map((p: { id: string }) => p.id)).toEqual([b.id, a.id, c.id]);
  });

  it('never treats an omitted anchor as an empty scope — appends past real existing children the caller did not mention (collapsed-parent guess bug)', async () => {
    const parent = await createProject();
    const existingChild1 = await createProject({ name: 'Existing 1', parentId: parent.id });
    const existingChild2 = await createProject({ name: 'Existing 2', parentId: parent.id });
    const mover = await createProject({ name: 'Mover' });

    // Explicit nulls — simulates a client (e.g. a sidebar with this parent
    // collapsed) that has no idea real children exist under this parent.
    const res = await request(app)
      .patch(`/api/projects/${mover.id}/move`)
      .send({ parentId: parent.id, prevId: null, nextId: null });
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/projects');
    const childIds = list.body
      .filter((p: { parentId: string | null }) => p.parentId === parent.id)
      .map((p: { id: string }) => p.id);
    expect(childIds).toEqual([existingChild1.id, existingChild2.id, mover.id]);
  });

  it('rejects a prevId that exists but is not actually a sibling in the resulting scope', async () => {
    const parentA = await createProject();
    const parentB = await createProject();
    const siblingUnderA = await createProject({ parentId: parentA.id });
    const mover = await createProject({ parentId: parentB.id });
    const before = await request(app).get(`/api/projects/${mover.id}`);

    // mover is under parentB; siblingUnderA is under parentA — not a valid anchor.
    const res = await request(app).patch(`/api/projects/${mover.id}/move`).send({ prevId: siblingUnderA.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();

    const after = await request(app).get(`/api/projects/${mover.id}`);
    expect(after.body.position).toBe(before.body.position);
    expect(after.body.parentId).toBe(before.body.parentId);
  });

  it('returns 400 when prevId does not reference an existing project', async () => {
    const project = await createProject();
    const res = await request(app).patch(`/api/projects/${project.id}/move`).send({ prevId: 'does-not-exist' });
    expect(res.status).toBe(400);
  });

  it("returns 400 when parentId equals the project's own id", async () => {
    const project = await createProject();
    const res = await request(app).patch(`/api/projects/${project.id}/move`).send({ parentId: project.id });
    expect(res.status).toBe(400);
  });

  it("returns 400 when parentId is one of the project's own descendants", async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });
    const res = await request(app).patch(`/api/projects/${parent.id}/move`).send({ parentId: child.id });
    expect(res.status).toBe(400);
  });

  it('returns 400 when parentId does not reference an existing project', async () => {
    const project = await createProject();
    const res = await request(app).patch(`/api/projects/${project.id}/move`).send({ parentId: 'does-not-exist' });
    expect(res.status).toBe(400);
  });

  it('returns the full updated project, not a bare success flag', async () => {
    const project = await createProject();
    const res = await request(app).patch(`/api/projects/${project.id}/move`).send({});
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(typeof res.body.position).toBe('number');
    expect(res.body).toHaveProperty('parentId');
    expect(res.body).toHaveProperty('updatedAt');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/projects/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes a leaf project with no workflow', async () => {
    const project = await createProject();
    const res = await request(app).delete(`/api/projects/${project.id}`);
    expect(res.status).toBe(204);
    const check = await request(app).get(`/api/projects/${project.id}`);
    expect(check.status).toBe(404);
  });

  it('cascades through a nested project tree, workflow, workphase, items, and related records', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });
    const workflow = await createWorkflow(parent.id);
    const workphase = await createWorkphase(workflow.id);
    const item = await createItem({ projectId: parent.id, workphaseId: workphase.id });
    await request(app).post(`/api/items/${item.id}/comments`).send({ content: 'a comment' });

    const boardsRes = await request(app).get(`/api/boards?workflowId=${workflow.id}`);
    const boardId = boardsRes.body[0].id;
    const column = await createColumn(boardId, workphase.id, workphase.id);

    // Seed directly (these tables have no POST route) to exercise the ON DELETE
    // CASCADE that removes an item's dependent rows when the project's items go.
    const label = { id: randomUUID(), name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments)
      .values({
        id: randomUUID(),
        itemId: item.id,
        type: 'local_file',
        label: 'notes.txt',
        createdAt: Date.now(),
      })
      .run();
    db.insert(notifications)
      .values({
        id: randomUUID(),
        itemId: item.id,
        workflowId: workflow.id,
        message: 'hi',
        type: 'item_in_workphase',
        createdAt: Date.now(),
      })
      .run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages)
      .values({
        id: randomUUID(),
        threadId: thread.id,
        role: 'user',
        content: 'hello',
        createdAt: Date.now(),
      })
      .run();

    const res = await request(app).delete(`/api/projects/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/projects/${parent.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/projects/${child.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/workflows/${workflow.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${item.id}`)).status).toBe(404);

    // Labels are global — they survive project deletion; only the item's own
    // itemLabels join rows are removed.
    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(1);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(attachments).where(eq(attachments.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatThreads).where(eq(chatThreads.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id)).all()).toHaveLength(0);
    expect(db.select().from(boards).where(eq(boards.id, boardId)).all()).toHaveLength(0);
    expect(db.select().from(columns).where(eq(columns.id, column.id)).all()).toHaveLength(0);
  });

  // Regression coverage for audit Finding #14: an item merely sitting in a
  // to-be-deleted project's workphase — because it belongs to another
  // project that was reparented away, or was given its own workflow, after
  // filing items into the old parent's workphases — must survive with its
  // workphaseId nulled, not be deleted alongside the project's own items.
  it("does not delete another project's item that is merely sitting in this project's workphase", async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const workphase = await createWorkphase(workflow.id);

    // A second, unrelated project whose item still points at `project`'s
    // workphase (simulating an item left behind after a reparent/re-workflow).
    const otherProject = await createProject();
    const strandedItem = await createItem({ projectId: otherProject.id, workphaseId: workphase.id });

    const res = await request(app).delete(`/api/projects/${project.id}`);
    expect(res.status).toBe(204);

    // The other project and its item both survive; the item's workphaseId is
    // nulled by ON DELETE SET NULL (surfaces as "Unknown status").
    expect((await request(app).get(`/api/projects/${otherProject.id}`)).status).toBe(200);
    const itemRes = await request(app).get(`/api/items/${strandedItem.id}`);
    expect(itemRes.status).toBe(200);
    expect(itemRes.body.workphaseId).toBeNull();
  });
});
