import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';

const API = 'http://localhost:3002/api';

test.beforeAll(() => {
  resetAndSeedDb();
});

test('seeded project appears in projectSidebar on load', async ({ page, projectSidebar }) => {
  await page.goto('/');
  await expect(projectSidebar.projectName('My First Project')).toBeVisible();
});

test('creates a top-level project via the projectSidebar', async ({ page, projectSidebar }) => {
  await page.goto('/');
  await projectSidebar.newProjectButton.click();
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  await page.getByPlaceholder('Project name').fill('Test Project Alpha');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(projectSidebar.projectName('Test Project Alpha')).toBeVisible();
});

test('creates a subproject nested under a parent', async ({ page, projectSidebar }) => {
  await page.goto('/');
  const row = projectSidebar.row('My First Project');
  await row.hover();
  await expect(row.getByTitle('Add subproject')).toBeVisible();
  await row.getByTitle('Add subproject').click();
  await expect(page.getByRole('heading', { name: 'New subproject' })).toBeVisible();
  await expect(page.getByText('Under My First Project')).toBeVisible();
  await page.getByPlaceholder('Subproject name').fill('Test Subproject Beta');
  await page.getByRole('button', { name: 'Create subproject' }).click();
  await expect(projectSidebar.projectName('Test Subproject Beta')).toBeVisible();
});

test('delete shows red deleting state then removes the project', async ({ page, projectSidebar, request }) => {
  await request.post(`${API}/projects`, { data: { name: 'To Be Deleted' } });
  await page.goto('/');

  await page.route('**/api/projects/*', async route => {
    if (route.request().method() === 'DELETE') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await route.continue();
  });

  const row = projectSidebar.row('To Be Deleted');
  await row.hover();
  await expect(row.getByTitle('Delete project')).toBeVisible();
  await row.getByTitle('Delete project').click();
  await row.getByRole('button', { name: 'Yes' }).click();

  await expect(page.getByText('Deleting…')).toBeVisible();
  await expect(projectSidebar.projectName('To Be Deleted')).not.toBeVisible();
});

test('created project persists after page refresh', async ({ page, projectSidebar }) => {
  await page.goto('/');
  await projectSidebar.newProjectButton.click();
  await page.getByPlaceholder('Project name').fill('Persisted Project');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(projectSidebar.projectName('Persisted Project')).toBeVisible();

  await page.reload();
  await expect(projectSidebar.projectName('Persisted Project')).toBeVisible();
});
