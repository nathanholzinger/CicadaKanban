import { test, expect } from '../fixtures';

const API = 'http://localhost:3002/api';

type Workphase = { id: string; name: string };

async function createBareWorkflow(request: import('@playwright/test').APIRequestContext, projectName: string) {
  const project = await (await request.post(`${API}/projects`, { data: { name: projectName } })).json();
  const workflow = await (await request.post(`${API}/workflows`, {
    data: { name: projectName, projectId: project.id },
  })).json();
  return { project, workflow };
}

async function addWorkphases(request: import('@playwright/test').APIRequestContext, workflowId: string, names: string[]) {
  const phases: Workphase[] = [];
  for (const name of names) {
    const phase = await (await request.post(`${API}/workphases`, { data: { workflowId, name } })).json();
    phases.push(phase);
  }
  return phases;
}

// Creates a workflow from the "quick" template (Todo/Done) so its workphases
// exist at workflow-creation time — the auto-bootstrapped default board then
// gets real 1:1 columns from the start, rather than an all-Unsorted board.
async function createTemplatedWorkflow(request: import('@playwright/test').APIRequestContext, projectName: string) {
  const project = await (await request.post(`${API}/projects`, { data: { name: projectName } })).json();
  const templates = await (await request.get(`${API}/workflow-templates`)).json();
  const quick = templates.find((t: { name: string }) => t.name === 'quick');
  const workflow = await (await request.post(`${API}/workflows`, {
    data: { name: projectName, projectId: project.id, templateId: quick.id },
  })).json();
  return { project, workflow };
}

// ─────────────────────────────────────────────────────────────────
// Multi-board management
// ─────────────────────────────────────────────────────────────────

test.describe('multi-board management', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('Delete board is hidden when it is the only board on the workflow', async ({ page, request, projectSidebar }) => {
    await createBareWorkflow(request, 'Single Board Project');
    await page.goto('/');
    await projectSidebar.select('Single Board Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await expect(page.getByRole('button', { name: '+ New board' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete board' })).not.toBeVisible();
  });

  test('creates a second board bootstrapped 1:1, and switches between boards', async ({ page, request, projectSidebar }) => {
    await createTemplatedWorkflow(request, 'Multi Board Project');

    await page.goto('/');
    await projectSidebar.select('Multi Board Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: '+ New board' }).click();
    await page.getByLabel('Board name').fill('QA View');
    await page.getByRole('button', { name: 'Create board' }).click();

    // New board starts immediately usable — 1:1 columns from current workphases
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete board' })).toBeVisible();

    await page.selectOption('select[aria-label="Active board"]', { label: 'Default Board' });
    await expect(page.getByRole('group', { name: 'Todo' })).toBeVisible();

    await page.selectOption('select[aria-label="Active board"]', { label: 'QA View' });
    await expect(page.getByRole('group', { name: 'Done' })).toBeVisible();
  });

  test('renames the active board', async ({ page, request, projectSidebar }) => {
    await createBareWorkflow(request, 'Toolbar Actions Project');
    await page.goto('/');
    await projectSidebar.select('Toolbar Actions Project');
    const main = page.locator('main');
    await main.getByRole('button', { name: 'Board' }).click();

    // Scoped to <main> — the sidebar's project-select button can otherwise
    // collide with "Rename board" under substring accessible-name matching.
    await main.getByRole('button', { name: 'Rename board' }).click();
    await main.getByLabel('Board name').fill('Renamed Board');
    await main.getByRole('button', { name: 'Save' }).click();

    await expect(main.locator('select[aria-label="Active board"]')).toContainText('Renamed Board');
  });
});

// ─────────────────────────────────────────────────────────────────
// Column range configuration (merged / expanded / overlap rejection)
// ─────────────────────────────────────────────────────────────────

test.describe('column range configuration', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('creates a merged column spanning two workphases, moving their items out of Unsorted', async ({ page, request, projectSidebar }) => {
    const { project, workflow } = await createBareWorkflow(request, 'Merged Column Project');
    const [todo, inProgress] = await addWorkphases(request, workflow.id, ['Todo', 'In Progress', 'Review', 'Done']);
    await request.post(`${API}/items`, { data: { title: 'Merge target item', projectId: project.id, workphaseId: todo.id } });

    await page.goto('/');
    await projectSidebar.select('Merged Column Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    // Board starts all-Unsorted since these workphases post-date board creation
    await expect(page.getByRole('group', { name: 'Unsorted' })).toBeVisible();

    await page.getByRole('button', { name: '+ Add column' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('select').nth(1).selectOption({ label: 'In Progress' });
    await expect(dialog.getByText('Covers: Todo, In Progress')).toBeVisible();
    await dialog.getByRole('button', { name: 'Add column' }).click();

    const merged = page.getByRole('group', { name: 'Todo – In Progress' });
    await expect(merged).toBeVisible();
    await expect(merged.getByRole('article', { name: 'Merge target item' })).toBeVisible();

    // Review/Done are still uncovered — Unsorted persists with needs-attention
    await expect(page.getByRole('group', { name: 'Unsorted' }).getByText('needs attention')).toBeVisible();
    void inProgress;
  });

  test('creates an expanded column and each workphase renders as its own sub-row', async ({ page, request, projectSidebar }) => {
    const { project, workflow } = await createBareWorkflow(request, 'Expanded Column Project');
    const [todo, inProgress] = await addWorkphases(request, workflow.id, ['Todo', 'In Progress']);
    await request.post(`${API}/items`, { data: { title: 'Todo item', projectId: project.id, workphaseId: todo.id } });
    await request.post(`${API}/items`, { data: { title: 'In Progress item', projectId: project.id, workphaseId: inProgress.id } });

    await page.goto('/');
    await projectSidebar.select('Expanded Column Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: '+ Add column' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('select').nth(1).selectOption({ label: 'In Progress' });
    await dialog.getByRole('button', { name: 'Expanded' }).click();
    await dialog.getByRole('button', { name: 'Add column' }).click();

    const column = page.getByRole('group', { name: 'Todo – In Progress' });
    await expect(column).toBeVisible();
    await expect(column.getByText('Todo', { exact: true })).toBeVisible();
    await expect(column.getByText('In Progress', { exact: true })).toBeVisible();
    await expect(column.getByRole('article', { name: 'Todo item' })).toBeVisible();
    await expect(column.getByRole('article', { name: 'In Progress item' })).toBeVisible();
  });

  test('rejects an overlapping range with an inline error', async ({ page, request, projectSidebar }) => {
    const { workflow } = await createBareWorkflow(request, 'Overlap Reject Project');
    const [todo, inProgress] = await addWorkphases(request, workflow.id, ['Todo', 'In Progress']);
    await request.post(`${API}/columns`, {
      data: { boardId: (await (await request.get(`${API}/boards?workflowId=${workflow.id}`)).json())[0].id,
        startWorkphaseId: todo.id, endWorkphaseId: todo.id },
    });

    await page.goto('/');
    await projectSidebar.select('Overlap Reject Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    await page.getByRole('button', { name: '+ Add column' }).click();
    const dialog = page.getByRole('dialog');
    // Default From/To is Todo/Todo — directly overlaps the existing column
    await dialog.getByRole('button', { name: 'Add column' }).click();

    await expect(dialog.getByText(/overlaps existing column/)).toBeVisible();
    void inProgress;
  });
});

// ─────────────────────────────────────────────────────────────────
// Broken column detection after an out-of-band workphase reorder
// ─────────────────────────────────────────────────────────────────

test.describe('broken column detection', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('flags a column as broken after reordering inverts its range', async ({ page, request, projectSidebar }) => {
    const { workflow } = await createBareWorkflow(request, 'Broken Column Project');
    const [todo, inProgress] = await addWorkphases(request, workflow.id, ['Todo', 'In Progress']);
    const boards = await (await request.get(`${API}/boards?workflowId=${workflow.id}`)).json();
    await request.post(`${API}/columns`, {
      data: { boardId: boards[0].id, startWorkphaseId: todo.id, endWorkphaseId: inProgress.id },
    });

    // Invert their order — the column's start now sorts after its end
    await request.patch(`${API}/workphases/reorder`, {
      data: { workphaseOrders: [{ id: todo.id, position: 2 }, { id: inProgress.id, position: 1 }] },
    });

    await page.goto('/');
    await projectSidebar.select('Broken Column Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();

    // displayName reflects current position order (post-reorder: In Progress, then Todo)
    const column = page.getByRole('group', { name: 'In Progress – Todo' });
    await expect(column).toBeVisible();
    await expect(column.getByText('broken')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Deleting a workphase reports the resulting column adjustments
// ─────────────────────────────────────────────────────────────────

test.describe('workphase delete notice', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('reports resized and removed columns after deleting workphases', async ({ page, request, projectSidebar }) => {
    const { workflow } = await createBareWorkflow(request, 'Workphase Delete Project');
    const [todo, inProgress, done] = await addWorkphases(request, workflow.id, ['Todo', 'In Progress', 'Done']);
    const boards = await (await request.get(`${API}/boards?workflowId=${workflow.id}`)).json();
    await request.post(`${API}/columns`, {
      data: { boardId: boards[0].id, startWorkphaseId: todo.id, endWorkphaseId: done.id },
    });

    await page.goto('/');
    await projectSidebar.select('Workphase Delete Project');
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    await page.getByRole('button', { name: 'Manage workphases' }).click();

    // Deleting a boundary workphase (Todo) shrinks the column's range
    const todoRow = page.locator('li', { hasText: 'Todo' });
    await todoRow.getByRole('button', { name: 'Delete workphase' }).click();
    await todoRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('1 column resized')).toBeVisible();

    // Now In Progress is the boundary — deleting it shrinks the column again
    const inProgressRow = page.locator('li', { hasText: 'In Progress' });
    await inProgressRow.getByRole('button', { name: 'Delete workphase' }).click();
    await inProgressRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('1 column resized')).toBeVisible();

    // Done is now the column's sole covered workphase — deleting it removes the column
    const doneRow = page.locator('li', { hasText: 'Done' });
    await doneRow.getByRole('button', { name: 'Delete workphase' }).click();
    await doneRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('1 column removed')).toBeVisible();
  });
});
