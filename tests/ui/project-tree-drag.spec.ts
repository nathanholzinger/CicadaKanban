import { holdNextRead, settledWrites, watchWrites } from '../helpers/requestHarness';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { dragOverlay } from '../helpers/boardLocators';
import { cancel, hoverTo, moveOnce, paintedBoxOf, pickUp, release } from '../helpers/dragGesture';
import {
  aim,
  aimAtOwnRow,
  ghostSlot,
  drawnProjectNames,
  expectProjectLine,
  expectSavedProjectTree,
} from '../helpers/projectTreeDrag';
import { fetchProject, fetchProjectDepthCap, seedProjects } from '../helpers/seed';
import { holdRequests } from '../helpers/holdRequests';
import {
  INDENT_WIDTH,
  projectNameIndentPx,
  projectRowIndentPx,
} from '../../client/src/components/sidebar/projectTreeUtils';

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
// The rows of TREE_1 other than the one dragged.
const TREE_1_ROWS = ['A', 'A1', 'A1a', 'B'];

test('TREE-1.1: the ghost shows the gap and depth, and a release saves exactly that placement', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  const restAt = async (name: string) => paintedBoxOf(projectSidebar.row(name));
  const rest = { A: await restAt('A'), A1: await restAt('A1'), A1a: await restAt('A1a'), B: await restAt('B') };

  // The ghost goes between A1a and B, at A1a's depth.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), 2);

  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['A1a', 'B']);
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '2');
  // The line rides the ghost's top edge, and starts where a name at its depth starts.
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.ghost.locator('[data-drop-line]')).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', '2');
  await expect(projectSidebar.dropLine).toHaveCSS('margin-left', `${projectNameIndentPx(2)}px`);

  // B slid a row down to make room, the rows above stayed, and no row was added for the ghost: it is X's own.
  await expect.poll(async () => (await restAt('B')).y).toBe(rest.B.y + rest.B.height);
  for (const name of ['A', 'A1', 'A1a'] as const) expect((await restAt(name)).y).toBe(rest[name].y);
  await expect(projectSidebar.dragHandles).toHaveCount(5);

  await release(page);

  // X is saved as A1's child, after A1a, where the ghost was.
  await expect.poll(async () => (await fetchProject(request, ids.X)).parentId).toBe(ids.A1);
  const x = await fetchProject(request, ids.X);
  const a1a = await fetchProject(request, ids.A1a);
  expect(x.position).toBeGreaterThan(a1a.position!);
  await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(2)}px`);
});

test('TREE-1.1: a release with no movement after the last row was crossed saves the gap the ghost shows', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['A', null],
    ['B', null],
    ['C', null],
  ]);
  await page.goto('/');
  const moves: unknown[] = [];
  page.on('request', req => {
    if (req.method() === 'PATCH' && req.url().endsWith('/move')) moves.push(req.postDataJSON());
  });
  const pitch = (await paintedBoxOf(projectSidebar.row('B'))).y - (await paintedBoxOf(projectSidebar.row('A'))).y;

  // One movement, the last, takes the copy past the point where B is the nearest row. dnd-kit names the
  // new row to the sidebar after that move, so there is no further movement to catch up with.
  const from = await pickUp(page, projectSidebar.dragHandle('A'));
  await moveOnce(page, { x: from.x, y: from.y + pitch * 0.75 });
  await expect.poll(() => ghostSlot(projectSidebar, ['B', 'C'])).toEqual(['B', 'C']);

  await release(page);

  // A is saved after B at the top level, where the ghost was.
  await expect.poll(() => moves.length).toBe(1);
  expect(moves[0]).toEqual({ parentId: null, prevId: ids.B, nextId: null });
  await expect(projectSidebar.projectNames('B', 'A', 'C')).toHaveText(['B', 'A', 'C']);
  expect((await fetchProject(request, ids.A)).parentId).toBeNull();
  // And the order is the stored one.
  await page.reload();
  await expect(projectSidebar.projectNames('B', 'A', 'C')).toHaveText(['B', 'A', 'C']);
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
  const dragX = async (over: string, tabs: number) => {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row(over), tabs);
    await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', String(tabs));
    await expectProjectLine(projectSidebar);
    await release(page);
  };

  // Released between A1a and B, at A1a's depth: A1's child, after A1a.
  const first = await seedProjects(request, TREE_1);
  await expectSavedProjectTree(request, first, TREE_1);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(TREE_1.map(([name]) => name));
  await dragX('B', 2);
  await expect.poll(() => moves.length).toBe(1);
  expect(moves[0]).toEqual({ parentId: first.A1, prevId: first.A1a, nextId: null });
  // Saved where the ghost was: A1's child, after A1a.
  await expect.poll(async () => (await fetchProject(request, first.X)).parentId).toBe(first.A1);
  const a1aPosition = (await fetchProject(request, first.A1a)).position!;
  expect((await fetchProject(request, first.X)).position).toBeGreaterThan(a1aPosition);

  // Released above the first row: top-level, before A.
  await resetAndSeedDb();
  const second = await seedProjects(request, TREE_1);
  await expectSavedProjectTree(request, second, TREE_1);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(TREE_1.map(([name]) => name));
  await dragX('A', 0);
  await expect.poll(() => moves.length).toBe(2);
  expect(moves[1]).toEqual({ parentId: null, prevId: null, nextId: second.A });

  // Saved where the ghost was: the stored position puts X before A, and
  // the sidebar shows it first.
  const aPosition = (await fetchProject(request, second.A)).position!;
  await expect.poll(async () => (await fetchProject(request, second.X)).position).toBeLessThan(aPosition);
  await expect(projectSidebar.projectNames('X', 'A', 'A1', 'A1a', 'B')).toHaveText(['X', 'A', 'A1', 'A1a', 'B']);
});

test('TREE-1.4: the all-project subtree offers only its own place, without a line or a write', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['X', null],
    ['X1', 'X'],
    ['X2', 'X'],
  ] as const;
  const ids = await seedProjects(request, tree);
  const before = await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'X1', 'X2']);
  const pickup = await paintedBoxOf(projectSidebar.row('X'));
  const writes = watchWrites(page);
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  for (const [tabs, rowsAway] of [
    [0, 0],
    [-3, -1],
    [3, 2],
  ] as const) {
    await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: from.y + rowsAway * pickup.height });
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X']);
    await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '0');
    await expect(projectSidebar.dropLine).toHaveCount(0);
    await expect.poll(async () => (await paintedBoxOf(projectSidebar.ghost)).y).toBe(pickup.y);
  }
  await release(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await expectSavedProjectTree(request, ids, tree)).toEqual(before);
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
  await expectSavedProjectTree(request, ids, [
    ...chain.map((name, i) => [name, i === 0 ? null : chain[i - 1]] as const),
    ['X', null],
    ['X1', 'X'],
  ]);
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'X', 'X1']);

  // One tab right of T, in X's own gap: X would be T's child, and X1 at depth cap + 1. The state is
  // still offered, with the ghost at that depth, its line and the carried copy marked invalid. A
  // release writes nothing.
  const first = await pickUp(page, projectSidebar.dragHandle('X'));
  await aimAtOwnRow(page, first, chain.length);
  await expect.poll(() => ghostSlot(projectSidebar, chain)).toEqual([t, null]);
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', `${chain.length}`);
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveCSS('margin-left', `${projectNameIndentPx(chain.length)}px`);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-invalid', 'true');
  await expect(dragOverlay(page)).toHaveCSS('outline-style', 'dashed');
  await expectProjectLine(projectSidebar);
  await release(page);
  expect(writes).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);

  // Aligned with T: X is S's child, after T, and X1 is at depth cap. The ghost, its line and the copy
  // aren't marked invalid, and the release saves it.
  const second = await pickUp(page, projectSidebar.dragHandle('X'));
  await aimAtOwnRow(page, second, chain.length - 1);
  await expect.poll(() => ghostSlot(projectSidebar, chain)).toEqual([t, null]);
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', `${chain.length - 1}`);
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.dropLine).not.toHaveAttribute('data-drop-invalid', 'true');
  await expect(dragOverlay(page)).toHaveCSS('outline-style', 'none');
  await expectProjectLine(projectSidebar);
  await release(page);
  await expect.poll(async () => (await fetchProject(request, ids.X)).parentId).toBe(ids[s]);
  expect((await fetchProject(request, ids.X)).position).toBeGreaterThan(
    (await fetchProject(request, ids[t])).position!,
  );
  expect((await fetchProject(request, ids.X1)).parentId).toBe(ids.X);
  await expect(projectSidebar.row('X1')).toHaveCSS('padding-left', `${projectRowIndentPx(cap - 1)}px`);
});

test('TREE-1.8: a project set back down in its own gap, at its own depth, writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  await expectSavedProjectTree(request, ids, TREE_1);
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(TREE_1.map(([name]) => name));
  const before = await fetchProject(request, ids.X);
  const writes = watchWrites(page);

  // X's own gap is below B, at the top level: the ghost is between B and the end of the list.
  const handle = projectSidebar.dragHandle('X');

  // The cursor leaves X's row for the gap above B, and goes on to X's own gap.
  const from = await pickUp(page, handle);
  await aim(page, from, projectSidebar.row('B'), 0);
  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['A1a', 'B']);
  await expectProjectLine(projectSidebar);
  await aimAtOwnRow(page, from, 0);
  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['B', null]);
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '0');
  await expectProjectLine(projectSidebar);
  await release(page);

  // Released before the cursor has left X's row. Picking up drifts the pointer
  // sideways, which on X's own row picks a depth, so it rests back at the start.
  await pickUp(page, handle);
  await hoverTo(page, from);
  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['B', null]);
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '0');
  await expectProjectLine(projectSidebar);
  await release(page);

  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);
});

test('TREE-1.9: coming back nearest the dragged project’s own row returns the ghost to its own gap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, TREE_1);
  await page.goto('/');
  const before = await fetchProject(request, ids.X);
  const writes = watchWrites(page);

  // The ghost shows the gap between A1a and B, then the cursor comes back to
  // X's own row: the ghost, and the line with it, go to X's own gap, below B.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), 0);
  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['A1a', 'B']);
  await hoverTo(page, from);
  await expect.poll(() => ghostSlot(projectSidebar, TREE_1_ROWS)).toEqual(['B', null]);
  // The one line is the ghost's own, at its depth. (That it rides the ghost's top edge is the row's:
  // SortableProjectRow.test.tsx.)
  await expect(projectSidebar.dropLine).toHaveCount(1);
  await expect(projectSidebar.ghost.locator('[data-drop-line]')).toHaveCount(1);
  await expect(projectSidebar.dropLine).toHaveAttribute('data-drop-line', '0');
  await release(page);

  expect(writes).toEqual([]);
  expect(await fetchProject(request, ids.X)).toEqual(before);
});

test('TREE-2.1: the branch is absent, its space closes, and ghost and tiers clear at release or cancel', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['A', null],
    ['X', null],
    ['X1', 'X'],
    ['X1a', 'X1'],
    ['B', null],
  ] as const;
  expect(await fetchProjectDepthCap(request)).toBeGreaterThanOrEqual(4);
  for (const ending of ['release', 'cancel'] as const) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, tree);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'X', 'X1', 'X1a', 'B']);
    if (ending === 'cancel') {
      await projectSidebar.toggle('X1');
      await expect(projectSidebar.projectName('X1a')).toHaveCount(0);
    }
    const firstChild = await paintedBoxOf(projectSidebar.row('X1'));
    const writes = watchWrites(page);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'X', 'B']);
    await expect.poll(async () => (await paintedBoxOf(projectSidebar.row('B'))).y).toBe(firstChild.y);
    for (const name of ['A', 'B']) await expect(projectSidebar.row(name)).toHaveAttribute('data-drop-tier', 'parent');
    await expect(projectSidebar.ghost).toHaveCount(1);
    await expect(projectSidebar.ghost.locator('[data-drop-tier]')).toHaveCount(0);
    await aim(page, from, projectSidebar.row('B'), 0);
    await expect.poll(() => ghostSlot(projectSidebar, ['A', 'B'])).toEqual(['B', null]);
    await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '0');
    await expect(projectSidebar.projectName('X1')).toHaveCount(0);
    await expect(projectSidebar.projectName('X1a')).toHaveCount(0);
    if (ending === 'release') {
      await release(page);
      await expectSavedProjectTree(request, ids, [
        ['A', null],
        ['B', null],
        ['X', null],
        ['X1', 'X'],
        ['X1a', 'X1'],
      ]);
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'B', 'X', 'X1', 'X1a']);
      expect(await settledWrites(page, writes)).toHaveLength(1);
    } else {
      await cancel(page);
      await expectSavedProjectTree(request, ids, tree);
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'X', 'X1', 'B']);
      await expect(projectSidebar.row('X1').getByTitle('Expand')).toBeVisible();
      expect(await settledWrites(page, writes)).toEqual([]);
    }
    await expect(projectSidebar.ghost).toHaveCount(0);
    await expect(projectSidebar.locator.locator('[data-drop-tier]')).toHaveCount(0);
  }
});

test('TREE-2.2: a child drop opens the collapsed parent before its answer and a sibling set-down leaves it collapsed', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['X', null],
  ] as const;
  for (const child of [true, false]) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, tree);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'T1', 'T2', 'X']);
    await projectSidebar.toggle('T');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'X']);
    const moves = await holdRequests(page, {
      method: 'PATCH',
      url: `**/api/projects/${ids.X}/move`,
      outcome: 'succeed',
    });
    const writes = watchWrites(page);
    try {
      const from = await pickUp(page, projectSidebar.dragHandle('X'));
      await aimAtOwnRow(page, from, child ? 1 : 0);
      await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', child ? '1' : '0');
      await release(page);
      if (child) {
        await moves.arrived();
        await expect.poll(async () => (await fetchProject(request, ids.X)).parentId).toBe(ids.T);
        await expect(projectSidebar.row('T').getByTitle('Collapse')).toBeVisible();
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'X', 'T1', 'T2']);
        await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
        moves.release();
        await expectSavedProjectTree(request, ids, [
          ['T', null],
          ['X', 'T'],
          ['T1', 'T'],
          ['T2', 'T'],
        ]);
        expect(await settledWrites(page, writes)).toHaveLength(1);
      } else {
        await expect(projectSidebar.row('T').getByTitle('Expand')).toBeVisible();
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'X']);
        expect(await settledWrites(page, writes)).toEqual([]);
      }
    } finally {
      moves.release();
    }
  }
});

test('TREE-2.3: refusal restores X before the following read while the drop-opened parent stays expanded', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['X', null],
  ] as const;
  const ids = await seedProjects(request, tree);
  const saved = await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'T1', 'T2', 'X']);
  await projectSidebar.toggle('T');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'X']);
  const moves = await holdRequests(page, { method: 'PATCH', url: `**/api/projects/${ids.X}/move`, outcome: 'refuse' });
  const read = await holdNextRead(page, '**/api/projects');
  const writes = watchWrites(page);
  try {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aimAtOwnRow(page, from, 1);
    await release(page);
    await moves.arrived();
    await expect(projectSidebar.row('T').getByTitle('Collapse')).toBeVisible();
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'X', 'T1', 'T2']);
    const refused = page.waitForResponse(response => response.url().endsWith(`/projects/${ids.X}/move`));
    moves.release();
    expect((await refused).status()).toBe(400);
    await read.arrived();
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'T1', 'T2', 'X']);
    await expect(projectSidebar.row('T').getByTitle('Collapse')).toBeVisible();
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(0)}px`);
    expect(await expectSavedProjectTree(request, ids, tree)).toEqual(saved);
    read.release();
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'T1', 'T2', 'X']);
    expect(await settledWrites(page, writes)).toHaveLength(1);
  } finally {
    moves.release();
    await read.dispose();
  }
});
