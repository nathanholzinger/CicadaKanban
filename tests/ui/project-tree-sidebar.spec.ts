import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { pickUp, release } from '../helpers/dragGesture';
import { aim } from '../helpers/projectTreeDrag';
import { pinProjectPosition, seedProjects } from '../helpers/seed';
import { projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';

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
  await page.goto('/');

  // P, then its children, then the rest of the top level.
  await expect(projectSidebar.locator.getByText(/^(P|A|B|C|TA|TB|TC)$/)).toHaveText([
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
    await expect(projectSidebar.locator.getByText(/^(A|B|X|Z)$/)).toHaveText(['A', 'B', 'X']);
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
