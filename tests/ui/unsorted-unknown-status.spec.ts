import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { resetAndSeedDb } from '../helpers/db';
import { seedTemplatedWorkflow, pickWorkphases, seedItem } from '../helpers/seed';
import { article, column, itemPanel } from '../helpers/boardLocators';

// Unsorted's Unknown-status list reads the board's live items, so a write to one of its items shows at
// once, with no reload (wiki boards-columns-unsorted §10). An item with no workphase is one the seed
// leaves in Unknown status (wiki item-attachment §14).

test.describe('Unsorted: an item of unknown status, after a write to it', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  // A project whose one item has no workphase, opened on its board with that item's Sheet open.
  async function openLost(
    page: Page,
    request: APIRequestContext,
    projectSidebar: ProjectSidebarPage,
    projectName: string,
  ) {
    const { project } = await seedTemplatedWorkflow(request, projectName);
    await seedItem(request, { title: 'Lost Item', projectId: project.id });
    await projectSidebar.openBoard(projectName);

    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await expect(unsorted.getByText('Unknown status')).toBeVisible();
    await expect(unsorted.getByText('needs attention')).toBeVisible();
    await article(unsorted, 'Lost Item').click();
    await expect(itemPanel(page).getByRole('heading', { name: 'Lost Item' })).toBeVisible();
    return unsorted;
  }

  test('a rename shows on its Card at once', async ({ page, request, projectSidebar }) => {
    const unsorted = await openLost(page, request, projectSidebar, 'Unknown Rename Project');

    await itemPanel(page).getByRole('heading', { name: 'Lost Item' }).click();
    await itemPanel(page).getByRole('textbox').fill('Found Item');
    await itemPanel(page).getByRole('textbox').press('Enter');

    await expect(article(unsorted, 'Found Item')).toBeVisible();
    await expect(article(unsorted, 'Lost Item')).toHaveCount(0);
  });

  test('a delete takes its Card away at once, and the bucket with it', async ({ page, request, projectSidebar }) => {
    const unsorted = await openLost(page, request, projectSidebar, 'Unknown Delete Project');

    await itemPanel(page).getByRole('button', { name: 'Delete item' }).click();
    await itemPanel(page).getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('article', { name: 'Lost Item', exact: true })).toHaveCount(0);
    await expect(unsorted).toHaveCount(0);
  });

  test('a status, given by a parent in a column through its Sheet, takes it out of Unsorted at once', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const projectName = 'Unknown Reassign Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, projectName);
    const [todo] = pickWorkphases(workflow, 'Todo');
    await seedItem(request, { title: 'Todo Parent', projectId: project.id, workphaseId: todo.id });
    await seedItem(request, { title: 'Lost Item', projectId: project.id });
    await projectSidebar.openBoard(projectName);

    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await article(unsorted, 'Lost Item').click();
    await itemPanel(page).getByLabel('Parent item').selectOption({ label: 'Todo Parent' });

    // It takes its parent's workphase and nests in the parent's Card, and Unsorted has nothing left.
    await expect(unsorted).toHaveCount(0);
    await expect(column(page, 'Todo').getByRole('article', { name: 'Todo Parent', exact: true })).toContainText(
      'Lost Item',
    );
  });
});
