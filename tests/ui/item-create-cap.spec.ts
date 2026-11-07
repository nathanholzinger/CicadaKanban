import { settledWrites, watchWrites } from '../helpers/requestHarness';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { article, itemPanel } from '../helpers/boardLocators';

import { fetchDefaultBoard, fetchItem, pickWorkphases, seedItem, seedTemplatedWorkflow } from '../helpers/seed';

// The Sheet's add-child control stops at the item cap. Depths are absolute, a root item at 1. A chain
// `L1`…`Ln` puts `Ln` at depth n; the deepest is detached, a Free Card, so it can be opened from the
// board. The cap is the board's, which the page reads with the board.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

const reasonAt = (cap: number) => `At the depth cap (${cap} levels)`;

// `length` is a number of levels, or what to make of the board's item cap, which is read before the items go in.
async function seedChain(request: APIRequestContext, name: string, length: number | ((cap: number) => number)) {
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const cap = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;
  const levels = typeof length === 'number' ? length : length(cap);
  let parent = await seedItem(request, { title: 'L1', projectId: project.id, workphaseId: todo.id });
  for (let level = 2; level <= levels; level++) {
    parent = await seedItem(request, {
      title: `L${level}`,
      parentId: parent.id,
      ...(level === levels ? { isAttached: false, workphaseId: todo.id } : {}),
    });
  }
  return { project, workflow, todo, deepest: parent, cap };
}

// The Sheet of the item titled `title`, opened from its Card, and its Children section's "+ Add".
async function openSheetOf(page: Page, title: string) {
  await article(page, title).click();
  const sheet = itemPanel(page);
  await expect(sheet.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const children = sheet.getByText(/^Children/).locator('..');
  return { sheet, add: children.getByRole('button', { name: '+ Add' }) };
}

// The server answers a project cap of `cap` to this page, apart from the item cap the board carries.
const answerProjectCap = (page: Page, cap: number) =>
  page.route('**/api/projects/depth-cap', route => route.fulfill({ json: { projectDepthCap: cap } }));

test('ATT-10.6: the Sheet allows adding a child that reaches exactly the item cap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { project, deepest, cap } = await seedChain(request, 'Item Cap Boundary Project', cap => cap - 1);
  // The project cap read is far below the item cap, so only the board's cap can leave it enabled.
  await answerProjectCap(page, 3);
  await projectSidebar.openBoard(project.name);
  await expect(article(page, deepest.title)).toBeVisible();

  const { add } = await openSheetOf(page, deepest.title);
  await expect(add).toBeEnabled();
  await add.click();
  await page.getByPlaceholder('Child title...').fill('Final level');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  // The child is stored at exactly the cap, attached to its parent, in the parent's workphase.
  await expect
    .poll(async () => (await fetchItem(request, deepest.id)).children.map((c: { title: string }) => c.title))
    .toEqual(['Final level']);
  const [child] = (await fetchItem(request, deepest.id)).children;
  const stored = await fetchItem(request, child.id);
  // The API counts a root as 0.
  expect(stored.depth + 1).toBe(cap);
  expect([stored.parentId, stored.isAttached, stored.workphaseId]).toEqual([
    deepest.id,
    1,
    (await fetchItem(request, deepest.id)).workphaseId,
  ]);
});

test('ATT-10.7: the Sheet’s add-child control stays drawn but disabled at the item cap, and starts nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { project, deepest, cap } = await seedChain(request, 'Item Cap Reached Project', cap => cap);
  // The project cap read is another number, so the reason can only name the item cap.
  await answerProjectCap(page, 5);
  await projectSidebar.openBoard(project.name);
  await expect(article(page, deepest.title)).toBeVisible();
  const writes = watchWrites(page);

  const { sheet, add } = await openSheetOf(page, deepest.title);
  await expect(add).toBeVisible();
  await expect(add).toBeDisabled();
  await expect(add).toHaveAttribute('title', reasonAt(cap));
  await add.focus();
  await expect(add).not.toBeFocused();
  // A forced click and a keypress open no input and send nothing.
  // (Hovering first waits out the Sheet's slide-in, which a forced click does not.)
  await add.hover();
  await add.click({ force: true });
  await page.keyboard.press('Enter');
  await expect(sheet.getByPlaceholder('Child title...')).toHaveCount(0);
  expect(await settledWrites(page, writes)).toEqual([]);
});

test('ATT-10.7: past the item cap, in data the API did not create, the control behaves the same way and the Sheet stays readable', async ({
  page,
  request,
  projectSidebar,
}) => {
  // The board answers an item cap of 3 to a chain four deep: its deepest item is past the cap, where
  // no create or move leaves one.
  const { project, deepest } = await seedChain(request, 'Item Cap Past Project', 4);
  await page.route('**/api/boards/*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...(await response.json()), itemDepthCap: 3 } });
  });
  await answerProjectCap(page, 12);
  await projectSidebar.openBoard(project.name);
  await expect(article(page, deepest.title)).toBeVisible();

  const { sheet, add } = await openSheetOf(page, deepest.title);
  await expect(add).toBeDisabled();
  // The reason names the item cap, not the item's depth or the project cap.
  await expect(add).toHaveAttribute('title', reasonAt(3));
  await expect(sheet.getByRole('heading', { name: deepest.title, exact: true })).toBeVisible();
});
