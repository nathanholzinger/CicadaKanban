import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { API } from '../helpers/api';

// ─────────────────────────────────────────────────────────────────
// Core board interaction (the original .fixme tests, now passing)
// ─────────────────────────────────────────────────────────────────

test.describe('board basics', () => {
  let projectId: string;
  let todoWorkphaseId: string;

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

    const todo = workflow.workphases.find((p: { name: string }) => p.name === 'Todo');
    todoWorkphaseId = todo.id;
  });

  test.beforeEach(async ({ page, projectSidebar }) => {
    await page.goto('/');
    await projectSidebar.select('My First Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
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
    await request.post(`${API}/items`, {
      data: { title: 'Typeless API item', projectId, workphaseId: todoWorkphaseId },
    });

    await page.goto('/');
    await projectSidebar.select('My First Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Typeless API item' })
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

// ─────────────────────────────────────────────────────────────────
// Items visibility: parent board vs child's inherited board
// ─────────────────────────────────────────────────────────────────

test.describe('items visibility with inherited workflow', () => {
  let parentId: string;
  let todoWorkphaseId: string;
  let inProgressWorkphaseId: string;

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
      data: { workphaseId: inProgressWorkphaseId, position: 1 },
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

  test('clicking the banner link navigates to the owning project board', async ({ page }) => {
    await inheritedBannerLink(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Owning Project' })).toBeVisible();
    // The owning project's board is editable — workphase management is reachable
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await expect(page.getByRole('button', { name: 'Manage workphases' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Child with its own workflow: items are NOT visible on parent board
// ─────────────────────────────────────────────────────────────────

test.describe('child project with own workflow', () => {
  let childTodoWorkphaseId: string;

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

    const childTodo = childWorkflow.workphases.find((p: { name: string }) => p.name === 'Todo');
    childTodoWorkphaseId = childTodo.id;

    // Create an item in the child's own workflow
    await request.post(`${API}/items`, {
      data: { title: 'Child-only item', projectId: child.id, workphaseId: childTodoWorkphaseId },
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

    // Empty workflow — no workphases yet, board is editable but has no columns
    await expect(page.getByRole('button', { name: 'Manage workphases' })).toBeVisible();
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
    await page.getByRole('dialog').getByRole('button', { name: /Source Project/ }).click();

    // Should get the same workphases as Source Project's flow workflow
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });

  // Reproduces a concretely-reachable gap left open by audit Finding #16
  // (client mutation handlers with no rejection path): App.tsx's `workflows`
  // state is fetched once at mount and never refreshed or pruned afterward,
  // so a project deleted elsewhere in the same session is still offered as a
  // "copy from" source here. Combined with Finding #13's sourceWorkflowId
  // existence check, submitting it now correctly 400s server-side — but
  // SetupWorkflowModal's submit() has no catch, so that failure is a silent
  // unhandled rejection: no message ever tells the user the workflow wasn't
  // created. Expected to fail until that catch (and an error message) is added.
  test('copying from a project deleted after the page loaded surfaces an error, not a silent no-op', async ({ page, projectSidebar, request }) => {
    const source = await (await request.post(`${API}/projects`, { data: { name: 'Stale Copy Source' } })).json();
    const templates = await (await request.get(`${API}/workflow-templates`)).json();
    const flow = templates.find((t: { name: string }) => t.name === 'flow');
    await request.post(`${API}/workflows`, {
      data: { name: 'Stale Copy Source', projectId: source.id, templateId: flow.id },
    });
    await request.post(`${API}/projects`, { data: { name: 'Stale Copy Target' } });

    // Mount the app while "Stale Copy Source" and its workflow still exist —
    // App.tsx fetches `workflows`/`projects` here and never refreshes them
    // again. `page.goto` only waits for the page load event, not for that
    // fetch to resolve, so wait for the sidebar to actually show it before
    // deleting anything — otherwise the delete below could race ahead of the
    // app's own initial fetch and this wouldn't reproduce staleness at all.
    await page.goto('/');
    await expect(projectSidebar.projectName('Stale Copy Source')).toBeVisible();

    // Delete the source project via a raw API call rather than the UI, so the
    // already-loaded page's in-memory state is left untouched by it —
    // reproducing a project being deleted elsewhere (another tab, another
    // user) mid-visit.
    await request.delete(`${API}/projects/${source.id}`);

    await projectSidebar.select('Stale Copy Target');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await page.getByRole('button', { name: /Set up a Workflow/ }).click();

    // The now-deleted "Stale Copy Source" still shows up as a copy option —
    // the client never learned it (or its workflow) was gone.
    await page.getByRole('dialog').getByRole('button', { name: /Stale Copy Source/ }).click();

    // Expected: the failure surfaces visibly in the dialog instead of vanishing.
    await expect(page.getByRole('dialog').getByText(/failed|does not reference/i)).toBeVisible();

    // And no workflow should have actually been created for the target project.
    await expect(page.getByRole('group', { name: 'Todo' })).not.toBeVisible();
  });
});
