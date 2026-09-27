import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

async function createItemType(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/item-types')
    .send({ name: 'Bug', color: '#ff0000', ...overrides });
  return res.body;
}

describe('POST /api/item-types', () => {
  it('returns 400 when name is missing or blank', async () => {
    const missing = await request(app).post('/api/item-types').send({});
    expect(missing.status).toBe(400);

    const blank = await request(app).post('/api/item-types').send({ name: '   ' });
    expect(blank.status).toBe(400);
  });

  it('creates an item type with a trimmed name', async () => {
    const res = await request(app).post('/api/item-types').send({ name: '  Feature  ', color: '#00ff00' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Feature');
    expect(res.body.color).toBe('#00ff00');
  });
});

describe('PUT /api/item-types/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/item-types/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('updates name (trimmed) and color', async () => {
    const type = await createItemType();
    const res = await request(app).put(`/api/item-types/${type.id}`).send({ name: '  Renamed  ', color: '#0000ff' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.color).toBe('#0000ff');
  });

  // Regression coverage for audit Finding #18: `name.trim()` was called
  // unguarded, so a non-string/null name threw a TypeError -> 500 instead
  // of a 400, and an empty/whitespace name was silently accepted here even
  // though POST rejects one.
  it('returns 400 instead of a 500 when name is null', async () => {
    const type = await createItemType();
    const res = await request(app).put(`/api/item-types/${type.id}`).send({ name: null });
    expect(res.status).toBe(400);
  });

  it('returns 400 instead of a 500 when name is not a string', async () => {
    const type = await createItemType();
    const res = await request(app).put(`/api/item-types/${type.id}`).send({ name: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 and leaves the name unchanged when name is set to an empty/whitespace string', async () => {
    const type = await createItemType({ name: 'Keep Me' });
    const res = await request(app).put(`/api/item-types/${type.id}`).send({ name: '   ' });
    expect(res.status).toBe(400);

    const list = await request(app).get('/api/item-types');
    expect(list.body.find((t: { id: string }) => t.id === type.id).name).toBe('Keep Me');
  });

  it('leaves fields unchanged and returns 200 when no updatable fields are given', async () => {
    const type = await createItemType();
    const res = await request(app).put(`/api/item-types/${type.id}`).send({});
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(type.name);
  });
});

describe('DELETE /api/item-types/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/item-types/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes an item type', async () => {
    const type = await createItemType();
    const res = await request(app).delete(`/api/item-types/${type.id}`);
    expect(res.status).toBe(204);

    const list = await request(app).get('/api/item-types');
    expect(list.body.find((t: { id: string }) => t.id === type.id)).toBeUndefined();
  });
});
