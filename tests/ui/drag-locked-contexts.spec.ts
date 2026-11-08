import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, seedItem, seedPositionedItems } from '../helpers/seed';
import { column, dragOverlay, dragRegion, itemRow } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitDragState,
  awaitPoppedOut,
  center,
  boxOf,
  clocksMargin,
  dragMachine,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import {
  dragBoxOf,
  releaseMove,
  expectOneMove,
  expectWithin,
  leanAtGhost,
  mergeRange,
  paintedCardOrder,
  paintedItemIds,
  seedBoardFixture,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn } from '../helpers/overflowTree';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1000 } });

for (const pop of [false, true]) {
  test(`${pop ? 'DRAG-1.5, DRAG-1.6' : 'DRAG-1.6'}: a sibling sub-row release ${pop ? 'uses its own within-action after both pops' : 'keeps the origin ghost before a pop'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Sibling Context');
    const col = await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded');
    const rows = await seedPositionedItems(request, [
      { key: 'A', title: 'A', projectId: s.project.id, workphaseId: s.todo.id, position: 1 },
      { key: 'X', title: 'X', projectId: s.project.id, workphaseId: s.todo.id, position: 2 },
      { key: 'Q', title: 'Q', projectId: s.project.id, workphaseId: s.doing.id, position: 3 },
      { key: 'R', title: 'R', projectId: s.project.id, workphaseId: s.doing.id, position: 4 },
    ]);
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: pop ? 250 : NO_POP.popDelayMs,
      popInDelayMs: pop ? 250 : NO_POP.popInDelayMs,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Sibling Context');
    const writes = watchWrites(page);
    const origin = subrowRegionKey(col, s.todo.id);
    const destination = subrowRegionKey(col, s.doing.id);
    await pickUp(page, itemRow(page, rows.X.id));
    await awaitDragContext(page, origin);
    await expect.poll(() => dropLineOn(page)).toEqual({ row: rows.A.id, side: 'after' });
    await hoverTo(page, await center(dragRegion(page, destination)));
    if (pop) {
      await awaitPoppedOut(page, tuning);
      await hoverTo(page, await center(dragRegion(page, destination)));
      await awaitDragContext(page, destination, clocksMargin(tuning.popInDelayMs));
      await expectWithin(dragOverlay(page), dragRegion(page, destination));
      await hoverTo(page, await topQuarter(itemRow(page, rows.Q.id)));
      await hoverTo(page, await topQuarter(itemRow(page, rows.Q.id)));
      await expect.poll(() => paintedCardOrder(dragRegion(page, destination))).toEqual(['X', 'Q', 'R']);
      await expect.poll(() => dropLineOn(page)).toEqual({ row: rows.Q.id, side: 'before' });
    } else {
      await awaitDragContext(page, origin);
      await expect.poll(() => dropLineOn(page)).toEqual({ row: rows.A.id, side: 'after' });
    }
    await releaseMove(page, rows.X.id);
    expectOneMove(
      await settledWrites(page, writes),
      rows.X.id,
      pop ? { workphaseId: s.doing.id, anchorId: rows.Q.id, side: 'before' } : { anchorId: rows.A.id, side: 'after' },
    );
    expect(await fetchItem(request, rows.X.id)).toMatchObject({
      workphaseId: pop ? s.doing.id : s.todo.id,
      parentId: null,
      isAttached: 0,
    });
    if (pop) {
      expect((await fetchItem(request, rows.X.id)).position).toBeLessThan(
        (await fetchItem(request, rows.Q.id)).position,
      );
      expect((await fetchItem(request, rows.Q.id)).position).toBeLessThan(
        (await fetchItem(request, rows.R.id)).position,
      );
      await expect.poll(() => paintedCardOrder(dragRegion(page, destination))).toEqual(['X', 'Q', 'R']);
    }
  });
}

for (const expanded of [false, true]) {
  for (const place of [
    'top',
    'middle',
    'bottom',
    'sibling sub-row',
    'foreign Card',
    'own header',
    'gap',
    'Unsorted',
  ] as const) {
    if (!expanded && place === 'sibling sub-row') continue;
    test(`DRAG-1.16: release from a locked ${expanded ? 'sub-row' : 'column'} over ${place} commits the current rendered own-list relation`, async ({
      page,
      request,
      projectSidebar,
    }) => {
      const s = await seedBoardFixture(request, 'Locked Release');
      const rows = await seedPositionedItems(request, [
        { key: 'A', title: 'A', projectId: s.project.id, workphaseId: s.todo.id, position: 1 },
        { key: 'X', title: 'X', projectId: s.project.id, workphaseId: s.todo.id, position: 2 },
        { key: 'B', title: 'B', projectId: s.project.id, workphaseId: s.todo.id, position: 3 },
        {
          key: 'Q',
          title: 'Q',
          projectId: s.project.id,
          workphaseId: expanded && place !== 'sibling sub-row' ? s.review.id : s.doing.id,
          position: 4,
        },
      ]);
      await seedItem(request, { title: 'U', projectId: s.project.id });
      const merged = expanded ? await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded') : null;
      const own = merged
        ? subrowRegionKey(merged, s.todo.id)
        : columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
      const other =
        merged && place === 'sibling sub-row'
          ? subrowRegionKey(merged, s.doing.id)
          : columnRegionKey(columnForWorkphase(s.board, expanded ? s.review.id : s.doing.id).id);
      await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
      await projectSidebar.openBoard('Locked Release');
      const before = await fetchItem(request, rows.X.id);
      const writes = watchWrites(page);
      const start = await pickUp(page, itemRow(page, rows.X.id));
      await leanAtGhost(page, itemRow(page, rows.X.id), start, 'up');
      const foreign = await boxOf(dragRegion(page, other));
      const ownBox = await boxOf(dragRegion(page, own));
      let target = { x: foreign.x + foreign.width / 2, y: foreign.y + foreign.height / 2 };
      if (place === 'top') target.y = foreign.y + 2;
      if (place === 'bottom') target.y = foreign.y + foreign.height - 2;
      if (place === 'foreign Card') target = await center(itemRow(page, rows.Q.id));
      if (place === 'own header')
        target = await center(
          page
            .getByRole('group')
            .filter({ has: dragRegion(page, own) })
            .getByRole('heading')
            .first(),
        );
      if (place === 'gap') target = { x: ownBox.x + ownBox.width + 10, y: ownBox.y + ownBox.height / 2 };
      if (place === 'Unsorted') target = await center(column(page, 'Unsorted'));
      await hoverTo(page, target);
      await awaitDragContext(page, own);
      const order = await paintedCardOrder(dragRegion(page, own));
      const at = order.indexOf('X');
      const ghost = await dragBoxOf(itemRow(page, rows.X.id));
      const copy = await dragBoxOf(dragOverlay(page));
      const previous = order[at - 1];
      const next = order[at + 1];
      const usePrevious = !!previous && (!next || copy.y + copy.height / 2 < ghost.y + ghost.height / 2);
      const name = usePrevious ? previous : next;
      expect(['A', 'B']).toContain(name);
      const anchorId = name === 'A' ? rows.A.id : rows.B.id;
      const side = usePrevious ? 'after' : 'before';
      await expect.poll(() => dropLineOn(page)).toEqual({ row: anchorId, side });
      await releaseMove(page, rows.X.id);
      expectOneMove(await settledWrites(page, writes), rows.X.id, { anchorId, side });
      const saved = await fetchItem(request, rows.X.id);
      expect(saved).toMatchObject({
        workphaseId: before.workphaseId,
        parentId: before.parentId,
        isAttached: before.isAttached,
      });
      const a = await fetchItem(request, rows.A.id);
      const b = await fetchItem(request, rows.B.id);
      const expectedOrder = [
        { title: 'A', position: a.position },
        { title: 'B', position: b.position },
        { title: 'X', position: saved.position },
      ]
        .sort((a, b) => a.position - b.position)
        .map(row => row.title);
      expect(expectedOrder).toEqual(order);
    });
  }
}

test('DRAG-1.16: leaving a Card sideways retains its S1/X/S2 hierarchy gap and depth', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seedBoardFixture(request, 'Locked Hierarchy Release');
  const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
  const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
  const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
  const x = await seedItem(request, { title: 'X', parentId: p.id });
  await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
  await projectSidebar.openBoard('Locked Hierarchy Release');
  const writes = watchWrites(page);
  const start = await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X', exact: true }));
  const destination = { x: start.x, y: (await topQuarter(itemRow(page, s2.id))).y };
  await hoverTo(page, destination);
  const refined = { x: start.x, y: (await topQuarter(itemRow(page, s2.id))).y };
  await hoverTo(page, refined);
  const orderShown = () => paintedItemIds(itemRow(page, p.id));
  await expect.poll(orderShown).toEqual([s1.id, x.id, s2.id]);
  const pBox = await boxOf(itemRow(page, p.id));
  await hoverTo(page, { x: pBox.x - 50, y: refined.y });
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect.poll(orderShown).toEqual([s1.id, x.id, s2.id]);
  expect((await dragBoxOf(itemRow(page, x.id))).x).toBe((await dragBoxOf(itemRow(page, s1.id))).x);
  const y1 = (await dragBoxOf(itemRow(page, s1.id))).y;
  const yx = (await dragBoxOf(itemRow(page, x.id))).y;
  const y2 = (await dragBoxOf(itemRow(page, s2.id))).y;
  expect(y1).toBeLessThan(yx);
  expect(yx).toBeLessThan(y2);
  const copy = await dragBoxOf(dragOverlay(page));
  const ghost = await dragBoxOf(itemRow(page, x.id));
  const above = copy.y + copy.height / 2 < ghost.y + ghost.height / 2;
  const relation = { anchorId: above ? s1.id : s2.id, side: above ? 'after' : 'before' };
  await expect.poll(() => dropLineOn(page)).toEqual({ row: relation.anchorId, side: relation.side });
  await releaseMove(page, x.id);
  const sent = await settledWrites(page, writes);
  expectOneMove(sent, x.id, relation);
  const saved = await fetchItem(request, x.id);
  expect(saved).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.todo.id });
  expect(saved.position).toBeGreaterThan((await fetchItem(request, s1.id)).position);
  expect(saved.position).toBeLessThan((await fetchItem(request, s2.id)).position);
});

for (const origin of ['Column', 'Board'] as const) {
  for (const distance of [1, 24]) {
    test(`${origin === 'Board' ? 'DRAG-1.17, DRAG-1.18' : 'DRAG-1.18'}: positive distance ${distance} never replaces the ${origin} zoom-in hold`, async ({
      page,
      request,
      projectSidebar,
    }) => {
      const s = await seedBoardFixture(request, 'Duration Only Entry');
      const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
      await seedItem(request, { title: 'S', parentId: p.id });
      const x = await seedItem(request, {
        title: 'X',
        projectId: s.project.id,
        ...(origin === 'Column' ? { workphaseId: s.todo.id } : {}),
      });
      const before = await fetchItem(request, x.id);
      const tuning = await seedDragTuning(page, { ...NO_POP, popDistancePx: distance, popSnapMs: 0 });
      await projectSidebar.openBoard('Duration Only Entry');
      const writes = watchWrites(page);
      await pickUp(page, itemRow(page, x.id));
      const target = await center(itemRow(page, p.id));
      const bounds = await dragBoxOf(itemRow(page, p.id));
      expect(
        Math.min(
          target.x - bounds.x,
          bounds.x + bounds.width - target.x,
          target.y - bounds.y,
          bounds.y + bounds.height - target.y,
        ),
      ).toBeGreaterThan(tuning.popDistancePx);
      await hoverTo(page, target);
      const key = origin === 'Column' ? columnRegionKey(columnForWorkphase(s.board, s.todo.id).id) : null;
      await awaitDragContext(page, key);
      await awaitDragState(page, origin === 'Column' ? 'locked' : 'popped-out');
      if (origin === 'Column')
        await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-candidate', descendantsRegionKey(p.id));
      const line = origin === 'Column' ? await dropLineOn(page) : null;
      if (line) expect(line.row).toBe(p.id);
      await releaseMove(page, x.id);
      const sent = await settledWrites(page, writes);
      expect(sent).toHaveLength(1);
      expect(sent[0].method).toBe('PATCH');
      expect(sent[0].url).toMatch(new RegExp(`/api/items/${x.id}/move$`));
      expect(sent[0].body).not.toHaveProperty('parentId');
      expect(sent[0].body).not.toHaveProperty('isAttached', true);
      if (origin === 'Column') expect(sent[0].body).toMatchObject({ anchorId: p.id, side: line!.side });
      else expect(sent[0].body).toMatchObject({ workphaseId: s.todo.id });
      expect(await fetchItem(request, x.id)).toMatchObject({
        parentId: before.parentId,
        isAttached: before.isAttached,
        workphaseId: s.todo.id,
      });
    });
  }
}

for (const expanded of [false, true]) {
  test(`DRAG-1.20: a foreign ${expanded ? 'sibling sub-row' : 'column'} Card cannot be named or zoomed into from an alone locked list`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Own Cards Only');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.doing.id });
    const id = expanded ? await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded') : undefined;
    const ownKey = id ? subrowRegionKey(id, s.todo.id) : columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    const otherKey = id ? subrowRegionKey(id, s.doing.id) : columnRegionKey(columnForWorkphase(s.board, s.doing.id).id);
    const tuning = await seedDragTuning(page, {
      popDelayMs: 2500,
      popInDelayMs: 300,
      cardZoomDwellMs: 150,
      cardPopInDelayMs: 150,
      popDistancePx: 0,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Own Cards Only');
    const before = await fetchItem(request, x.id);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(itemRow(page, q.id)));
    await page.waitForTimeout(2 * (tuning.cardZoomDwellMs + tuning.cardPopInDelayMs));
    await awaitDragContext(page, ownKey);
    await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-candidate');
    await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-phase');
    await expect(page.locator('[data-drop-side]')).toHaveCount(0);
    await release(page);
    expect(await settledWrites(page, writes)).toEqual([]);
    expect(await fetchItem(request, x.id)).toEqual(before);

    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(itemRow(page, q.id)));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await center(dragRegion(page, otherKey)));
    await awaitDragContext(page, otherKey, clocksMargin(tuning.popInDelayMs));
    await hoverTo(page, await center(itemRow(page, q.id)));
    await awaitDragContext(
      page,
      descendantsRegionKey(q.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    await releaseMove(page, x.id);
    expect(await settledWrites(page, writes)).toHaveLength(1);
    expect(writes[0].body).toMatchObject({ parentId: q.id, isAttached: true });
    expect(writes[0].body).not.toHaveProperty('position');
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: q.id, isAttached: 1, workphaseId: s.doing.id });
  });
}
