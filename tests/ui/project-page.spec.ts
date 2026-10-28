import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { seedProject } from '../helpers/seed';

test.beforeAll(async ({ request }) => {
  await resetAndSeedDb();

  const parent = await seedProject(request, { name: 'Parent Project', description: 'A top-level project' });
  const child = await seedProject(request, { name: 'Child Project', parentId: parent.id });
  await seedProject(request, { name: 'Grandchild Project', parentId: child.id });
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clicking a project shows its detail page', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');

  await expect(page.getByRole('heading', { level: 1, name: 'Parent Project' })).toBeVisible();
  await expect(page.getByText('A top-level project')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Subprojects' })).toBeVisible();
  await expect(page.locator('main').getByRole('button', { name: 'Child Project', exact: true })).toBeVisible();
});

test('clicking a subproject in the list navigates to it', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');
  await page.locator('main').getByRole('button', { name: 'Child Project', exact: true }).click();
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
  await seedProject(request, { name: 'Doomed Project' });
  await page.reload();
  await projectSidebar.select('Doomed Project');
  await expect(page.getByRole('heading', { level: 1, name: 'Doomed Project' })).toBeVisible();

  await projectSidebar.deleteProject('Doomed Project');

  await expect(page.getByText('Select a project to get started.')).toBeVisible();
});

// The sidebar's own delete affordance (SortableProjectRow, exercised above)
// is a separate variant — this covers ProjectPage's own main-content
// self-delete trigger.
test('a project can be deleted from its own page', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Self Delete Me' });
  await page.reload();
  await projectSidebar.select('Self Delete Me');
  await expect(page.getByRole('heading', { level: 1, name: 'Self Delete Me' })).toBeVisible();

  await page.getByRole('heading', { level: 1, name: 'Self Delete Me' }).hover();
  await page.locator('main').getByTitle('Delete project').click();
  await expect(page.getByText('Delete this project?')).toBeVisible();
  await page.locator('main').getByRole('button', { name: 'Yes' }).click();

  await expect(page.getByText('Select a project to get started.')).toBeVisible();
});

// Triggering the self-delete prompt on one project (without confirming or
// cancelling) and then navigating to another must not leave the prompt
// showing under the new project's heading: a project switch remounts
// ConfirmDeleteInline, resetting it.
test('starting a project self-delete and navigating away does not leak the confirm prompt to a different project', async ({
  page,
  projectSidebar,
  request,
}) => {
  await seedProject(request, { name: 'Leak Source' });
  await seedProject(request, { name: 'Leak Target' });
  await page.reload();

  await projectSidebar.select('Leak Source');
  await page.getByRole('heading', { level: 1, name: 'Leak Source' }).hover();
  await page.locator('main').getByTitle('Delete project').click();
  await expect(page.getByText('Delete this project?')).toBeVisible();

  await projectSidebar.select('Leak Target');

  await expect(page.getByRole('heading', { level: 1, name: 'Leak Target' })).toBeVisible();
  await expect(page.getByText('Delete this project?')).not.toBeVisible();
});

test('project name can be edited inline', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Rename Me' });
  await page.reload();
  await projectSidebar.select('Rename Me');

  await page.getByRole('heading', { level: 1, name: 'Rename Me' }).click();
  await page.locator('main input').fill('Renamed Project');
  await page.locator('main input').press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Renamed Project' })).toBeVisible();
  await expect(projectSidebar.projectName('Renamed Project')).toBeVisible();
});

test('project name cannot be saved as empty', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Keep My Name' });
  await page.reload();
  await projectSidebar.select('Keep My Name');

  await page.getByRole('heading', { level: 1, name: 'Keep My Name' }).click();
  await page.locator('main input').fill('');
  await page.locator('main input').press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Keep My Name' })).toBeVisible();
});

test('description can be added when previously empty', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'No Description Yet' });
  await page.reload();
  await projectSidebar.select('No Description Yet');

  await page.getByRole('button', { name: 'Add description' }).click();
  await page.locator('main textarea').fill('Brand new description');
  await page.locator('main textarea').blur();

  await expect(page.getByText('Brand new description')).toBeVisible();
});

test('description can be updated', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Update Description', description: 'Original description' });
  await page.reload();
  await projectSidebar.select('Update Description');

  await page.getByText('Original description').click();
  await page.locator('main textarea').fill('Updated description');
  await page.locator('main textarea').blur();

  await expect(page.getByText('Updated description')).toBeVisible();
  await expect(page.getByText('Original description')).not.toBeVisible();
});

test('description can be cleared', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Clear Description', description: 'Remove me' });
  await page.reload();
  await projectSidebar.select('Clear Description');

  await page.getByText('Remove me').click();
  await page.locator('main textarea').fill('');
  await page.locator('main textarea').blur();

  await expect(page.getByRole('button', { name: 'Add description' })).toBeVisible();
  await expect(page.getByText('Remove me')).not.toBeVisible();
});

test('a subproject can be added from the details page', async ({ page, projectSidebar }) => {
  await projectSidebar.select('Parent Project');

  await page.locator('main').getByTitle('Add subproject').click();
  await expect(page.getByRole('heading', { name: 'New subproject' })).toBeVisible();
  await page.getByPlaceholder('Subproject name').fill('Details Page Child');
  await page.getByRole('button', { name: 'Create subproject' }).click();

  await expect(page.locator('main').getByRole('button', { name: 'Details Page Child' })).toBeVisible();
  await expect(projectSidebar.projectName('Details Page Child')).toBeVisible();
});

test('a subproject can be deleted from the details page', async ({ page, projectSidebar, request }) => {
  const { id: parentId } = await seedProject(request, { name: 'Delete Test Parent' });
  await seedProject(request, { name: 'Delete Test Child', parentId });
  await page.reload();
  await projectSidebar.select('Delete Test Parent');

  const childRow = page.locator('main li').filter({ hasText: 'Delete Test Child' });
  await childRow.hover();
  await childRow.getByTitle('Delete subproject').click();
  await childRow.getByRole('button', { name: 'Yes' }).click();

  await expect(page.locator('main').getByRole('button', { name: 'Delete Test Child' })).not.toBeVisible();
});

// ── Reparenting ────────────────────────────────────────────────────────────────

test('parent dropdown shows Root, excludes self and all descendants', async ({ page, projectSidebar, request }) => {
  const p = await seedProject(request, { name: 'Picker Parent' });
  await seedProject(request, { name: 'Picker Child', parentId: p.id });
  await page.reload();
  await projectSidebar.select('Picker Parent');

  const texts = await page.locator('main select option').allTextContents();

  expect(texts).toContain('Root');
  expect(texts.some(t => t.includes('Picker Parent'))).toBe(false);
  expect(texts.some(t => t.includes('Picker Child'))).toBe(false);
});

test('a subproject can be reparented to root via the parent dropdown', async ({ page, projectSidebar, request }) => {
  const parent = await seedProject(request, { name: 'Repa Parent' });
  await seedProject(request, { name: 'Repa Child', parentId: parent.id });
  await page.reload();
  await projectSidebar.select('Repa Child');

  await expect(page.locator('nav').getByRole('button', { name: 'Repa Parent' })).toBeVisible();

  await page.locator('main select').selectOption('');

  await expect(page.locator('nav').getByRole('button', { name: 'Repa Parent' })).not.toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Repa Child' })).toBeVisible();
});

test('a root project can be reparented to become a subproject', async ({ page, projectSidebar, request }) => {
  await seedProject(request, { name: 'Adopt Me' });
  await seedProject(request, { name: 'Adopt Parent' });
  await page.reload();
  await projectSidebar.select('Adopt Me');

  await expect(page.locator('nav')).not.toBeVisible();

  await page.locator('main select').selectOption({ label: 'Adopt Parent' });

  await expect(page.locator('nav').getByRole('button', { name: 'Adopt Parent' })).toBeVisible();
});
