import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { bottomQuarter, cancel, hoverTo, pickUp, release, topQuarter, type Point } from '../helpers/dragGesture';
import { fetchDefaultBoard, fetchProject, seedBareWorkflow, seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { INDENT_WIDTH, projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// TREE-1's tree: top-level A, B and X, where A has a child A1, and A1 has a
// child A1a. X is the project dragged. Depths count from the top level.
const TREE_1 = [
  ['A', null],
  ['A1', 'A'],
  ['A1a', 'A1'],
  ['B', null],
  ['X', null],
] as const;

// Aims the live drag at the top or bottom of a row, `tabs` indents right of
// where the pointer picked the project up (negative for left). The dragged
// project is top-level in every tree here, so `tabs` is the depth aimed at.
async function aim(page: Page, from: Point, row: Locator, side: 'before' | 'after', tabs: number) {
  const target = side === 'before' ? await topQuarter(row) : await bottomQuarter(row);
  await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: target.y });
}

test('TREE-1.1: an indicator line shows the gap, and a release saves exactly what the line shows', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');

  // The line goes between A1a and B, at A1a's depth.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), 'before', 2);

  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'before');
  await expect(projectSidebar.row('B').locator('..').locator('[data-drop-line]')).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveCSS('margin-left', `${projectRowIndentPx(2)}px`);

  // Nothing slides aside to make room, and no row is added for a ghost: the
  // line is the only cue.
  for (const name of ['A', 'A1', 'A1a', 'B']) {
    await expect(projectSidebar.row(name).locator('..')).toHaveCSS('transform', 'none');
  }
  await expect(projectSidebar.dragHandles).toHaveCount(5);

  await release(page);

  // X is saved as A1's child, after A1a, where the line showed it.
  const x = await fetchProject(request, ids.X);
  const a1a = await fetchProject(request, ids.A1a);
  expect(x.parentId).toBe(ids.A1);
  expect(x.position).toBeGreaterThan(a1a.position!);
  await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(2)}px`);
});

test('TREE-1.7: every depth offered is valid: projects have no depth cap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { workflow } = await seedBareWorkflow(request, 'Cap probe');
  const { itemDepthCap: cap } = await fetchDefaultBoard(request, workflow.id);

  // A chain of projects, each the only child of the one before, one level
  // past the item cap, with D its deepest; and X, with a child X1.
  const chain = Array.from({ length: cap + 2 }, (_, depth) => `P${depth}`);
  const deepest = chain[chain.length - 1];
  const ids = await seedProjects(request, [
    ...chain.map((name, depth) => [name, depth === 0 ? null : chain[depth - 1]] as const),
    ['X', null],
    ['X1', 'X'],
  ]);
  await page.goto('/');

  // X tabbed one right of D: the line reaches that depth, and the save holds.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row(deepest), 'after', chain.length);
  await expect(projectSidebar.dropLine).toHaveCSS('margin-left', `${projectRowIndentPx(chain.length)}px`);
  await release(page);

  expect((await fetchProject(request, ids.X)).parentId).toBe(ids[deepest]);
  expect((await fetchProject(request, ids.X1)).parentId).toBe(ids.X);
});

test('TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  const before = await fetchProject(request, ids.X);
  const writes: string[] = [];
  page.on('request', req => {
    if (req.method() !== 'GET') writes.push(`${req.method()} ${req.url()}`);
  });

  // X's own gap is below B, at the top level: the line is on B's bottom.
  const handle = projectSidebar.dragHandle('X');
  const row = projectSidebar.row('B');

  // The cursor leaves X's row for the gap above B, and goes on to X's own gap.
  const from = await pickUp(page, handle);
  await aim(page, from, row, 'before', 0);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'before');
  await aim(page, from, row, 'after', 0);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'after');
  await release(page);

  // Released before the cursor has left X's row. Picking up drifts the pointer
  // sideways, which on X's own row picks a depth, so it rests back at the start.
  await pickUp(page, handle);
  await hoverTo(page, from);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'after');
  await release(page);

  expect(writes).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);
});

test('TREE-1.9: coming back to the dragged project’s own row means its own gap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  const before = await fetchProject(request, ids.X);
  const writes: string[] = [];
  page.on('request', req => {
    if (req.method() !== 'GET') writes.push(`${req.method()} ${req.url()}`);
  });

  // The line shows the gap between A1a and B, then the cursor comes back to
  // X's own row: the line moves to X's own gap, below B.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), 'before', 0);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'before');
  await hoverTo(page, from);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', 'after');
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await release(page);

  expect(writes).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);
});

test('TREE-2.1: the dragged project’s descendants are dimmed for the whole drag', async ({
  page,
  request,
  projectSidebar,
}) => {
  await seedProjects(request, [
    ['A', null],
    ['X', null],
    ['X1', 'X'],
    ['X1a', 'X1'],
  ]);
  await page.goto('/');
  const dimmed = '0.4';
  const clear = '1';

  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  for (const side of ['after', 'before'] as const) {
    await aim(page, from, projectSidebar.row('A'), side, 0);
    await expect(projectSidebar.row('X1')).toHaveCSS('opacity', dimmed);
    await expect(projectSidebar.row('X1a')).toHaveCSS('opacity', dimmed);
    await expect(projectSidebar.row('A')).toHaveCSS('opacity', clear);
  }

  await cancel(page);
  await expect(projectSidebar.row('X1')).toHaveCSS('opacity', clear);
  await expect(projectSidebar.row('X1a')).toHaveCSS('opacity', clear);
});

test.describe('TREE-2.2: a collapsed project opens when a project is dropped into it as its child', () => {
  // T is collapsed, with children T1 and T2. X is dropped into the gap
  // between T and U, `tabs` indents right of its own level.
  async function dropBelowCollapsedT(
    page: Page,
    request: APIRequestContext,
    projectSidebar: ProjectSidebarPage,
    tabs: number,
  ) {
    await seedProjects(request, [
      ['T', null],
      ['T1', 'T'],
      ['T2', 'T'],
      ['U', null],
      ['X', null],
    ]);
    await page.goto('/');
    await projectSidebar.toggle('T');
    await expect(projectSidebar.projectName('T1')).not.toBeVisible();

    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row('U'), 'before', tabs);
    await release(page);
  }

  test('as its child, T opens, showing X, T1 and T2 under it', async ({ page, request, projectSidebar }) => {
    await dropBelowCollapsedT(page, request, projectSidebar, 1);
    await expect(projectSidebar.row('T').getByTitle('Collapse')).toBeVisible();
    for (const name of ['X', 'T1', 'T2']) await expect(projectSidebar.row(name)).toBeVisible();
  });

  test('as its sibling, T stays collapsed', async ({ page, request, projectSidebar }) => {
    await dropBelowCollapsedT(page, request, projectSidebar, 0);
    await expect(projectSidebar.row('T').getByTitle('Expand')).toBeVisible();
    await expect(projectSidebar.projectName('T1')).not.toBeVisible();
  });
});
