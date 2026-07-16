import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import {
  labels, itemLabels, attachments, notifications, chatThreads, chatMessages, boards, columns,
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

  it('returns 400 when parentId equals the project\'s own id', async () => {
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
});

describe('PATCH /api/projects/reorder', () => {
  it('returns 400 when projectOrders is not an array', async () => {
    const res = await request(app).patch('/api/projects/reorder').send({});
    expect(res.status).toBe(400);
  });

  it('atomically updates position and parentId for multiple projects', async () => {
    const a = await createProject();
    const b = await createProject();

    const res = await request(app).patch('/api/projects/reorder').send({
      projectOrders: [
        { id: a.id, parentId: null, position: 5 },
        { id: b.id, parentId: a.id, position: 1 },
      ],
    });
    expect(res.status).toBe(200);

    const updatedB = await request(app).get(`/api/projects/${b.id}`);
    expect(updatedB.body.parentId).toBe(a.id);
  });

  it('returns 400 when an entry\'s parentId equals its own id', async () => {
    const a = await createProject();
    const res = await request(app).patch('/api/projects/reorder').send({
      projectOrders: [{ id: a.id, parentId: a.id, position: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry\'s parentId is one of its own descendants', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });
    const res = await request(app).patch('/api/projects/reorder').send({
      projectOrders: [{ id: parent.id, parentId: child.id, position: 1 }],
    });
    expect(res.status).toBe(400);
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

    // Seed directly to exercise the label/attachment/notification/chat cascade
    // branches inside deleteProjectById that aren't reachable via a POST route.
    const label = { id: randomUUID(), workflowId: workflow.id, name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments).values({
      id: randomUUID(), itemId: item.id, type: 'local_file', label: 'notes.txt', createdAt: Date.now(),
    }).run();
    db.insert(notifications).values({
      id: randomUUID(), itemId: item.id, workflowId: workflow.id, message: 'hi', type: 'item_in_workphase', createdAt: Date.now(),
    }).run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages).values({
      id: randomUUID(), threadId: thread.id, role: 'user', content: 'hello', createdAt: Date.now(),
    }).run();

    const res = await request(app).delete(`/api/projects/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/projects/${parent.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/projects/${child.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/workflows/${workflow.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${item.id}`)).status).toBe(404);

    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(0);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(attachments).where(eq(attachments.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatThreads).where(eq(chatThreads.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id)).all()).toHaveLength(0);
    expect(db.select().from(boards).where(eq(boards.id, boardId)).all()).toHaveLength(0);
    expect(db.select().from(columns).where(eq(columns.id, column.id)).all()).toHaveLength(0);
  });
});
