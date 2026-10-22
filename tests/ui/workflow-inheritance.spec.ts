import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { API } from '../helpers/api';
import { moveItem } from '../helpers/seed';

// How a project's board relates to its workflow: a project with none of its own
// inherits its nearest ancestor's, read-only, and one with its own keeps its
// items off the parent's board. The rule: wiki project-tree §10.

// ─────────────────────────────────────────────────────────────────
// Items visibility: parent board vs child's inherited board
// ─────────────────────────────────────────────────────────────────

test.describe('items visibility with inherited workflow', () => {
  let parentId: string;
  let todoWorkphaseId: string;
  let inProgressWorkphaseId: string;

  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const parent = await (
      await request.post(`${API}/projects`, {
        data: { name: 'Parent Project' },
      })
    ).json();
    parentId = parent.id;

    const child = await (
      await request.post(`${API}/projects`, {
        data: { name: 'Child Project', parentId: parent.id },
      })
    ).json();

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    const workflow = await (
      await request.post(`${API}/workflows`, {
        data: { name: 'Parent Project', projectId: parent.id, templateId: flow.id },
      })
    ).json();

    const todo = workflow.workphases.find((p: { name: string }) => p.name === 'Todo');
    const inProgress = workflow.workphases.find((p: { name: string }) => p.name === 'In Progress');
    todoWorkphaseId = todo.id;
    inProgressWorkphaseId = inProgress.id;

    // Seed a parent-owned item and a child-owned item into the parent's workflow
    await request.post(`${API}/items`, {
      data: { title: 'Parent-owned item', projectId: parent.id, workphaseId: todoWorkphaseId },
    });
    await request.post(`${API}/items`, {
      data: { title: 'Child-owned item', projectId: child.id, workphaseId: todoWorkphaseId },
    });
  });

  test('item created in parent project appears on the parent board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Parent Project');

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Parent-owned item' }),
    ).toBeVisible();
  });

  test('item created in parent project is NOT shown on the child inherited board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Child Project');

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Parent-owned item' }),
    ).not.toBeVisible();
  });

  test('item created in child project appears on the child inherited board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Child Project');

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Child-owned item' }),
    ).toBeVisible();
  });

  test('item created in child project also appears on the parent board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Parent Project');

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Child-owned item' }),
    ).toBeVisible();
  });

  test('moving an item via API is reflected on both boards', async ({ page, request, projectSidebar }) => {
    // Find the child-owned item
    const workflowRes = await request.get(`${API}/workflows?projectId=${parentId}`);
    const workflows = await workflowRes.json();
    const workflowDetail = await (await request.get(`${API}/workflows/${workflows[0].id}`)).json();
    const childItem = workflowDetail.items.find((i: { title: string }) => i.title === 'Child-owned item');

    // Move it to In Progress via API
    await moveItem(request, childItem.id, { workphaseId: inProgressWorkphaseId });

    // Verify on parent board
    await projectSidebar.openBoard('Parent Project');
    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Child-owned item' }),
    ).toBeVisible();

    // Verify on child board
    await projectSidebar.showBoard('Child Project');
    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Child-owned item' }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Inherited workflow is read-only
// ─────────────────────────────────────────────────────────────────

test.describe('inherited workflow is read-only', () => {
  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const parent = await (
      await request.post(`${API}/projects`, {
        data: { name: 'Owning Project' },
      })
    ).json();

    await request.post(`${API}/projects`, {
      data: { name: 'Inheriting Project', parentId: parent.id },
    });

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    await request.post(`${API}/workflows`, {
      data: { name: 'Owning Project', projectId: parent.id, templateId: flow.id },
    });
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
    const todoColumn = page.getByRole('group', { name: 'Todo' });
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
  let childTodoWorkphaseId: string;

  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    const parent = await (
      await request.post(`${API}/projects`, {
        data: { name: 'Parent With Workflow' },
      })
    ).json();

    const child = await (
      await request.post(`${API}/projects`, {
        data: { name: 'Child With Own Workflow', parentId: parent.id },
      })
    ).json();

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const quick = templates.find((t: { name: string }) => t.name === 'quick');
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    await request.post(`${API}/workflows`, {
      data: { name: 'Parent With Workflow', projectId: parent.id, templateId: flow.id },
    });

    const childWorkflow = await (
      await request.post(`${API}/workflows`, {
        data: { name: 'Child With Own Workflow', projectId: child.id, templateId: quick.id },
      })
    ).json();

    const childTodo = childWorkflow.workphases.find((p: { name: string }) => p.name === 'Todo');
    childTodoWorkphaseId = childTodo.id;

    // Create an item in the child's own workflow
    await request.post(`${API}/items`, {
      data: { title: 'Child-only item', projectId: child.id, workphaseId: childTodoWorkphaseId },
    });
  });

  test('item in child own workflow is not visible on parent board', async ({ page, projectSidebar }) => {
    await projectSidebar.openBoard('Parent With Workflow');

    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Child-only item' })).not.toBeVisible();
  });
});
