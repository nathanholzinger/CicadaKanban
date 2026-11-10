import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, seedItem } from '../helpers/seed';
import { dragOverlay, dragRegion, itemRow } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitPoppedOut,
  center,
  clocksMargin,
  gapBetween,
  hoverTo,
  pickUp,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import {
  dragBoxOf,
  expectOneMove,
  leanAtGhost,
  mergeRange,
  paintedCardOrder,
  paintedItemIds,
  releaseMove,
  seedBoardFixture,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn, placementShown } from '../helpers/overflowTree';
import { columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

test('DRAG-4.1: B02 a detached child already parented to P reattaches last and inherits its workphase again', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'B02 Detached Child Return';
  const s = await seedBoardFixture(request, name);
  const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.doing.id });
  const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
  const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
  const x = await seedItem(request, { title: 'X', parentId: p.id, isAttached: false, workphaseId: s.todo.id });
  const beforeP = await fetchItem(request, p.id);
  const beforeS1 = await fetchItem(request, s1.id);
  const beforeS2 = await fetchItem(request, s2.id);
  await mergeRange(request, s.board, s.todo.id, s.doing.id, 'merged');
  const tuning = await seedDragTuning(page, { ...NO_POP, cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 });
  await projectSidebar.openBoard(name);
  const writes = watchWrites(page);
  await pickUp(page, itemRow(page, x.id));
  await hoverTo(page, await center(itemRow(page, p.id)));
  await awaitDragContext(
    page,
    descendantsRegionKey(p.id),
    clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
  );
  await releaseMove(page, x.id);
  expectOneMove(await settledWrites(page, writes), x.id, {
    parentId: p.id,
    isAttached: true,
    anchorId: s2.id,
    side: 'after',
  });
  const saved = await fetchItem(request, x.id);
  expect(saved).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.doing.id });
  expect(saved.position).toBeGreaterThan(beforeS2.position);
  const { children: previousChildren, ...previousFields } = beforeP;
  const { children: currentChildren, ...currentFields } = await fetchItem(request, p.id);
  expect(currentFields).toEqual(previousFields);
  expect(previousChildren.map((child: { id: string }) => child.id).sort()).toEqual([s1.id, s2.id, x.id].sort());
  expect(currentChildren.map((child: { id: string }) => child.id).sort()).toEqual([s1.id, s2.id, x.id].sort());
  expect(await fetchItem(request, s1.id)).toEqual(beforeS1);
  expect(await fetchItem(request, s2.id)).toEqual(beforeS2);
  expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s2.id, x.id]);
  await expect(itemRow(page, p.id).getByRole('button', { name: 'X', exact: true })).toBeVisible();
});

for (const moved of [false, true]) {
  test(`DRAG-4.3, DRAG-4.13: B04 done-parent ${moved ? 'first-child' : 'immediate last-child'} attach preserves sibling positions`, async ({
    page,
    request,
    projectSidebar,
  }, testInfo) => {
    const name = 'B04 Done Parent';
    const s = await seedBoardFixture(request, name);
    const older = await seedItem(request, { title: 'Older', projectId: s.project.id, workphaseId: s.done.id });
    await expect.poll(() => Date.now()).toBeGreaterThan((await fetchItem(request, older.id)).completedAt);
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.done.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const beforeP = await fetchItem(request, p.id);
    const beforeS1 = await fetchItem(request, s1.id);
    const beforeS2 = await fetchItem(request, s2.id);
    const doneKey = columnRegionKey(columnForWorkphase(s.board, s.done.id).id);
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: 650,
      popInDelayMs: 350,
      cardZoomDwellMs: 650,
      cardPopInDelayMs: 350,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(
      page,
      await gapBetween(
        dragRegion(page, columnRegionKey(columnForWorkphase(s.board, s.todo.id).id)),
        dragRegion(page, columnRegionKey(columnForWorkphase(s.board, s.doing.id).id)),
      ),
    );
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await center(dragRegion(page, doneKey)));
    await awaitDragContext(page, doneKey, clocksMargin(tuning.popInDelayMs));
    expect(await paintedCardOrder(dragRegion(page, doneKey))).toEqual(['Older', 'P', 'X']);
    await testInfo.attach('B04-done-column-observation', {
      body: JSON.stringify(
        {
          ids: { P: p.id, X: x.id, S1: s1.id, S2: s2.id },
          context: await dragRegion(page, doneKey).getAttribute('data-active-context'),
          line: await dropLineOn(page),
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
    const point = await center(itemRow(page, p.id));
    await hoverTo(page, point);
    const held = await dragBoxOf(dragOverlay(page));
    expect(point.x).toBeGreaterThanOrEqual(held.x);
    expect(point.x).toBeLessThanOrEqual(held.x + held.width);
    expect(point.y).toBeGreaterThanOrEqual(held.y);
    expect(point.y).toBeLessThanOrEqual(held.y + held.height);
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    if (moved) {
      await hoverTo(page, await topQuarter(itemRow(page, s1.id)));
      await hoverTo(page, await topQuarter(itemRow(page, s1.id)));
      expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: null, nextId: s1.id });
    }
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, {
      parentId: p.id,
      isAttached: true,
      anchorId: moved ? s1.id : s2.id,
      side: moved ? 'before' : 'after',
    });
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({
      parentId: p.id,
      isAttached: 1,
      workphaseId: s.done.id,
      completedAt: null,
      positionScope: 'attached-siblings',
    });
    if (moved) expect(saved.position).toBeLessThan(beforeS1.position);
    else expect(saved.position).toBeGreaterThan(beforeS2.position);
    expect(await fetchItem(request, s1.id)).toEqual(beforeS1);
    expect(await fetchItem(request, s2.id)).toEqual(beforeS2);
    const { children: previousChildren, ...previousFields } = beforeP;
    const { children: currentChildren, ...currentFields } = await fetchItem(request, p.id);
    expect(currentFields).toEqual(previousFields);
    expect(previousChildren.map((child: { id: string }) => child.id)).toEqual([s1.id, s2.id]);
    expect(currentChildren.map((child: { id: string }) => child.id).sort()).toEqual([s1.id, s2.id, x.id].sort());
    const savedSiblings = await Promise.all([x, s1, s2].map(row => fetchItem(request, row.id)));
    for (const row of savedSiblings)
      expect(row).toMatchObject({
        parentId: p.id,
        isAttached: 1,
        workphaseId: s.done.id,
        completedAt: null,
        positionScope: 'attached-siblings',
      });
    const expectedOrder = moved ? [x.id, s1.id, s2.id] : [s1.id, s2.id, x.id];
    expect(savedSiblings.sort((left, right) => left.position - right.position).map(row => row.id)).toEqual(
      expectedOrder,
    );
    await expect.poll(() => paintedItemIds(itemRow(page, p.id))).toEqual(expectedOrder);
  });
}

for (const held of [false, true]) {
  test(`DRAG-4.5: B05 the same B/before aim ${held ? 'held through zoom attaches last' : 'released quickly only repositions'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'B05 Same Aim';
    const s = await seedBoardFixture(request, name);
    const oldParent = await seedItem(request, { title: 'Old parent', projectId: s.project.id, workphaseId: s.todo.id });
    const a = await seedItem(request, { title: 'A', projectId: s.project.id, workphaseId: s.todo.id });
    const x = await seedItem(request, {
      title: 'X',
      parentId: oldParent.id,
      isAttached: false,
      workphaseId: s.todo.id,
    });
    const b = await seedItem(request, { title: 'B', projectId: s.project.id, workphaseId: s.todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: b.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: b.id });
    const tuning = await seedDragTuning(page, { ...NO_POP, cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRow(page, x.id));
    await leanAtGhost(page, itemRow(page, x.id), { x: from.x + 10, y: from.y + 10 }, 'down', 1);
    await expect.poll(() => dropLineOn(page)).toEqual({ row: b.id, side: 'before' });
    if (held)
      await awaitDragContext(
        page,
        descendantsRegionKey(b.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
    await releaseMove(page, x.id);
    expectOneMove(
      await settledWrites(page, writes),
      x.id,
      held ? { parentId: b.id, isAttached: true, anchorId: s2.id, side: 'after' } : { anchorId: b.id, side: 'before' },
    );
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({
      parentId: held ? b.id : oldParent.id,
      isAttached: held ? 1 : 0,
      workphaseId: s.todo.id,
    });
    if (held) {
      expect(saved.position).toBeGreaterThan((await fetchItem(request, s2.id)).position);
      expect(await paintedItemIds(itemRow(page, b.id))).toEqual([s1.id, s2.id, x.id]);
    } else {
      expect(saved.position).toBeGreaterThan((await fetchItem(request, a.id)).position);
      expect(saved.position).toBeLessThan((await fetchItem(request, b.id)).position);
    }
  });
}

test('DRAG-4.17: B20 exiting P cancels the uncommitted attachment and repositions Free X after Q', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'B20 Exit Before Release';
  const s = await seedBoardFixture(request, name);
  const oldParent = await seedItem(request, { title: 'Old parent', projectId: s.project.id, workphaseId: s.todo.id });
  const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
  await seedItem(request, { title: 'S1', parentId: p.id });
  const x = await seedItem(request, { title: 'X', parentId: oldParent.id, isAttached: false, workphaseId: s.todo.id });
  const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
  const key = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
  const tuning = await seedDragTuning(page, {
    ...NO_POP,
    popDelayMs: 650,
    cardZoomDwellMs: 1600,
    cardPopInDelayMs: 350,
    popSnapMs: 0,
  });
  await projectSidebar.openBoard(name);
  const writes = watchWrites(page);
  await pickUp(page, itemRow(page, x.id));
  await hoverTo(page, await center(itemRow(page, p.id)));
  await awaitDragContext(
    page,
    descendantsRegionKey(p.id),
    clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
  );
  await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
  await hoverTo(page, await center(itemRow(page, q.id)));
  await awaitDragContext(page, key, clocksMargin(tuning.popDelayMs));
  await expect(itemRow(page, p.id).locator(`[data-item-id="${x.id}"]`)).toHaveCount(0);
  await expect(itemRow(dragRegion(page, key), x.id)).toHaveAttribute('role', 'article');
  await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'short-card');
  expect((await dragBoxOf(dragOverlay(page))).height).toBe((await dragBoxOf(itemRow(page, x.id))).height);
  const point = await center(itemRow(page, q.id));
  await hoverTo(page, point);
  await leanAtGhost(page, itemRow(page, x.id), point, 'up');
  await expect.poll(() => dropLineOn(page)).toEqual({ row: q.id, side: 'after' });
  expect(writes).toEqual([]);
  await releaseMove(page, x.id);
  expectOneMove(await settledWrites(page, writes), x.id, { anchorId: q.id, side: 'after' });
  const saved = await fetchItem(request, x.id);
  expect(saved).toMatchObject({ parentId: oldParent.id, isAttached: 0, workphaseId: s.todo.id });
  expect(saved.position).toBeGreaterThan((await fetchItem(request, q.id)).position);
});
