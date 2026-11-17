import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { cancel, pickUp, pickUpBeforeMove, recordGeometry, release } from '../helpers/dragGesture';
import {
  aim,
  aimAtOwnRow,
  drawnProjectNames,
  expectProjectGhost,
  expectSavedProjectTree,
} from '../helpers/projectTreeDrag';
import {
  fetchProject,
  fetchProjects,
  fetchProjectDepthCap,
  pinProjectCreatedAt,
  pinProjectParent,
  pinProjectPosition,
  seedProjects,
} from '../helpers/seed';
import { holdRequests } from '../helpers/holdRequests';
import { holdNextRead, holdNextWrite, settledWrites, watchWrites } from '../helpers/requestHarness';
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

  // X is dragged under A, as its first child, and released.
  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('B'), 1);
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

test('TREE-4.7: drag release, create and parent edit retain the server reindex order without reload', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const tree = [
    ['P', null],
    ['A', 'P'],
    ['B', 'P'],
    ['X', null],
  ] as const;
  for (const mode of ['drag', 'create', 'edit']) {
    await resetAndSeedDb();
    const ids = await seedProjects(request, tree);
    await pinProjectPosition(request, ids.A, 1500);
    await pinProjectPosition(request, ids.B, 1600);
    await expectSavedProjectTree(request, ids, tree);
    expect((await fetchProject(request, ids.A)).position).toBe(1500);
    expect((await fetchProject(request, ids.B)).position).toBe(1600);
    await page.goto('/');
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'A', 'B', 'X']);
    const gate =
      mode === 'drag'
        ? await holdRequests(page, { method: 'PATCH', url: `**/api/projects/${ids.X}/move`, outcome: 'succeed' })
        : undefined;
    const method = mode === 'drag' ? 'PATCH' : mode === 'create' ? 'POST' : 'PUT';
    const answer = page.waitForResponse(
      response =>
        response.request().method() === method &&
        new URL(response.url()).pathname ===
          `/api/projects${mode === 'create' ? '' : `/${ids.X}${mode === 'drag' ? '/move' : ''}`}`,
    );
    const writes = watchWrites(page);
    try {
      if (mode === 'drag') {
        const from = await pickUp(page, projectSidebar.dragHandle('X'));
        await aimAtOwnRow(page, from, 1);
        await release(page);
        await gate!.arrived();
        await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'A', 'B', 'X']);
        gate!.release();
      } else if (mode === 'create') {
        await projectSidebar.row('P').hover();
        await projectSidebar.row('P').getByTitle('Add subproject').click();
        await page.getByPlaceholder('Subproject name').fill('New');
        await page.getByRole('button', { name: 'Create subproject' }).click();
      } else {
        await projectSidebar.select('X');
        await page.locator('main').getByRole('combobox').selectOption(ids.P);
      }
      const response = await answer;
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.reindexed).toEqual(
        expect.arrayContaining([
          { id: ids.A, position: 1 },
          { id: ids.B, position: 2 },
        ]),
      );
      if (mode === 'create') ids.New = body.id;
      const expected = mode === 'create' ? ['P', 'A', 'B', 'New', 'X'] : ['P', 'A', 'B', 'X'];
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
      await expect(projectSidebar.row(mode === 'create' ? 'New' : 'X')).toHaveCSS(
        'padding-left',
        `${projectRowIndentPx(1)}px`,
      );
      await expectSavedProjectTree(
        request,
        ids,
        mode === 'create'
          ? [
              ['P', null],
              ['A', 'P'],
              ['B', 'P'],
              ['New', 'P'],
              ['X', null],
            ]
          : [
              ['P', null],
              ['A', 'P'],
              ['B', 'P'],
              ['X', 'P'],
            ],
      );
      expect(await settledWrites(page, writes)).toHaveLength(1);
      if (mode === 'drag') {
        await page.reload();
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
        await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
      }
    } finally {
      gate?.release();
    }
  }
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
  const savedBeforeLoad = await fetchProjects(request);
  const writes = watchWrites(page);
  // At the default width the deepest names have no room left after their indents, so they draw at
  // no width. The widest sidebar leaves each name room.
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    SIDEBAR_WIDTH_STORAGE_KEY,
    String(SIDEBAR_MAX_WIDTH_PX),
  ] as const);
  await page.goto('/');

  const names = [...chain, ...beyond];
  for (const [depth, name] of names.entries()) {
    await expect(projectSidebar.projectName(name)).toBeVisible();
    await expect(projectSidebar.row(name)).toHaveCSS('padding-left', `${projectRowIndentPx(depth)}px`);
  }
  const ordinaryRowClass = await projectSidebar.row(chain[0]).getAttribute('class');
  const ordinaryWrapperClass = await projectSidebar.row(chain[0]).locator('..').getAttribute('class');
  for (const name of beyond) {
    await expect(projectSidebar.row(name)).toHaveClass(ordinaryRowClass!);
    await expect(projectSidebar.row(name).locator('..')).toHaveClass(ordinaryWrapperClass!);
  }
  await expect(projectSidebar.locator.locator('[data-drop-invalid]')).toHaveCount(0);
  await expect(projectSidebar.row('Past 2')).toHaveCSS('padding-left', `${projectRowIndentPx(cap + 1)}px`);
  await expect(projectSidebar.dropLine).toHaveCount(0);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await fetchProjects(request)).toEqual(savedBeforeLoad);
});

test('TREE-4.9: the branch appears between A1 and A2 before the answer and never returns to pickup on success', async ({
  page,
  request,
  projectSidebar,
}) => {
  const tree = [
    ['A', null],
    ['A1', 'A'],
    ['A2', 'A'],
    ['B', null],
    ['X', null],
    ['X1', 'X'],
  ] as const;
  const ids = await seedProjects(request, tree);
  await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['A', 'A1', 'A2', 'B', 'X', 'X1']);
  const gate = await holdNextWrite(page, { method: 'PATCH', url: `**/api/projects/${ids.X}/move`, outcome: 'succeed' });
  try {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aim(page, from, projectSidebar.row('A2'), 1);
    await expectProjectGhost(projectSidebar, ['A', 'A1', 'A2', 'B'], ['A1', 'A2'], 1);
    await release(page);
    const held = await gate.arrived();
    const sent = held.request.body as { parentId: string; prevId: string | null; nextId: string | null };
    expect(sent.parentId).toBe(ids.A);
    expect(sent.prevId === ids.A1 || sent.nextId === ids.A2).toBe(true);
    expect(held.request.body).not.toHaveProperty('position');
    const expected = ['A', 'A1', 'X', 'X1', 'A2', 'B'];
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
    await expect(projectSidebar.row('X1')).toHaveCSS('padding-left', `${projectRowIndentPx(2)}px`);
    const record = await recordGeometry(page, { names: 'aside button.text-left' });
    const answered = page.waitForResponse(response => response.url().endsWith(`/projects/${ids.X}/move`));
    gate.release();
    expect((await answered).ok()).toBe(true);
    await settledWrites(page, []);
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
    for (const frame of await record.stop())
      expect([...frame.names].sort((a, b) => a.y - b.y).map(row => row.text)).toEqual(expected);
    await expectSavedProjectTree(request, ids, [
      ['A', null],
      ['A1', 'A'],
      ['X', 'A'],
      ['X1', 'X'],
      ['A2', 'A'],
      ['B', null],
    ]);
    await page.reload();
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
    await expect(projectSidebar.row('X1')).toHaveCSS('padding-left', `${projectRowIndentPx(2)}px`);
  } finally {
    await gate.dispose();
  }
});

test('TREE-4.11: an unanswered release contributes its whole branch and height to the next pickup', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  expect(cap).toBeGreaterThanOrEqual(4);
  const chain = Array.from({ length: cap - 3 }, (_, i) => `S${i + 1}`);
  const s = chain.at(-1)!;
  const tree = [
    ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
    ['T', s],
    ['P', null],
    ['X', null],
    ['X1', 'X'],
  ] as const;
  const ids = await seedProjects(request, tree);
  await expectSavedProjectTree(request, ids, tree);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'T', 'P', 'X', 'X1']);
  const gate = await holdNextWrite(page, { method: 'PATCH', url: `**/api/projects/${ids.X}/move`, outcome: 'succeed' });
  try {
    const from = await pickUp(page, projectSidebar.dragHandle('X'));
    await aimAtOwnRow(page, from, 1);
    await release(page);
    await gate.arrived();
    await expect(projectSidebar.row('X')).toHaveCSS('padding-left', `${projectRowIndentPx(1)}px`);
    await pickUpBeforeMove(page, projectSidebar.dragHandle('P'));
    await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual([...chain, 'T', 'P']);
    await expect(page.locator('[data-drag-overlay] [data-carried-branch]')).toHaveText(
      '+ 1 child, 2 total descendants',
    );
    await expect(projectSidebar.row(s)).toHaveAttribute('data-drop-tier', 'parent');
    await expect(projectSidebar.row('T')).toHaveAttribute('data-drop-tier', 'anchor');
    await cancel(page);
    gate.release();
    await expectSavedProjectTree(request, ids, [
      ...chain.map((name, i) => [name, i ? chain[i - 1] : null] as const),
      ['T', s],
      ['P', null],
      ['X', 'P'],
      ['X1', 'X'],
    ]);
  } finally {
    await gate.dispose();
  }
});

test('TREE-4.15: older initial and refresh reads never remove a created child or restore a deleted subtree', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const tree = [
    ['P', null],
    ['C', 'P'],
    ['Q', null],
  ] as const;
  for (const origin of ['initial', 'refresh'])
    for (const action of ['create', 'delete']) {
      await resetAndSeedDb();
      const ids = await seedProjects(request, tree);
      await expectSavedProjectTree(request, ids, tree);
      const q = await fetchProject(request, ids.Q);
      const old = origin === 'initial' ? await holdNextRead(page, '**/api/projects') : undefined;
      await page.goto('/');
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'C', 'Q']);
      let stale = old;
      if (origin === 'refresh') {
        stale = await holdNextRead(page, '**/api/projects');
        const refusal = await holdNextWrite(page, {
          method: 'PATCH',
          url: `**/api/projects/${ids.P}/move`,
          outcome: 'refuse',
        });
        try {
          const from = await pickUp(page, projectSidebar.dragHandle('P'));
          await aim(page, from, projectSidebar.row('Q'), 0);
          await release(page);
          await refusal.arrived();
          refusal.release();
          await stale.arrived();
          await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'C', 'Q']);
        } finally {
          await refusal.dispose();
        }
      }
      await stale!.arrived();
      let fresh: Awaited<ReturnType<typeof holdNextRead>> | undefined;
      try {
        if (action === 'create') {
          const created = page.waitForResponse(
            response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/projects',
          );
          await projectSidebar.row('P').hover();
          await projectSidebar.row('P').getByTitle('Add subproject').click();
          await page.getByPlaceholder('Subproject name').fill('N');
          await page.getByRole('button', { name: 'Create subproject' }).click();
          const response = await created;
          expect(response.ok()).toBe(true);
          ids.N = (await response.json()).id;
          await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'C', 'N', 'Q']);
          expect((await fetchProject(request, ids.N)).position).toBe(2);
        } else {
          await projectSidebar.deleteProject('P');
          await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['Q']);
        }
        const expected = action === 'create' ? ['P', 'C', 'N', 'Q'] : ['Q'];
        const record = await recordGeometry(page, { names: 'aside button.text-left' });
        fresh = await holdNextRead(page, '**/api/projects');
        let freshStarted = false;
        const noteRead = (req: import('@playwright/test').Request) => {
          if (req.method() === 'GET' && new URL(req.url()).pathname === '/api/projects') freshStarted = true;
        };
        page.on('request', noteRead);
        const writes = watchWrites(page);
        const answered = page.waitForResponse(
          response => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/projects',
        );
        stale!.release();
        expect((await answered).ok()).toBe(true);
        await settledWrites(page, writes);
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
        if (freshStarted) {
          await fresh.arrived();
          await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(expected);
          const freshAnswer = page.waitForResponse(
            response => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/projects',
          );
          fresh.release();
          expect((await freshAnswer).ok()).toBe(true);
          await settledWrites(page, writes);
        }
        page.off('request', noteRead);
        for (const frame of await record.stop()) {
          expect([...frame.names].sort((a, b) => a.y - b.y).map(row => row.text)).toEqual(expected);
          if (action === 'create') {
            const n = frame.names.find(row => row.text === 'N')!;
            const c = frame.names.find(row => row.text === 'C')!;
            expect(n.x, 'N retains its sibling name column under P').toBeCloseTo(c.x, 1);
          }
        }
        expect(await settledWrites(page, writes)).toEqual([]);
        expect(await fetchProject(request, ids.Q)).toEqual(q);
        await expect(projectSidebar.row('Q')).toHaveCSS('padding-left', `${projectRowIndentPx(0)}px`);
        await expectSavedProjectTree(
          request,
          ids,
          action === 'create'
            ? [
                ['P', null],
                ['C', 'P'],
                ['N', 'P'],
                ['Q', null],
              ]
            : [['Q', null]],
        );
      } finally {
        await stale!.dispose();
        if (fresh) await fresh.dispose();
      }
    }
});
