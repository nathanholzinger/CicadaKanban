import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { API } from '../helpers/api';

test.beforeAll(async () => {
  await resetAndSeedDb();
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('sidebar shows no projects in zero state', async ({ projectSidebar }) => {
  await expect(projectSidebar.locator.getByText('No projects yet.')).toBeVisible();
});

test('project created via api appears in sidebar after refresh', async ({ page, projectSidebar, request }) => {
  await request.post(`${API}/projects`, { data: { name: 'My First Project' } });
  await page.reload();
  await expect(projectSidebar.projectName('My First Project')).toBeVisible();
});

test('creates a top-level project via the sidebar', async ({ page, projectSidebar }) => {
  await projectSidebar.newProjectButton.click();
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  await page.getByPlaceholder('Project name').fill('Test Project Alpha');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(projectSidebar.projectName('Test Project Alpha')).toBeVisible();
});

test('creates a subproject nested under a parent', async ({ page, projectSidebar }) => {
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
  await page.reload();

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

  await expect(projectSidebar.locator.getByText('Deleting…')).toBeVisible();
  await expect(projectSidebar.projectName('To Be Deleted')).not.toBeVisible();
});

test('collapses and expands subprojects via the chevron', async ({ page, projectSidebar, request }) => {
  const parent = await request.post(`${API}/projects`, { data: { name: 'Collapsible Parent' } });
  const { id: parentId } = await parent.json();
  await request.post(`${API}/projects`, { data: { name: 'Hidden Child', parentId } });
  await page.reload();

  // Child is visible by default (expanded)
  await expect(projectSidebar.projectName('Hidden Child')).toBeVisible();

  // Collapse — child disappears
  await projectSidebar.toggle('Collapsible Parent');
  await expect(projectSidebar.projectName('Hidden Child')).not.toBeVisible();

  // Expand — child reappears
  await projectSidebar.toggle('Collapsible Parent');
  await expect(projectSidebar.projectName('Hidden Child')).toBeVisible();
});

test('created project persists after page refresh', async ({ page, projectSidebar }) => {
  await projectSidebar.newProjectButton.click();
  await page.getByPlaceholder('Project name').fill('Persisted Project');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(projectSidebar.projectName('Persisted Project')).toBeVisible();

  await page.reload();
  await expect(projectSidebar.projectName('Persisted Project')).toBeVisible();
});
