import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createProject, createItem } from '../fixtures.js';

async function createLabel(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/labels')
    .send({ name: 'Bug', color: '#ff0000', ...overrides });
  return res.body;
}

describe('POST /api/labels/item/:itemId', () => {
  it('returns 400 when labelId is missing', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).post(`/api/labels/item/${item.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent item', async () => {
    const label = await createLabel();
    const res = await request(app).post('/api/labels/item/does-not-exist').send({ labelId: label.id });
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent label', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const res = await request(app).post(`/api/labels/item/${item.id}`).send({ labelId: 'does-not-exist' });
    expect(res.status).toBe(404);
  });

  it('assigns a label to an item', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const label = await createLabel();
    const res = await request(app).post(`/api/labels/item/${item.id}`).send({ labelId: label.id });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });

    const listed = await request(app).get(`/api/labels/item/${item.id}`);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(label.id);
  });

  it('treats re-assigning the same label as idempotent success, not a duplicate-key error', async () => {
    const project = await createProject();
    const item = await createItem({ projectId: project.id });
    const label = await createLabel();
    await request(app).post(`/api/labels/item/${item.id}`).send({ labelId: label.id });
    const res = await request(app).post(`/api/labels/item/${item.id}`).send({ labelId: label.id });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });
  });
});
