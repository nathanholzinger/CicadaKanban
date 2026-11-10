import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, moveItem, seedItem, seedPositionedItems, updateColumn } from '../helpers/seed';
import { column, dragOverlay, dragRegion, itemRow, titlesIn } from '../helpers/boardLocators';
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
  POP_OUT_ONLY,
  NO_POP,
} from '../helpers/dragGesture';
import {
  carveDivider,
  carveZone,
  settleOnBottomBand,
  settleOnTopBand,
  stableBoxOf,
} from '../helpers/boardDragScenario';
import {
  dragBoxOf,
  expectOneMove,
  mergeRange,
  paintedCardOrder,
  releaseMove,
  seedBoardFixture,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

for (const aim of ['top', 'bottom', 'D1', 'D2'] as const) {
  test(`DRAG-3.9: done release at ${aim} has no positional bands or anchor and reserves newest completion at the bottom`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Done Band Contract');
    const rows = await seedPositionedItems(
      request,
      ['X', 'D1', 'D2'].map((key, i) => ({
        key,
        title: key,
        projectId: s.project.id,
        workphaseId: s.todo.id,
        position: i + 1,
      })),
    );
    let stamp = 0;
    for (const id of [rows.D1.id, rows.D2.id]) {
      await expect.poll(() => Date.now()).toBeGreaterThan(stamp);
      stamp = (await moveItem(request, id, { workphaseId: s.done.id })).completedAt;
    }
    const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
    await projectSidebar.openBoard('Done Band Contract');
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, rows.X.id));
    const h = (await dragBoxOf(dragOverlay(page))).height;
    await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    const region = dragRegion(column(page, 'Done'));
    await expect(region.locator('[data-carve-divider]')).toHaveCount(0);
    await expect(region.locator('[data-carve-zone]')).toHaveCount(1);
    const zone = await boxOf(carveZone(region, 'single'));
    const d1 = await boxOf(itemRow(page, rows.D1.id));
    const d2 = await boxOf(itemRow(page, rows.D2.id));
    const gap = d2.y - d1.y - d1.height;
    expect(zone.height).toBe(h + gap);
    expect(zone.y).toBeGreaterThanOrEqual(d2.y + d2.height);
    const b = await stableBoxOf(region);
    await hoverTo(
      page,
      aim === 'D1' || aim === 'D2'
        ? await center(itemRow(page, rows[aim].id))
        : { x: b.x + b.width / 2, y: aim === 'top' ? b.y + 2 : b.y + b.height - 2 },
    );
    await awaitDragState(page, 'popped-out');
    await expect.poll(() => paintedCardOrder(region)).toEqual(['D1', 'D2', 'X']);
    await releaseMove(page, rows.X.id);
    expectOneMove(await settledWrites(page, writes), rows.X.id, { workphaseId: s.done.id });
    const saved = await fetchItem(request, rows.X.id);
    expect(saved).toMatchObject({ workphaseId: s.done.id, position: null });
    expect(saved.completedAt).toBeGreaterThan(stamp);
    await expect.poll(() => titlesIn(column(page, 'Done'))).toEqual(['D1', 'D2', 'X']);
  });
}

for (const terminal of [false, true]) {
  for (const fraction of [0.03, 0.5, 0.97]) {
    test(`DRAG-3.10: empty ${terminal ? 'terminal' : 'active'} one-zone height equals the carried Card and release at ${fraction} changes only workphase`, async ({
      page,
      request,
      projectSidebar,
    }) => {
      const s = await seedBoardFixture(request, 'Empty Band Contract');
      const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
      const before = await fetchItem(request, x.id);
      const target = terminal ? s.done : s.review;
      const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
      await projectSidebar.openBoard('Empty Band Contract');
      const writes = watchWrites(page);
      await pickUp(page, itemRow(page, x.id));
      const h = (await dragBoxOf(dragOverlay(page))).height;
      await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
      await awaitPoppedOut(page, tuning);
      const region = dragRegion(column(page, target.name));
      await expect(region.locator('[data-carve-divider]')).toHaveCount(0);
      await expect(region.locator('[data-carve-zone]')).toHaveCount(1);
      const b = await boxOf(carveZone(region, 'single'));
      expect(b.height).toBe(h);
      const old = await boxOf(region);
      await hoverTo(page, { x: b.x + b.width / 2, y: b.y + b.height * fraction });
      await expect(itemRow(region, x.id)).toBeVisible();
      expect((await boxOf(region)).height).toBe(old.height);
      await releaseMove(page, x.id);
      expectOneMove(await settledWrites(page, writes), x.id, { workphaseId: target.id });
      const saved = await fetchItem(request, x.id);
      expect(saved.workphaseId).toBe(target.id);
      expect(saved.position).toBe(terminal ? null : before.position);
      expect(saved.completedAt === null).toBe(!terminal);
    });
  }
}

test('DRAG-3.11: middle-band ghost previews the kept-position gap and bottom ghost previews the end before release', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Band Ghost Contract');
  const rows = await seedPositionedItems(request, [
    { key: 'A', title: 'A', projectId: s.project.id, workphaseId: s.doing.id, position: 1 },
    { key: 'X', title: 'X', projectId: s.project.id, workphaseId: s.todo.id, position: 1.5 },
    { key: 'B', title: 'B', projectId: s.project.id, workphaseId: s.doing.id, position: 2 },
    { key: 'C', title: 'C', projectId: s.project.id, workphaseId: s.doing.id, position: 3 },
  ]);
  const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
  await projectSidebar.openBoard('Band Ghost Contract');
  const writes = watchWrites(page);
  const region = dragRegion(column(page, 'In Progress'));
  await pickUp(page, itemRow(page, rows.X.id));
  await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
  await awaitPoppedOut(page, tuning);
  await hoverTo(page, await center(region));
  await expect(dragMachine(page)).toHaveAttribute('data-drag-band', 'middle');
  await expect.poll(() => paintedCardOrder(region)).toEqual(['A', 'X', 'B', 'C']);
  await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
  await settleOnBottomBand(page, region);
  await expect.poll(() => paintedCardOrder(region)).toEqual(['A', 'B', 'C', 'X']);
  await releaseMove(page, rows.X.id);
  expectOneMove(await settledWrites(page, writes), rows.X.id, {
    workphaseId: s.doing.id,
    anchorId: rows.C.id,
    side: 'after',
  });
  expect((await fetchItem(request, rows.X.id)).position).toBeGreaterThan(
    (await fetchItem(request, rows.C.id)).position,
  );
});

for (const expanded of [false, true]) {
  test(`DRAG-3.12: a middle release ${expanded ? 'between sibling sub-rows changes the exact phase' : 'back into its merged covered set sends nothing'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Covered Set Setdown');
    const col = await mergeRange(request, s.board, s.doing.id, s.review.id, expanded ? 'expanded' : 'merged');
    const x = await seedItem(request, {
      title: 'X',
      projectId: s.project.id,
      workphaseId: expanded ? s.doing.id : s.review.id,
    });
    for (const name of ['A', 'B', 'C'])
      await seedItem(request, { title: name, projectId: s.project.id, workphaseId: s.review.id });
    const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
    await projectSidebar.openBoard('Covered Set Setdown');
    const before = await fetchItem(request, x.id);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, { x: 100, y: 90 });
    await awaitPoppedOut(page, tuning);
    const region = dragRegion(page, expanded ? subrowRegionKey(col, s.review.id) : columnRegionKey(col));
    await hoverTo(page, await center(region));
    await expect(dragMachine(page)).toHaveAttribute('data-drag-band', 'middle');
    if (expanded) await releaseMove(page, x.id);
    else await release(page);
    const sent = await settledWrites(page, writes);
    if (expanded) expectOneMove(sent, x.id, { workphaseId: s.review.id });
    else expect(sent).toEqual([]);
    expect(await fetchItem(request, x.id)).toMatchObject({
      workphaseId: s.review.id,
      position: before.position,
      parentId: before.parentId,
      isAttached: before.isAttached,
    });
  });
}

test('DRAG-3.18: labels distinguish the empty region name from the done workphase name and yield to its ghost', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Band Label Contract');
  const x = await seedItem(request, { title: 'X', projectId: s.project.id });
  for (const title of ['A', 'B']) await seedItem(request, { title, projectId: s.project.id, workphaseId: s.todo.id });
  await seedItem(request, { title: 'D', projectId: s.project.id, workphaseId: s.done.id });
  await updateColumn(request, columnForWorkphase(s.board, s.review.id).id, { name: 'Empty display' });
  await updateColumn(request, columnForWorkphase(s.board, s.done.id).id, { name: 'Finished display' });
  await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
  await projectSidebar.openBoard('Band Label Contract');
  await pickUp(page, itemRow(page, x.id));
  const positional = dragRegion(column(page, 'Todo'));
  await expect(carveZone(positional, 'top')).toHaveText('Move Top');
  await expect(carveZone(positional, 'bottom')).toHaveText('Move Bottom');
  await expect(positional.getByText(/^Move /)).toHaveCount(2);
  const empty = dragRegion(column(page, 'Empty display'));
  await expect(carveZone(empty, 'single')).toHaveText('Move to Empty display');
  const done = dragRegion(column(page, 'Finished display'));
  await expect(carveZone(done, 'single')).toHaveText('Move to Done');
  for (const region of [positional, empty, done]) {
    await hoverTo(page, await center(region));
    await expect(itemRow(region, x.id)).toBeVisible();
    await expect(region.getByText(/^Move /)).toHaveCount(0);
    const remaining = region.locator('[data-carve-zone]');
    for (let i = 0; i < (await remaining.count()); i++) expect((await boxOf(remaining.nth(i))).height).toBe(0);
    await hoverTo(page, { x: 100, y: 80 });
  }
  await cancel(page);
});

test('DRAG-3.23: popping into a done column previews and commits the newest completion without an anchor', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Locked Done Commit');
  const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
  await seedItem(request, { title: 'D1', projectId: s.project.id, workphaseId: s.done.id });
  const d2 = await seedItem(request, { title: 'D2', projectId: s.project.id, workphaseId: s.done.id });
  const tuning = await seedDragTuning(page, { ...NO_POP, popDelayMs: 200, popInDelayMs: 250, popSnapMs: 0 });
  await projectSidebar.openBoard('Locked Done Commit');
  const writes = watchWrites(page);
  await pickUp(page, itemRow(page, x.id));
  await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
  await awaitPoppedOut(page, tuning);
  const region = dragRegion(column(page, 'Done'));
  await hoverTo(page, await center(region));
  await awaitDragContext(
    page,
    columnRegionKey(columnForWorkphase(s.board, s.done.id).id),
    clocksMargin(tuning.popInDelayMs),
  );
  await expect.poll(() => paintedCardOrder(region)).toEqual(['D1', 'D2', 'X']);
  await releaseMove(page, x.id);
  expectOneMove(await settledWrites(page, writes), x.id, { workphaseId: s.done.id });
  const saved = await fetchItem(request, x.id);
  expect(saved).toMatchObject({ workphaseId: s.done.id, position: null });
  expect(saved.completedAt).toBeGreaterThanOrEqual((await fetchItem(request, d2.id)).completedAt);
  await expect.poll(() => titlesIn(column(page, 'Done'))).toEqual(['D1', 'D2', 'X']);
});

test('DRAG-3.24: an own done ghost stays D1/X/D2 through up/down moves and set-down writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Done Own Slot');
  const rows: Record<string, { id: string }> = {};
  let stamp = 0;
  for (const title of ['D1', 'X', 'D2']) {
    const item = await seedItem(request, { title, projectId: s.project.id, workphaseId: s.todo.id });
    await expect.poll(() => Date.now()).toBeGreaterThan(stamp);
    stamp = (await moveItem(request, item.id, { workphaseId: s.done.id })).completedAt;
    rows[title] = item;
  }
  await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
  await projectSidebar.openBoard('Done Own Slot');
  const before = await Promise.all(Object.values(rows).map(item => fetchItem(request, item.id)));
  expect(before.map(item => item.position)).toEqual([null, null, null]);
  const writes = watchWrites(page);
  const region = dragRegion(column(page, 'Done'));
  await pickUp(page, itemRow(page, rows.X.id));
  const neighbors = await Promise.all([rows.D1, rows.D2].map(item => dragBoxOf(itemRow(page, item.id))));
  for (const target of [rows.D2, rows.D1, rows.D2]) {
    await hoverTo(page, await center(itemRow(page, target.id)));
    await expect.poll(() => paintedCardOrder(region)).toEqual(['D1', 'X', 'D2']);
    expect(await Promise.all([rows.D1, rows.D2].map(item => dragBoxOf(itemRow(page, item.id))))).toEqual(neighbors);
  }
  await release(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await Promise.all(Object.values(rows).map(item => fetchItem(request, item.id)))).toEqual(before);
  await expect.poll(() => titlesIn(column(page, 'Done'))).toEqual(['D1', 'X', 'D2']);
});

for (const lock of ['column', 'sub-row', 'Descendants'] as const) {
  test(`DRAG-3.17, DRAG-3.20: exact Board reservations and dividers collapse in layout when locked in ${lock} and return at Board`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Reservation Lifecycle');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id });
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'S', parentId: p.id });
    const b = await seedItem(request, { title: 'B', projectId: s.project.id, workphaseId: s.todo.id });
    const r1 = await seedItem(request, { title: 'R1', projectId: s.project.id, workphaseId: s.review.id });
    await seedItem(request, { title: 'R2', projectId: s.project.id, workphaseId: s.review.id });
    await seedItem(request, { title: 'D1', projectId: s.project.id, workphaseId: s.done.id });
    await seedItem(request, { title: 'D2', projectId: s.project.id, workphaseId: s.done.id });
    const expanded = await mergeRange(request, s.board, s.doing.id, s.review.id, 'expanded');
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: 450,
      popInDelayMs: 450,
      cardZoomDwellMs: 200,
      cardPopInDelayMs: 200,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Reservation Lifecycle');
    await expect(itemRow(page, r1.id)).toBeVisible();
    const positional = dragRegion(column(page, 'Todo'));
    const sub = dragRegion(page, subrowRegionKey(expanded, s.review.id));
    const empty = dragRegion(page, subrowRegionKey(expanded, s.doing.id));
    const terminal = dragRegion(column(page, 'Done'));
    const regions = [positional, sub, empty, terminal];
    const baseline = await Promise.all(regions.map(region => boxOf(region)));
    const pBox = await boxOf(itemRow(page, p.id));
    const bBox = await boxOf(itemRow(page, b.id));
    const gap = bBox.y - pBox.y - pBox.height;
    await pickUp(page, itemRow(page, x.id));
    const h = (await dragBoxOf(dragOverlay(page))).height;
    for (const region of [positional, sub]) {
      await expect(region.locator('[data-carve-divider]')).toHaveCount(2);
      expect((await boxOf(carveZone(region, 'top'))).height).toBe((h + gap) / 2);
      expect((await boxOf(carveZone(region, 'bottom'))).height).toBe((h + gap) / 2);
    }
    for (const region of [empty, terminal]) await expect(region.locator('[data-carve-divider]')).toHaveCount(0);
    expect((await boxOf(carveZone(empty, 'single'))).height).toBe(h);
    expect((await boxOf(carveZone(terminal, 'single'))).height).toBe(h + gap);
    const boardSizes = await Promise.all(regions.map(region => boxOf(region)));
    for (let i = 0; i < regions.length; i++) {
      await hoverTo(page, await center(regions[i]));
      await expect(itemRow(regions[i], x.id)).toBeVisible();
      expect((await boxOf(regions[i])).height).toBe(boardSizes[i].height);
      await expect(regions[i].getByText(/^Move /)).toHaveCount(0);
      await hoverTo(page, { x: 100, y: 90 });
    }
    const target = lock === 'sub-row' ? sub : positional;
    const key =
      lock === 'sub-row'
        ? subrowRegionKey(expanded, s.review.id)
        : columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    await hoverTo(page, await center(target));
    await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
    if (lock === 'Descendants') {
      await hoverTo(page, await center(itemRow(page, p.id)));
      await awaitDragContext(
        page,
        descendantsRegionKey(p.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
    }
    await expect(page.locator('[data-carve-divider]:visible')).toHaveCount(0);
    for (let i = 0; i < regions.length; i++) {
      if ((lock === 'sub-row' && i === 1) || (lock !== 'sub-row' && i === 0)) continue;
      expect((await boxOf(regions[i])).height).toBe(baseline[i].height);
    }
    // The active region has one actual ghost row and its normal gaps, with no additional reservation.
    if (lock !== 'Descendants') {
      const at = lock === 'sub-row' ? 1 : 0;
      expect((await boxOf(target)).height - baseline[at].height).toBe(h + gap);
    } else {
      const cards = target.getByRole('article');
      const boxes = await Promise.all(Array.from({ length: await cards.count() }, (_, i) => boxOf(cards.nth(i))));
      // Independent DOMRect sums can differ below a thousandth of a CSS pixel.
      expect((await boxOf(target)).height).toBeCloseTo(
        boxes.reduce((sum, box) => sum + box.height, 0) + gap * (boxes.length - 1),
        3,
      );
    }
    await hoverTo(page, { x: 100, y: 90 });
    if (lock === 'Descendants') await awaitDragContext(page, key, clocksMargin(tuning.popDelayMs));
    await awaitPoppedOut(page, tuning);
    for (const region of [positional, sub]) await expect(region.locator('[data-carve-divider]:visible')).toHaveCount(2);
    for (const region of [positional, sub]) {
      expect((await boxOf(carveZone(region, 'top'))).height).toBe((h + gap) / 2);
      expect((await boxOf(carveZone(region, 'bottom'))).height).toBe((h + gap) / 2);
    }
    expect((await boxOf(carveZone(empty, 'single'))).height).toBe(h);
    expect((await boxOf(carveZone(terminal, 'single'))).height).toBe(h + gap);
    for (let i = 0; i < regions.length; i++) expect((await boxOf(regions[i])).height).toBe(boardSizes[i].height);
    await cancel(page);
  });
}

// Project creation can lose its API connection before the band fixture is ready.
for (const topVisible of [false, true]) {
  test.skip(`DRAG-3.16: ${topVisible ? 'restoring the content top makes the top band reachable' : 'a clipped visible top remains middle while the content divider is above view'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Scrolled Band Contract');
    const rows = await seedPositionedItems(request, [
      ...Array.from({ length: 18 }, (_, i) => ({
        key: 'A' + i,
        title: 'A' + i,
        projectId: s.project.id,
        workphaseId: s.doing.id,
        position: i + 1,
      })),
      { key: 'X', title: 'X', projectId: s.project.id, workphaseId: s.todo.id, position: 8.5 },
    ]);
    const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
    await projectSidebar.openBoard('Scrolled Band Contract');
    const writes = watchWrites(page);
    const region = dragRegion(column(page, 'In Progress'));
    await pickUp(page, itemRow(page, rows.X.id));
    await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    const scroll = region.locator('xpath=ancestor::*[contains(@class,"overflow-y-auto")][1]');
    await scroll.evaluate(el => {
      el.scrollTop = 450;
    });
    const clipped = await boxOf(scroll);
    expect((await boxOf(carveDivider(region, 'top'))).y).toBeLessThan(clipped.y);
    if (topVisible) {
      await scroll.evaluate(el => {
        el.scrollTop = 0;
      });
      expect((await boxOf(carveDivider(region, 'top'))).y).toBeGreaterThanOrEqual(clipped.y);
      await settleOnTopBand(page, region);
    } else {
      await hoverTo(page, { x: clipped.x + clipped.width / 2, y: clipped.y + 4 });
      await expect(dragMachine(page)).toHaveAttribute('data-drag-band', 'middle');
    }
    await releaseMove(page, rows.X.id);
    expectOneMove(
      await settledWrites(page, writes),
      rows.X.id,
      topVisible ? { workphaseId: s.doing.id, anchorId: rows.A0.id, side: 'before' } : { workphaseId: s.doing.id },
    );
    const saved = await fetchItem(request, rows.X.id);
    expect(saved.workphaseId).toBe(s.doing.id);
    if (topVisible) expect(saved.position).toBeLessThan((await fetchItem(request, rows.A0.id)).position);
    else expect(saved.position).toBe(8.5);
  });
}
