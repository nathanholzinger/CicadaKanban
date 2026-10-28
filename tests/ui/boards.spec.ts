import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { pickWorkphases, seedItem, seedTemplatedWorkflow } from '../helpers/seed';

// ─────────────────────────────────────────────────────────────────
// Core board interaction
// ─────────────────────────────────────────────────────────────────

test.describe('board basics', () => {
  let projectId: string;
  let todoWorkphaseId: string;

  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const { project, workflow } = await seedTemplatedWorkflow(request, 'My First Project');
    projectId = project.id;
    const [todo] = pickWorkphases(workflow, 'Todo');
    todoWorkphaseId = todo.id;
  });

  test.beforeEach(async ({ projectSidebar }) => {
    await projectSidebar.openBoard('My First Project');
  });

  test('loads the board with workflow workphases', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });

  test('adds a workphase to a workflow — lands in Unsorted, not its own column', async ({ page }) => {
    await page.getByRole('button', { name: 'Manage workphases' }).click();
    await page.getByRole('button', { name: '+ Add workphase' }).click();
    await page.getByPlaceholder('Workphase name...').fill('Sprint 1');
    await page.getByRole('button', { name: 'Add workphase' }).click();

    // No column is auto-created for it — it's uncovered until a board admin
    // extends a column's range (or adds a new one) to include it.
    await expect(page.getByRole('group', { name: 'Sprint 1' })).not.toBeVisible();
    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await expect(unsorted).toBeVisible();
    await expect(unsorted.getByText('needs attention')).toBeVisible();
    await expect(unsorted.getByText('Sprint 1')).toBeVisible();
  });

  test('typeless item created via API renders in the Todo workphase', async ({ page, request, projectSidebar }) => {
    await seedItem(request, { title: 'Typeless API item', projectId, workphaseId: todoWorkphaseId });

    await projectSidebar.openBoard('My First Project');

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Typeless API item' }),
    ).toBeVisible();
  });

  test('adds an item to a workphase via the inline form', async ({ page }) => {
    const todoColumn = page.getByRole('group', { name: 'Todo' });
    await todoColumn.getByRole('button', { name: '+ Add item' }).click();
    await todoColumn.getByPlaceholder('Item title...').fill('My first E2E task');
    await todoColumn.getByRole('button', { name: 'Add' }).click();
    await expect(todoColumn.getByText('My first E2E task')).toBeVisible();
  });
});
