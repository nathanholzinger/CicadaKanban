import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, seedItem } from '../helpers/seed';
import { dragOverlay, dragRegion, itemRow, zoomCue } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitPoppedOut,
  cancel,
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
  leanAtGhost,
  paintedItemIds,
  releaseMove,
  seedBoardFixture,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn } from '../helpers/overflowTree';
import { columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

for (const target of ['A/after', 'B/before'] as const) {
  test(`DRAG-4.19: B06 ${target} selects the named Card while the pointer is outside that Card`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `B06 ${target}`;
    const s = await seedBoardFixture(request, name);
    const a = await seedItem(request, { title: 'A', projectId: s.project.id, workphaseId: s.todo.id });
    const a1 = await seedItem(request, { title: 'A1', parentId: a.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const b = await seedItem(request, { title: 'B', projectId: s.project.id, workphaseId: s.todo.id });
    const b1 = await seedItem(request, { title: 'B1', parentId: b.id });
    await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
    const tuning = await seedDragTuning(page, { ...NO_POP, cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRow(page, x.id));
    const chosen = target === 'A/after' ? a : b;
    const lastChild = target === 'A/after' ? a1 : b1;
    const point = await leanAtGhost(
      page,
      itemRow(page, x.id),
      { x: from.x + 10, y: from.y + 10 },
      target === 'A/after' ? 'up' : 'down',
      1,
    );
    await expect
      .poll(() => dropLineOn(page))
      .toEqual({ row: chosen.id, side: target === 'A/after' ? 'after' : 'before' });
    const chosenBox = await dragBoxOf(itemRow(page, chosen.id));
    expect(point.y < chosenBox.y || point.y > chosenBox.y + chosenBox.height).toBe(true);
    await awaitDragContext(
      page,
      descendantsRegionKey(chosen.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, {
      parentId: chosen.id,
      isAttached: true,
      anchorId: lastChild.id,
      side: 'after',
    });
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: chosen.id, isAttached: 1 });
  });
}

for (const end of ['dwell', 'cue', 'complete'] as const) {
  test(`${end === 'dwell' ? 'DRAG-4.20' : 'DRAG-4.20, DRAG-4.21'}: B07 ${end} release follows the cue phases without moving cards, ghost or line`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `B07 ${end}`;
    const s = await seedBoardFixture(request, name);
    const a = await seedItem(request, { title: 'A', projectId: s.project.id, workphaseId: s.todo.id });
    const a1 = await seedItem(request, { title: 'A1', parentId: a.id });
    const b = await seedItem(request, { title: 'B', projectId: s.project.id, workphaseId: s.todo.id });
    const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      cardZoomDwellMs: 650,
      cardPopInDelayMs: 1600,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await hoverTo(page, await center(itemRow(page, a.id)));
    await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'before' });
    await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'dwell');
    await expect(zoomCue(page)).toHaveCount(0);
    if (end !== 'dwell') {
      await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'cue', {
        timeout: clocksMargin(tuning.cardZoomDwellMs),
      });
      const cue = zoomCue(itemRow(page, a.id));
      await expect(cue).toBeVisible();
      await expect(zoomCue(page)).toHaveCount(1);
      const observedBoxes = async () =>
        Promise.all(
          [a, b, q, x]
            .map(row => dragBoxOf(itemRow(page, row.id)))
            .concat([dragBoxOf(dragOverlay(page)), dragBoxOf(page.locator('[data-drop-side]'))]),
        );
      const started = await observedBoxes();
      await expect
        .poll(() => cue.evaluate(el => el.getAnimations()[0]?.effect?.getComputedTiming().progress ?? -1), {
          intervals: [16],
          timeout: clocksMargin(tuning.cardPopInDelayMs),
        })
        .toBeGreaterThan(0.8);
      await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'cue');
      expect(await observedBoxes()).toEqual(started);
      expect(await dropLineOn(page)).toEqual({ row: a.id, side: 'before' });
    }
    expect(writes).toEqual([]);
    if (end === 'complete') {
      await awaitDragContext(page, descendantsRegionKey(a.id), clocksMargin(tuning.cardPopInDelayMs));
      await expect(itemRow(page, a.id)).toHaveAttribute('data-active-context', 'true');
      await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
      expect(await paintedItemIds(itemRow(page, a.id))).toEqual([a1.id, x.id]);
      await releaseMove(page, x.id);
      expectOneMove(await settledWrites(page, writes), x.id, {
        parentId: a.id,
        isAttached: true,
        anchorId: a1.id,
        side: 'after',
      });
      expect(await fetchItem(request, x.id)).toMatchObject({ parentId: a.id, isAttached: 1, workphaseId: s.todo.id });
      expect((await fetchItem(request, x.id)).position).toBeGreaterThan((await fetchItem(request, a1.id)).position);
    } else {
      await releaseMove(page, x.id);
      expectOneMove(await settledWrites(page, writes), x.id, { anchorId: a.id, side: 'before' });
      expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0, workphaseId: s.todo.id });
      expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, a.id)).position);
    }
  });
}

for (const reset of ['card', 'side', 'pop-return', 'cancel-pickup'] as const) {
  test(`DRAG-4.22: B08 ${reset} clears the cue and starts fresh clocks`, async ({
    page,
    request,
    projectSidebar,
  }, testInfo) => {
    const name = `B08 ${reset}`;
    const s = await seedBoardFixture(request, name);
    const a = await seedItem(request, { title: 'A', projectId: s.project.id, workphaseId: s.todo.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const b = await seedItem(request, { title: 'B', projectId: s.project.id, workphaseId: s.todo.id });
    await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
    const key = columnRegionKey(columnForWorkphase(s.board, s.todo.id).id);
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      popDelayMs: 350,
      popInDelayMs: 350,
      cardZoomDwellMs: 650,
      cardPopInDelayMs: 1600,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRow(page, x.id));
    const point = await leanAtGhost(page, itemRow(page, x.id), { x: from.x + 10, y: from.y + 10 }, 'up');
    await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'after' });
    await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'cue', {
      timeout: clocksMargin(tuning.cardZoomDwellMs),
    });
    await expect(zoomCue(itemRow(page, a.id))).toBeVisible();
    let anchor = a.id;
    let side = 'before';
    if (reset === 'card') {
      await leanAtGhost(page, itemRow(page, x.id), point, 'down', 1);
      anchor = b.id;
      await expect.poll(() => dropLineOn(page)).toEqual({ row: b.id, side: 'before' });
    } else if (reset === 'side') {
      await hoverTo(page, await center(itemRow(page, a.id)));
      await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'before' });
    } else if (reset === 'pop-return') {
      const other = dragRegion(page, columnRegionKey(columnForWorkphase(s.board, s.doing.id).id));
      await hoverTo(page, await gapBetween(dragRegion(page, key), other));
      await awaitPoppedOut(page, tuning);
      await expect(zoomCue(page)).toHaveCount(0);
      await expect(dragMachine(page)).not.toHaveAttribute('data-drag-zoom-phase');
      await hoverTo(page, await center(dragRegion(page, key)));
      await awaitDragContext(page, key, clocksMargin(tuning.popInDelayMs));
      await expect(dragMachine(page)).toHaveAttribute('data-drag-zoom-phase', 'dwell');
      await hoverTo(page, await center(itemRow(page, a.id)));
      await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'before' });
    } else {
      await cancel(page);
      expect(await settledWrites(page, writes)).toEqual([]);
      await expect(zoomCue(page)).toHaveCount(0);
      await expect(dragMachine(page)).toHaveCount(0);
      const again = await pickUp(page, itemRow(page, x.id));
      await leanAtGhost(page, itemRow(page, x.id), { x: again.x + 10, y: again.y + 10 }, 'up', 1);
      side = 'after';
      await expect.poll(() => dropLineOn(page)).toEqual({ row: a.id, side: 'after' });
    }
    const resetFrame = () =>
      page.evaluate(() => {
        const machine = document.querySelector('[data-drag-state]');
        return {
          context: machine?.getAttribute('data-drag-context'),
          phase: machine?.getAttribute('data-drag-zoom-phase'),
          candidate: machine?.getAttribute('data-drag-zoom-candidate'),
          cueCount: document.querySelectorAll('[style*="animation-name: cue-fill"]').length,
        };
      });
    await testInfo.attach('B08-reset-frame', {
      body: JSON.stringify(
        { ids: { A: a.id, B: b.id, X: x.id }, frame: await resetFrame(), line: await dropLineOn(page) },
        null,
        2,
      ),
      contentType: 'application/json',
    });
    await expect
      .poll(
        async () => {
          const frame = await resetFrame();
          return { phase: frame.phase, cueCount: frame.cueCount };
        },
        { intervals: [16] },
      )
      .toEqual({ phase: 'dwell', cueCount: 0 });
    expect(writes).toEqual([]);
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, { anchorId: anchor, side });
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({ parentId: null, isAttached: 0, workphaseId: s.todo.id });
    const anchorSaved = await fetchItem(request, anchor);
    if (side === 'before') expect(saved.position).toBeLessThan(anchorSaved.position);
    else expect(saved.position).toBeGreaterThan(anchorSaved.position);
  });
}
