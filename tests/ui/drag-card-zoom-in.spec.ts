import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, seedItem } from '../helpers/seed';
import { dragRegion, itemRow, zoomCue } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitPoppedOut,
  center,
  clocksMargin,
  dragMachine,
  gapBetween,
  hoverTo,
  pickUp,
  seedDragTuning,
  NO_POP,
} from '../helpers/dragGesture';
import {
  dragBoxOf,
  expectOneMove,
  mergeRange,
  paintedItemIds,
  releaseMove,
  seedBoardFixture,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn } from '../helpers/overflowTree';
import { columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

// Both former skipped zoom paths pass through Board. The own-column return
// proves DRAG-4.1; only the foreign-column setup has DRAG-4.15's premises.
for (const foreign of [false, true]) {
  test(`${foreign ? 'DRAG-4.1, DRAG-4.15' : 'DRAG-4.1'}: B01 ${foreign ? 'cross-column' : 'own-column return'} zoom immediately attaches last with the parent workphase`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `B01 ${foreign ? 'Cross' : 'Return'}`;
    const s = await seedBoardFixture(request, name);
    const p = await seedItem(request, {
      title: 'P',
      projectId: s.project.id,
      workphaseId: foreign ? s.review.id : s.doing.id,
    });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const targetColumn = await mergeRange(
      request,
      s.board,
      foreign ? s.doing.id : s.todo.id,
      foreign ? s.review.id : s.doing.id,
      'merged',
    );
    const originColumn = foreign ? columnForWorkphase(s.board, s.todo.id).id : targetColumn;
    const targetKey = columnRegionKey(targetColumn);
    const originKey = columnRegionKey(originColumn);
    const beforeP = await fetchItem(request, p.id);
    const beforeS1 = await fetchItem(request, s1.id);
    const beforeS2 = await fetchItem(request, s2.id);
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
    await awaitDragContext(page, originKey);
    const targetRegion = dragRegion(page, targetKey);
    const outsideRegion = dragRegion(page, columnRegionKey(columnForWorkphase(s.board, s.done.id).id));
    await hoverTo(page, await gapBetween(targetRegion, outsideRegion));
    await awaitPoppedOut(page, tuning);
    await awaitDragContext(page, null);
    await hoverTo(page, await center(targetRegion));
    await awaitDragContext(page, targetKey, clocksMargin(tuning.popInDelayMs));
    await hoverTo(page, await center(itemRow(page, p.id)));
    await expect.poll(() => dropLineOn(page)).toMatchObject({ row: p.id });
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    // Immediate means no additional move or settling wait after entry.
    expect(writes).toEqual([]);
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, {
      parentId: p.id,
      isAttached: true,
      anchorId: s2.id,
      side: 'after',
    });
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: p.workphaseId });
    expect(saved.position).toBeGreaterThan(beforeS2.position);
    expect(beforeS2.position).toBeGreaterThan(beforeS1.position);
    const { children: previousChildren, ...previousFields } = beforeP;
    const { children: currentChildren, ...currentFields } = await fetchItem(request, p.id);
    expect(currentFields).toEqual(previousFields);
    expect(previousChildren.map((child: { id: string }) => child.id).sort()).toEqual([s1.id, s2.id].sort());
    expect(currentChildren.map((child: { id: string }) => child.id).sort()).toEqual([s1.id, s2.id, x.id].sort());
    const savedSiblings = await Promise.all([s1, s2, x].map(row => fetchItem(request, row.id)));
    expect(savedSiblings.sort((left, right) => left.position - right.position).map(row => row.id)).toEqual([
      s1.id,
      s2.id,
      x.id,
    ]);
    expect(await fetchItem(request, s1.id)).toEqual(beforeS1);
    expect(await fetchItem(request, s2.id)).toEqual(beforeS2);
    expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s2.id, x.id]);
    expect((await dragBoxOf(itemRow(page, x.id))).y).toBeGreaterThan((await dragBoxOf(itemRow(page, s2.id))).y);
    await expect(itemRow(page, p.id).getByRole('button', { name: 'X', exact: true })).toBeVisible();
  });
}

test('DRAG-4.15, DRAG-4.22: B27 a cleared cue followed by a Board release over P uses the merged column band, not attachment', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'B27 Board Contrast';
  const s = await seedBoardFixture(request, name);
  const a = await seedItem(request, { title: 'A', projectId: s.project.id, workphaseId: s.todo.id });
  const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
  const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.review.id });
  await seedItem(request, { title: 'S1', parentId: p.id });
  await seedItem(request, { title: 'S2', parentId: p.id });
  const target = await mergeRange(request, s.board, s.doing.id, s.review.id, 'merged');
  const originKey = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
  const targetKey = columnRegionKey(target);
  const before = await fetchItem(request, x.id);
  const tuning = await seedDragTuning(page, {
    ...NO_POP,
    popDelayMs: 350,
    cardZoomDwellMs: 650,
    cardPopInDelayMs: 1600,
    popSnapMs: 0,
  });
  await projectSidebar.openBoard(name);
  const writes = watchWrites(page);
  await pickUp(page, itemRow(page, x.id));
  await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'after' });
  await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'cue', {
    timeout: clocksMargin(tuning.cardZoomDwellMs),
  });
  await expect(zoomCue(itemRow(page, a.id))).toBeVisible();
  await hoverTo(page, await gapBetween(dragRegion(page, originKey), dragRegion(page, targetKey)));
  await awaitPoppedOut(page, tuning);
  await expect(zoomCue(page)).toHaveCount(0);
  await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-phase');
  await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-candidate');
  await hoverTo(page, await center(itemRow(page, p.id)));
  await awaitDragContext(page, null);
  await expect(dragMachine(page)).toHaveAttribute('data-drag-band', 'middle');
  expect(writes).toEqual([]);
  await releaseMove(page, x.id);
  expectOneMove(await settledWrites(page, writes), x.id, { workphaseId: s.doing.id });
  expect(await fetchItem(request, x.id)).toMatchObject({
    parentId: null,
    isAttached: 0,
    workphaseId: s.doing.id,
    position: before.position,
  });
});
