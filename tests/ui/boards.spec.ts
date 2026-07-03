import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const API = 'http://localhost:3002/api';

// ─────────────────────────────────────────────────────────────────
// Core board interaction (the original .fixme tests, now passing)
// ─────────────────────────────────────────────────────────────────

test.describe('board basics', () => {
  let projectId: string;
  let todoColumnId: string;

  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);

    const project = await (await request.post(`${API}/projects`, {
      data: { name: 'My First Project', description: 'Board test project' },
    })).json();
    projectId = project.id;

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    const workflow = await (await request.post(`${API}/workflows`, {
      data: { name: 'My First Project', projectId: project.id, templateId: flow.id },
    })).json();

    const todo = workflow.columns.find((c: { name: string }) => c.name === 'Todo');
    todoColumnId = todo.id;
  });

  test.beforeEach(async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('My First Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
  });

  test('loads the board with workflow columns', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });

  test('adds a column to a workflow', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add column' }).click();
    await page.getByPlaceholder('Column name...').fill('Sprint 1');
    await page.getByRole('button', { name: 'Add column' }).click();
    await expect(page.getByRole('group', { name: 'Sprint 1' })).toBeVisible();
  });

  test('typeless item created via API renders in the Todo column', async ({ page, request, projectSidebar }) => {
    await request.post(`${API}/items`, {
      data: { title: 'Typeless API item', projectId, columnId: todoColumnId },
    });

    await page.goto('/');
    await projectSidebar.select('My First Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Typeless API item' })
    ).toBeVisible();
  });

  test('adds an item to a column via the inline form', async ({ page }) => {
    const todoColumn = page.getByRole('group', { name: 'Todo' });
    await todoColumn.getByRole('button', { name: '+ Add item' }).click();
    await todoColumn.getByPlaceholder('Card title...').fill('My first E2E task');
    await todoColumn.getByRole('button', { name: 'Add' }).click();
    await expect(todoColumn.getByText('My first E2E task')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Items visibility: parent board vs child's inherited board
// ─────────────────────────────────────────────────────────────────

test.describe('items visibility with inherited workflow', () => {
  let parentId: string;
  let todoColumnId: string;
  let inProgressColumnId: string;

  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);

    const parent = await (await request.post(`${API}/projects`, {
      data: { name: 'Parent Project' },
    })).json();
    parentId = parent.id;

    const child = await (await request.post(`${API}/projects`, {
      data: { name: 'Child Project', parentId: parent.id },
    })).json();

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    const workflow = await (await request.post(`${API}/workflows`, {
      data: { name: 'Parent Project', projectId: parent.id, templateId: flow.id },
    })).json();

    const todo = workflow.columns.find((c: { name: string }) => c.name === 'Todo');
    const inProgress = workflow.columns.find((c: { name: string }) => c.name === 'In Progress');
    todoColumnId = todo.id;
    inProgressColumnId = inProgress.id;

    // Seed a parent-owned item and a child-owned item into the parent's workflow
    await request.post(`${API}/items`, {
      data: { title: 'Parent-owned item', projectId: parent.id, columnId: todoColumnId },
    });
    await request.post(`${API}/items`, {
      data: { title: 'Child-owned item', projectId: child.id, columnId: todoColumnId },
    });
  });

  test('item created in parent project appears on the parent board', async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Parent Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Parent-owned item' })
    ).toBeVisible();
  });

  test('item created in parent project is NOT shown on the child inherited board', async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Child Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Parent-owned item' })
    ).not.toBeVisible();
  });

  test('item created in child project appears on the child inherited board', async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Child Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Child-owned item' })
    ).toBeVisible();
  });

  test('item created in child project also appears on the parent board', async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Parent Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Child-owned item' })
    ).toBeVisible();
  });

  test('moving an item via API is reflected on both boards', async ({ page, request, projectSidebar }) => {
    // Find the child-owned item
    const workflowRes = await request.get(`${API}/workflows?projectId=${parentId}`);
    const workflows = await workflowRes.json();
    const workflowDetail = await (await request.get(`${API}/workflows/${workflows[0].id}`)).json();
    const childItem = workflowDetail.items.find((i: { title: string }) => i.title === 'Child-owned item');

    // Move it to In Progress via API
    await request.patch(`${API}/items/${childItem.id}/move`, {
      data: { columnId: inProgressColumnId, position: 1 },
    });

    // Verify on parent board
    await page.goto('/');
    await projectSidebar.select('Parent Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Child-owned item' })
    ).toBeVisible();

    // Verify on child board
    await projectSidebar.select('Child Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Child-owned item' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Inherited workflow is read-only
// ─────────────────────────────────────────────────────────────────

test.describe('inherited workflow is read-only', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);

    const parent = await (await request.post(`${API}/projects`, {
      data: { name: 'Owning Project' },
    })).json();

    await request.post(`${API}/projects`, {
      data: { name: 'Inheriting Project', parentId: parent.id },
    });

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    await request.post(`${API}/workflows`, {
      data: { name: 'Owning Project', projectId: parent.id, templateId: flow.id },
    });
  });

  test.beforeEach(async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Inheriting Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
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

  test('columns in the inherited view have no delete button', async ({ page }) => {
    const todoColumn = page.getByRole('group', { name: 'Todo' });
    await expect(todoColumn).toBeVisible();
    // The delete (×) button appears only when onDelete is provided — it's absent in read-only mode
    await expect(todoColumn.locator('[title="Delete column"]')).not.toBeVisible();
  });

  test('clicking the banner link navigates to the owning project board', async ({ page }) => {
    await inheritedBannerLink(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Owning Project' })).toBeVisible();
    // The owning project's board has the Add column button (editable)
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await expect(page.getByRole('button', { name: '+ Add column' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Child with its own workflow: items are NOT visible on parent board
// ─────────────────────────────────────────────────────────────────

test.describe('child project with own workflow', () => {
  let childTodoColumnId: string;

  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);

    const parent = await (await request.post(`${API}/projects`, {
      data: { name: 'Parent With Workflow' },
    })).json();

    const child = await (await request.post(`${API}/projects`, {
      data: { name: 'Child With Own Workflow', parentId: parent.id },
    })).json();

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const quick = templates.find((t: { name: string }) => t.name === 'quick');
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    await request.post(`${API}/workflows`, {
      data: { name: 'Parent With Workflow', projectId: parent.id, templateId: flow.id },
    });

    const childWorkflow = await (await request.post(`${API}/workflows`, {
      data: { name: 'Child With Own Workflow', projectId: child.id, templateId: quick.id },
    })).json();

    const childTodo = childWorkflow.columns.find((c: { name: string }) => c.name === 'Todo');
    childTodoColumnId = childTodo.id;

    // Create an item in the child's own workflow
    await request.post(`${API}/items`, {
      data: { title: 'Child-only item', projectId: child.id, columnId: childTodoColumnId },
    });
  });

  test('item in child own workflow is not visible on parent board', async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('Parent With Workflow');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Child-only item' })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Workflow creation modes: Scratch, Template, Copy
// ─────────────────────────────────────────────────────────────────

test.describe('workflow creation', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);

    // Source project whose workflow can be copied
    const source = await (await request.post(`${API}/projects`, {
      data: { name: 'Source Project' },
    })).json();

    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');

    await request.post(`${API}/workflows`, {
      data: { name: 'Source Project', projectId: source.id, templateId: flow.id },
    });
  });

  test('creates a workflow from scratch (custom)', async ({ page, projectSidebar, request }) => {
    await request.post(`${API}/projects`, { data: { name: 'Scratch Project' } });

    await page.goto('/');
    await projectSidebar.select('Scratch Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    await page.getByRole('button', { name: 'Custom' }).click();

    // Empty workflow — no columns yet, only the Add column button
    await expect(page.getByRole('button', { name: '+ Add column' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Todo' })).not.toBeVisible();
  });

  test('creates a workflow from a template', async ({ page, projectSidebar, request }) => {
    await request.post(`${API}/projects`, { data: { name: 'Template Project' } });

    await page.goto('/');
    await projectSidebar.select('Template Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    // /^flow/i anchors to the start of the accessible name, avoiding the "Set up a Workflow" button
    await page.getByRole('button', { name: /^flow/i }).click();

    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'In Progress' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Review' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });

  test('creates a workflow by copying from another project', async ({ page, projectSidebar, request }) => {
    await request.post(`${API}/projects`, { data: { name: 'Copy Project' } });

    await page.goto('/');
    await projectSidebar.select('Copy Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    // The copy section shows "Source Project" as a copyable workflow
    await page.getByRole('button', { name: /Source Project/ }).click();

    // Should get the same columns as Source Project's flow workflow
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });
});
