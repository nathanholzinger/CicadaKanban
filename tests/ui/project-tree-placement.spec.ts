import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { dragOverlay } from '../helpers/boardLocators';
import { atFraction, boxOf, cancel, hoverTo, moveOnce, pickUp, recordGeometry, release } from '../helpers/dragGesture';
import {
  aim,
  aimAtOwnRow,
  drawnProjectNames,
  expectProjectGhost,
  expectSavedProjectTree,
  ghostSlot,
} from '../helpers/projectTreeDrag';
import { holdNextRead, holdNextWrite, settledWrites, watchWrites } from '../helpers/requestHarness';
import { fetchProject, fetchProjectDepthCap, pinProjectParent, seedProjects } from '../helpers/seed';
import { projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';

const TREE = [
  ['A', null],
  ['A1', 'A'],
  ['A1a', 'A1'],
  ['B', null],
  ['X', null],
] as const;
type Tree = ReadonlyArray<readonly [string, string | null]>;

test.beforeEach(async () => {
  await resetAndSeedDb();
});

test('TREE-1.2: the four gap depths save their named placements and the parent-child gap has one state', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  for (const depth of [3, 2, 1, 0]) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, TREE);
    await expectSavedProjectTree(request, ids, TREE);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'A1', 'A1a', 'B', 'X']);
    const writes = watchWrites(page);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row('B'), -3);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['A1a', 'B'], 0);
    await aim(page, from, projectSidebar.row('B'), 6);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['A1a', 'B'], 3);
    await aim(page, from, projectSidebar.row('B'), depth);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['A1a', 'B'], depth);
    await release(page);
    const expected: Tree =
      depth === 3
        ? [
            ['A', null],
            ['A1', 'A'],
            ['A1a', 'A1'],
            ['X', 'A1a'],
            ['B', null],
          ]
        : depth === 2
          ? [
              ['A', null],
              ['A1', 'A'],
              ['A1a', 'A1'],
              ['X', 'A1'],
              ['B', null],
            ]
          : depth === 1
            ? [
                ['A', null],
                ['A1', 'A'],
                ['A1a', 'A1'],
                ['X', 'A'],
                ['B', null],
              ]
            : [
                ['A', null],
                ['A1', 'A'],
                ['A1a', 'A1'],
                ['X', null],
                ['B', null],
              ];
    await expectSavedProjectTree(request, ids, expected);
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected.map(([name]) => name));
    expect(await settledWrites(page, writes)).toHaveLength(1);
  }
  await resetAndSeedDb();
  const ids = await seedProjects(request, TREE);
  await expectSavedProjectTree(request, ids, TREE);
  await page.goto('/');
  await expect(projectSidebar.row('A1a')).toBeVisible();
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  for (const tabs of [-3, 2, 6]) {
    await aim(page, from, projectSidebar.row('A1a'), tabs);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['A1', 'A1a'], 2);
  }
  await cancel(page);
});

test('TREE-1.5: collapsed T supplies its real first child and complete subtree to both placements', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['U', null],
    ['X', null],
  ] as const;
  for (const depth of [1, 0]) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, tree);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'T1', 'T2', 'U', 'X']);
    await projectSidebar.toggle('T');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['T', 'U', 'X']);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row('U'), depth);
    await expectProjectGhost(projectSidebar, ['T', 'U'], ['T', 'U'], depth);
    await release(page);
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(depth)}px`);
    await expectSavedProjectTree(
      request,
      ids,
      depth === 1
        ? [
            ['T', null],
            ['X', 'T'],
            ['T1', 'T'],
            ['T2', 'T'],
            ['U', null],
          ]
        : [
            ['T', null],
            ['T1', 'T'],
            ['T2', 'T'],
            ['X', null],
            ['U', null],
          ],
    );
  }
});

test('TREE-1.6: the own gap has two depths and no carried descendant can be a neighbor', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['A', null],
    ['X', null],
    ['X1', 'X'],
    ['X2', 'X'],
    ['B', null],
  ] as const;
  const ids = await seedProjects(request, tree);
  await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'X', 'X1', 'X2', 'B']);
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  for (const [tabs, depth] of [
    [-3, 0],
    [0, 0],
    [4, 1],
    [1, 1],
  ]) {
    await aimAtOwnRow(page, from, tabs);
    await expectProjectGhost(projectSidebar, ['A', 'B'], ['A', 'B'], depth);
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'X', 'B']);
  }
  await release(page);
  await expectSavedProjectTree(request, ids, [
    ['A', null],
    ['X', 'A'],
    ['X1', 'X'],
    ['X2', 'X'],
    ['B', null],
  ]);
});

test('TREE-1.10: own-row offset selects B first child, clamps right, and own depth writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  for (const tabs of [1, 4, 0]) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, TREE);
    const before = await expectSavedProjectTree(request, ids, TREE);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'A1', 'A1a', 'B', 'X']);
    const writes = watchWrites(page);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aimAtOwnRow(page, from, tabs);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A1a', 'B'], ['B', null], tabs === 0 ? 0 : 1);
    await release(page);
    if (tabs === 0) expect(await expectSavedProjectTree(request, ids, TREE)).toEqual(before);
    else
      await expectSavedProjectTree(request, ids, [
        ['A', null],
        ['A1', 'A'],
        ['A1a', 'A1'],
        ['B', null],
        ['X', 'B'],
      ]);
    expect(await settledWrites(page, writes)).toHaveLength(tabs === 0 ? 0 : 1);
  }
});

test('TREE-1.13: a too-tall existing subtree is invalid at the root while the exact-fit subtree saves', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const cap = await fetchProjectDepthCap(request);
  for (const height of [cap, cap - 1]) {
    await resetAndSeedDb();
    const descendants = Array.from({ length: height }, (_, i) => `M${i + 1}`);
    const names = ['R', 'R1', 'M', ...descendants, 'B'];
    const ids = await seedProjects(
      request,
      names.map(name => [name, null] as const),
    );
    const source: Tree = [
      ['R', null],
      ['R1', 'R'],
      ['M', 'R1'],
      ...descendants.map((name, i) => [name, i ? descendants[i - 1] : 'M'] as const),
      ['B', null],
    ];
    for (const [name, parent] of source) if (parent) await pinProjectParent(request, ids[name], ids[parent]);
    const before = await expectSavedProjectTree(request, ids, source);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(names);
    const writes = watchWrites(page);
    const from = await pickUp(page, projectSidebar.dragHandle('M'));
    await aim(page, from, projectSidebar.row('B'), -2);
    await expectProjectGhost(projectSidebar, ['R', 'R1', 'B'], ['B', null], 0, { name: 'M', invalid: height === cap });
    await expect(dragOverlay(page)).toHaveCSS('outline-style', height === cap ? 'dashed' : 'none');
    await release(page);
    if (height === cap) expect(await expectSavedProjectTree(request, ids, source)).toEqual(before);
    else
      await expectSavedProjectTree(request, ids, [
        ['R', null],
        ['R1', 'R'],
        ['B', null],
        ['M', null],
        ...descendants.map((name, i) => [name, i ? descendants[i - 1] : 'M'] as const),
      ]);
    expect(await settledWrites(page, writes)).toHaveLength(height === cap ? 0 : 1);
  }
});

test('TREE-1.15: edit and create growth retain the pickup height, and shrink retains it until the next drag', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const cap = await fetchProjectDepthCap(request);
  const chain = Array.from({ length: cap - 1 }, (_, i) => `P${i + 1}`);
  const t = chain.at(-1)!;
  const stem: Tree = chain.map((name, i) => [name, i ? chain[i - 1] : null]);
  for (const kind of ['edit-growth', 'create-growth', 'shrink'] as const) {
    await resetAndSeedDb();
    const tree: Tree = [
      ...stem,
      ['X', null],
      ...(kind === 'create-growth' ? [] : [['Y', kind === 'shrink' ? 'X' : null] as const]),
    ];
    const ids = await seedProjects(request, tree);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(tree.map(([name]) => name));
    const gate = await holdNextWrite(page, {
      method: kind === 'create-growth' ? 'POST' : 'PUT',
      url: kind === 'create-growth' ? '**/api/projects' : `**/api/projects/${ids.Y}`,
      outcome: 'succeed',
    });
    try {
      if (kind === 'create-growth') {
        await projectSidebar.row('X').hover();
        await projectSidebar.row('X').getByTitle('Add subproject').click();
        await page.getByPlaceholder('Subproject name').fill('Y');
        await page.getByRole('button', { name: 'Create subproject' }).click();
      } else {
        await projectSidebar.select('Y');
        await page
          .locator('main')
          .getByRole('combobox')
          .selectOption(kind === 'shrink' ? '' : ids.X);
      }
      const held = await gate.arrived();
      expect(held.status).toBeGreaterThanOrEqual(200);
      expect(held.status).toBeLessThan(300);
      if (kind === 'create-growth') ids.Y = (held.body as { id: string }).id;
      const savedTree: Tree = [...stem, ['X', null], ['Y', kind === 'shrink' ? null : 'X']];
      const saved = await expectSavedProjectTree(request, ids, savedTree);
      if (kind === 'create-growth') {
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      const writes = watchWrites(page);
      const from = await pickUp(page, projectSidebar.dragHandle('X'));
      await expect(projectSidebar.ghost).toHaveCount(1);
      if (kind === 'shrink') await expect(projectSidebar.ghost.getByTitle('Collapse')).toBeVisible();
      gate.release();
      if (kind === 'shrink') {
        await expect(projectSidebar.ghost.getByTitle('Collapse')).toBeHidden();
        await expect(page.locator('main').getByRole('navigation')).toHaveCount(0);
        await expect(projectSidebar.projectName('Y')).toHaveCount(0);
      } else await expect(projectSidebar.row('Y')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
      await aimAtOwnRow(page, from, cap - 1);
      await expectProjectGhost(
        projectSidebar,
        kind === 'shrink' ? chain : [...chain, 'Y'],
        [t, kind === 'shrink' ? null : 'Y'],
        cap - 1,
        { invalid: kind === 'shrink' },
      );
      if (kind === 'shrink') {
        await release(page);
        expect(await settledWrites(page, writes)).toEqual([]);
      } else {
        const refused = page.waitForResponse(response => response.url().endsWith(`/projects/${ids.X}/move`));
        await release(page);
        expect((await refused).status()).toBe(400);
        expect(await settledWrites(page, writes)).toHaveLength(1);
      }
      expect(await expectSavedProjectTree(request, ids, savedTree)).toEqual(saved);
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'X', 'Y']);
      await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(0)}px`);
      await expect(projectSidebar.row('Y')).toHaveCSS(
        'padding-left',
        `${projectRowIndentPx(kind === 'shrink' ? 0 : 1)}px`,
      );
      const nextWrites = watchWrites(page);
      const next = await pickUp(page, projectSidebar.dragHandle('X'));
      await aimAtOwnRow(page, next, cap - 1);
      await expectProjectGhost(
        projectSidebar,
        kind === 'shrink' ? [...chain, 'Y'] : chain,
        [t, kind === 'shrink' ? 'Y' : null],
        cap - 1,
        { invalid: kind !== 'shrink' },
      );
      await release(page);
      if (kind === 'shrink') {
        await expectSavedProjectTree(request, ids, [...stem, ['X', t], ['Y', null]]);
        expect(await settledWrites(page, nextWrites)).toHaveLength(1);
      } else expect(await settledWrites(page, nextWrites)).toEqual([]);
    } finally {
      await gate.dispose();
    }
  }
});

test('TREE-1.16: an edited-out or rolled-back descendant stays hidden until the drag ends', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  for (const kind of ['edit', 'refused-drag'] as const) {
    await resetAndSeedDb();
    const tree: Tree =
      kind === 'edit'
        ? [
            ['X', null],
            ['Y', 'X'],
            ['B', null],
          ]
        : [
            ['X', null],
            ['B', null],
            ['Y', 'B'],
          ];
    const ids = await seedProjects(request, tree);
    await expectSavedProjectTree(request, ids, tree);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(tree.map(([name]) => name));
    const gate = await holdNextWrite(page, {
      method: kind === 'edit' ? 'PUT' : 'PATCH',
      url: `**/api/projects/${ids.Y}${kind === 'edit' ? '' : '/move'}`,
      outcome: kind === 'edit' ? 'succeed' : 'refuse',
    });
    let read: Awaited<ReturnType<typeof holdNextRead>> | undefined;
    try {
      if (kind === 'edit') {
        await projectSidebar.select('Y');
        await page.locator('main').getByRole('combobox').selectOption(ids.B);
      } else {
        const earlier = await pickUp(page, projectSidebar.dragHandle('Y'));
        await aim(page, earlier, projectSidebar.row('B'), 0);
        await release(page);
        await expect(projectSidebar.row('Y')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
        read = await holdNextRead(page, '**/api/projects');
      }
      await gate.arrived();
      const from = await pickUp(page, projectSidebar.dragHandle('X'));
      await expect(projectSidebar.projectName('Y')).toHaveCount(0);
      await expect(projectSidebar.ghost.getByTitle('Collapse')).toBeVisible();
      const writes = watchWrites(page);
      gate.release();
      await expect(projectSidebar.ghost.getByTitle('Collapse')).toBeHidden();
      await expect(projectSidebar.projectName('Y')).toHaveCount(0);
      if (read) {
        await read.arrived();
        await expect(projectSidebar.projectName('Y')).toHaveCount(0);
        const readAnswer = page.waitForResponse(
          response => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/projects',
        );
        read.release();
        const response = await readAnswer;
        expect(response.ok()).toBe(true);
        await response.finished();
        await expect(projectSidebar.ghost).toHaveCount(1);
        await expect(projectSidebar.ghost.getByTitle('Collapse')).toBeHidden();
        await expect(projectSidebar.projectName('Y')).toHaveCount(0);
      } else {
        await expect(
          page.locator('main').getByRole('navigation').getByRole('button', { name: 'B', exact: true }),
        ).toBeVisible();
      }
      await expect.poll(async () => (await fetchProject(request, ids.Y)).parentId).toBe(ids.B);
      await aimAtOwnRow(page, from, 0);
      await expectProjectGhost(projectSidebar, ['B'], [null, 'B'], 0);
      await expect(projectSidebar.projectName('Y')).toHaveCount(0);
      await release(page);
      expect(await settledWrites(page, writes)).toEqual([]);
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['X', 'B', 'Y']);
      await expect(projectSidebar.row('Y')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
      await expectSavedProjectTree(request, ids, [
        ['X', null],
        ['B', null],
        ['Y', 'B'],
      ]);
      const next = await pickUp(page, projectSidebar.dragHandle('X'));
      await expect(projectSidebar.row('Y')).toBeVisible();
      if (kind === 'edit') {
        await aim(page, next, projectSidebar.row('Y'), 1);
        await expectProjectGhost(projectSidebar, ['B', 'Y'], ['Y', null], 1);
        await release(page);
        await expectSavedProjectTree(request, ids, [
          ['B', null],
          ['Y', 'B'],
          ['X', 'B'],
        ]);
      } else await cancel(page);
    } finally {
      await gate.dispose();
      if (read) await read.dispose();
    }
  }
});

test('TREE-1.17: each nearest row has one slot across its middle and release saves the shown order', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const names = ['A', 'B', 'X', 'C', 'D'];
  const cases = [
    { near: 'A', order: ['X', 'A', 'B', 'C', 'D'], slot: [null, 'A'] },
    { near: 'B', order: ['A', 'X', 'B', 'C', 'D'], slot: ['A', 'B'] },
    { near: 'X', order: names, slot: ['B', 'C'] },
    { near: 'C', order: ['A', 'B', 'C', 'X', 'D'], slot: ['C', 'D'] },
    { near: 'D', order: ['A', 'B', 'C', 'D', 'X'], slot: ['D', null] },
  ] as const;
  for (const cell of cases) {
    await resetAndSeedDb();
    const ids = await seedProjects(
      request,
      names.map(name => [name, null] as const),
    );
    await expectSavedProjectTree(
      request,
      ids,
      names.map(name => [name, null] as const),
    );
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(names);
    const original = await boxOf(projectSidebar.row(cell.near));
    const writes = watchWrites(page);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    for (const fraction of [0.4, 0.6]) {
      await hoverTo(page, { x: from.x, y: original.y + original.height * fraction });
      await expectProjectGhost(projectSidebar, ['A', 'B', 'C', 'D'], [...cell.slot], 0);
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(cell.order);
    }
    await release(page);
    await expectSavedProjectTree(
      request,
      ids,
      cell.order.map(name => [name, null] as const),
    );
    expect(await settledWrites(page, writes)).toHaveLength(cell.near === 'X' ? 0 : 1);
  }
});

test('TREE-1.18: the slot list contains only drawn rows while tab-right still precedes hidden T1', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['A', null],
    ['T', null],
    ['T1', 'T'],
    ['T2', 'T'],
    ['X', null],
    ['X1', 'X'],
    ['X2', 'X'],
    ['B', null],
  ] as const;
  const ids = await seedProjects(request, tree);
  await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(tree.map(([name]) => name));
  await projectSidebar.toggle('T');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'T', 'X', 'X1', 'X2', 'B']);
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'T', 'X', 'B']);
  await aim(page, from, projectSidebar.row('T'), 0);
  await expectProjectGhost(projectSidebar, ['A', 'T', 'B'], ['A', 'T'], 0);
  await aim(page, from, projectSidebar.row('B'), 0);
  await expectProjectGhost(projectSidebar, ['A', 'T', 'B'], ['B', null], 0);
  await aimAtOwnRow(page, from, 0);
  await expectProjectGhost(projectSidebar, ['A', 'T', 'B'], ['T', 'B'], 0);
  await aimAtOwnRow(page, from, 1);
  await expectProjectGhost(projectSidebar, ['A', 'T', 'B'], ['T', 'B'], 1);
  await release(page);
  await expectSavedProjectTree(request, ids, [
    ['A', null],
    ['T', null],
    ['X', 'T'],
    ['X1', 'X'],
    ['X2', 'X'],
    ['T1', 'T'],
    ['T2', 'T'],
    ['B', null],
  ]);
});

test('TREE-1.19: a still copy keeps the selected first or last gap throughout the row shuffle', async ({
  page,
  request,
  projectSidebar,
}) => {
  const names = ['A', 'B', 'X', 'C', 'D'];
  for (const near of ['A', 'D']) {
    await resetAndSeedDb();
    const ids = await seedProjects(
      request,
      names.map(name => [name, null] as const),
    );
    await expectSavedProjectTree(
      request,
      ids,
      names.map(name => [name, null] as const),
    );
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(names);
    const target = await atFraction(projectSidebar.row(near), 0.5);
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    const record = await recordGeometry(page, {
      names: 'aside button.text-left',
      ghost: 'aside [data-drag-ghost]',
      copy: '[data-drag-overlay]',
    });
    await moveOnce(page, { x: from.x, y: target.y });
    const expected = near === 'A' ? ['X', 'A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'X'];
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
    await expect
      .poll(() =>
        projectSidebar.locator.evaluate(element =>
          element.getAnimations({ subtree: true }).some(animation => animation.playState === 'running'),
        ),
      )
      .toBe(false);
    const frames = await record.stop();
    const orders = frames.map(frame => [...frame.names].sort((a, b) => a.y - b.y).map(row => row.text));
    const firstSelected = orders.findIndex(order => JSON.stringify(order) === JSON.stringify(expected));
    expect(firstSelected).toBeGreaterThanOrEqual(0);
    for (const order of orders.slice(firstSelected)) expect(order).toEqual(expected);
    await expect
      .poll(() => ghostSlot(projectSidebar, ['A', 'B', 'C', 'D']))
      .toEqual(near === 'A' ? [null, 'A'] : ['D', null]);
    const copies = frames.slice(firstSelected).flatMap(frame => frame.copy);
    expect(copies.length).toBeGreaterThan(0);
    expect(new Set(copies.map(copy => `${copy.x}:${copy.y}`)).size).toBe(1);
    await cancel(page);
  }
});
