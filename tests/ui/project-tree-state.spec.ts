import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { dragOverlay } from '../helpers/boardLocators';
import { boxOf, cancel, hoverTo, paintedBoxOf, pickUpBeforeMove, release, textLayoutOf } from '../helpers/dragGesture';
import {
  aim,
  aimAtOwnRow,
  drawnProjectNames,
  expectProjectGhost,
  expectSavedProjectTree,
} from '../helpers/projectTreeDrag';
import { holdNextWrite, settledWrites, successfulWrite, watchWrites } from '../helpers/requestHarness';
import { fetchProject, fetchProjectDepthCap, pinProjectParent, seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../../client/src/components/sidebar/sidebarWidth';

type Tree = ReadonlyArray<readonly [string, string | null]>;

async function openTree(page: Page, request: APIRequestContext, sidebar: ProjectSidebarPage, tree: Tree) {
  await resetAndSeedDb();
  const ids = await seedProjects(request, tree);
  await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(sidebar)).toEqual(tree.map(([name]) => name));
  return ids;
}

// Reads the app's assigned target tier, separately from painted opacity.
const tier = (sidebar: ProjectSidebarPage, name: string, value: 'parent' | 'anchor' | 'neither') =>
  expect(sidebar.row(name)).toHaveAttribute('data-drop-tier', value);

// Reads the ghost marker and absence of a target tier on its content.
async function untieredGhost(sidebar: ProjectSidebarPage) {
  await expect(sidebar.ghost).toHaveCount(1);
  await expect(sidebar.ghost.locator('[data-drop-tier]')).toHaveCount(0);
}

test('TREE-2.4: the configured cap chain retains every row with Full, Mid, Low and a separate ghost', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  expect(cap).toBeGreaterThanOrEqual(4);
  const chain = Array.from({ length: cap }, (_, i) => `P${i + 1}`);
  const tree: Tree = [...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const), ['X', null], ['X1', 'X']];
  await openTree(page, request, projectSidebar, tree);
  await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'X']);
  for (const name of chain.slice(0, -2)) await tier(projectSidebar, name, 'parent');
  await tier(projectSidebar, chain[cap - 2], 'anchor');
  await tier(projectSidebar, chain[cap - 1], 'neither');
  await untieredGhost(projectSidebar);
  await expect(projectSidebar.projectName('X1')).toHaveCount(0);
  await cancel(page);
});

test('TREE-2.5: root fit makes unrelated top-level rows Mid and an over-tall branch makes every row Low', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  for (const height of [cap - 1, cap]) {
    await resetAndSeedDb();
    const descendants = Array.from({ length: height }, (_, i) => `X${i + 1}`);
    const tree: Tree = [
      ['A', null],
      ['A1', 'A'],
      ['B', null],
      ['B1', 'B'],
      ['X', null],
      ...descendants.map((name, i) => [name, i ? descendants[i - 1] : 'X'] as const),
    ];
    const ids = await seedProjects(
      request,
      tree.map(([name]) => [name, null] as const),
    );
    for (const [name, parent] of tree) if (parent) await pinProjectParent(request, ids[name], ids[parent]);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(tree.map(([name]) => name));
    await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'A1', 'B', 'B1', 'X']);
    for (const name of ['A', 'B']) await tier(projectSidebar, name, height === cap ? 'neither' : 'anchor');
    for (const name of ['A1', 'B1']) await tier(projectSidebar, name, 'neither');
    await untieredGhost(projectSidebar);
    await cancel(page);
  }
});

test('TREE-2.6: the saved depth changes during a drag but pickup tiers persist until cancel and the next pickup', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  const chain = Array.from({ length: cap - 2 }, (_, i) => `Q${i + 1}`);
  const q = chain.at(-1)!;
  const tree: Tree = [
    ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
    ['M', q],
    ['L', 'M'],
    ['P', null],
    ['X', null],
    ['X1', 'X'],
  ];
  const ids = await openTree(page, request, projectSidebar, tree);
  await projectSidebar.select('P');
  const gate = await holdNextWrite(page, { method: 'PUT', url: `**/api/projects/${ids.P}`, outcome: 'succeed' });
  try {
    await page.locator('main').getByRole('combobox').selectOption(ids[q]);
    await gate.arrived();
    expect((await fetchProject(request, ids.P)).parentId).toBe(ids[q]);
    await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    await tier(projectSidebar, 'P', 'parent');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, 'L', 'neither');
    gate.release();
    await expect(projectSidebar.row('P')).toHaveCSS('padding-left', `${projectRowIndentPx(cap - 2)}px`);
    await tier(projectSidebar, 'P', 'parent');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, 'L', 'neither');
    await cancel(page);
    await expect(projectSidebar.locator.locator('[data-drop-tier]')).toHaveCount(0);
    await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    await tier(projectSidebar, 'P', 'anchor');
    await cancel(page);
  } finally {
    await gate.dispose();
  }
});

test('TREE-2.7: Mid retains a sibling line and Low retains a valid shallower state while over-cap still writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  const chain = Array.from({ length: cap }, (_, i) => `P${i + 1}`);
  const tree: Tree = [
    ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
    ['B', null],
    ['X', null],
    ['X1', 'X'],
  ];
  const ids = await openTree(page, request, projectSidebar, tree);
  const before = await expectSavedProjectTree(request, ids, tree);
  const writes = watchWrites(page);
  const from = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), cap - 2);
  await tier(projectSidebar, chain[cap - 2], 'anchor');
  await untieredGhost(projectSidebar);
  await expectProjectGhost(projectSidebar, [...chain, 'B'], [chain.at(-1)!, 'B'], cap - 2);
  await expect(projectSidebar.dropLine).not.toHaveAttribute('data-drop-tier', /.+/);
  await aim(page, from, projectSidebar.row('B'), cap);
  await expectProjectGhost(projectSidebar, [...chain, 'B'], [chain.at(-1)!, 'B'], cap, { invalid: true });
  await release(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await expectSavedProjectTree(request, ids, tree)).toEqual(before);
  const next = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  await tier(projectSidebar, chain.at(-1)!, 'neither');
  await aim(page, next, projectSidebar.row('B'), 0);
  await expectProjectGhost(projectSidebar, [...chain, 'B'], [chain.at(-1)!, 'B'], 0);
  await release(page);
  await expectSavedProjectTree(request, ids, [...tree.slice(0, cap), ['X', null], ['X1', 'X'], ['B', null]]);
  expect(await settledWrites(page, writes)).toHaveLength(1);
});

test('TREE-2.10: one count text line hangs outside the unchanged row box and lets B receive the drag', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['X', null],
    ['A', 'X'],
    ['B', null],
    ['Q', null],
  ] as const;
  const ids = await openTree(page, request, projectSidebar, tree);
  await projectSidebar.toggle('X');
  await expect(projectSidebar.row('X').getByTitle('Expand', { exact: true })).toBeVisible();
  await expect(projectSidebar.projectName('A')).toHaveCount(0);
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'B', 'Q']);
  const writes = watchWrites(page);
  const leafRow = await boxOf(projectSidebar.row('B'));
  await pickUpBeforeMove(page, projectSidebar.dragHandle('B'));
  const leafCopy = await boxOf(dragOverlay(page));
  expect(leafCopy.height, 'a carried leaf is one ordinary project row').toBe(leafRow.height);
  await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveCount(0);
  await cancel(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'B', 'Q']);
  const source = await boxOf(projectSidebar.row('X'));
  const nextBefore = await paintedBoxOf(projectSidebar.row('B'));
  const lastBefore = await paintedBoxOf(projectSidebar.row('Q'));
  const sidebarBefore = await boxOf(projectSidebar.locator);
  const from = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  const copy = dragOverlay(page);
  const countLine = copy.locator('[data-carried-branch]');
  await expect(countLine).toHaveText('+ 1 child');
  await expect(page.locator('[data-carried-branch]')).toHaveCount(1);
  await expect(projectSidebar.ghost.locator('[data-carried-branch]')).toHaveCount(0);
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'B', 'Q']);
  expect((await textLayoutOf(countLine.locator('span'))).rows, 'the count is one line of text').toBe(1);
  const copyBox = await paintedBoxOf(copy, { layoutSize: true });
  expect(copyBox.height, 'the count does not grow the source row box').toBe(source.height);
  expect(copyBox.height, 'a branch copy has the same measured height as a leaf copy').toBe(leafCopy.height);
  expect((await boxOf(projectSidebar.ghost)).height).toBe(source.height);
  expect((await paintedBoxOf(projectSidebar.row('B'))).y, 'no extra sidebar row before B').toBe(nextBefore.y);
  expect((await paintedBoxOf(projectSidebar.row('Q'))).y, 'no extra sidebar space below B').toBe(lastBefore.y);
  expect((await boxOf(projectSidebar.locator)).height).toBe(sidebarBefore.height);
  const lineBox = await paintedBoxOf(countLine);
  expect(lineBox.y, 'the second line is outside and below the measured copy').toBeGreaterThanOrEqual(
    copyBox.y + copyBox.height,
  );
  const next = await paintedBoxOf(projectSidebar.row('B'));
  const top = Math.max(lineBox.y, next.y);
  const bottom = Math.min(lineBox.y + lineBox.height, next.y + next.height);
  expect(bottom, 'the count line really covers part of B').toBeGreaterThan(top);
  const throughLine = { x: from.x, y: (top + bottom) / 2 };
  expect(throughLine.x).toBeGreaterThan(Math.max(lineBox.x, next.x));
  expect(throughLine.x).toBeLessThan(Math.min(lineBox.x + lineBox.width, next.x + next.width));
  // Browser hit-testing reads the covered row, independently of CSS classes or the drag's selected target.
  expect(
    await projectSidebar
      .row('B')
      .evaluate((row, point) => row.contains(document.elementFromPoint(point.x, point.y)), throughLine),
    'B receives the browser hit through the count line',
  ).toBe(true);
  await hoverTo(page, throughLine);
  await expectProjectGhost(projectSidebar, ['B', 'Q'], ['B', 'Q'], 0);
  expect((await paintedBoxOf(copy, { layoutSize: true })).height).toBe(leafCopy.height);
  expect((await paintedBoxOf(projectSidebar.row('Q'))).y).toBe(lastBefore.y);
  const answered = successfulWrite(page, 'PATCH', `/api/projects/${ids.X}/move`);
  await release(page);
  await answered;
  const moves = await settledWrites(page, writes);
  expect(moves).toHaveLength(1);
  expect(moves[0]).toEqual({
    method: 'PATCH',
    url: expect.stringMatching(new RegExp(`/api/projects/${ids.X}/move$`)),
    body: { parentId: null, prevId: ids.B, nextId: null },
  });
  await expectSavedProjectTree(request, ids, [
    ['B', null],
    ['X', null],
    ['A', 'X'],
    ['Q', null],
  ]);
});

test('TREE-2.11: narrow clipping never wraps or widens the sidebar and wide layout retains the same full counts', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['X', null],
    ['A', 'X'],
    ['A1', 'A'],
    ['A1a', 'A1'],
    ['B', 'X'],
    ['B1', 'B'],
    ['Q', null],
  ] as const;
  const count = '+ 2 children, 5 total descendants';
  for (const width of [120, 420]) {
    await page.addInitScript(({ key, width }) => localStorage.setItem(key, String(width)), {
      key: SIDEBAR_WIDTH_STORAGE_KEY,
      width,
    });
    const ids = await openTree(page, request, projectSidebar, tree);
    const sidebarBefore = await boxOf(projectSidebar.locator);
    const rowBefore = await boxOf(projectSidebar.row('X'));
    await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    const line = dragOverlay(page).locator('[data-carried-branch]');
    await expect(line).toHaveText(count);
    const metrics = await textLayoutOf(line.locator('span'));
    expect(metrics.rows, 'no wrapped third line').toBe(1);
    expect(metrics.contentLeft, 'count text begins within the row').toBeGreaterThanOrEqual(rowBefore.x);
    expect(metrics.contentRight, 'count text is constrained to the row').toBeLessThanOrEqual(
      rowBefore.x + rowBefore.width,
    );
    if (width === 120) {
      expect(metrics.scroll).toBeGreaterThan(metrics.client);
      expect(metrics.clips).toBe(true);
    } else expect(metrics.scroll).toBeLessThanOrEqual(metrics.client);
    expect((await boxOf(projectSidebar.locator)).width).toBe(sidebarBefore.width);
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'Q']);
    await cancel(page);
    await expectSavedProjectTree(request, ids, tree);
  }
});

test('TREE-2.12: all four endings restore the branch immediately and respect A collapse preference', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const cap = await fetchProjectDepthCap(request);
  const chain = Array.from({ length: cap - 2 }, (_, i) => `T${i + 1}`);
  const tree: Tree = [
    ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
    ['Q', null],
    ['X', null],
    ['A', 'X'],
    ['A1', 'A'],
    ['B', 'X'],
  ];
  for (const collapsed of [false, true])
    for (const ending of ['valid', 'escape', 'own', 'invalid']) {
      const ids = await openTree(page, request, projectSidebar, tree);
      const before = await expectSavedProjectTree(request, ids, tree);
      if (collapsed) {
        await projectSidebar.toggle('A');
        await expect(projectSidebar.projectName('A1')).toHaveCount(0);
      }
      const writes = watchWrites(page);
      const gate =
        ending === 'valid'
          ? await holdNextWrite(page, { method: 'PATCH', url: `**/api/projects/${ids.X}/move`, outcome: 'succeed' })
          : undefined;
      try {
        const from = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'Q', 'X']);
        await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveText(
          '+ 2 children, 3 total descendants',
        );
        if (ending === 'escape') await cancel(page);
        else {
          if (ending === 'invalid') {
            await aim(page, from, projectSidebar.row('Q'), cap - 2);
            await expectProjectGhost(projectSidebar, [...chain, 'Q'], [chain.at(-1)!, 'Q'], cap - 2, { invalid: true });
          } else {
            await aimAtOwnRow(page, from, ending === 'valid' ? 1 : 0);
            await expectProjectGhost(projectSidebar, [...chain, 'Q'], ['Q', null], ending === 'valid' ? 1 : 0);
          }
          await release(page);
        }
        if (gate) await gate.arrived();
        await expect
          .poll(() => drawnProjectNames(projectSidebar))
          .toEqual([...chain, 'Q', 'X', 'A', ...(collapsed ? [] : ['A1']), 'B']);
        await expect(projectSidebar.row('X')).toHaveCSS(
          'padding-left',
          `${projectRowIndentPx(ending === 'valid' ? 1 : 0)}px`,
        );
        await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveCount(0);
        await expect(projectSidebar.ghost).toHaveCount(0);
        await expect(projectSidebar.locator.locator('[data-drop-tier]')).toHaveCount(0);
        if (collapsed) await expect(projectSidebar.row('A').getByTitle('Expand')).toBeVisible();
        if (gate) {
          gate.release();
          await expectSavedProjectTree(request, ids, [
            ...tree.slice(0, cap - 1),
            ['X', 'Q'],
            ['A', 'X'],
            ['A1', 'A'],
            ['B', 'X'],
          ]);
          expect(await settledWrites(page, writes)).toHaveLength(1);
        } else {
          expect(await expectSavedProjectTree(request, ids, tree)).toEqual(before);
          expect(await settledWrites(page, writes)).toEqual([]);
        }
      } finally {
        if (gate) await gate.dispose();
      }
    }
});

test('TREE-2.13: the line stays on top at every boundary and follows all four name columns', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['A', null],
    ['A1', 'A'],
    ['A1a', 'A1'],
    ['B', null],
    ['X', null],
  ] as const;
  await openTree(page, request, projectSidebar, tree);
  const from = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  await expect(projectSidebar.ghost).toHaveAttribute('data-drag-ghost', '0');
  await aim(page, from, projectSidebar.row('A'), 0);
  await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], [null, 'A'], 0);
  let previousX = -Infinity;
  for (const depth of [0, 1, 2, 3]) {
    await aim(page, from, projectSidebar.row('B'), depth);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['A1a', 'B'], depth);
    const line = await paintedBoxOf(projectSidebar.dropLine);
    expect(line.x).toBeGreaterThan(previousX);
    previousX = line.x;
  }
  await aimAtOwnRow(page, from, 0);
  await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['B', null], 0);
  await cancel(page);
  await openTree(page, request, projectSidebar, [
    ['X', null],
    ['X1', 'X'],
  ]);
  const empty = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
  await aimAtOwnRow(page, empty, 3);
  await expect(projectSidebar.dropLine).toHaveCount(0);
  await cancel(page);
});

test('TREE-2.14: a late created row stays untiered and reachable until cancel then becomes Mid at the next pickup', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  expect(cap).toBeGreaterThanOrEqual(3);
  const chain = Array.from({ length: cap - 2 }, (_, i) => `T${i + 1}`);
  const t = chain.at(-1)!;
  const tree: Tree = [
    ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
    ['M', t],
    ['L', 'M'],
    ['X', null],
    ['X1', 'X'],
  ];
  const ids = await openTree(page, request, projectSidebar, tree);
  const gate = await holdNextWrite(page, { method: 'POST', url: '**/api/projects', outcome: 'succeed' });
  try {
    await projectSidebar.createSubproject(t, 'Y');
    const saved = await gate.arrived();
    ids.Y = (saved.body as { id: string }).id;
    expect((await fetchProject(request, ids.Y)).parentId).toBe(ids[t]);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(projectSidebar.projectName('Y')).toHaveCount(0);
    const writes = watchWrites(page);
    const from = await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    await tier(projectSidebar, t, 'parent');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, 'L', 'neither');
    gate.release();
    await expect(projectSidebar.row('Y')).toHaveCSS('padding-left', `${projectRowIndentPx(cap - 2)}px`);
    await expect(projectSidebar.row('Y')).not.toHaveAttribute('data-drop-tier', /.+/);
    await tier(projectSidebar, t, 'parent');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, 'L', 'neither');
    await aim(page, from, projectSidebar.row('Y'), cap - 2);
    await expectProjectGhost(projectSidebar, [...chain, 'M', 'L', 'Y'], ['L', 'Y'], cap - 2);
    await expect(projectSidebar.row('Y')).not.toHaveAttribute('data-drop-tier', /.+/);
    await tier(projectSidebar, t, 'parent');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, 'L', 'neither');
    await cancel(page);
    expect(await settledWrites(page, writes)).toEqual([]);
    expect((await fetchProject(request, ids.Y)).parentId).toBe(ids[t]);
    await pickUpBeforeMove(page, projectSidebar.dragHandle('X'));
    await tier(projectSidebar, 'Y', 'anchor');
    await tier(projectSidebar, 'M', 'anchor');
    await tier(projectSidebar, t, 'parent');
    await tier(projectSidebar, 'L', 'neither');
    await cancel(page);
  } finally {
    await gate.dispose();
  }
});
