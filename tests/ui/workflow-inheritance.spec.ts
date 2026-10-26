import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { moveItem, pickWorkphases, seedItem, seedProjects, seedWorkflow } from '../helpers/seed';
import { article, column } from '../helpers/boardLocators';

// How a project's board relates to its workflow: a project with none of its own
// inherits its nearest ancestor's, read-only, and one with its own keeps its
// items off the parent's board. The rule: wiki project-tree §10.

// ─────────────────────────────────────────────────────────────────
// Items visibility: parent board vs child's inherited board
// ─────────────────────────────────────────────────────────────────

test.describe('items visibility with inherited workflow', () => {
  let childItemId: string;
  let inProgressWorkphaseId: string;

  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const ids = await seedProjects(request, [
      ['Parent Project', null],
      ['Child Project', 'Parent Project'],
    ]);
    const workflow = await seedWorkflow(request, ids['Parent Project'], 'Parent Project', 'flow');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    inProgressWorkphaseId = inProgress.id;

    // Seed a parent-owned item and a child-owned item into the parent's workflow
    await seedItem(request, { title: 'Parent-owned item', projectId: ids['Parent Project'], workphaseId: todo.id });
    const childItem = await seedItem(request, {
      title: 'Child-owned item',
      projectId: ids['Child Project'],
      workphaseId: todo.id,
    });
    childItemId = childItem.id;
  });

  test('item created in parent project appears on the parent board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Parent Project');

    await expect(article(column(page, 'Todo'), 'Parent-owned item')).toBeVisible();
  });

  test('item created in parent project is NOT shown on the child inherited board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Child Project');

    await expect(article(column(page, 'Todo'), 'Parent-owned item')).not.toBeVisible();
  });

  test('item created in child project appears on the child inherited board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Child Project');

    await expect(article(column(page, 'Todo'), 'Child-owned item')).toBeVisible();
  });

  test('item created in child project also appears on the parent board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Parent Project');

    await expect(article(column(page, 'Todo'), 'Child-owned item')).toBeVisible();
  });

  test('moving an item via API is reflected on both boards', async ({ page, request, projectSidebar }) => {
    // Move it to In Progress via API
    await moveItem(request, childItemId, { workphaseId: inProgressWorkphaseId });

    // Verify on parent board
    await projectSidebar.openBoard('Parent Project');
    await expect(article(column(page, 'In Progress'), 'Child-owned item')).toBeVisible();

    // Verify on child board
    await projectSidebar.showBoard('Child Project');
    await expect(article(column(page, 'In Progress'), 'Child-owned item')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Inherited workflow is read-only
// ─────────────────────────────────────────────────────────────────

test.describe('inherited workflow is read-only', () => {
  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const ids = await seedProjects(request, [
      ['Owning Project', null],
      ['Inheriting Project', 'Owning Project'],
    ]);
    await seedWorkflow(request, ids['Owning Project'], 'Owning Project', 'flow');
  });

  test.beforeEach(async ({ projectSidebar }) => {
    await projectSidebar.openBoard('Inheriting Project');
  });

  // "Owning Project" appears twice: once in the breadcrumb <nav> and once in the banner.
  // The banner button always comes after the breadcrumb in DOM order, so .last() picks it.
  function inheritedBannerLink(page: Page) {
    return page.locator('main').getByRole('button', { name: 'Owning Project' }).last();
  }

  test('shows the "Inherited from" banner with a link to the owning project', async ({ page }) => {
    await expect(page.getByText('Inherited from')).toBeVisible();
    await expect(inheritedBannerLink(page)).toBeVisible();
  });

  test('board and workphase management controls are hidden in the inherited (read-only) view', async ({ page }) => {
    const todoColumn = column(page, 'Todo');
    await expect(todoColumn).toBeVisible();
    // Column edit/delete, board create/rename/delete, and workphase management
    // are all gated behind `readOnly` — none should be reachable here.
    await expect(todoColumn.locator('[title="Delete column"]')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage workphases' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '+ New board' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add column' })).not.toBeVisible();
  });

  test('clicking the banner link navigates to the owning project board', async ({ page, projectSidebar }) => {
    await inheritedBannerLink(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Owning Project' })).toBeVisible();
    // The owning project's board is editable — workphase management is reachable
    await projectSidebar.openBoardTab();
    await expect(page.getByRole('button', { name: 'Manage workphases' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Child with its own workflow: items are NOT visible on parent board
// ─────────────────────────────────────────────────────────────────

test.describe('child project with own workflow', () => {
  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const ids = await seedProjects(request, [
      ['Parent With Workflow', null],
      ['Child With Own Workflow', 'Parent With Workflow'],
    ]);
    await seedWorkflow(request, ids['Parent With Workflow'], 'Parent With Workflow', 'flow');
    const childWorkflow = await seedWorkflow(
      request,
      ids['Child With Own Workflow'],
      'Child With Own Workflow',
      'quick',
    );
    const [childTodo] = pickWorkphases(childWorkflow, 'Todo');

    // Create an item in the child's own workflow
    await seedItem(request, {
      title: 'Child-only item',
      projectId: ids['Child With Own Workflow'],
      workphaseId: childTodo.id,
    });
  });

  test('item in child own workflow is not visible on parent board', async ({ page, projectSidebar }) => {
    // On its own board first, so its absence from the parent's is not an item that never rendered.
    await projectSidebar.openBoard('Child With Own Workflow');
    await expect(article(column(page, 'Todo'), 'Child-only item')).toBeVisible();

    await projectSidebar.openBoard('Parent With Workflow');
    await expect(column(page, 'Todo')).toBeVisible();
    await expect(article(page, 'Child-only item')).not.toBeVisible();
  });
});
