import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { cancel, hoverTo, pickUp, release } from '../helpers/dragGesture';
import { aim, watchWrites } from '../helpers/projectTreeDrag';
import { fetchProject, fetchProjectDepthCap, seedProjects } from '../helpers/seed';
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
  await expect.poll(async () => (await fetchProject(request, ids.X)).parentId).toBe(ids.A1);
  const x = await fetchProject(request, ids.X);
  const a1a = await fetchProject(request, ids.A1a);
  expect(x.position).toBeGreaterThan(a1a.position!);
  await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(2)}px`);
});

test('TREE-1.12: a release saves the placement as a move naming a neighbor, never a position', async ({
  page,
  request,
  projectSidebar,
}) => {
  const moves: unknown[] = [];
  page.on('request', req => {
    if (req.method() === 'PATCH' && req.url().endsWith('/move')) moves.push(req.postDataJSON());
  });
  const dragX = async (over: string, side: 'before' | 'after', tabs: number) => {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row(over), side, tabs);
    await release(page);
  };

  // Released between A1a and B, at A1a's depth: A1's child, after A1a.
  const first = await seedProjects(request, TREE_1);
  await page.goto('/');
  await dragX('B', 'before', 2);
  await expect.poll(() => moves.length).toBe(1);
  expect(moves[0]).toEqual({ parentId: first.A1, prevId: first.A1a, nextId: null });
  // Saved where the line showed it: A1's child, after A1a.
  await expect.poll(async () => (await fetchProject(request, first.X)).parentId).toBe(first.A1);
  const a1aPosition = (await fetchProject(request, first.A1a)).position!;
  expect((await fetchProject(request, first.X)).position).toBeGreaterThan(a1aPosition);

  // Released above the first row: top-level, before A.
  await resetAndSeedDb();
  const second = await seedProjects(request, TREE_1);
  await page.goto('/');
  await dragX('A', 'before', 0);
  await expect.poll(() => moves.length).toBe(2);
  expect(moves[1]).toEqual({ parentId: null, prevId: null, nextId: second.A });

  // Saved where the line showed it: the stored position puts X before A, and
  // the sidebar shows it first.
  const aPosition = (await fetchProject(request, second.A)).position!;
  await expect.poll(async () => (await fetchProject(request, second.X)).position).toBeLessThan(aPosition);
  await expect(projectSidebar.projectNames('X', 'A', 'A1', 'A1a', 'B')).toHaveText(['X', 'A', 'A1', 'A1a', 'B']);
});

test('TREE-1.4: when the dragged project’s subtree holds every project, no line is drawn and a release writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['X', null],
    ['X1', 'X'],
    ['X2', 'X'],
  ]);
  await page.goto('/');
  const stored = () => Promise.all([ids.X, ids.X1, ids.X2].map(id => fetchProject(request, id)));
  const before = await stored();
  const writes = watchWrites(page);

  // Every project is in X's subtree, so no row is left to draw a line against,
  // whichever of them the cursor is over and however far sideways. The cursor
  // ends over X1, over X2 and over X's own row in turn, and each time a release
  // sends nothing. X's row is aimed at from the pickup point: the carried copy
  // repeats its name.
  for (const over of ['X1', 'X2', null]) {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    for (const tabs of [-3, 0, 3]) {
      for (const side of ['before', 'after'] as const) {
        if (over) {
          await aim(page, from, projectSidebar.row(over), side, tabs);
        } else {
          await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: from.y + (side === 'before' ? -4 : 4) });
        }
        await expect(projectSidebar.dropLine).toHaveCount(0);
      }
    }
    await release(page);
  }

  expect(writes).toEqual([]);
  expect(await stored()).toEqual(before);
});

test('TREE-1.11, TREE-3.9: a tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);

  // A chain of projects, each the only child of the one before, from a
  // top-level project down to S, at depth cap − 2, and S's only child T, at
  // depth cap − 1; and X, the last row, with a child X1.
  const chain = Array.from({ length: cap - 1 }, (_, level) => `P${level + 1}`);
  const [s, t] = chain.slice(-2);
  const ids = await seedProjects(request, [
    ...chain.map((name, level) => [name, level === 0 ? null : chain[level - 1]] as const),
    ['X', null],
    ['X1', 'X'],
  ]);
  await page.goto('/');
  const writes = watchWrites(page);
  const before = await fetchProject(request, ids.X);

  // One tab right of T: X would be T's child, and X1 at depth cap + 1. The state
  // is still offered, and its line is marked invalid. A release writes nothing.
  const first = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, first, projectSidebar.row(t), 'after', chain.length);
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveCSS('margin-left', `${projectRowIndentPx(chain.length)}px`);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-invalid', 'true');
  await release(page);
  expect(writes).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);

  // Aligned with T: X is S's child, after T, and X1 is at depth cap. The line
  // isn't marked invalid, and the release saves it.
  const second = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, second, projectSidebar.row(t), 'after', chain.length - 1);
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.dropLine).not.toHaveAttribute('data-drop-invalid', 'true');
  await release(page);
  await expect.poll(async () => (await fetchProject(request, ids.X)).parentId).toBe(ids[s]);
  expect((await fetchProject(request, ids.X)).position).toBeGreaterThan(
    (await fetchProject(request, ids[t])).position!,
  );
});

test('TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  const before = await fetchProject(request, ids.X);
  const writes = watchWrites(page);

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
  const writes = watchWrites(page);

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
  const ids = await seedProjects(request, [
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

  // A release ends the drag the same way, here by moving X ahead of A.
  const again = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, again, projectSidebar.row('A'), 'before', 0);
  await expect(projectSidebar.row('X1')).toHaveCSS('opacity', dimmed);
  await release(page);

  const aPosition = (await fetchProject(request, ids.A)).position!;
  await expect.poll(async () => (await fetchProject(request, ids.X)).position).toBeLessThan(aPosition);
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

test('TREE-2.3: a collapsed project opened by a drop stays open if the move fails', async ({
  page,
  request,
  projectSidebar,
}) => {
  await seedProjects(request, [
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['X', null],
  ]);
  await page.goto('/');
  await projectSidebar.toggle('T');
  await expect(projectSidebar.projectName('T1')).not.toBeVisible();
  // The server refuses every move.
  await page.route('**/api/projects/*/move', route =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'refused' }) }),
  );

  // X is released one tab right of T, as its first child.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('T'), 'after', 1);
  const refused = page.waitForResponse(res => res.url().endsWith('/move'));
  await release(page);
  expect((await refused).status()).toBe(400);

  // T is open, showing its children, and X is back after it, at the top level.
  await expect(projectSidebar.row('T').getByTitle('Collapse')).toBeVisible();
  await expect(projectSidebar.projectNames('T', 'T1', 'T2', 'X')).toHaveText(['T', 'T1', 'T2', 'X']);
  await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(0)}px`);
});
