import { test, expect } from '../fixtures';
import {
  seedItem,
  seedPositionedItems,
  seedProject,
  fetchItem,
  reorderWorkphases,
  columnForWorkphase,
} from '../helpers/seed';
import { article, column, dragOverlay, dragRegion, itemRow, itemRowButton } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitDragState,
  awaitPoppedOut,
  boxOf,
  cancel,
  center,
  clocksMargin,
  dragMachine,
  gapBetween,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
  POP_OUT_ONLY,
  SUSTAINED,
} from '../helpers/dragGesture';
import {
  seedBoardFixture,
  setSectionExpanded,
  releaseMove,
  mergeRange,
  leanAtGhost,
  paintedCardOrder,
  expectFollowing,
  expectOneMove,
  expectWithin,
  dragBoxOf,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn } from '../helpers/overflowTree';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1000 } });

for (const kind of ['merged', 'expanded', 'unsorted', 'nested Stub'] as const) {
  test(`DRAG-1.1: pickup chooses exactly the ${kind} starting context`, async ({ page, request, projectSidebar }) => {
    const s = await seedBoardFixture(request, 'Pickup Context');
    let key: string | null = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    let sourceId: string;
    if (kind === 'expanded') {
      const id = await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded');
      sourceId = (await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.doing.id })).id;
      key = subrowRegionKey(id, s.doing.id);
    } else if (kind === 'nested Stub') {
      const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
      const a = await seedItem(request, { title: 'A', parentId: p.id });
      sourceId = (await seedItem(request, { title: 'X', parentId: a.id })).id;
      key = descendantsRegionKey(p.id);
    } else {
      sourceId = (
        await seedItem(request, {
          title: 'X',
          projectId: s.project.id,
          ...(kind === 'merged' ? { workphaseId: s.todo.id } : {}),
        })
      ).id;
      if (kind === 'unsorted') key = null;
    }
    await seedDragTuning(page, { ...NO_POP, sectionLevels: 3, popSnapMs: 0 });
    await projectSidebar.openBoard('Pickup Context');
    if (kind === 'nested Stub') {
      await setSectionExpanded(article(page, 'P'), true);
      await pickUp(page, itemRowButton(page, sourceId, 'X'));
    } else await pickUp(page, itemRow(page, sourceId));
    await awaitDragContext(page, key);
    await awaitDragState(page, key === null ? 'popped-out' : 'locked');
    if (key && kind !== 'nested Stub') {
      expect(key.startsWith('descendants:')).toBe(false);
      const active = page.locator('[data-active-context="true"]');
      await expect(active).toHaveCount(1);
      await expect(active).toHaveAttribute('data-drag-region', key);
      const bounds = await boxOf(dragRegion(page, key));
      const group = page.getByRole('group').filter({ has: dragRegion(page, key) });
      const header = await boxOf(group.getByRole('heading').first());
      const footer = await boxOf(group.getByRole('button', { name: '+ Add item', exact: true }).last());
      expect(header.y + header.height).toBeLessThanOrEqual(bounds.y);
      expect(footer.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
      await expect(group).not.toHaveAttribute('data-active-context');
    }
    if (kind === 'unsorted') await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
    await cancel(page);
  });
}

for (const lean of ['up', 'down'] as const) {
  test(`DRAG-1.2: the A/B gap saves its highlighted ${lean === 'up' ? 'A/after' : 'B/before'} relation`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Named Gap');
    const rows = await seedPositionedItems(
      request,
      ['A', 'B', 'Q', 'X'].map((key, i) => ({
        key,
        title: key,
        projectId: s.project.id,
        workphaseId: s.todo.id,
        position: i + 1,
      })),
    );
    const before = await fetchItem(request, rows.X.id);
    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard('Named Gap');
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, rows.X.id));
    let aim = await topQuarter(itemRow(page, rows.B.id));
    await hoverTo(page, aim);
    aim = await topQuarter(itemRow(page, rows.B.id));
    await hoverTo(page, aim);
    await expect.poll(() => paintedCardOrder(column(page, 'Todo'))).toEqual(['A', 'X', 'B', 'Q']);
    await leanAtGhost(page, itemRow(page, rows.X.id), aim, lean);
    const anchor = lean === 'up' ? rows.A : rows.B;
    const side = lean === 'up' ? 'after' : 'before';
    await expect.poll(() => dropLineOn(page)).toEqual({ row: anchor.id, side });
    await expect(page.locator('[data-drop-side]')).toHaveCount(1);
    await releaseMove(page, rows.X.id);
    expectOneMove(await settledWrites(page, writes), rows.X.id, { anchorId: anchor.id, side });
    await expect.poll(() => paintedCardOrder(column(page, 'Todo'))).toEqual(['A', 'X', 'B', 'Q']);
    const saved = await fetchItem(request, rows.X.id);
    expect(saved).toMatchObject({
      workphaseId: before.workphaseId,
      parentId: before.parentId,
      isAttached: before.isAttached,
    });
    expect(saved.position).toBeGreaterThan((await fetchItem(request, rows.A.id)).position);
    expect(saved.position).toBeLessThan((await fetchItem(request, rows.B.id)).position);
  });
}

test('DRAG-1.22, DRAG-1.24: the own-slot ghost leaves neighbors still and saves A/after ahead of an unseen U', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Hidden Workflow Neighbor');
  const child = await seedProject(request, { name: 'Filtered Card View', parentId: s.project.id });
  const rows = await seedPositionedItems(request, [
    { key: 'A', title: 'A', projectId: child.id, workphaseId: s.todo.id, position: 1 },
    { key: 'U', title: 'U', projectId: s.project.id, workphaseId: s.todo.id, position: 2 },
    { key: 'X', title: 'X', projectId: child.id, workphaseId: s.todo.id, position: 3 },
    { key: 'B', title: 'B', projectId: child.id, workphaseId: s.todo.id, position: 4 },
  ]);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard('Filtered Card View');
  await expect(article(page, 'U')).toHaveCount(0);
  const writes = watchWrites(page);
  const from = await pickUp(page, itemRow(page, rows.X.id));
  const neighbors = await Promise.all([rows.A, rows.B].map(row => dragBoxOf(itemRow(page, row.id))));
  await hoverTo(page, from);
  await expect.poll(() => paintedCardOrder(column(page, 'Todo'))).toEqual(['A', 'X', 'B']);
  const after = await Promise.all([rows.A, rows.B].map(row => dragBoxOf(itemRow(page, row.id))));
  after.forEach((box, i) => {
    expect(box.y).toBeCloseTo(neighbors[i].y, 0);
    expect(box.x).toBeCloseTo(neighbors[i].x, 0);
  });
  await leanAtGhost(page, itemRow(page, rows.X.id), from, 'up');
  await expect.poll(() => dropLineOn(page)).toEqual({ row: rows.A.id, side: 'after' });
  await releaseMove(page, rows.X.id);
  expectOneMove(await settledWrites(page, writes), rows.X.id, { anchorId: rows.A.id, side: 'after' });
  expect((await fetchItem(request, rows.X.id)).position).toBeLessThan((await fetchItem(request, rows.U.id)).position);
  await expect.poll(() => paintedCardOrder(column(page, 'Todo'))).toEqual(['A', 'X', 'B']);
});

test('DRAG-1.24: an alone Card picked up and set down sends no request', async ({ page, request, projectSidebar }) => {
  const s = await seedBoardFixture(request, 'Alone Card');
  const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
  const before = await fetchItem(request, x.id);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard('Alone Card');
  const writes = watchWrites(page);
  const home = await pickUp(page, itemRow(page, x.id));
  await hoverTo(page, home);
  await expect(page.locator('[data-drop-side]')).toHaveCount(0);
  await release(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await fetchItem(request, x.id)).toEqual(before);
});

for (const reenter of [false, true]) {
  test(`DRAG-1.3, DRAG-1.12: a freely-following Board copy ${reenter ? 're-enters and saves A/before' : 'sets down in the origin middle band without a write'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Return to Origin');
    const rows = await seedPositionedItems(
      request,
      ['A', 'B', 'X'].map((key, i) => ({
        key,
        title: key,
        projectId: s.project.id,
        workphaseId: s.todo.id,
        position: i + 1,
      })),
    );
    const before = await fetchItem(request, rows.X.id);
    const tuning = await seedDragTuning(page, {
      ...(reenter ? SUSTAINED : POP_OUT_ONLY),
      popInDelayMs: reenter ? 1200 : NO_POP.popInDelayMs,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Return to Origin');
    const writes = watchWrites(page);
    const key = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    await pickUp(page, itemRow(page, rows.X.id));
    const neutral = await gapBetween(column(page, 'Todo'), column(page, 'In Progress'));
    await hoverTo(page, neutral);
    await awaitPoppedOut(page, tuning);
    await awaitDragContext(page, null);
    const p1 = { x: 100, y: 70 };
    await expectFollowing(page, neutral, p1);
    const p2 = { x: 600, y: 70 };
    await expectFollowing(page, p1, p2);
    await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
    await hoverTo(page, await center(dragRegion(page, key)));
    if (reenter) {
      await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
      await expectWithin(dragOverlay(page), dragRegion(page, key), 'x');
      await hoverTo(page, await topQuarter(itemRow(page, rows.A.id)));
      await hoverTo(page, await topQuarter(itemRow(page, rows.A.id)));
      await expect.poll(() => dropLineOn(page)).toEqual({ row: rows.A.id, side: 'before' });
    } else await awaitDragState(page, 'popped-out');
    if (reenter) await releaseMove(page, rows.X.id);
    else await release(page);
    if (reenter) {
      expectOneMove(await settledWrites(page, writes), rows.X.id, { anchorId: rows.A.id, side: 'before' });
      await expect.poll(() => paintedCardOrder(column(page, 'Todo'))).toEqual(['X', 'A', 'B']);
      expect(await fetchItem(request, rows.X.id)).toMatchObject({
        workphaseId: before.workphaseId,
        parentId: before.parentId,
        isAttached: before.isAttached,
      });
    } else {
      expect(await settledWrites(page, writes)).toEqual([]);
      expect(await fetchItem(request, rows.X.id)).toEqual(before);
    }
  });
}

for (const place of [
  'header',
  'footer',
  'toolbar',
  'column gap',
  'sub-row gap',
  'below sub-rows',
  'Unsorted',
  'broken column',
] as const) {
  test(`DRAG-1.9: Board release over ${place} has no candidate, pop-in or request`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Nowhere Contexts');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.doing.id });
    await seedItem(request, { title: 'R', projectId: s.project.id, workphaseId: s.review.id });
    let mergedId: string | undefined;
    if (place === 'sub-row gap' || place === 'below sub-rows')
      mergedId = await mergeRange(request, s.board, s.doing.id, s.review.id, 'expanded');
    if (place === 'Unsorted') await seedItem(request, { title: 'U', projectId: s.project.id });
    if (place === 'broken column') {
      await mergeRange(request, s.board, s.doing.id, s.review.id, 'merged');
      await reorderWorkphases(
        request,
        [s.todo, s.review, s.doing, s.done].map((phase, position) => ({ id: phase.id, position })),
      );
    }
    const before = await fetchItem(request, x.id);
    const tuning = await seedDragTuning(page, {
      ...POP_OUT_ONLY,
      popInDelayMs: 500,
      cardZoomDwellMs: 120,
      cardPopInDelayMs: 120,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Nowhere Contexts');
    const todo = column(page, 'Todo');
    const other = mergedId
      ? page.getByRole('group').filter({ has: dragRegion(page, subrowRegionKey(mergedId, s.doing.id)) })
      : place === 'broken column'
        ? page.getByRole('group').filter({ has: page.getByText('broken', { exact: true }) })
        : column(page, 'In Progress');
    await expect(other).toHaveCount(1);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    const neutral = await gapBetween(todo, other);
    await hoverTo(page, neutral);
    await awaitPoppedOut(page, tuning);
    let target = neutral;
    if (place === 'header') target = await center(other.getByRole('heading').first());
    else if (place === 'footer')
      target = await center(other.getByRole('button', { name: '+ Add item', exact: true }).last());
    else if (place === 'toolbar')
      target = await center(page.getByRole('button', { name: '+ Add column', exact: true }));
    else if (place === 'Unsorted') target = await center(column(page, 'Unsorted'));
    else if (place === 'broken column') target = await center(other);
    else if (mergedId) {
      const first = await boxOf(dragRegion(page, subrowRegionKey(mergedId, s.doing.id)));
      const last = await boxOf(dragRegion(page, subrowRegionKey(mergedId, s.review.id)));
      const footer = await boxOf(other.getByRole('button', { name: '+ Add item', exact: true }).last());
      target = {
        x: last.x + last.width / 2,
        y:
          place === 'sub-row gap'
            ? (first.y + first.height + last.y) / 2
            : Math.min(last.y + last.height + 30, footer.y - 10),
      };
      if (place === 'below sub-rows') expect(target.y).toBeGreaterThan(last.y + last.height);
    }
    await hoverTo(page, target);
    await page.waitForTimeout(tuning.popInDelayMs + tuning.cardZoomDwellMs + tuning.cardPopInDelayMs);
    await awaitDragState(page, 'popped-out');
    await awaitDragContext(page, null);
    await expect(dragMachine(page)).not.toHaveAttribute('data-drag-band');
    await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-candidate');
    await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-phase');
    await release(page);
    expect(await settledWrites(page, writes)).toEqual([]);
    expect(await fetchItem(request, x.id)).toEqual(before);
    await expect(itemRow(todo, x.id)).toBeVisible();
    await expect(page.locator('[data-pending]')).toHaveCount(0);
  });
}
