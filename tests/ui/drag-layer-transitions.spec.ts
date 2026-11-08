import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, fetchItemTypes, seedItem } from '../helpers/seed';
import { column, dragOverlay, dragRegion, itemRow, itemRowButton } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitDragState,
  awaitPoppedOut,
  boxOf,
  bottomQuarter,
  cancel,
  center,
  clocksMargin,
  dragMachine,
  gapBetween,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  tabBy,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import {
  dragBoxOf,
  expectFollowing,
  expectOneMove,
  expectWithin,
  leanAtGhost,
  paintedCardOrder,
  paintedItemIds,
  mergeRange,
  releaseMove,
  seedBoardFixture,
  setSectionExpanded,
} from '../helpers/boardDragSurface';
import { holdNextWrite, settledWrites, successfulWrite, watchWrites } from '../helpers/requestHarness';
import { dropLineOn } from '../helpers/overflowTree';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

for (const action of ['nowhere', 'band', 'zoom'] as const) {
  test(`DRAG-1.13, DRAG-1.17: Unsorted follows freely before its ${action} release path`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Unsorted Entry');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id });
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'S', parentId: p.id });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popInDelayMs: action === 'zoom' ? 650 : NO_POP.popInDelayMs,
      cardZoomDwellMs: 400,
      cardPopInDelayMs: 400,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Unsorted Entry');
    const before = await fetchItem(request, x.id);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRow(page, x.id));
    await awaitDragState(page, 'popped-out');
    await awaitDragContext(page, null);
    const first = { x: 90, y: 80 };
    // pickUp activates ten pixels beyond its press point.
    await expectFollowing(page, { x: from.x + 10, y: from.y + 10 }, first);
    await expectFollowing(page, first, { x: 600, y: 90 });
    await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
    if (action === 'nowhere') {
      await hoverTo(page, await center(column(page, 'Unsorted')));
      await release(page);
      expect(await settledWrites(page, writes)).toEqual([]);
      expect(await fetchItem(request, x.id)).toEqual(before);
    } else if (action === 'band') {
      const region = dragRegion(page, columnRegionKey(columnForWorkphase(s.board, s.todo.id).id));
      const b = await boxOf(region);
      await hoverTo(page, { x: b.x + b.width / 2, y: b.y + 2 });
      await expect(dragMachine(page)).toHaveAttribute('data-drag-band', 'top');
      await releaseMove(page, x.id);
      expectOneMove(await settledWrites(page, writes), x.id, {
        workphaseId: s.todo.id,
        anchorId: p.id,
        side: 'before',
      });
      expect(await fetchItem(request, x.id)).toMatchObject({ workphaseId: s.todo.id, parentId: null, isAttached: 0 });
      expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, p.id)).position);
    } else {
      const key = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
      await hoverTo(page, await center(itemRow(page, p.id)));
      await awaitDragContext(page, null);
      await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-candidate');
      await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
      await expectWithin(dragOverlay(page), dragRegion(page, key), 'x');
      await hoverTo(page, await center(itemRow(page, p.id)));
      await awaitDragContext(
        page,
        descendantsRegionKey(p.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
      await releaseMove(page, x.id);
      expect(await settledWrites(page, writes)).toHaveLength(1);
      expect(writes[0].body).toMatchObject({ parentId: p.id, isAttached: true });
      expect(await fetchItem(request, x.id)).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.todo.id });
    }
  });
}

for (const expanded of [false, true]) {
  for (const populated of [false, true]) {
    test(`DRAG-1.5, DRAG-1.26, DRAG-1.28, DRAG-1.35, DRAG-3.22: one hold from ${expanded ? 'sub-row' : 'column'} enters ${populated ? 'populated' : 'childless'} P with both Stub copies and whole-Card bounds`, async ({
      page,
      request,
      projectSidebar,
    }) => {
      const s = await seedBoardFixture(request, 'Direct Descendants Entry');
      const [type] = await fetchItemTypes(request);
      const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
      const a = populated ? await seedItem(request, { title: 'A', parentId: p.id }) : null;
      const a1 = populated ? await seedItem(request, { title: 'A1', parentId: a!.id }) : null;
      const b = populated ? await seedItem(request, { title: 'B', parentId: p.id }) : null;
      const x = await seedItem(request, {
        title: 'X',
        projectId: s.project.id,
        workphaseId: s.todo.id,
        ...(populated ? { type: type.id } : {}),
      });
      await seedItem(request, { title: 'XC', parentId: x.id });
      const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
      await seedItem(request, { title: 'Foreign child', parentId: q.id });
      const col = expanded
        ? await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded')
        : columnForWorkphase(s.board, s.todo.id).id;
      const key = expanded ? subrowRegionKey(col, s.todo.id) : columnRegionKey(col);
      const tuning = await seedDragTuning(page, {
        ...NO_POP,
        popDelayMs: 800,
        cardZoomDwellMs: 160,
        cardPopInDelayMs: 160,
        popSnapMs: 0,
      });
      await projectSidebar.openBoard('Direct Descendants Entry');
      const writes = watchWrites(page);
      await pickUp(page, itemRow(page, x.id));
      await awaitDragContext(page, key);
      await expect(page.locator('[data-active-context="true"]')).toHaveCount(1);
      await expect(dragRegion(page, key)).toHaveAttribute('data-active-context', 'true');
      await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'short-card');
      const short = await dragBoxOf(dragOverlay(page));
      const point = await center(itemRow(page, p.id));
      await hoverTo(page, point);
      await expect.poll(() => dropLineOn(page)).toMatchObject({ row: p.id });
      await awaitDragContext(
        page,
        descendantsRegionKey(p.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
      await expect(page.locator('[data-active-context="true"]')).toHaveCount(1);
      await expect(itemRow(page, p.id)).toHaveAttribute('data-active-context', 'true');
      await expect(dragRegion(page, key)).not.toHaveAttribute('data-active-context');
      await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
      await expect(itemRow(page, x.id).getByRole('button', { name: /X$/ })).toBeVisible();
      const row = await dragBoxOf(itemRow(page, x.id));
      const copy = await dragBoxOf(dragOverlay(page));
      expect(copy.height).toBe(row.height);
      expect(copy.width).toBe(row.width);
      expect(copy.height).toBeLessThan(short.height);
      expect(point.x).toBeGreaterThanOrEqual(copy.x);
      expect(point.x).toBeLessThanOrEqual(copy.x + copy.width);
      expect(point.y).toBeGreaterThanOrEqual(copy.y);
      expect(point.y).toBeLessThanOrEqual(copy.y + copy.height);
      if (a) {
        const referenceRow = await dragBoxOf(itemRow(page, a.id));
        expect(row.height).toBe(referenceRow.height);
        expect(copy.width).toBe(referenceRow.width);
      }
      await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveText('+ 1 child');
      await expect(itemRow(page, x.id).locator('[data-carried-branch]')).toHaveCount(0);
      expect((await dragBoxOf(dragOverlay(page).locator('[data-carried-branch]'))).y).toBeGreaterThanOrEqual(
        copy.y + copy.height - 1,
      );
      await expectWithin(dragOverlay(page), itemRow(page, p.id));
      if (populated) {
        await expect.poll(() => paintedItemIds(itemRow(page, p.id))).toEqual([a!.id, a1!.id, b!.id, x.id]);
        await expect.poll(() => dropLineOn(page)).toEqual({ row: b!.id, side: 'after' });
        await hoverTo(page, await center(itemRow(page, a!.id)));
        await page.waitForTimeout(2 * (tuning.cardZoomDwellMs + tuning.cardPopInDelayMs));
        await awaitDragContext(page, descendantsRegionKey(p.id));
        const pb = await boxOf(itemRow(page, p.id));
        const title = await center(itemRow(page, p.id).getByText('P', { exact: true }));
        await hoverTo(page, title);
        await expectWithin(dragOverlay(page), itemRow(page, p.id));
        const before = await dragBoxOf(dragOverlay(page));
        const moved = { x: title.x + 8, y: title.y + 8 };
        await hoverTo(page, moved);
        const after = await dragBoxOf(dragOverlay(page));
        expect(after.x).toBeGreaterThan(before.x);
        expect(after.y).toBeGreaterThan(before.y);
        await hoverTo(page, { x: pb.x - 40, y: title.y });
        await expectWithin(dragOverlay(page), itemRow(page, p.id));
        await awaitDragContext(page, descendantsRegionKey(p.id));
        // Place before B at depth one, using only this Card's hierarchy.
        const bAim = await topQuarter(itemRow(page, b!.id));
        await hoverTo(page, bAim);
        await tabBy(page, bAim, 1);
        await awaitDragContext(page, descendantsRegionKey(p.id));
        await expect
          .poll(async () => (await dragBoxOf(itemRow(page, x.id))).x)
          .toBe((await dragBoxOf(itemRow(page, a1!.id))).x);
        await expect
          .poll(async () => (await dragBoxOf(itemRow(page, x.id))).y)
          .toBeGreaterThan((await dragBoxOf(itemRow(page, a1!.id))).y);
        await expect
          .poll(async () => (await dragBoxOf(itemRow(page, x.id))).y)
          .toBeLessThan((await dragBoxOf(itemRow(page, b!.id))).y);
        await releaseMove(page, x.id);
        expect(await settledWrites(page, writes)).toHaveLength(1);
        expect(writes[0].body).toMatchObject({ parentId: a!.id, isAttached: true, anchorId: a1!.id, side: 'after' });
        expect(await fetchItem(request, x.id)).toMatchObject({
          parentId: a!.id,
          isAttached: 1,
          workphaseId: s.todo.id,
        });
        expect((await fetchItem(request, x.id)).position).toBeGreaterThan((await fetchItem(request, a1!.id)).position);
      } else {
        // An immediate release after the single hold is last-child attachment.
        await releaseMove(page, x.id);
        expect(await settledWrites(page, writes)).toHaveLength(1);
        expect(writes[0].body).toMatchObject({ parentId: p.id, isAttached: true });
        expect(await fetchItem(request, x.id)).toMatchObject({ parentId: p.id, isAttached: 1 });
      }
      await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
    });
  }
}

for (const expanded of [false, true]) {
  test(`DRAG-1.5: immediate release after ${expanded ? 'sub-row' : 'column'} zoom attaches X as P's last child`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Immediate Last Child');
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    const a = await seedItem(request, { title: 'A', parentId: p.id });
    const b = await seedItem(request, { title: 'B', parentId: p.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    if (expanded) await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded');
    const tuning = await seedDragTuning(page, { ...NO_POP, cardZoomDwellMs: 180, cardPopInDelayMs: 180, popSnapMs: 0 });
    await projectSidebar.openBoard('Immediate Last Child');
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(itemRow(page, p.id)));
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    // Observe the actual reserved slot without waiting for the form's translation to settle.
    expect(
      await itemRow(page, p.id)
        .locator('[data-item-id]')
        .evaluateAll(rows => rows.map(row => row.getAttribute('data-item-id'))),
    ).toEqual([a.id, b.id, x.id]);
    expect((await boxOf(itemRow(page, x.id))).y).toBeGreaterThan((await boxOf(itemRow(page, b.id))).y);
    await releaseMove(page, x.id);
    expect(await settledWrites(page, writes)).toHaveLength(1);
    expect(writes[0].body).toMatchObject({ parentId: p.id, isAttached: true, anchorId: b.id, side: 'after' });
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.todo.id });
    expect(saved.position).toBeGreaterThan((await fetchItem(request, b.id)).position);
    expect((await fetchItem(request, b.id)).position).toBeGreaterThan((await fetchItem(request, a.id)).position);
    await expect
      .poll(async () => (await dragBoxOf(itemRow(page, x.id))).y)
      .toBeGreaterThan((await dragBoxOf(itemRow(page, b.id))).y);
  });
}

for (const detach of [false, true]) {
  test(`DRAG-1.36: pending ${detach ? 'detach' : 'attach'} makes X start and remain bounded by its previewed Free ancestor`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Pending Pickup Bounds');
    const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
    const p = await seedItem(
      request,
      detach ? { title: 'P', parentId: q.id } : { title: 'P', projectId: s.project.id, workphaseId: s.todo.id },
    );
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    const held = await holdNextWrite(page, { method: 'PATCH', url: `**/api/items/${p.id}/move`, outcome: 'succeed' });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: detach ? 200 : NO_POP.popDelayMs,
      cardZoomDwellMs: 120,
      cardPopInDelayMs: 120,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Pending Pickup Bounds');
    if (detach) {
      await pickUp(page, itemRowButton(page, p.id, 'P'));
      const qb = await boxOf(itemRow(page, q.id));
      await hoverTo(page, { x: qb.x + qb.width / 2, y: qb.y + qb.height + 30 });
      await awaitDragContext(
        page,
        columnRegionKey(columnForWorkphase(s.board, s.todo.id).id),
        clocksMargin(tuning.popDelayMs),
      );
      await release(page);
    } else {
      await pickUp(page, itemRow(page, p.id));
      await hoverTo(page, await center(itemRow(page, q.id)));
      await awaitDragContext(
        page,
        descendantsRegionKey(q.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
      await release(page);
    }
    const pending = await held.arrived();
    expect(pending.status).toBe(200);
    expect(pending.request.body).toMatchObject(detach ? { isAttached: false } : { parentId: q.id, isAttached: true });
    const owner = detach ? p : q;
    await expect(itemRow(page, x.id)).toBeVisible();
    await pickUp(page, itemRowButton(page, x.id, 'X'));
    await awaitDragContext(page, descendantsRegionKey(owner.id));
    const b = await boxOf(itemRow(page, owner.id));
    for (const point of [
      { x: b.x - 40, y: b.y },
      { x: b.x + b.width + 40, y: b.y + b.height },
    ]) {
      await hoverTo(page, point);
      await expectWithin(dragOverlay(page), itemRow(page, owner.id));
      await awaitDragContext(page, descendantsRegionKey(owner.id));
    }
    await cancel(page);
    const answered = successfulWrite(page, 'PATCH', `/api/items/${p.id}/move`);
    held.release();
    await answered;
    await held.dispose();
  });
}

for (const finish of ['reorder', 'board', 'sibling'] as const) {
  test(`DRAG-1.17, DRAG-1.26, DRAG-3.22: Descendants exits one layer before the ${finish} continuation`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'One Layer At A Time');
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'S', parentId: p.id });
    const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'XC', parentId: x.id });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: 650,
      cardZoomDwellMs: 350,
      cardPopInDelayMs: 350,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('One Layer At A Time');
    const key = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(itemRow(page, p.id)));
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    const point =
      finish === 'sibling'
        ? await center(itemRow(page, q.id))
        : await gapBetween(column(page, 'Todo'), column(page, 'In Progress'));
    await hoverTo(page, point);
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await awaitDragContext(page, key, clocksMargin(tuning.popDelayMs));
    if (finish === 'sibling') {
      const returned = await dragBoxOf(dragOverlay(page));
      expect(point.x).toBeGreaterThanOrEqual(returned.x);
      expect(point.x).toBeLessThanOrEqual(returned.x + returned.width);
      expect(point.y).toBeGreaterThanOrEqual(returned.y);
      expect(point.y).toBeLessThanOrEqual(returned.y + returned.height);
    }
    const footer = await boxOf(column(page, 'Todo').getByRole('button', { name: '+ Add item', exact: true }));
    await hoverTo(page, { x: footer.x + footer.width / 2, y: footer.y - 15 });
    await awaitDragContext(page, key);
    await expect(dragRegion(page, key)).toHaveAttribute('data-active-context', 'true');
    await expect(page.locator('[data-active-context="true"]')).toHaveCount(1);
    await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'short-card');
    await expect(itemRow(page, x.id)).toHaveAttribute('role', 'article');
    await expectWithin(dragOverlay(page), dragRegion(page, key), 'x');
    await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveText('+ 1 child');
    await expect(itemRow(page, x.id).locator('[data-carried-branch]')).toHaveCount(0);
    const backCopy = await dragBoxOf(dragOverlay(page));
    const backGhost = await dragBoxOf(itemRow(page, x.id));
    expect(backCopy.width).toBe(backGhost.width);
    expect(backCopy.height).toBe(backGhost.height);
    expect((await dragBoxOf(dragOverlay(page).locator('[data-carried-branch]'))).y).toBeGreaterThanOrEqual(
      backCopy.y + backCopy.height - 1,
    );
    if (finish === 'board') {
      await hoverTo(page, point);
      await awaitPoppedOut(page, tuning);
      await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
      await release(page);
      expect(await settledWrites(page, writes)).toEqual([]);
    } else if (finish === 'sibling') {
      await hoverTo(page, await bottomQuarter(itemRow(page, q.id)));
      const towardQ = await bottomQuarter(itemRow(page, q.id));
      await hoverTo(page, towardQ);
      await awaitDragContext(page, key);
      await leanAtGhost(page, itemRow(page, x.id), towardQ, 'down', 1);
      await expect.poll(() => dropLineOn(page)).toMatchObject({ row: q.id });
      await awaitDragContext(
        page,
        descendantsRegionKey(q.id),
        clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
      );
      await expect(itemRow(page, q.id)).toHaveAttribute('data-active-context', 'true');
      await expect(page.locator('[data-active-context="true"]')).toHaveCount(1);
      await cancel(page);
      expect(await settledWrites(page, writes)).toEqual([]);
    } else {
      await hoverTo(page, await topQuarter(itemRow(page, p.id)));
      await hoverTo(page, await topQuarter(itemRow(page, p.id)));
      await expect.poll(() => paintedCardOrder(dragRegion(page, key))).toEqual(['X', 'P', 'Q']);
      await expect.poll(() => dropLineOn(page)).toEqual({ row: p.id, side: 'before' });
      await releaseMove(page, x.id);
      expectOneMove(await settledWrites(page, writes), x.id, { anchorId: p.id, side: 'before' });
      expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0, workphaseId: s.todo.id });
      expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, p.id)).position);
      expect((await fetchItem(request, p.id)).position).toBeLessThan((await fetchItem(request, q.id)).position);
      await expect.poll(() => paintedCardOrder(dragRegion(page, key))).toEqual(['X', 'P', 'Q']);
    }
    await expect(page.locator('[data-active-context="true"]')).toHaveCount(0);
  });
}

for (const attach of [false, true]) {
  test(`DRAG-1.33: C stays collapsed and E expanded through pops; zoom ${attach ? 'attachment keeps C open' : 'exit restores C collapse'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Section Preferences');
    const c = await seedItem(request, { title: 'C', projectId: s.project.id, workphaseId: s.doing.id });
    const cc = await seedItem(request, { title: 'CC', parentId: c.id });
    const e = await seedItem(request, { title: 'E', projectId: s.project.id, workphaseId: s.doing.id });
    const ec = await seedItem(request, { title: 'EC', parentId: e.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: 250,
      popInDelayMs: 300,
      cardZoomDwellMs: 220,
      cardPopInDelayMs: 220,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard('Section Preferences');
    const writes = watchWrites(page);
    await setSectionExpanded(itemRow(page, c.id), false);
    await setSectionExpanded(itemRow(page, e.id), true);
    const preferences = async () => {
      await expect(itemRow(page, cc.id)).toHaveCount(0);
      await expect(itemRow(page, ec.id)).toBeVisible();
    };
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    await preferences();
    const key = columnRegionKey(columnForWorkphase(s.board, s.doing.id).id);
    await hoverTo(page, await center(dragRegion(page, key)));
    await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
    await preferences();
    await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    await preferences();
    await release(page);
    expect(await settledWrites(page, writes)).toEqual([]);
    await preferences();
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(dragRegion(page, key)));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await center(dragRegion(page, key)));
    await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
    await hoverTo(page, await center(itemRow(page, c.id)));
    await awaitDragContext(
      page,
      descendantsRegionKey(c.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    await expect(itemRow(page, cc.id)).toBeVisible();
    await expect(itemRow(page, ec.id)).toBeVisible();
    if (attach) {
      await releaseMove(page, x.id);
      expect(await settledWrites(page, writes)).toHaveLength(1);
      expect(writes[0].body).toMatchObject({ parentId: c.id, isAttached: true });
      expect(await fetchItem(request, x.id)).toMatchObject({ parentId: c.id, isAttached: 1 });
      await expect(itemRow(page, cc.id)).toBeVisible();
      await expect(itemRow(page, x.id)).toBeVisible();
      await expect(itemRow(page, c.id).getByTitle('Hide attached children', { exact: true })).toBeVisible();
      await expect(itemRow(page, ec.id)).toBeVisible();
    } else {
      const b = await boxOf(itemRow(page, c.id));
      await hoverTo(page, { x: b.x + b.width / 2, y: b.y + b.height + 20 });
      await awaitDragContext(page, key, clocksMargin(tuning.popDelayMs));
      await hoverTo(page, { x: 100, y: 90 });
      await awaitPoppedOut(page, tuning);
      await release(page);
      await preferences();
      expect(await settledWrites(page, writes)).toEqual([]);
    }
  });
}
