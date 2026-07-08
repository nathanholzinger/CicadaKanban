import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

const BASE = 'http://localhost:3002/api';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test('GET /api/workflow-templates returns "quick" and "flow" with correct workphases', async ({ request }) => {
  const res = await request.get(`${BASE}/workflow-templates`);
  expect(res.status()).toBe(200);
  const templates = await res.json();

  const quick = templates.find((t: { name: string }) => t.name === 'quick');
  expect(quick).toBeTruthy();
  expect(quick.workphases).toHaveLength(2);
  expect(quick.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'Done']);

  const flow = templates.find((t: { name: string }) => t.name === 'flow');
  expect(flow).toBeTruthy();
  expect(flow.workphases).toHaveLength(4);
  expect(flow.workphases.map((p: { name: string }) => p.name)).toEqual(['Todo', 'In Progress', 'Review', 'Done']);
});
