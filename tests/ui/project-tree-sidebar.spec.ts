import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { pickUp, release } from '../helpers/dragGesture';
import { aim } from '../helpers/projectTreeDrag';
import {
  fetchProjectDepthCap,
  pinProjectCreatedAt,
  pinProjectParent,
  pinProjectPosition,
  seedProjects,
} from '../helpers/seed';
import { projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';
import { SIDEBAR_MAX_WIDTH_PX, SIDEBAR_WIDTH_STORAGE_KEY } from '../../client/src/components/sidebar/sidebarWidth';

test.beforeEach(async () => {
  await resetAndSeedDb();
});

test('TREE-4.3: the sidebar shows each project’s children by position, then creation time', async ({
  page,
  request,
  projectSidebar,
}) => {
  // P's children A and B tie at 2.0, with B created first, and C sits at 1.5.
  // The top-level projects TA and TB tie the same way, with TC at 1.5.
  const ids = await seedProjects(request, [
    ['P', null],
    ['B', 'P'],
    ['A', 'P'],
    ['C', 'P'],
    ['TB', null],
    ['TA', null],
    ['TC', null],
  ]);
  for (const [name, position] of [
    ['B', 2.0],
    ['A', 2.0],
    ['C', 1.5],
    ['TB', 2.0],
    ['TA', 2.0],
    ['TC', 1.5],
  ] as const) {
    await pinProjectPosition(request, ids[name], position);
  }
  // B and TB were created first, which two creates in one millisecond wouldn't
  // settle.
  for (const [name, createdAt] of [
    ['B', 1000],
    ['A', 2000],
    ['TB', 1000],
    ['TA', 2000],
  ] as const) {
    await pinProjectCreatedAt(request, ids[name], createdAt);
  }
  await page.goto('/');

  // P, then its children, then the rest of the top level.
  await expect(projectSidebar.projectNames('P', 'A', 'B', 'C', 'TA', 'TB', 'TC')).toHaveText([
    'P',
    'C',
    'B',
    'A',
    'TC',
    'TB',
    'TA',
  ]);
});

test('TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt', async ({
  page,
  request,
  projectSidebar,
}) => {
  await seedProjects(request, [
    ['A', null],
    ['B', null],
    ['X', null],
  ]);
  await page.goto('/');
  // The server refuses every write to a project.
  await page.route('**/api/projects**', route =>
    route.request().method() === 'GET'
      ? route.fallback()
      : route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'refused' }) }),
  );
  const asBefore = async () => {
    await expect(projectSidebar.projectNames('A', 'B', 'X', 'Z')).toHaveText(['A', 'B', 'X']);
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(0)}px`);
  };
  const refusedWrite = (method: string) => page.waitForResponse(res => res.request().method() === method);

  // X is dragged under A, and released.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('A'), 'after', 1);
  const moved = refusedWrite('PATCH');
  await release(page);
  expect((await moved).status()).toBe(400);
  await asBefore();

  // A project, Z, is created.
  await projectSidebar.newProjectButton.click();
  await page.getByPlaceholder('Project name').fill('Z');
  const created = refusedWrite('POST');
  await page.getByRole('button', { name: 'Create project' }).click();
  expect((await created).status()).toBe(400);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await asBefore();

  // X's parent is edited to A, on X's page.
  await projectSidebar.select('X');
  const edited = refusedWrite('PUT');
  await page.locator('main select').selectOption({ label: 'A' });
  expect((await edited).status()).toBe(400);
  await asBefore();
});

test('TREE-4.4: the sidebar sorts a project with no position as if its position were 0', async ({
  page,
  request,
  projectSidebar,
}) => {
  // P's children A (0.5) and B (2.0), and N, created last, with no position.
  const ids = await seedProjects(request, [
    ['P', null],
    ['A', 'P'],
    ['B', 'P'],
    ['N', 'P'],
  ]);
  await pinProjectPosition(request, ids.A, 0.5);
  await pinProjectPosition(request, ids.B, 2.0);
  await pinProjectPosition(request, ids.N, null);
  await page.goto('/');

  await expect(projectSidebar.projectNames('P', 'A', 'B', 'N')).toHaveText(['P', 'N', 'A', 'B']);
});

test.describe('TREE-4.7: the sidebar applies the renumbered pairs, so it shows the server’s order without a reload', () => {
  // P is expanded, with children A and B at 1500 and 1600, and X is top-level.
  // A sidebar that merged only the written project would hold 1500, 1600 and 3,
  // and show the new one first.
  async function seedTree(request: APIRequestContext, page: Page) {
    const ids = await seedProjects(request, [
      ['P', null],
      ['A', 'P'],
      ['B', 'P'],
      ['X', null],
    ]);
    await pinProjectPosition(request, ids.A, 1500);
    await pinProjectPosition(request, ids.B, 1600);
    await page.goto('/');
    return ids;
  }

  test('a drag of X under P, after B', async ({ page, request, projectSidebar }) => {
    await seedTree(request, page);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row('B'), 'after', 1);
    await release(page);

    // X is P's child once the move lands; only then is its place in the order a
    // result, since it reads P, A, B, X before.
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
    const order = projectSidebar.projectNames('P', 'A', 'B', 'X');
    await expect(order).toHaveText(['P', 'A', 'B', 'X']);
    await page.reload();
    await expect(order).toHaveText(['P', 'A', 'B', 'X']);
  });

  test('a create under P', async ({ page, request, projectSidebar }) => {
    await seedTree(request, page);
    const row = projectSidebar.row('P');
    await row.hover();
    await row.getByTitle('Add subproject').click();
    await page.getByPlaceholder('Subproject name').fill('New');
    await page.getByRole('button', { name: 'Create subproject' }).click();

    await expect(projectSidebar.projectNames('P', 'A', 'B', 'X', 'New')).toHaveText(['P', 'A', 'B', 'New', 'X']);
  });

  test('an edit of X’s parent to P', async ({ page, request, projectSidebar }) => {
    await seedTree(request, page);
    await projectSidebar.select('X');
    await page.locator('main select').selectOption({ label: 'P' });

    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
    await expect(projectSidebar.projectNames('P', 'A', 'B', 'X')).toHaveText(['P', 'A', 'B', 'X']);
  });
});

test('TREE-3.7: the sidebar shows every project of a tree past the project cap, flagging and repairing none', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  // A chain down to the cap, and two projects below it, which no project write
  // would place there.
  const chain = Array.from({ length: cap }, (_, level) => `P${level + 1}`);
  const beyond = ['Past 1', 'Past 2'];
  const ids = await seedProjects(request, [
    ...chain.map((name, level) => [name, level === 0 ? null : chain[level - 1]] as const),
    ...beyond.map(name => [name, null] as const),
  ]);
  await pinProjectParent(request, ids[beyond[0]], ids[chain[chain.length - 1]]);
  await pinProjectParent(request, ids[beyond[1]], ids[beyond[0]]);
  // At the default width the deepest names have no room left after their indents, so they draw at
  // no width. The widest sidebar leaves each name room.
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    SIDEBAR_WIDTH_STORAGE_KEY,
    String(SIDEBAR_MAX_WIDTH_PX),
  ] as const);
  await page.goto('/');

  for (const name of [...chain, ...beyond]) await expect(projectSidebar.projectName(name)).toBeVisible();
  await expect(projectSidebar.row('Past 2')).toHaveCSS('padding-left', `${projectRowIndentPx(cap + 1)}px`);
  await expect(projectSidebar.dropLine).toHaveCount(0);
});
