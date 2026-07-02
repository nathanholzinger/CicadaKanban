import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';

test.beforeAll(() => {
  resetAndSeedDb();
});

// UI tests below require Story 2 (frontend update) — client still calls /api/boards
test.fixme('loads the app with the seeded default project and workflow', async ({ page }) => {
  await page.goto('/');
  // The seeded workflow columns should be present (flow template: Todo → Done)
  await expect(page.getByRole('heading', { name: 'Todo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
});

test.fixme('adds a column to a workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Add column' }).click();
  await page.getByPlaceholder('Column name...').fill('Sprint 1');
  await page.getByRole('button', { name: 'Add column' }).click();
  await expect(page.getByRole('heading', { name: 'Sprint 1' })).toBeVisible();
});

test.fixme('typeless item created via API renders in UI', async ({ page, request }) => {
  // Resolve the seeded project and its workflow's Todo column
  const projectsRes = await request.get('http://localhost:3002/api/projects');
  const projects = await projectsRes.json();
  const project = projects.find((p: { name: string }) => p.name === 'My First Project');

  const workflowsRes = await request.get(`http://localhost:3002/api/workflows?projectId=${project.id}`);
  const workflows = await workflowsRes.json();
  const workflow = workflows[0];

  const workflowRes = await request.get(`http://localhost:3002/api/workflows/${workflow.id}`);
  const workflowDetail = await workflowRes.json();
  const todoCol = workflowDetail.columns.find((c: { name: string }) => c.name === 'Todo');

  await request.post('http://localhost:3002/api/items', {
    data: { title: 'Typeless API item', projectId: project.id, columnId: todoCol.id },
  });

  await page.goto('/');
  await expect(
    page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Typeless API item' })
  ).toBeVisible();
});

test.fixme('adds an item to a column', async ({ page }) => {
  await page.goto('/');

  const todoColumn = page.getByRole('group', { name: 'Todo' });
  await todoColumn.getByRole('button', { name: '+ Add card' }).click();
  await todoColumn.getByPlaceholder('Card title...').fill('My first E2E task');
  await todoColumn.getByRole('button', { name: 'Add' }).click();

  await expect(todoColumn.getByText('My first E2E task')).toBeVisible();
});
