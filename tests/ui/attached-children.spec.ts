import { test, expect } from '../fixtures';

const API = 'http://localhost:3002/api';

async function createTemplatedWorkflow(request: import('@playwright/test').APIRequestContext, projectName: string) {
  const project = await (await request.post(`${API}/projects`, { data: { name: projectName } })).json();
  const templates = await (await request.get(`${API}/workflow-templates`)).json();
  const flow = templates.find((t: { name: string }) => t.name === 'flow');
  const workflow = await (await request.post(`${API}/workflows`, {
    data: { name: projectName, projectId: project.id, templateId: flow.id },
  })).json();
  const todo = workflow.workphases.find((p: { name: string }) => p.name === 'Todo');
  return { project, workflow, todo };
}

test.describe('attached children on the board', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('shows attached children nested under the parent card, and the toggle collapses them', async ({ page, request, projectSidebar }) => {
    const { project, todo } = await createTemplatedWorkflow(request, 'Nested Children Project');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Parent Card', projectId: project.id, workphaseId: todo.id },
    })).json();
    await request.post(`${API}/items`, { data: { title: 'Attached Kid', parentId: parent.id } });

    await page.goto('/');
    await projectSidebar.select('Nested Children Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    const card = page.getByRole('article', { name: 'Parent Card' });
    await expect(card).toBeVisible();
    // Attached child renders nested under the parent, not as its own card.
    await expect(card.getByText('Attached Kid')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Attached Kid' })).not.toBeVisible();

    await card.getByRole('button', { name: /child/ }).click();
    await expect(card.getByText('Attached Kid')).not.toBeVisible();
  });

  test('a detached child renders as its own top-level card, not nested', async ({ page, request, projectSidebar }) => {
    const { project, todo } = await createTemplatedWorkflow(request, 'Detached Sibling Project');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Parent With Detached', projectId: project.id, workphaseId: todo.id },
    })).json();
    await request.post(`${API}/items`, {
      data: { title: 'Detached Kid', parentId: parent.id, isAttached: false, workphaseId: todo.id },
    });

    await page.goto('/');
    await projectSidebar.select('Detached Sibling Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(page.getByRole('article', { name: 'Detached Kid' })).toBeVisible();
  });

  test('unchecking "Show attached children by default" collapses cards on the next load', async ({ page, request, projectSidebar }) => {
    const { project, workflow, todo } = await createTemplatedWorkflow(request, 'Board Toggle Project');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Toggle Default Parent', projectId: project.id, workphaseId: todo.id },
    })).json();
    await request.post(`${API}/items`, { data: { title: 'Hidden Kid', parentId: parent.id } });

    await page.goto('/');
    await projectSidebar.select('Board Toggle Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    const card = page.getByRole('article', { name: 'Toggle Default Parent' });
    await expect(card.getByText('Hidden Kid')).toBeVisible(); // the setting defaults to on

    // Controlled checkbox — its state flips only after the PUT resolves, so
    // click and then wait for the re-render rather than using uncheck().
    const toggle = page.getByLabel('Show attached children by default');
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Persisted server-side...
    const boards = await (await request.get(`${API}/boards?workflowId=${workflow.id}`)).json();
    await expect.poll(async () => {
      const board = await (await request.get(`${API}/boards/${boards[0].id}`)).json();
      return board.showAttachedChildren;
    }).toBe(0);

    // ...and a fresh load renders children collapsed, expandable via the badge.
    await page.goto('/');
    await projectSidebar.select('Board Toggle Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    const reloaded = page.getByRole('article', { name: 'Toggle Default Parent' });
    await expect(reloaded).toBeVisible();
    await expect(reloaded.getByText('Hidden Kid')).not.toBeVisible();

    await reloaded.getByRole('button', { name: /child/ }).click();
    await expect(reloaded.getByText('Hidden Kid')).toBeVisible();
  });

  test('the child badge counts only attached children and nesting recurses through grandchildren', async ({ page, request, projectSidebar }) => {
    const { project, todo } = await createTemplatedWorkflow(request, 'Badge Count Project');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Badge Parent', projectId: project.id, workphaseId: todo.id },
    })).json();
    const attachedChild = await (await request.post(`${API}/items`, {
      data: { title: 'Attached One', parentId: parent.id },
    })).json();
    await request.post(`${API}/items`, {
      data: { title: 'Detached One', parentId: parent.id, isAttached: false, workphaseId: todo.id },
    });
    await request.post(`${API}/items`, { data: { title: 'Nested Grand', parentId: attachedChild.id } });

    await page.goto('/');
    await projectSidebar.select('Badge Count Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    const card = page.getByRole('article', { name: 'Badge Parent' });
    // Only the attached child is counted — the detached one is its own card.
    await expect(card.getByRole('button', { name: /^1 child/ })).toBeVisible();
    await expect(card.getByText('Attached One')).toBeVisible();
    await expect(card.getByText('Nested Grand')).toBeVisible();

    await expect(page.getByRole('article', { name: 'Detached One' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Attached One' })).not.toBeVisible();
  });
});

test.describe('reparent and attach/detach controls', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('detaching a child via the detail panel keeps it in place when the parent moves', async ({ page, request, projectSidebar }) => {
    const { project, todo, workflow } = await createTemplatedWorkflow(request, 'Detach Control Project');
    const inProgress = workflow.workphases.find((p: { name: string }) => p.name === 'In Progress');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Movable Parent', projectId: project.id, workphaseId: todo.id },
    })).json();
    const child = await (await request.post(`${API}/items`, {
      data: { title: 'Toggle Child', parentId: parent.id },
    })).json();

    await page.goto('/');
    await projectSidebar.select('Detach Control Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('article', { name: 'Movable Parent' }).click();
    const panel = page.locator('div.fixed.top-0.right-0');
    await expect(panel.getByText('Toggle Child')).toBeVisible();
    await panel.getByRole('button', { name: 'Attached' }).click();
    await expect(panel.getByRole('button', { name: 'Detached' })).toBeVisible();

    const detached = await (await request.get(`${API}/items/${child.id}`)).json();
    expect(detached.isAttached).toBe(0);

    // Move the parent — the now-detached child should stay in its workphase.
    await request.patch(`${API}/items/${parent.id}/move`, { data: { workphaseId: inProgress.id, position: 1 } });
    const afterMove = await (await request.get(`${API}/items/${child.id}`)).json();
    expect(afterMove.workphaseId).toBe(todo.id);

    // And the board shows it: parent moved on, child stayed put as its own card.
    await page.goto('/');
    await projectSidebar.select('Detach Control Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Movable Parent' }),
    ).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Toggle Child' }),
    ).toBeVisible();
  });

  test('the Parent dropdown excludes descendants, and reparenting nests the item under its new parent', async ({ page, request, projectSidebar }) => {
    const { project, todo } = await createTemplatedWorkflow(request, 'Reparent Control Project');
    const itemA = await (await request.post(`${API}/items`, { data: { title: 'Item A', projectId: project.id, workphaseId: todo.id } })).json();
    const itemB = await (await request.post(`${API}/items`, { data: { title: 'Item B', projectId: project.id, workphaseId: todo.id } })).json();
    await request.post(`${API}/items`, { data: { title: 'A Child', parentId: itemA.id } });

    await page.goto('/');
    await projectSidebar.select('Reparent Control Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('article', { name: 'Item A' }).click();
    const panel = page.locator('div.fixed.top-0.right-0');
    const parentSelect = panel.getByLabel('Parent item');

    // Cycle prevention in the UI: neither the item itself nor its descendant is offered.
    await expect(parentSelect.locator('option', { hasText: 'Item B' })).toHaveCount(1);
    await expect(parentSelect.locator('option', { hasText: 'A Child' })).toHaveCount(0);
    await expect(parentSelect.locator('option', { hasText: 'Item A' })).toHaveCount(0);

    await parentSelect.selectOption({ label: 'Item B' });

    // Item A (with its own child) now renders nested inside Item B's card.
    await expect(page.getByRole('article', { name: 'Item B' }).getByText('Item A')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Item A' })).not.toBeVisible();

    const updated = await (await request.get(`${API}/items/${itemA.id}`)).json();
    expect(updated.parentId).toBe(itemB.id);
  });

  test("unchecking Attached in the item's own panel detaches it onto the board", async ({ page, request, projectSidebar }) => {
    const { project, todo } = await createTemplatedWorkflow(request, 'Own Panel Project');
    const parent = await (await request.post(`${API}/items`, {
      data: { title: 'Own Panel Parent', projectId: project.id, workphaseId: todo.id },
    })).json();
    const child = await (await request.post(`${API}/items`, {
      data: { title: 'Own Panel Child', parentId: parent.id },
    })).json();

    await page.goto('/');
    await projectSidebar.select('Own Panel Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    // The attached child is only a nested row — open its own panel from there.
    await expect(page.getByRole('article', { name: 'Own Panel Child' })).not.toBeVisible();
    await page.getByRole('article', { name: 'Own Panel Parent' })
      .getByRole('button', { name: 'Own Panel Child' }).click();

    const panel = page.locator('div.fixed.top-0.right-0');
    // Controlled checkbox — state flips after the PUT resolves; avoid uncheck().
    const attachedCheckbox = panel.getByLabel('Attached');
    await attachedCheckbox.click();
    await expect(attachedCheckbox).not.toBeChecked();

    // The board updates live: the child becomes its own top-level card.
    await expect(page.getByRole('article', { name: 'Own Panel Child' })).toBeVisible();

    const detached = await (await request.get(`${API}/items/${child.id}`)).json();
    expect(detached.isAttached).toBe(0);
  });
});
