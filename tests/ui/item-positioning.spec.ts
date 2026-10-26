import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  seedTemplatedWorkflow,
  pickWorkphases,
  seedItem,
  seedPositionedItems,
  moveItem,
  pinItemPosition,
} from '../helpers/seed';
import { article, column, itemPanel, titlesIn } from '../helpers/boardLocators';

// The positioning rules a board shows without a drag: the order a column
// renders in, what an inline create sends, and a write's answer folded into
// the board rather than reloading it.

// Every board load from now on: a GET of the board itself, which is what a
// reload after a write would be.
function watchBoardLoads(page: Page): string[] {
  const loads: string[] = [];
  page.on('request', r => {
    if (r.method() === 'GET' && /^\/api\/boards\/[^/]+$/.test(new URL(r.url()).pathname)) loads.push(r.url());
  });
  return loads;
}

test.describe('item positioning on the board', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test('TC-6.4: a done column lists its items by when they were completed, oldest first', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Done Order Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo, done] = pickWorkphases(workflow, 'Todo', 'Done');
    const d1 = await seedItem(request, { title: 'D1', projectId: project.id, workphaseId: todo.id });
    const d2 = await seedItem(request, { title: 'D2', projectId: project.id, workphaseId: todo.id });
    const d3 = await seedItem(request, { title: 'D3', projectId: project.id, workphaseId: todo.id });
    // Completed in the order D2, D3, D1, each once the clock has passed the one before.
    let lastCompletedAt = 0;
    for (const item of [d2, d3, d1]) {
      await expect.poll(() => Date.now()).toBeGreaterThan(lastCompletedAt);
      lastCompletedAt = (await moveItem(request, item.id, { workphaseId: done.id })).completedAt;
    }

    await projectSidebar.openBoard(name);

    // Not creation order, and done items hold no position.
    await expect.poll(() => titlesIn(column(page, 'Done'))).toEqual(['D2', 'D3', 'D1']);
  });

  test("TC-2.11, TC-5a.1: an inline create sends no position, and the column takes the server's order without a reload", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Inline Create Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    // High enough that the next append reindexes the scope first.
    await seedPositionedItems(request, [
      { key: 'a', projectId: project.id, workphaseId: todo.id, position: 1100, title: 'High A' },
      { key: 'b', projectId: project.id, workphaseId: todo.id, position: 1200, title: 'High B' },
    ]);

    await projectSidebar.openBoard(name);
    const todoColumn = column(page, 'Todo');
    await expect.poll(() => titlesIn(todoColumn)).toEqual(['High A', 'High B']);
    const loads = watchBoardLoads(page);

    const sent = page.waitForRequest(r => r.method() === 'POST' && new URL(r.url()).pathname === '/api/items');
    await todoColumn.getByRole('button', { name: '+ Add item' }).click();
    await todoColumn.getByPlaceholder('Item title...').fill('New C');
    await todoColumn.getByRole('button', { name: 'Add' }).click();

    // A workphase alone: the server resolves the number.
    const body = (await sent).postDataJSON();
    expect(body).toMatchObject({ workphaseId: todo.id });
    expect(body).not.toHaveProperty('position');

    // The server reindexed A and B to 1 and 2, and put C at 3. Only with
    // those pairs applied is C last: against the old 1100 and 1200 it would sort first.
    await expect.poll(() => titlesIn(todoColumn)).toEqual(['High A', 'High B', 'New C']);
    expect(loads).toEqual([]);
  });

  test("TC-5a.1: a detach from the item's own panel lands at the server's position, without a reload", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Panel Detach Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, { title: 'Panel Parent', projectId: project.id, workphaseId: todo.id });
    const free = await seedItem(request, { title: 'Panel Free', projectId: project.id, workphaseId: todo.id });
    await seedItem(request, { title: 'Panel Stub', parentId: parent.id });
    // High enough that the detach's append reindexes the scope first.
    await pinItemPosition(request, parent.id, 1100);
    await pinItemPosition(request, free.id, 1200);

    await projectSidebar.openBoard(name);
    const todoColumn = column(page, 'Todo');
    await expect.poll(() => titlesIn(todoColumn)).toEqual(['Panel Parent', 'Panel Free']);
    const loads = watchBoardLoads(page);

    await article(page, 'Panel Parent').getByRole('button', { name: 'Panel Stub' }).click();
    // Controlled checkbox — state flips after the PUT resolves; avoid uncheck().
    const attachedCheckbox = itemPanel(page).getByLabel('Attached');
    await attachedCheckbox.click();
    await expect(attachedCheckbox).not.toBeChecked();

    // Reindexed to 1 and 2, with the Stub appended at 3: last, as the server has it.
    await expect.poll(() => titlesIn(todoColumn)).toEqual(['Panel Parent', 'Panel Free', 'Panel Stub']);
    expect(loads).toEqual([]);
  });
});
