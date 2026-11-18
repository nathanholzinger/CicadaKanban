import { test, expect } from '../fixtures';
import { columnForWorkphase, fetchItem, seedItem, type SeededItem } from '../helpers/seed';
import { dragOverlay, dragRegion, itemRow, itemRowButton } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitProjection,
  atFraction,
  boxOf,
  release,
  center,
  clocksMargin,
  hoverTo,
  pickUp,
  paintedBoxOf,
  seedDragTuning,
  tabBy,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import {
  dragBoxOf,
  expectOneMove,
  expectFollowing,
  expectWithin,
  leanAtGhost,
  mergeRange,
  paintedItemIds,
  paintedCardOrder,
  releaseMove,
  seedBoardFixture,
  setSectionExpanded,
} from '../helpers/boardDragSurface';
import { settledWrites, watchWrites } from '../helpers/requestHarness';
import { dropLineOn, placementShown } from '../helpers/overflowTree';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1800, height: 1100 } });

for (const expanded of [false, true]) {
  test(`DRAG-4.1, DRAG-4.30: B09 stationary foreign entry from ${expanded ? 'sub-row' : 'column'} starts after the nested last subtree`, async ({
    page,
    request,
    projectSidebar,
  }, testInfo) => {
    const name = 'B09 Nested Last Seed';
    const s = await seedBoardFixture(request, name);
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const s2a = await seedItem(request, { title: 'S2a', parentId: s2.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const col = expanded
      ? await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded')
      : columnForWorkphase(s.board, s.todo.id).id;
    const key = expanded ? subrowRegionKey(col, s.todo.id) : columnRegionKey(col);
    const tuning = await seedDragTuning(page, { ...NO_POP, cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    await setSectionExpanded(itemRow(page, p.id), true);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await awaitDragContext(page, key);
    await hoverTo(page, await center(itemRow(page, p.id)));
    await expect.poll(() => dropLineOn(page)).toMatchObject({ row: p.id });
    const point = await center(itemRow(page, s1.id));
    await hoverTo(page, point);
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    const s1Box = await dragBoxOf(itemRow(page, s1.id));
    expect(point.x).toBeGreaterThanOrEqual(s1Box.x);
    expect(point.x).toBeLessThanOrEqual(s1Box.x + s1Box.width);
    expect(point.y).toBeGreaterThanOrEqual(s1Box.y);
    expect(point.y).toBeLessThanOrEqual(s1Box.y + s1Box.height);
    const paintedOrder = await paintedItemIds(itemRow(page, p.id));
    expect(paintedOrder).toEqual([s1.id, s2.id, s2a.id, x.id]);
    expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: s2.id, nextId: null });
    const line = await dropLineOn(page);
    await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
    await page.screenshot({ path: testInfo.outputPath('B09-before-release.png') });
    await releaseMove(page, x.id);
    await testInfo.attach('B09-observation', {
      body: JSON.stringify(
        {
          ids: { P: p.id, S1: s1.id, S2: s2.id, S2a: s2a.id, X: x.id },
          point,
          line,
          paintedOrder,
          saved: await fetchItem(request, x.id),
          writes: await settledWrites(page, writes),
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
    expectOneMove(await settledWrites(page, writes), x.id, {
      parentId: p.id,
      isAttached: true,
      anchorId: s2.id,
      side: 'after',
    });
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.todo.id });
    expect((await fetchItem(request, x.id)).position).toBeGreaterThan((await fetchItem(request, s2.id)).position);
  });
}

test('DRAG-4.30, DRAG-5.10: B10 own Stub returns to its pickup slot after a column excursion and writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'B10 Own Slot Return';
  const s = await seedBoardFixture(request, name);
  const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
  const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
  const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
  const s2a = await seedItem(request, { title: 'S2a', parentId: s2.id });
  const q = await seedItem(request, { title: 'Q', projectId: s.project.id, workphaseId: s.todo.id });
  const before = await fetchItem(request, s1.id);
  const tuning = await seedDragTuning(page, {
    ...NO_POP,
    popDelayMs: 650,
    cardZoomDwellMs: 650,
    cardPopInDelayMs: 350,
    popSnapMs: 0,
  });
  await projectSidebar.openBoard(name);
  await setSectionExpanded(itemRow(page, p.id), true);
  const writes = watchWrites(page);
  await pickUp(page, itemRowButton(page, s1.id, 'S1'));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await hoverTo(page, await center(itemRow(page, q.id)));
  await awaitDragContext(
    page,
    columnRegionKey(columnForWorkphase(s.board, s.todo.id).id),
    clocksMargin(tuning.popDelayMs),
  );
  await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'short-card');
  await hoverTo(page, await center(itemRow(page, p.id)));
  await awaitDragContext(
    page,
    descendantsRegionKey(p.id),
    clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
  );
  expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s2.id, s2a.id]);
  expect(await placementShown(itemRow(page, p.id), s1.id)).toEqual({ parentId: null, prevId: null, nextId: s2.id });
  await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
  expect((await dragBoxOf(dragOverlay(page))).height).toBe((await dragBoxOf(itemRow(page, s1.id))).height);
  expect((await dragBoxOf(dragOverlay(page))).width).toBe((await dragBoxOf(itemRow(page, s1.id))).width);
  await release(page);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect(await fetchItem(request, s1.id)).toEqual(before);
});

for (const depth of [0, 1, 2]) {
  test(`DRAG-4.33: B12 nested-last gap depth ${depth} commits its distinct parent and slot`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'B12 Last Gap States';
    const s = await seedBoardFixture(request, name);
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const s2a = await seedItem(request, { title: 'S2a', parentId: s2.id });
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      cardZoomDwellMs: 650,
      cardPopInDelayMs: 350,
      modalHoldDwellMs: NO_POP.cardZoomDwellMs,
      popSnapMs: 0,
    });
    await projectSidebar.openBoard(name);
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    const entry = await center(itemRow(page, p.id));
    await hoverTo(page, entry);
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );
    const last = await boxOf(itemRow(page, s2a.id));
    const point = { x: entry.x, y: last.y + last.height + 10 };
    await hoverTo(page, point);
    await tabBy(page, point, -1);
    await awaitProjection(page, '3:0:true');
    await tabBy(page, point, 3);
    await awaitProjection(page, '3:2:true');
    await tabBy(page, point, depth);
    await awaitProjection(page, `3:${depth}:true`);
    expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s2.id, s2a.id, x.id]);
    const expected = [
      { parent: p, anchor: s2, shown: { parentId: null, prevId: s2.id, nextId: null } },
      { parent: s2, anchor: s2a, shown: { parentId: s2.id, prevId: s2a.id, nextId: null } },
      { parent: s2a, anchor: null, shown: { parentId: s2a.id, prevId: null, nextId: null } },
    ][depth];
    expect(await placementShown(itemRow(page, p.id), x.id)).toEqual(expected.shown);
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, {
      parentId: expected.parent.id,
      isAttached: true,
      ...(expected.anchor ? { anchorId: expected.anchor.id, side: 'after' } : {}),
    });
    expect(await fetchItem(request, x.id)).toMatchObject({
      parentId: expected.parent.id,
      isAttached: 1,
      workphaseId: s.todo.id,
    });
    if (expected.anchor)
      expect((await fetchItem(request, x.id)).position).toBeGreaterThan(
        (await fetchItem(request, expected.anchor.id)).position,
      );
    else
      expect((await fetchItem(request, expected.parent.id)).children.map((child: { id: string }) => child.id)).toEqual([
        x.id,
      ]);
  });
}

for (const state of [
  { depth: 0, single: false },
  { depth: 1, single: false },
  { depth: 2, single: false },
  { depth: 3, single: false },
  { depth: 1, single: true },
]) {
  test(`DRAG-4.8: B11 ${state.single ? 'sole-state branch' : 'worked'} gap depth ${state.depth} saves the painted placement`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'B11 Gap States';
    const s = await seedBoardFixture(request, name);
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s1a = await seedItem(request, { title: 'S1a', parentId: s1.id });
    const s1a1 = await seedItem(request, { title: 'S1a1', parentId: s1a.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    const xc = state.single ? await seedItem(request, { title: 'XC', parentId: x.id }) : null;
    if (xc) expect(s.board.itemDepthCap).toBeGreaterThanOrEqual(4);
    await seedDragTuning(page, { ...NO_POP, modalHoldDwellMs: NO_POP.cardZoomDwellMs, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    await setSectionExpanded(itemRow(page, p.id), true);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRowButton(page, x.id, 'X'));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    if (xc) await expect(itemRow(page, xc.id)).toHaveCount(0);
    const target = state.single ? s1a : s2;
    let point = { x: from.x, y: (await topQuarter(itemRow(page, target.id))).y };
    await hoverTo(page, point);
    point = { x: from.x, y: (await topQuarter(itemRow(page, target.id))).y };
    await hoverTo(page, point);
    const gap = state.single ? 1 : 3;
    await tabBy(page, point, -1);
    await awaitProjection(page, `${gap}:${state.single ? 1 : 0}:true`);
    await tabBy(page, point, 4);
    await awaitProjection(page, `${gap}:${state.single ? 1 : 3}:true`);
    await tabBy(page, point, state.depth);
    await awaitProjection(page, `${gap}:${state.depth}:true`);
    expect(await paintedItemIds(itemRow(page, p.id))).toEqual(
      state.single ? [s1.id, x.id, s1a.id, s1a1.id, s2.id] : [s1.id, s1a.id, s1a1.id, x.id, s2.id],
    );
    const expected = state.single
      ? { parent: s1, anchor: s1a, side: 'before', shown: { parentId: s1.id, prevId: null, nextId: s1a.id } }
      : [
          { parent: p, anchor: s1, side: 'after', shown: { parentId: null, prevId: s1.id, nextId: s2.id } },
          { parent: s1, anchor: s1a, side: 'after', shown: { parentId: s1.id, prevId: s1a.id, nextId: null } },
          { parent: s1a, anchor: s1a1, side: 'after', shown: { parentId: s1a.id, prevId: s1a1.id, nextId: null } },
          { parent: s1a1, anchor: null, side: undefined, shown: { parentId: s1a1.id, prevId: null, nextId: null } },
        ][state.depth];
    expect(await placementShown(itemRow(page, p.id), x.id)).toEqual(expected.shown);
    const line = await dropLineOn(page);
    expect(state.single ? [s1.id, s1a.id] : [s1a1.id, s2.id]).toContain(line?.row);
    if (xc) {
      await expect(itemRow(page, xc.id)).toHaveCount(0);
      expect(line?.row).not.toBe(x.id);
      expect(line?.row).not.toBe(xc.id);
    }
    await releaseMove(page, x.id);
    const expectedBody = {
      ...(expected.parent.id !== p.id ? { parentId: expected.parent.id, isAttached: true } : {}),
      ...(expected.anchor ? { anchorId: expected.anchor.id, side: expected.side } : {}),
    };
    const observedWrites = await settledWrites(page, writes);
    if (!state.single && state.depth === 0) {
      expect(observedWrites).toHaveLength(1);
      expect([expectedBody, { anchorId: s2.id, side: 'before' }]).toContainEqual(observedWrites[0].body);
      expectOneMove(observedWrites, x.id, observedWrites[0].body as Record<string, unknown>);
    } else expectOneMove(observedWrites, x.id, expectedBody);
    const saved = await fetchItem(request, x.id);
    expect(saved).toMatchObject({ parentId: expected.parent.id, isAttached: 1, workphaseId: s.todo.id });
    if (expected.anchor) {
      const anchor = await fetchItem(request, expected.anchor.id);
      if (expected.side === 'before') expect(saved.position).toBeLessThan(anchor.position);
      else expect(saved.position).toBeGreaterThan(anchor.position);
    } else {
      expect((await fetchItem(request, expected.parent.id)).children.map((child: { id: string }) => child.id)).toEqual([
        x.id,
      ]);
    }
    if (xc)
      expect(await fetchItem(request, xc.id)).toMatchObject({ parentId: x.id, isAttached: 1, workphaseId: s.todo.id });
  });
}

for (const invalidRelease of [false, true]) {
  test(`DRAG-4.18, DRAG-4.32, DRAG-5.9: B15 ${invalidRelease ? 'invalid release restores origin' : 'invalid depth cue clears at a valid shallower state in the same gap'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'B15 Cap State';
    const s = await seedBoardFixture(request, name);
    let ancestor: { id: string } | undefined;
    for (let depth = 1; depth < s.board.itemDepthCap - 2; depth++) {
      ancestor = await seedItem(request, {
        title: `Ancestor ${depth}`,
        projectId: s.project.id,
        workphaseId: s.done.id,
        ...(ancestor ? { parentId: ancestor.id, isAttached: false } : {}),
      });
    }
    const p = await seedItem(request, {
      title: 'P',
      projectId: s.project.id,
      parentId: ancestor!.id,
      isAttached: false,
      workphaseId: s.todo.id,
    });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s1a = await seedItem(request, { title: 'S1a', parentId: s1.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    const beforeX = await fetchItem(request, x.id);
    await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    await setSectionExpanded(itemRow(page, p.id), true);
    const writes = watchWrites(page);
    const from = await pickUp(page, itemRowButton(page, x.id, 'X'));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    let point = { x: from.x, y: (await topQuarter(itemRow(page, s2.id))).y };
    await hoverTo(page, point);
    point = { x: from.x, y: (await topQuarter(itemRow(page, s2.id))).y };
    await hoverTo(page, point);
    point = await tabBy(page, point, 2);
    await awaitProjection(page, '2:2:false');
    await expect(itemRow(page, x.id)).toHaveAttribute('data-placement-valid', 'false');
    await expect(itemRow(page, x.id)).toBeVisible();
    expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s1a.id, x.id, s2.id]);
    await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
    if (invalidRelease) {
      await release(page);
      expect(await settledWrites(page, writes)).toEqual([]);
      expect(await fetchItem(request, x.id)).toEqual(beforeX);
      return;
    }
    await tabBy(page, point, -2);
    await awaitProjection(page, '2:0:true');
    await expect(itemRow(page, x.id)).not.toHaveAttribute('data-placement-valid');
    expect(await paintedItemIds(itemRow(page, p.id))).toEqual([s1.id, s1a.id, x.id, s2.id]);
    expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: s1.id, nextId: s2.id });
    await releaseMove(page, x.id);
    expectOneMove(await settledWrites(page, writes), x.id, { anchorId: s1.id, side: 'after' });
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: s.todo.id });
  });
}
for (const origin of ['free', 'foreign-stub'] as const) {
  for (const approach of ['above', 'below'] as const) {
    for (const destination of ['first', 'middle', 'deep'] as const) {
      test(`${origin === 'foreign-stub' && approach === 'above' && destination === 'first' ? 'DRAG-4.19, DRAG-4.34, DRAG-5.4' : `DRAG-4.34${origin === 'foreign-stub' ? ', DRAG-5.4' : ''}`}: B13 ${origin} from ${approach} follows the cursor to ${destination}`, async ({
        page,
        request,
        projectSidebar,
      }, testInfo) => {
        const name = 'B13 Moving Foreign Entry';
        const s = await seedBoardFixture(request, name);
        let x!: SeededItem;
        let originParent: SeededItem | undefined;
        const createOrigin = async () => {
          if (origin === 'foreign-stub') {
            originParent = await seedItem(request, {
              title: 'Origin',
              projectId: s.project.id,
              workphaseId: s.todo.id,
            });
            x = await seedItem(request, { title: 'X', parentId: originParent.id });
          } else x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
        };
        if (approach === 'above') await createOrigin();
        const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.doing.id });
        const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
        const s1a = await seedItem(request, { title: 'S1a', parentId: s1.id });
        const s1a1 = await seedItem(request, { title: 'S1a1', parentId: s1a.id });
        const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
        if (approach === 'below') await createOrigin();
        await seedItem(request, { title: 'R', projectId: s.project.id, workphaseId: s.doing.id });
        await seedItem(request, { title: 'T', projectId: s.project.id, workphaseId: s.doing.id });
        const col = await mergeRange(request, s.board, s.todo.id, s.doing.id, 'merged');
        const key = columnRegionKey(col);
        const tuning = await seedDragTuning(page, {
          ...NO_POP,
          popDelayMs: origin === 'foreign-stub' ? 1000 : NO_POP.popDelayMs,
          cardZoomDwellMs: 1600,
          cardPopInDelayMs: 350,
          modalHoldDwellMs: NO_POP.cardZoomDwellMs,
          popSnapMs: 0,
        });
        await projectSidebar.openBoard(name);
        await setSectionExpanded(itemRow(page, p.id), true);
        const writes = watchWrites(page);
        const from = await pickUp(
          page,
          origin === 'foreign-stub' ? itemRowButton(page, x.id, 'X') : itemRow(page, x.id),
        );
        let point = { x: from.x + 10, y: from.y + 10 };
        if (originParent) {
          await awaitDragContext(page, descendantsRegionKey(originParent.id));
          point = await atFraction(itemRow(page, p.id), approach === 'above' ? 0.15 : 0.85);
          await hoverTo(page, point);
          await awaitDragContext(page, key, clocksMargin(tuning.popDelayMs));
          const originRegion = dragRegion(page, key);
          const frames: unknown[] = [];
          const observe = async (stage: string) =>
            frames.push({
              stage,
              order: await paintedCardOrder(originRegion),
              line: await dropLineOn(page),
              context: await page.locator('[data-drag-state]').getAttribute('data-drag-context'),
              candidate: await page.locator('[data-drag-state]').getAttribute('data-drag-zoom-candidate'),
            });
          await observe('pop landed');
          // A pop removes the source Stub and inserts a Card, so its former aim can be stale.
          for (let pass = 0; pass < 3; pass++) {
            const order = await paintedCardOrder(originRegion);
            const xi = order.indexOf('X');
            const pi = order.indexOf('P');
            if (approach === 'above' ? xi + 1 === pi : pi + 1 === xi) break;
            const index = approach === 'above' ? (xi < pi ? pi - 1 : pi) : xi > pi ? pi + 1 : pi;
            point = await center(originRegion.getByRole('article', { name: order[index], exact: true }));
            await hoverTo(page, point);
            await observe(`aim ${pass + 1}`);
          }
          await testInfo.attach('B13-entry-preparation', {
            body: JSON.stringify({ ids: { P: p.id, Origin: originParent.id, X: x.id }, frames }, null, 2),
            contentType: 'application/json',
          });
        } else await awaitDragContext(page, key);
        const wantedLine = { row: p.id, side: approach === 'above' ? 'before' : 'after' };
        const currentLine = await dropLineOn(page);
        if (currentLine?.row !== wantedLine.row || currentLine.side !== wantedLine.side) {
          await leanAtGhost(
            page,
            itemRow(page, x.id),
            point,
            approach === 'above' ? 'down' : 'up',
            originParent ? 3 : 1,
          );
        }
        if (originParent)
          await testInfo.attach('B13-named-relation', {
            body: JSON.stringify(
              {
                ids: { P: p.id, Origin: originParent.id, X: x.id },
                line: await dropLineOn(page),
                context: await page.locator('[data-drag-state]').getAttribute('data-drag-context'),
                candidate: await page.locator('[data-drag-state]').getAttribute('data-drag-zoom-candidate'),
              },
              null,
              2,
            ),
            contentType: 'application/json',
          });
        await expect.poll(() => dropLineOn(page)).toEqual(wantedLine);
        if (originParent && approach === 'above') {
          const heldOrigin = originParent;
          const history: Array<{
            context: string | null;
            phase: string | null;
            candidate: string | null;
            line: { row: string | null; side: string | null } | null;
          }> = [];
          let capturedCue = false;
          // Read layer and line in one DOM observation while the pointer stays still.
          await expect
            .poll(
              async () => {
                const frame = await page.evaluate(() => {
                  const machine = document.querySelector('[data-drag-state]');
                  const line = document.querySelector('[data-drop-side]');
                  return {
                    context: machine?.getAttribute('data-drag-context') ?? null,
                    phase: machine?.getAttribute('data-drag-zoom-phase') ?? null,
                    candidate: machine?.getAttribute('data-drag-zoom-candidate') ?? null,
                    line: line
                      ? {
                          row: line.closest('[data-item-id]')?.getAttribute('data-item-id') ?? null,
                          side: line.getAttribute('data-drop-side'),
                        }
                      : null,
                  };
                });
                history.push(frame);
                if (frame.phase === 'cue' && !capturedCue) {
                  capturedCue = true;
                  await page.screenshot({ path: testInfo.outputPath('B13-held-P-before-wrong-cue.png') });
                  await testInfo.attach('B13-held-copy-geometry', {
                    body: JSON.stringify(
                      {
                        ids: { P: p.id, Origin: heldOrigin.id, X: x.id },
                        point,
                        frame,
                        copy: await dragBoxOf(dragOverlay(page)),
                        ghost: await dragBoxOf(itemRow(page, x.id)),
                      },
                      null,
                      2,
                    ),
                    contentType: 'application/json',
                  });
                }
                return frame.context;
              },
              { intervals: [16], timeout: clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs) },
            )
            .not.toBe(key);
          await testInfo.attach('B13-stationary-named-history', {
            body: JSON.stringify({ ids: { P: p.id, Origin: originParent.id, X: x.id }, history, writes }, null, 2),
            contentType: 'application/json',
          });
          const heldFrames = history.filter(frame => frame.context === key);
          expect(heldFrames.length).toBeGreaterThan(0);
          expect(heldFrames.every(frame => frame.line?.row === p.id && frame.line.side === 'before')).toBe(true);
          expect(history[history.length - 1].context).toBe(descendantsRegionKey(p.id));
        } else {
          await awaitDragContext(
            page,
            descendantsRegionKey(p.id),
            clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
          );
        }
        await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
        const interior = await center(itemRow(page, s1.id));
        await hoverTo(page, interior);
        await expectFollowing(page, interior, { x: interior.x + 4, y: interior.y + 4 });
        const target = destination === 'first' ? s1 : s2;
        point = { x: point.x, y: (await topQuarter(itemRow(page, target.id))).y };
        await hoverTo(page, point);
        point = { x: point.x, y: (await topQuarter(itemRow(page, target.id))).y };
        await hoverTo(page, point);
        const depth = destination === 'deep' ? 3 : 0;
        await tabBy(page, point, depth);
        await awaitProjection(page, `${destination === 'first' ? 0 : 3}:${depth}:true`);
        const shown =
          destination === 'first'
            ? { parentId: null, prevId: null, nextId: s1.id }
            : destination === 'middle'
              ? { parentId: null, prevId: s1.id, nextId: s2.id }
              : { parentId: s1a1.id, prevId: null, nextId: null };
        expect(await placementShown(itemRow(page, p.id), x.id)).toEqual(shown);
        expect(await paintedItemIds(itemRow(page, p.id))).toEqual(
          destination === 'first' ? [x.id, s1.id, s1a.id, s1a1.id, s2.id] : [s1.id, s1a.id, s1a1.id, x.id, s2.id],
        );
        await expectWithin(dragOverlay(page), itemRow(page, p.id));
        const region = dragRegion(page, key);
        const originOrder =
          origin === 'free'
            ? ['P', 'R', 'T']
            : approach === 'above'
              ? ['Origin', 'P', 'R', 'T']
              : ['P', 'Origin', 'R', 'T'];
        await expect.poll(() => paintedCardOrder(region)).toEqual(originOrder);
        await expect(region.getByRole('article', { name: 'X', exact: true })).toHaveCount(0);
        await expect
          .poll(async () => {
            const boxes = await Promise.all(
              originOrder.map(title => paintedBoxOf(region.getByRole('article', { name: title, exact: true }))),
            );
            const gaps = boxes.slice(1).map((box, i) => box.y - boxes[i].y - boxes[i].height);
            return Math.max(...gaps.map(gap => Math.abs(gap - gaps[gaps.length - 1])));
          })
          .toBeLessThan(0.01);
        expect(writes).toEqual([]);
        await releaseMove(page, x.id);
        const parent = destination === 'deep' ? s1a1 : p;
        const body = {
          parentId: parent.id,
          isAttached: true,
          ...(destination === 'first'
            ? { anchorId: s1.id, side: 'before' }
            : destination === 'middle'
              ? { anchorId: s1.id, side: 'after' }
              : {}),
        };
        const observedWrites = await settledWrites(page, writes);
        if (destination === 'middle') {
          const allowed = [body, { parentId: p.id, isAttached: true, anchorId: s2.id, side: 'before' }];
          expect(observedWrites).toHaveLength(1);
          expect(allowed).toContainEqual(observedWrites[0].body);
          expectOneMove(observedWrites, x.id, observedWrites[0].body as Record<string, unknown>);
        } else expectOneMove(observedWrites, x.id, body);
        const saved = await fetchItem(request, x.id);
        expect(saved).toMatchObject({ parentId: parent.id, isAttached: 1, workphaseId: s.doing.id });
        if (destination === 'first') expect(saved.position).toBeLessThan((await fetchItem(request, s1.id)).position);
        else if (destination === 'middle') {
          expect(saved.position).toBeGreaterThan((await fetchItem(request, s1.id)).position);
          expect(saved.position).toBeLessThan((await fetchItem(request, s2.id)).position);
        } else
          expect((await fetchItem(request, s1a1.id)).children.map((child: { id: string }) => child.id)).toEqual([x.id]);
      });
    }
  }
}
