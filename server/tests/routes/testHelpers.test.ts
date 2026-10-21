import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items, projects } from '../../src/db/schema.js';
import testHelpers from '../../src/routes/testHelpers.js';
import { createProject, createItem } from '../fixtures.js';

// The setup routes are mounted only when ENABLE_TEST_ROUTES is set, which Playwright's
// server sets and this suite doesn't, so they get an app of their own here.
const testApp = express().use(express.json()).use('/api/test', testHelpers);

const patch = (path: string, body: Record<string, unknown>) => request(testApp).patch(`/api/test${path}`).send(body);
const projectRow = (id: string) => db.select().from(projects).where(eq(projects.id, id)).get()!;

describe('the test routes that write one column', () => {
  it('write the value to the row they name, and answer ok', async () => {
    const project = await createProject();
    const parent = await createProject({ name: 'Parent' });
    const item = await createItem({ projectId: project.id });

    const results = [
      await patch(`/items/${item.id}/position`, { position: 7.5 }),
      await patch(`/projects/${project.id}/position`, { position: 3 }),
      await patch(`/projects/${project.id}/created-at`, { createdAt: 1234 }),
      await patch(`/projects/${project.id}/parent`, { parentId: parent.id }),
    ];
    for (const res of results) {
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    }

    expect(db.select().from(items).where(eq(items.id, item.id)).get()!.position).toBe(7.5);
    expect(projectRow(project.id)).toMatchObject({ position: 3, createdAt: 1234, parentId: parent.id });
  });

  it('take null for a project position and parent', async () => {
    const parent = await createProject({ name: 'Parent' });
    const project = await createProject({ name: 'Child', parentId: parent.id });

    expect((await patch(`/projects/${project.id}/position`, { position: null })).status).toBe(200);
    expect((await patch(`/projects/${project.id}/parent`, { parentId: null })).status).toBe(200);
    expect(projectRow(project.id)).toMatchObject({ position: null, parentId: null });
  });

  it('answer 404, naming what is missing, for a row that does not exist', async () => {
    const results = [
      [await patch('/items/no-such-item/position', { position: 1 }), 'Item not found'],
      [await patch('/projects/no-such-project/position', { position: 1 }), 'Project not found'],
      [await patch('/projects/no-such-project/created-at', { createdAt: 1 }), 'Project not found'],
      [await patch('/projects/no-such-project/parent', { parentId: null }), 'Project not found'],
    ] as const;
    for (const [res, error] of results) {
      expect(res.status, error).toBe(404);
      expect(res.body, error).toEqual({ error });
    }
  });

  it('answer 400 for a value the column does not take, and write nothing', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const before = projectRow(project.id);

    const results = [
      await patch(`/items/${item.id}/position`, { position: 'high' }),
      await patch(`/items/${item.id}/position`, { position: null }),
      await patch(`/projects/${project.id}/position`, { position: 'high' }),
      await patch(`/projects/${project.id}/created-at`, { createdAt: null }),
      await patch(`/projects/${project.id}/parent`, { parentId: 5 }),
    ];
    for (const res of results) expect(res.status).toBe(400);
    expect(projectRow(project.id)).toEqual(before);
    expect(db.select().from(items).where(eq(items.id, item.id)).get()!.position).toBe(item.position);
  });
});
