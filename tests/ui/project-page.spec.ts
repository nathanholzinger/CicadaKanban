import { expect, test } from '../fixtures';

const API = 'http://localhost:3002/api';

let parentId: string;
let childId: string;

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/test/reset`);

  const parent = await (await request.post(`${API}/projects`, {
    data: { name: 'Parent Project', description: 'A top-level project' },
  })).json();
  parentId = parent.id;

  const child = await (await request.post(`${API}/projects`, {
    data: { name: 'Child Project', parentId: parent.id },
  })).json();
  childId = child.id;

  await request.post(`${API}/projects`, {
    data: { name: 'Grandchild Project', parentId: child.id },
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clicking a project shows its detail page', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');

  await expect(page.getByRole('heading', { level: 1, name: 'Parent Project' })).toBeVisible();
  await expect(page.getByText('A top-level project')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Subprojects' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Child Project' })).toBeVisible();
});

test('clicking a subproject in the list navigates to it', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');
  await page.getByRole('button', { name: 'Child Project' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Child Project' })).toBeVisible();
});

test('breadcrumb shows the full ancestor chain and breadcrumb is clickable', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Grandchild Project');
  await expect(page.locator('nav').getByRole('button', { name: 'Parent Project' })).toBeVisible();
  await expect(page.locator('nav').getByRole('button', { name: 'Child Project' })).toBeVisible();
  await page.locator('nav').getByRole('button', { name: 'Parent Project' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Parent Project' })).toBeVisible();
});

test('selected project persists after page refresh', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Parent Project' })).toBeVisible();
});

test('deleting the selected project returns to the placeholder', async ({ page, projectSidebar, request }) => {
  await request.post(`${API}/projects`, { data: { name: 'Doomed Project' } });
  await projectSidebar.select('Doomed Project');
  await expect(page.getByRole('heading', { level: 1, name: 'Doomed Project' })).toBeVisible();

  const row = projectSidebar.row('Doomed Project');
  await row.hover();
  await expect(row.getByTitle('Delete project')).toBeVisible();
  await row.getByTitle('Delete project').click();
  await row.getByRole('button', { name: 'Yes' }).click();

  await expect(page.getByText('Select a project to get started.')).toBeVisible();
});
