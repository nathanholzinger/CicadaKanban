import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

describe('GET /api/workflow-templates', () => {
  it('returns the seeded "quick" and "flow" templates, each with workphases', async () => {
    const res = await request(app).get('/api/workflow-templates');
    expect(res.status).toBe(200);
    const names = res.body.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(['flow', 'quick']);
    for (const template of res.body) {
      expect(Array.isArray(template.workphases)).toBe(true);
    }
  });

  it('returns "flow" workphases ordered by position with correct flags', async () => {
    const res = await request(app).get('/api/workflow-templates');
    const flow = res.body.find((t: { name: string }) => t.name === 'flow');
    expect(flow.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
    expect(flow.workphases.find((p: { name: string }) => p.name === 'Review').triggersNotification).toBe(1);
    expect(flow.workphases.find((p: { name: string }) => p.name === 'Done').isTerminal).toBe(1);
  });

  it('returns "quick" workphases ordered by position', async () => {
    const res = await request(app).get('/api/workflow-templates');
    const quick = res.body.find((t: { name: string }) => t.name === 'quick');
    expect(quick.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'Done']);
  });
});

describe('GET /api/workflow-templates/:id', () => {
  it('returns a single template with its workphases', async () => {
    const list = await request(app).get('/api/workflow-templates');
    const id = list.body[0].id;
    const res = await request(app).get(`/api/workflow-templates/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(Array.isArray(res.body.workphases)).toBe(true);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/workflow-templates/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
