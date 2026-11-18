import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, fetchItem, fetchDefaultBoard } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  cancel,
  center,
  seedDragTuning,
  NO_POP,
  awaitDragContext,
  boxOf,
  clocksMargin,
  gapBetween,
  release,
  topQuarter,
  setBackDownLeaning,
} from '../helpers/dragGesture';
import { column, dragRegion, itemRow, itemRowButton, dragOverlay, overflowRow } from '../helpers/boardLocators';
import {
  expectTarget,
  freeTargetAtDepth,
  openTargets,
  targetBoard,
  targetChain,
  targetChild,
  targetRoot,
  TARGET_ZOOM,
  restoreTargetRows,
  savedTargetRows,
  observeTargetAbsence,
  previewTargetAttach,
  previewTargetDetach,
  zoomTarget,
  seedNonTargetPlaces,
  modalTargets,
  nameTargetNeighbor,
  openTargetModal,
  aimTargetOverflow,
  pickUpTargetCard,
} from '../helpers/dragTargetScenario';
import { dropLineOn, holdFreeAt, placementShown, rowIds } from '../helpers/overflowTree';
import { awaitProjection, tabBy } from '../helpers/dragGesture';
import { mergeRange, releaseMove, zoomIntoCard } from '../helpers/boardDragSurface';
import {
  holdNextDeferredWrite,
  holdNextWrite,
  settledWrites,
  successfulWrite,
  watchWrites,
} from '../helpers/requestHarness';
import {
  columnRegionKey,
  subrowRegionKey,
  descendantsRegionKey,
} from '../../client/src/components/workflow/dragRegions';
import { API } from '../helpers/api';
import { columnForWorkphase } from '../helpers/seed';
import { hierarchyModal } from '../helpers/boardLocators';
import { awaitModalHold } from '../helpers/dragGesture';
import { holdForcedStopCause } from '../helpers/forcedStopCause';

test.use({ viewport: { width: 1800, height: 1400 } });

// Pickup classification, rendered target tiers and attached-parent API parity.
// Static pickups disable pops; transition tests explicitly observe their reached contexts.

const PROJECT = 'Drag Classification Project';

test.describe('drag-target classification', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test('DRAG-2.1, DRAG-2.2, DRAG-2.3, DRAG-2.7, DRAG-2.10, ATT-4.9: every visible target is classified at pickup and agrees with an attached-parent API move', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, PROJECT);
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const board = await fetchDefaultBoard(request, workflow.id);
    const cap: number = board.itemDepthCap;
    expect(typeof cap).toBe('number');

    // X: the carried Card, with an attached Stub S, a detached child D (its
    // own Card) and D's own child D1 — DRAG-2.2's fixture.
    const x = await seedItem(request, { title: 'X', projectId: project.id, workphaseId: todo.id });
    const s = await seedItem(request, { title: 'S', parentId: x.id });
    const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: todo.id });
    const d1 = await seedItem(request, { title: 'D1', parentId: d.id });

    // X's subtree is 2 levels tall (X -> D -> D1, through the detached
    // branch — ATT-4.5), so the deepest legal parent for X sits at depth
    // cap - 1 - 2. A chain of nested Stubs down to exactly that depth ends
    // in T_ok; one more level under it is T_over — DRAG-2.3's and DRAG-2.7's
    // fixture, parameterized on the cap the board reports, never a literal.
    const xHeight = 2;
    const okDepth = cap - 1 - xHeight;
    expect(okDepth).toBeGreaterThanOrEqual(1);
    let deepest = await seedItem(request, { title: 'T1', projectId: project.id, workphaseId: todo.id });
    const chain = [deepest];
    for (let depth = 2; depth <= okDepth; depth++) {
      deepest = await seedItem(request, { title: `T${depth}`, parentId: deepest.id });
      chain.push(deepest);
    }
    const tOk = deepest;
    const tOver = await seedItem(request, { title: `T${okDepth + 1}`, parentId: tOk.id });

    // V supplies a Valid parent in another workphase for the inheritance replay.
    const v = await seedItem(request, { title: 'V', projectId: project.id, workphaseId: inProgress.id });
    const all = [x, s, d, d1, ...chain, tOver, v];
    const baseline = await savedTargetRows(request, all);
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0, workphaseId: todo.id });
    expect(await fetchItem(request, s.id)).toMatchObject({ parentId: x.id, isAttached: 1 });
    expect(await fetchItem(request, d.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
    expect(await fetchItem(request, d1.id)).toMatchObject({ parentId: d.id, isAttached: 1 });
    for (let i = 0; i < chain.length; i++) {
      expect(await fetchItem(request, chain[i].id)).toMatchObject({
        parentId: i === 0 ? null : chain[i - 1].id,
        isAttached: i === 0 ? 0 : 1,
      });
    }
    expect(chain.length + 1 + xHeight).toBe(cap);
    expect(await fetchItem(request, tOver.id)).toMatchObject({ parentId: tOk.id, isAttached: 1 });

    // The chain runs deeper than a Card's section shows by default, and a row behind an overflow
    // row isn't drawn to carry a state: show every level the cap allows.
    await seedDragTuning(page, { ...NO_POP, sectionLevels: cap });
    await projectSidebar.openBoard(PROJECT);
    await expect(page.getByRole('article', { name: 'X', exact: true })).toBeVisible();

    // Nothing is classified before a drag begins.
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);

    await pickUp(page, page.getByRole('article', { name: 'X', exact: true }));

    const expectStates = async () => {
      await expect(itemRow(page, v.id)).toHaveAttribute('data-drop-state', 'valid'); // DRAG-2.1
      await expect(itemRow(page, tOk.id)).toHaveAttribute('data-drop-state', 'valid'); // DRAG-2.3, DRAG-2.7 (a Stub)
      await expect(itemRow(page, tOver.id)).toHaveAttribute('data-drop-state', 'depth-capped'); // DRAG-2.3
      for (const id of [x.id, d.id, d1.id]) {
        await expect(itemRow(page, id).first()).toHaveAttribute('data-drop-state', 'cycle-forming'); // DRAG-2.2
      }
      // S is X's own attached child, so it renders only nested inside X's
      // own card — and that card's attached children collapse while it's
      // the one being dragged (a fixed, small ghost height for the carve-out
      // math), so S isn't in the DOM at all right now, never mind
      // classified. D and D1 above are unaffected: D is detached (its
      // own card, not nested under X), so neither it nor its own child D1
      // depends on X's collapse.
      await expect(itemRow(page, s.id)).toHaveCount(0);
    };
    await expectStates();
    const visible = all.filter(row => row.id !== s.id);
    expect(
      await page
        .locator('[data-item-id]')
        .evaluateAll(rows => rows.map(row => row.getAttribute('data-item-id')).sort()),
    ).toEqual(visible.map(row => row.id).sort());
    const classified: Array<{ id: string; state: string | null }> = [];
    for (const row of visible) {
      const state = await itemRow(page, row.id).getAttribute('data-drop-state');
      const expected = [x.id, d.id, d1.id].includes(row.id)
        ? 'cycle-forming'
        : row.id === tOver.id
          ? 'depth-capped'
          : 'valid';
      expect(state, row.title).toBe(expected);
      classified.push({ id: row.id, state });
    }

    await cancel(page);

    // The classification is per-drag: gone once the drag is, and nothing moved.
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);
    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'X', exact: true }),
    ).toBeVisible();
    const reloaded = await fetchItem(request, x.id);
    expect(reloaded.workphaseId).toBe(todo.id);
    expect(reloaded.parentId).toBeNull();

    for (const target of classified) {
      await test.step(`API parent ${target.id}: ${target.state}`, async () => {
        await restoreTargetRows(request, baseline);
        const before = await savedTargetRows(request, [x, s, d, d1]);
        const response = await request.patch(`${API}/items/${x.id}/move`, {
          data: { parentId: target.id, isAttached: true },
        });
        if (target.state === 'valid') {
          expect(response.ok()).toBe(true);
          const parent = baseline.find(row => row.id === target.id)!;
          expect(await fetchItem(request, x.id)).toMatchObject({
            parentId: target.id,
            isAttached: 1,
            workphaseId: parent.workphaseId,
          });
        } else {
          expect(response.status()).toBeGreaterThanOrEqual(400);
          expect(response.status()).toBeLessThan(500);
          expect(await savedTargetRows(request, [x, s, d, d1])).toEqual(before);
        }
      });
    }
    await restoreTargetRows(request, baseline);
  });

  // Skipped: the non-target fixture has no verified aim outside the expanded sub-rows.
  test.skip('DRAG-2.8: a Stub drag uses the Card classification rules and non-target places have no classification', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const b = await targetBoard(request, 'Stub Drag Classification Project');
    const { project, todo } = b;
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s2 = await seedItem(request, { title: 'S2', parentId: p.id });
    const q = await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });
    const sq = await seedItem(request, { title: 'SQ', parentId: q.id });
    const deep = await freeTargetAtDepth(request, b, 'Depth-capped Card', b.cap);
    const { unsorted: u, expandedId: expanded } = await seedNonTargetPlaces(request, b);
    expect(await fetchItem(request, s1.id)).toMatchObject({ parentId: p.id, isAttached: 1 });
    const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, popDelayMs: 300, popInDelayMs: 300 });
    await expect(itemRow(page, s1.id)).toBeVisible();

    await pickUp(page, itemRow(page, s1.id).getByRole('button', { name: 'S1' }));

    // P (S1's own Card), Q (the zoom-in reparent, DRAG-5.4) and Q's own Stub
    // are ordinary Valid targets; only S1 itself is Cycle-forming.
    await expect(itemRow(page, s2.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(itemRow(page, s1.id)).toHaveAttribute('data-drop-state', 'cycle-forming');
    await expect(itemRow(page, p.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(itemRow(page, q.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(itemRow(page, sq.id)).toHaveAttribute('data-drop-state', 'valid');
    await expectTarget(page, deep.row, 'depth-capped');
    for (const ancestor of deep.ancestors) await expectTarget(page, ancestor, 'valid');

    await cancel(page);
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);

    const outer = page.getByRole('group').filter({ has: dragRegion(page, subrowRegionKey(expanded, b.todo.id)) });
    const broken = page.getByRole('group').filter({ has: page.getByText('broken', { exact: true }) });
    const unsorted = column(page, 'Unsorted');
    await expect(broken).toHaveCount(1);
    await expect(itemRow(unsorted, u.id)).toBeVisible();
    const writes = watchWrites(page);
    for (const place of ['Unsorted', 'broken', 'wrapper'] as const) {
      await test.step(place, async () => {
        const before = await fetchItem(request, s1.id);
        await pickUp(page, itemRowButton(page, s1.id, s1.title));
        const nowhere = place === 'Unsorted' ? unsorted : place === 'broken' ? broken : outer;
        await expect(nowhere).not.toHaveAttribute('data-drop-state');
        await hoverTo(page, await gapBetween(outer, column(page, 'Review')));
        await awaitDragContext(page, null, clocksMargin(tuning.popDelayMs, tuning.popDelayMs));
        let point = await center(nowhere);
        if (place === 'wrapper') {
          const last = await boxOf(dragRegion(page, subrowRegionKey(expanded, b.doing.id)));
          const footer = await boxOf(outer.getByRole('button', { name: '+ Add item', exact: true }).last());
          point = { x: last.x + last.width / 2, y: Math.min(last.y + last.height + 30, footer.y - 10) };
          expect(point.y).toBeGreaterThan(last.y + last.height);
        }
        await hoverTo(page, point);
        await observeTargetAbsence(
          page,
          tuning.popInDelayMs + tuning.cardZoomDwellMs + tuning.cardPopInDelayMs,
          async () => {
            await awaitDragContext(page, null);
          },
        );
        await release(page);
        expect(await settledWrites(page, writes)).toEqual([]);
        expect(await fetchItem(request, s1.id)).toEqual(before);
      });
    }
  });
});

test('DRAG-2.14: a Valid Card and its Valid Stub are both Full', async ({ page, request, projectSidebar }) => {
  const b = await targetBoard(request, 'Full Card and Stub');
  const x = await targetRoot(request, b, 'X');
  const p = await targetRoot(request, b, 'P');
  const s = await targetChild(request, p, 'S');
  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  expect(await fetchItem(request, p.id)).toMatchObject({ parentId: null, isAttached: 0 });
  expect(await fetchItem(request, s.id)).toMatchObject({ parentId: p.id, isAttached: 1 });
  await openTargets(page, projectSidebar, b);
  await expect(itemRow(page, p.id)).toBeVisible();
  await expect(itemRow(page, s.id)).toBeVisible();
  await pickUp(page, itemRow(page, x.id));
  await expectTarget(page, p, 'valid', 'parent');
  await expectTarget(page, s, 'valid', 'parent');
  await cancel(page);
});

test('DRAG-2.4: classifications stay fixed while the drag leaves and enters contexts', async ({
  page,
  request,
  projectSidebar,
}) => {
  const b = await targetBoard(request, 'Classification Through Contexts');
  const x = await targetRoot(request, b, 'X');
  const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: b.todo.id });
  const d1 = await targetChild(request, d, 'D1');
  const t = await targetRoot(request, b, 'T');
  const chain = [t, ...(await targetChain(request, t, b.cap - 3, 'T child '))];
  const q = await targetRoot(request, b, 'Q', b.doing.id);
  const qs = await targetChild(request, q, 'Q Stub');
  const r = await targetRoot(request, b, 'R', b.doing.id);
  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  expect(await fetchItem(request, d.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
  expect(await fetchItem(request, d1.id)).toMatchObject({ parentId: d.id, isAttached: 1 });
  expect(chain.length + 1 + 2).toBe(b.cap + 1);
  const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, popDelayMs: 300, popInDelayMs: 300 });
  const doing = columnRegionKey(columnForWorkphase(b.board, b.doing.id).id);
  const observe = async () => {
    for (const row of [x, d, d1]) await expectTarget(page, row, 'cycle-forming');
    for (const row of chain.slice(0, -1)) await expectTarget(page, row, 'valid');
    await expectTarget(page, chain[chain.length - 1], 'depth-capped');
    for (const row of [q, qs, r]) await expectTarget(page, row, 'valid');
  };
  await pickUp(page, itemRow(page, x.id));
  await awaitDragContext(page, columnRegionKey(columnForWorkphase(b.board, b.todo.id).id));
  await observe();
  await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
  await awaitDragContext(page, null, clocksMargin(tuning.popDelayMs));
  await observe();
  await hoverTo(page, await center(dragRegion(column(page, 'In Progress'))));
  await awaitDragContext(page, doing, clocksMargin(tuning.popInDelayMs));
  await observe();
  await zoomTarget(page, q, tuning);
  await observe();
  await hoverTo(page, await center(itemRow(page, r.id)));
  await awaitDragContext(page, doing, clocksMargin(tuning.popDelayMs));
  await observe();
  await cancel(page);
});

test('DRAG-2.16: a capped Stub is Mid under a Valid parent and deeper Stubs stay Low', async ({
  page,
  request,
  projectSidebar,
}) => {
  const b = await targetBoard(request, 'Cap Boundary Tiers');
  const x = await targetRoot(request, b, 'X');
  const height = 2;
  const branch = await targetChain(request, x, height, 'X child ');
  const { row: p, ancestors } = await freeTargetAtDepth(request, b, 'P', b.cap - height - 1);
  const [s, c, e] = await targetChain(request, p, height + 1, 'P child ');
  expect(ancestors.length + 1 + 1 + branch.length).toBe(b.cap);
  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  const tuning = await openTargets(page, projectSidebar, b, TARGET_ZOOM);
  for (const row of [p, s, c, e]) await expect(itemRow(page, row.id)).toBeVisible();
  await pickUp(page, itemRow(page, x.id));
  await expectTarget(page, p, 'valid', 'parent');
  await expectTarget(page, s, 'depth-capped', 'anchor');
  for (const row of [c, e]) await expectTarget(page, row, 'depth-capped', 'neither');
  await cancel(page);

  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  const from = await zoomIntoCard(page, itemRow(page, x.id), itemRow(page, p.id), p.id, tuning);
  await awaitProjection(page, '3:0:true');
  expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: s.id, nextId: null });
  const gap = { x: from.x, y: (await center(itemRow(page, x.id))).y };
  await tabBy(page, gap, 1);
  await awaitProjection(page, '3:1:false');
  await tabBy(page, gap, 0);
  await awaitProjection(page, '3:0:true');
  await releaseMove(page, x.id);
  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: p.id, isAttached: 1, workphaseId: b.todo.id });
  expect((await fetchItem(request, x.id)).position).toBeGreaterThan((await fetchItem(request, s.id)).position);
});

test('DRAG-2.12: pending parent changes and detach keep visible descendants Cycle-forming', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  for (const kind of ['attach', 'reparent', 'detach'] as const) {
    await test.step(kind, async () => {
      const b = await targetBoard(request, `Pending cycle ${kind}`);
      const x = await targetRoot(request, b, 'X');
      const p = await targetRoot(request, b, 'P');
      const a = kind === 'reparent' ? await targetChild(request, p, 'A') : await targetRoot(request, b, 'A');
      const d =
        kind === 'detach'
          ? await targetChild(request, x, 'D')
          : await seedItem(request, { title: 'D', parentId: a.id, isAttached: false, workphaseId: b.todo.id });
      const moving = kind === 'detach' ? d : a;
      const old = await fetchItem(request, moving.id);
      expect(old).toMatchObject({
        parentId: kind === 'detach' ? x.id : kind === 'reparent' ? p.id : null,
        isAttached: kind === 'attach' ? 0 : 1,
      });
      expect(await fetchItem(request, d.id)).toMatchObject({
        parentId: kind === 'detach' ? x.id : a.id,
        isAttached: kind === 'detach' ? 1 : 0,
      });
      const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, popDelayMs: 300 });
      const key = columnRegionKey(columnForWorkphase(b.board, b.todo.id).id);
      const writes = watchWrites(page);
      const held = await holdNextDeferredWrite(page, 'PATCH', `**/api/items/${moving.id}/move`);
      try {
        if (kind === 'detach') await previewTargetDetach(page, d, p, key, tuning);
        else await previewTargetAttach(page, a, x, key, tuning, kind === 'reparent' ? p : undefined);
        await held.arrived();
        expect(await fetchItem(request, moving.id)).toEqual(old);
        await expect(itemRow(page, moving.id)).toHaveAttribute('data-pending', 'true');
        if (kind !== 'detach') {
          expect(writes[0].body).toMatchObject({ parentId: x.id, isAttached: true });
          await expect(itemRow(itemRow(page, x.id), a.id)).toBeVisible();
        }
        await expect(column(page, 'Todo').getByRole('article', { name: 'D', exact: true })).toBeVisible();
        expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
        await pickUp(page, itemRow(page, x.id));
        await expectTarget(page, d, 'cycle-forming', 'anchor');
        await cancel(page);
        const answered = successfulWrite(page, 'PATCH', `/api/items/${moving.id}/move`);
        held.release();
        await answered;
        await expect(itemRow(page, moving.id)).not.toHaveAttribute('data-pending', 'true');
      } finally {
        await held.dispose();
      }
    });
  }
});

test('DRAG-1.7, DRAG-1.8, DRAG-2.15: Cycle-forming and Depth-capped Free Cards are Mid neighbors and their Stubs are Low', async ({
  page,
  request,
  projectSidebar,
}) => {
  const b = await targetBoard(request, 'Mid Free Neighbors');
  const x = await targetRoot(request, b, 'X');
  const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: b.todo.id });
  const d1 = await targetChild(request, d, 'D1');
  const { row: t } = await freeTargetAtDepth(request, b, 'T', b.cap - 1);
  const ts = await targetChild(request, t, 'T Stub');
  expect(await fetchItem(request, d.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
  expect(await fetchItem(request, d1.id)).toMatchObject({ parentId: d.id, isAttached: 1 });
  expect(await fetchItem(request, ts.id)).toMatchObject({ parentId: t.id, isAttached: 1 });
  const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, sectionLevels: 2 });
  const key = columnRegionKey(columnForWorkphase(b.board, b.todo.id).id);
  for (const target of [d, t]) {
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
    const writes = watchWrites(page);
    await pickUp(page, itemRow(page, x.id));
    await expectTarget(page, d, 'cycle-forming', 'anchor');
    await expectTarget(page, t, 'depth-capped', 'anchor');
    await expectTarget(page, d1, 'cycle-forming', 'neither');
    await expectTarget(page, ts, 'depth-capped', 'neither');
    const relation = await nameTargetNeighbor(page, x, target);
    await observeTargetAbsence(page, tuning.cardZoomDwellMs + tuning.cardPopInDelayMs, async () => {
      await awaitDragContext(page, key, 0);
      await expect(page.locator('[data-drag-state]')).not.toHaveAttribute('data-drag-zoom-phase', { timeout: 0 });
      await expect(itemRow(page, target.id).locator('[data-drag-cue]')).toHaveCount(0, { timeout: 0 });
    });
    await releaseMove(page, x.id);
    expect(await settledWrites(page, writes)).toHaveLength(1);
    expect(writes[0].body).toEqual({ anchorId: target.id, side: relation.side });
    expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0, workphaseId: b.todo.id });
  }
});

test('DRAG-2.17: the attached branch stays absent while Free-linked descendants keep their tiers', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  for (const origin of ['section', 'free'] as const) {
    await test.step(origin, async () => {
      const b = await targetBoard(request, `Branch target ${origin}`);
      const p = await targetRoot(request, b, 'P');
      const z = await targetChild(request, p, 'Z');
      const x = origin === 'section' ? await targetChild(request, p, 'X') : await targetRoot(request, b, 'X');
      const [c, g] = await targetChain(request, x, 2, 'Carried child ');
      const w = await targetChild(request, p, 'W');
      const q = await targetRoot(request, b, 'Q');
      const qs = await targetChild(request, q, 'Q Stub');
      const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: b.todo.id });
      const d1 = await targetChild(request, d, 'D1');
      expect(await fetchItem(request, x.id)).toMatchObject({
        parentId: origin === 'section' ? p.id : null,
        isAttached: origin === 'section' ? 1 : 0,
      });
      expect(await fetchItem(request, d.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
      expect(await fetchItem(request, d1.id)).toMatchObject({ parentId: d.id, isAttached: 1 });
      const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, popDelayMs: 300 });
      for (const row of [c, g, d, d1]) await expect(itemRow(page, row.id)).toBeVisible();
      const absent = async () => {
        for (const row of [c, g]) {
          await expect(itemRow(page, row.id)).toHaveCount(0);
          await expect(page.getByText(row.title, { exact: true })).toHaveCount(0);
        }
        await expectTarget(page, d, 'cycle-forming', 'anchor');
        await expectTarget(page, d1, 'cycle-forming', 'neither');
      };
      const from = await pickUp(
        page,
        origin === 'section'
          ? itemRowButton(page, x.id, x.title)
          : itemRow(page, x.id).getByText(x.title, { exact: true }),
      );
      if (origin === 'section') await hoverTo(page, from);
      await absent();
      if (origin === 'section') {
        expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: z.id, nextId: w.id });
        const ownGap = { x: from.x, y: (await center(itemRow(page, x.id))).y };
        await tabBy(page, ownGap, 3);
        await awaitProjection(page, '1:1:true');
        expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: z.id, prevId: null, nextId: null });
        for (let pass = 0; pass < 2; pass++) {
          const target = await topQuarter(itemRow(page, z.id));
          await tabBy(page, { x: from.x, y: target.y }, 0);
        }
        expect(await placementShown(itemRow(page, p.id), x.id)).toEqual({ parentId: null, prevId: null, nextId: z.id });
        await expect.poll(() => dropLineOn(page)).toEqual({ row: z.id, side: 'before' });
        await absent();
        await hoverTo(page, await center(itemRow(page, q.id)));
        await awaitDragContext(
          page,
          columnRegionKey(columnForWorkphase(b.board, b.todo.id).id),
          clocksMargin(tuning.popDelayMs),
        );
        await absent();
      }
      await zoomTarget(page, q, tuning);
      await absent();
      expect(await placementShown(itemRow(page, q.id), x.id)).toEqual({ parentId: null, prevId: qs.id, nextId: null });
      await cancel(page);
    });
  }
});

test('DRAG-2.18: overflow rows are Full for Valid owners and Low for invalid owners', async ({
  page,
  request,
  projectSidebar,
}) => {
  const b = await targetBoard(request, 'Overflow Target Tiers');
  const x = await targetRoot(request, b, 'X');
  const branch = await targetChain(request, x, 3, 'X child ');
  const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: b.todo.id });
  const [cycle] = await targetChain(request, d, 2, 'D child ');
  const vCard = await targetRoot(request, b, 'Valid card');
  const v = await targetChild(request, vCard, 'Valid owner');
  const v1 = await targetChild(request, v, 'Valid child 1');
  await targetChild(request, v, 'Valid child 2');
  await targetChild(request, v1, 'Uncounted grandchild');
  const { row: tCard, ancestors } = await freeTargetAtDepth(request, b, 'Deep card', b.cap - 4);
  const t = await targetChild(request, tCard, 'Capped owner');
  await targetChain(request, t, 2, 'Capped child ');
  expect(ancestors.length + 2 + 1 + 3).toBe(b.cap + 1);
  expect(await fetchItem(request, d.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
  const represented = [
    { card: vCard, owner: v, count: '2 children', tier: 'parent' },
    { card: tCard, owner: t, count: '1 child', tier: 'neither' },
    { card: d, owner: cycle, count: '1 child', tier: 'neither' },
  ] as const;
  await openTargets(page, projectSidebar, b, { sectionLevels: 1 });
  for (const row of represented) {
    expect(await rowIds(itemRow(page, row.card.id))).toEqual([row.owner.id, `overflow:${row.owner.id}`]);
    await expect(overflowRow(page, row.owner.id)).toHaveText(row.count);
  }
  await expect(overflowRow(page, branch[0].id)).toHaveText('1 child');
  await pickUp(page, itemRow(page, x.id));
  await expectTarget(page, v, 'valid', 'parent');
  await expectTarget(page, t, 'depth-capped', 'anchor');
  await expectTarget(page, cycle, 'cycle-forming', 'neither');
  for (const row of represented) {
    const control = overflowRow(page, row.owner.id);
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute('data-drop-tier', row.tier);
    await expect(control).not.toHaveAttribute('data-item-id');
    await expect(control).toHaveText(row.count);
    expect(await rowIds(itemRow(page, row.card.id))).toEqual([row.owner.id, `overflow:${row.owner.id}`]);
  }
  await expect(overflowRow(page, branch[0].id)).toHaveCount(0);
  await cancel(page);
});

test('DRAG-2.20, DRAG-7.12: the ghost, copy, backdrop rows and non-target places carry no target tier', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await modalTargets(request, 'Untiered Representations');
  const { expandedId } = await seedNonTargetPlaces(request, s);
  const tuning = await openTargets(page, projectSidebar, s, {
    ...TARGET_ZOOM,
    sectionLevels: 3,
    modalHoldDwellMs: 500,
    modalHoldCueMs: 500,
  });
  expect(await fetchItem(request, s.x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  expect(await fetchItem(request, s.d.id)).toMatchObject({ parentId: s.x.id, isAttached: 0 });
  await expect(overflowRow(page, s.r.id)).toBeVisible();
  await expect(dragRegion(page, subrowRegionKey(expandedId, s.todo.id))).toBeVisible();
  await pickUpTargetCard(page, s.x);
  await expectTarget(page, s.a, 'valid', 'parent');
  await expectTarget(page, s.d, 'cycle-forming', 'anchor');
  await expectTarget(page, s.freeBranch[0], 'cycle-forming', 'neither');
  expect(await itemRow(page, s.x.id).getAttribute('class')).toContain('opacity-(--drag-tier-ghost)');
  await expect(itemRow(page, s.x.id)).not.toHaveAttribute('data-drop-tier');
  await expect(dragOverlay(page)).not.toHaveAttribute('data-drop-tier');
  await expect(dragOverlay(page).locator('[data-drop-tier]')).toHaveCount(0);
  for (const place of [
    column(page, 'Unsorted'),
    page.getByRole('group').filter({ has: dragRegion(page, subrowRegionKey(expandedId, s.todo.id)) }),
    page.getByRole('group').filter({ has: page.getByText('broken', { exact: true }) }),
  ]) {
    await expect(place).toHaveCount(1);
    await expect(place).not.toHaveAttribute('data-drop-tier');
  }
  await zoomTarget(page, s.p, tuning);
  const modal = await openTargetModal(page, s.x, s.p, s.r, 3, tuning);
  await expectTarget(modal, s.r, 'valid', 'parent');
  await expectTarget(modal, s.r1, 'valid', 'parent');
  await expectTarget(modal, s.mid, 'depth-capped', 'anchor');
  await expectTarget(modal, s.low, 'depth-capped', 'neither');
  await expect(itemRow(page, s.p.id).getByText(s.a.title, { exact: true })).toBeVisible();
  await expect(itemRow(page, s.p.id).locator('[data-drop-tier]')).toHaveCount(0);
  await expect(itemRow(modal, s.x.id)).not.toHaveAttribute('data-drop-tier');
  await expect(dragOverlay(page)).not.toHaveAttribute('data-drop-tier');
  await cancel(page);
});

test('DRAG-2.21: nested rows keep their own tiers and the drop line takes none', async ({
  page,
  request,
  projectSidebar,
}) => {
  const b = await targetBoard(request, 'Independent Nested Tiers');
  const x = await targetRoot(request, b, 'X');
  const p = await seedItem(request, { title: 'P', parentId: x.id, isAttached: false, workphaseId: b.todo.id });
  const [s, deeper] = await targetChain(request, p, 2, 'Low Stub ');
  const { row: boundary } = await freeTargetAtDepth(request, b, 'Boundary', b.cap - 4);
  const [mid] = await targetChain(request, boundary, 2, 'Boundary Stub ');
  expect(await fetchItem(request, p.id)).toMatchObject({ parentId: x.id, isAttached: 0 });
  const tuning = await openTargets(page, projectSidebar, b, TARGET_ZOOM);
  await pickUp(page, itemRow(page, x.id));
  await expectTarget(page, p, 'cycle-forming', 'anchor');
  for (const row of [s, deeper]) await expectTarget(page, row, 'cycle-forming', 'neither');
  await nameTargetNeighbor(page, x, p);
  await expect(itemRow(page, p.id).locator('[data-drop-side]')).toHaveCount(1);
  await expect(itemRow(page, p.id).locator('[data-drop-side]')).not.toHaveAttribute('data-drop-tier');
  await cancel(page);
  expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
  await holdFreeAt(page, x, boundary, tuning, () => topQuarter(itemRow(page, mid.id)), 0);
  await awaitProjection(page, '0:0:true');
  await expectTarget(page, mid, 'depth-capped', 'anchor');
  await expect.poll(() => dropLineOn(page)).toEqual({ row: mid.id, side: 'before' });
  await expect(itemRow(page, mid.id).locator('[data-drop-side]')).toHaveCount(1);
  await expect(itemRow(page, mid.id).locator('[data-drop-side]')).not.toHaveAttribute('data-drop-tier');
  await cancel(page);
});

test('DRAG-2.19, DRAG-7.12: pickup tiers survive layer changes and a write answer, then clear at every drag end', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  await test.step('merged layers, an answer during drag and a pending drop', async () => {
    const s = await modalTargets(request, 'Tier Lifecycle Drop');
    const earlierNeighbor = await targetRoot(request, s, 'Earlier neighbor');
    const earlier = await targetRoot(request, s, 'Earlier item');
    const tuning = await openTargets(page, projectSidebar, s, {
      ...TARGET_ZOOM,
      sectionLevels: 3,
      popDelayMs: 300,
      popInDelayMs: 300,
      modalHoldDwellMs: 500,
      modalHoldCueMs: 500,
    });
    expect(await fetchItem(request, s.x.id)).toMatchObject({ parentId: null, isAttached: 0 });
    const prior = await holdNextWrite(page, {
      method: 'PATCH',
      url: `**/api/items/${earlier.id}/move`,
      outcome: 'succeed',
    });
    const current = await holdNextWrite(page, {
      method: 'PATCH',
      url: `**/api/items/${s.x.id}/move`,
      outcome: 'succeed',
    });
    try {
      await setBackDownLeaning(page, itemRow(page, earlier.id), 'up');
      expect((await prior.arrived()).status).toBe(200);
      await expect(itemRow(page, earlier.id)).toHaveAttribute('data-pending', 'true');
      const snapshot = async () => {
        await expectTarget(page, s.d, 'cycle-forming', 'anchor');
        for (const row of s.freeBranch.slice(0, 3)) await expectTarget(page, row, 'cycle-forming', 'neither');
        for (const row of [s.p, s.a, s.q, s.r, s.r1, s.tail, earlierNeighbor, earlier]) {
          if (await itemRow(page, row.id).count()) await expectTarget(page, row, 'valid', 'parent');
        }
        if (await itemRow(page, s.mid.id).count()) await expectTarget(page, s.mid, 'depth-capped', 'anchor');
        if (await itemRow(page, s.low.id).count()) await expectTarget(page, s.low, 'depth-capped', 'neither');
        if (await overflowRow(page, s.r.id).count()) {
          await expect(overflowRow(page, s.r.id)).toHaveAttribute('data-drop-tier', 'parent');
        }
        await expect(overflowRow(page, s.freeBranch[2].id)).toHaveAttribute('data-drop-tier', 'neither');
      };
      await pickUpTargetCard(page, s.x);
      await snapshot();
      await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
      await awaitDragContext(page, null, clocksMargin(tuning.popDelayMs));
      await snapshot();
      await hoverTo(page, await center(dragRegion(column(page, 'Todo'))));
      await awaitDragContext(
        page,
        columnRegionKey(columnForWorkphase(s.board, s.todo.id).id),
        clocksMargin(tuning.popInDelayMs),
      );
      await snapshot();
      await zoomTarget(page, s.p, tuning);
      await snapshot();
      const modal = await openTargetModal(page, s.x, s.p, s.r, 3, tuning);
      await snapshot();
      const previousAnswer = successfulWrite(page, 'PATCH', `/api/items/${earlier.id}/move`);
      prior.release();
      await previousAnswer;
      await expect(itemRow(page, earlier.id)).not.toHaveAttribute('data-pending', 'true');
      await awaitDragContext(page, descendantsRegionKey(s.p.id));
      await snapshot();
      const preview = await placementShown(modal, s.x.id);
      expect(preview).toEqual({ parentId: s.r.id, prevId: null, nextId: s.r1.id });
      await release(page);
      expect((await current.arrived()).status).toBe(200);
      await expect(page.locator('[data-drop-tier]')).toHaveCount(0);
      await expect(itemRow(modal, s.x.id)).toHaveAttribute('data-pending', 'true');
      expect(await placementShown(modal, s.x.id)).toEqual(preview);
      const answer = successfulWrite(page, 'PATCH', `/api/items/${s.x.id}/move`);
      current.release();
      await answer;
      await expect(itemRow(modal, s.x.id)).not.toHaveAttribute('data-pending', 'true');
      await expect(page.locator('[data-drop-tier]')).toHaveCount(0);
    } finally {
      await current.dispose();
      await prior.dispose();
    }
  });

  await test.step('expanded sub-row and cancel', async () => {
    const s = await modalTargets(request, 'Tier Lifecycle Cancel');
    const expanded = await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded');
    const tuning = await openTargets(page, projectSidebar, s, { sectionLevels: 3, popDelayMs: 300, popInDelayMs: 300 });
    expect(await fetchItem(request, s.x.id)).toMatchObject({ parentId: null, isAttached: 0 });
    const snapshot = async () => {
      await expectTarget(page, s.a, 'valid', 'parent');
      await expectTarget(page, s.d, 'cycle-forming', 'anchor');
      await expectTarget(page, s.freeBranch[0], 'cycle-forming', 'neither');
    };
    await pickUpTargetCard(page, s.x);
    await awaitDragContext(page, subrowRegionKey(expanded, s.todo.id));
    await snapshot();
    const outer = page.getByRole('group').filter({ has: dragRegion(page, subrowRegionKey(expanded, s.todo.id)) });
    await hoverTo(page, await gapBetween(outer, column(page, 'Review')));
    await awaitDragContext(page, null, clocksMargin(tuning.popDelayMs));
    await snapshot();
    await hoverTo(page, await center(dragRegion(page, subrowRegionKey(expanded, s.todo.id))));
    await awaitDragContext(page, subrowRegionKey(expanded, s.todo.id), clocksMargin(tuning.popInDelayMs));
    await snapshot();
    await cancel(page);
    await expect(page.locator('[data-drop-tier]')).toHaveCount(0);
  });

  await test.step('a genuine earlier refusal forces a stop', async () => {
    const s = await modalTargets(request, 'Tier Lifecycle Stop');
    await targetRoot(request, s, 'Earlier neighbor');
    const earlier = await targetRoot(request, s, 'Earlier item');
    await openTargets(page, projectSidebar, s, { sectionLevels: 3 });
    const before = await fetchItem(request, s.x.id);
    const cause = await holdForcedStopCause(page, 'failed-item-drop');
    try {
      await setBackDownLeaning(page, itemRow(page, earlier.id), 'up');
      await cause.arrived();
      await expect(itemRow(page, earlier.id)).toHaveAttribute('data-pending', 'true');
      await pickUpTargetCard(page, s.x);
      await expectTarget(page, s.a, 'valid', 'parent');
      await expectTarget(page, s.d, 'cycle-forming', 'anchor');
      await expectTarget(page, s.freeBranch[0], 'cycle-forming', 'neither');
      await cause.trigger();
      await expect(itemRow(page, s.x.id)).toBeVisible();
      await expect(dragOverlay(page)).toHaveCount(0);
      await expect(page.locator('[data-drop-tier]')).toHaveCount(0);
      expect(await fetchItem(request, s.x.id)).toEqual(before);
      await release(page);
    } finally {
      await cause.dispose();
    }
  });
});

test('DRAG-2.22: dimmed targets start no entry cue while a Full overflow row can open its modal', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  await test.step('invalid Card and overflow targets', async () => {
    const s = await modalTargets(request, 'No Dimmed Target Holds', 4);
    const tuning = await openTargets(page, projectSidebar, s, {
      ...TARGET_ZOOM,
      sectionLevels: 3,
      modalHoldDwellMs: 300,
      modalHoldCueMs: 300,
    });
    expect(await fetchItem(request, s.x.id)).toMatchObject({ parentId: null, isAttached: 0 });
    expect(await fetchItem(request, s.d.id)).toMatchObject({ parentId: s.x.id, isAttached: 0 });
    await expect(overflowRow(page, s.branch[2].id)).toBeVisible();
    await expect(overflowRow(page, s.freeBranch[2].id)).toBeVisible();
    await pickUpTargetCard(page, s.x);
    await expectTarget(page, s.d, 'cycle-forming', 'anchor');
    await expect(overflowRow(page, s.freeBranch[2].id)).toHaveAttribute('data-drop-tier', 'neither');
    await expect(overflowRow(page, s.branch[2].id)).toHaveCount(0);
    await nameTargetNeighbor(page, s.x, s.d);
    await observeTargetAbsence(page, tuning.cardZoomDwellMs + tuning.cardPopInDelayMs, async () => {
      await awaitDragContext(page, columnRegionKey(columnForWorkphase(s.board, s.todo.id).id), 0);
      await expect(page.locator('[data-drag-state]')).not.toHaveAttribute('data-drag-zoom-phase', { timeout: 0 });
      await expect(itemRow(page, s.d.id).locator('[data-drag-cue]')).toHaveCount(0, { timeout: 0 });
      await awaitModalHold(page, null, 0);
      await expect(hierarchyModal(page, s.d.title)).toHaveCount(0, { timeout: 0 });
    });
    await zoomTarget(page, s.p, tuning);
    await expectTarget(page, s.r, 'depth-capped', 'anchor');
    await aimTargetOverflow(page, s.x, s.r, 3);
    await awaitProjection(page, '3:3:false');
    await observeTargetAbsence(page, tuning.modalHoldDwellMs + tuning.modalHoldCueMs, async () => {
      await awaitModalHold(page, null, 0);
      await expect(overflowRow(page, s.r.id).locator('[data-drag-cue]')).toHaveCount(0, { timeout: 0 });
      await expect(hierarchyModal(page, s.p.title)).toHaveCount(0, { timeout: 0 });
    });
    await cancel(page);
  });
  await test.step('Full overflow retains its ordinary hold', async () => {
    const s = await modalTargets(request, 'Full Target Hold');
    const tuning = await openTargets(page, projectSidebar, s, {
      ...TARGET_ZOOM,
      sectionLevels: 3,
      modalHoldDwellMs: 1500,
      modalHoldCueMs: 1000,
    });
    expect(await fetchItem(request, s.x.id)).toMatchObject({ parentId: null, isAttached: 0 });
    await expect(overflowRow(page, s.r.id)).toBeVisible();
    await pickUpTargetCard(page, s.x);
    await zoomTarget(page, s.p, tuning);
    await expectTarget(page, s.r, 'valid', 'parent');
    await expect(overflowRow(page, s.r.id)).toHaveAttribute('data-drop-tier', 'parent');
    await aimTargetOverflow(page, s.x, s.r, 3);
    await awaitProjection(page, '3:3:true');
    await awaitModalHold(page, `${s.r.id}:dwell`);
    await awaitModalHold(page, `${s.r.id}:cue`, clocksMargin(tuning.modalHoldDwellMs));
    await expect(overflowRow(page, s.r.id).locator('[data-drag-cue]')).toBeVisible();
    await expect(hierarchyModal(page, s.p.title)).toBeVisible({ timeout: clocksMargin(tuning.modalHoldCueMs) });
    await cancel(page);
  });
});

test('DRAG-2.23: pickup tiers use pending parent and attachment state', async ({ page, request, projectSidebar }) => {
  test.slow();
  const variants = [
    { kind: 'attach', parent: 'P' },
    { kind: 'attach', parent: 'Q' },
    { kind: 'reparent', parent: 'P' },
    { kind: 'reparent', parent: 'Q' },
    { kind: 'detach', parent: 'Q' },
    { kind: 'detach', parent: 'X' },
    { kind: 'attach', parent: 'X' },
  ] as const;
  for (const variant of variants) {
    await test.step(`${variant.kind} ${variant.parent}`, async () => {
      const b = await targetBoard(request, `Pending tier ${variant.kind} ${variant.parent}`);
      const x = await targetRoot(request, b, 'X');
      await targetChain(request, x, 1, 'X child ');
      const oldCard = await targetRoot(request, b, 'Old parent');
      const parent =
        variant.parent === 'X'
          ? x
          : (await freeTargetAtDepth(request, b, variant.parent, b.cap - (variant.parent === 'P' ? 2 : 1))).row;
      const d =
        variant.kind === 'detach'
          ? await targetChild(request, parent, 'D')
          : variant.kind === 'reparent'
            ? await targetChild(request, oldCard, 'D')
            : await targetRoot(request, b, 'D');
      const old = await fetchItem(request, d.id);
      expect(old).toMatchObject({
        parentId: variant.kind === 'detach' ? parent.id : variant.kind === 'reparent' ? oldCard.id : null,
        isAttached: variant.kind === 'attach' ? 0 : 1,
      });
      const tuning = await openTargets(page, projectSidebar, b, { ...TARGET_ZOOM, popDelayMs: 300 });
      const key = columnRegionKey(columnForWorkphase(b.board, b.todo.id).id);
      const writes = watchWrites(page);
      const held = await holdNextDeferredWrite(page, 'PATCH', `**/api/items/${d.id}/move`);
      try {
        if (variant.kind === 'detach') await previewTargetDetach(page, d, oldCard, key, tuning);
        else await previewTargetAttach(page, d, parent, key, tuning, variant.kind === 'reparent' ? oldCard : undefined);
        await held.arrived();
        expect(await fetchItem(request, d.id)).toEqual(old);
        await expect(itemRow(page, d.id)).toHaveAttribute('data-pending', 'true');
        if (variant.kind === 'detach') {
          await expect(column(page, 'Todo').getByRole('article', { name: 'D', exact: true })).toBeVisible();
          expect(writes[0].body).toMatchObject({ isAttached: false });
        } else {
          await expect(itemRow(itemRow(page, parent.id), d.id)).toBeVisible();
          expect(writes[0].body).toMatchObject({ parentId: parent.id, isAttached: true });
        }
        expect(await fetchItem(request, x.id)).toMatchObject({ parentId: null, isAttached: 0 });
        await pickUp(page, itemRow(page, x.id));
        if (variant.parent === 'X' && variant.kind === 'attach') {
          await expect(column(page, 'Todo').getByRole('article', { name: 'D', exact: true })).toHaveCount(0);
          await expect(itemRow(page, d.id)).toHaveCount(0);
        } else {
          await expectTarget(
            page,
            d,
            variant.parent === 'X' ? 'cycle-forming' : 'depth-capped',
            variant.kind === 'detach' || variant.parent === 'P' ? 'anchor' : 'neither',
          );
        }
        await cancel(page);
        const answered = successfulWrite(page, 'PATCH', `/api/items/${d.id}/move`);
        held.release();
        await answered;
        await expect(itemRow(page, d.id)).not.toHaveAttribute('data-pending', 'true');
        expect(await fetchItem(request, d.id)).toMatchObject({
          parentId: parent.id,
          isAttached: variant.kind === 'detach' ? 0 : 1,
        });
      } finally {
        await held.dispose();
      }
    });
  }
});
