import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { article, column, dragRegion, titlesIn } from '../helpers/boardLocators';
import { settleOnBottomBand } from '../helpers/boardDragScenario';
import {
  awaitPoppedOut,
  boxOf,
  center,
  gapBetween,
  hoverTo,
  pickUp,
  POP_OUT_ONLY,
  release,
  seedDragTuning,
} from '../helpers/dragGesture';
import {
  holdNextDeferredWrite,
  holdNextRead,
  successfulWrite,
  watchBoardLoads,
  watchWrites,
} from '../helpers/requestHarness';
import {
  addWorkphases,
  fetchBoard,
  fetchDefaultBoard,
  fetchItem,
  seedBareWorkflow,
  seedBoard,
  seedColumn,
  seedItem,
  updateColumn,
} from '../helpers/seed';
import { subrowRegionKey } from '../../client/src/components/workflow/dragRegions';
import { STOP_FLASH_MS } from '../../client/src/components/workflow/forcedStop';

test.beforeEach(async () => {
  await resetAndSeedDb();
});

test('BCU-1.10: a held switch read cannot undo a move answer applied while it ran', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { project, workflow } = await seedBareWorkflow(request, 'Switch Read Race Project');
  const [w1, w2] = await addWorkphases(request, workflow.id, ['W1', 'W2']);
  const a = await fetchDefaultBoard(request, workflow.id);
  const ca = await seedColumn(request, workflow.id, w1.id, w2.id);
  await updateColumn(request, ca.id, { displayMode: 'expanded' });
  const b = await seedBoard(request, workflow.id, 'Board B');
  expect((await fetchBoard(request, b.id)).columns.map(c => c.entryWorkphaseId)).toEqual([w1.id, w2.id]);
  const x = await seedItem(request, { title: 'X', projectId: project.id, workphaseId: w1.id });
  await seedItem(request, { title: 'Y', projectId: project.id, workphaseId: w2.id });
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(project.name);
  await expect(page.getByLabel('Active board')).toHaveValue(a.id);
  const merged = column(page, 'W1 – W2');
  await expect(article(merged, 'X')).toBeVisible();
  await expect(article(merged, 'Y')).toBeVisible();
  const target = dragRegion(page, subrowRegionKey(ca.id, w2.id));

  const move = await holdNextDeferredWrite(page, 'PATCH', '**/api/items/*/move');
  const writes = watchWrites(page);
  await pickUp(page, article(merged, 'X'));
  const targetMid = await center(target);
  await hoverTo(page, { x: (await boxOf(target)).x - 16, y: targetMid.y });
  await awaitPoppedOut(page, tuning);
  await settleOnBottomBand(page, target);
  await release(page);
  await move.arrived();
  expect(writes).toEqual([
    expect.objectContaining({
      url: expect.stringContaining(`/api/items/${x.id}/move`),
      body: expect.objectContaining({ workphaseId: w2.id }),
    }),
  ]);

  const stale = await holdNextRead(page, `**/api/boards/${b.id}`);
  await page.getByLabel('Active board').selectOption(b.id);
  await stale.arrived();
  await expect(page.getByText('Loading board…')).toBeVisible();
  const answered = successfulWrite(page, 'PATCH', `/api/items/${x.id}/move`);
  move.release();
  await answered;
  await expect.poll(async () => (await fetchItem(request, x.id)).workphaseId).toBe(w2.id);

  const loads = watchBoardLoads(page);
  const current = await holdNextRead(page, `**/api/boards/${b.id}`);
  stale.release();
  await current.arrived();
  await expect(page.getByText('Loading board…')).toBeVisible();
  await expect(column(page, 'W1')).toHaveCount(0);
  current.release();
  await expect(column(page, 'W1')).toBeVisible();
  await expect(merged).toHaveCount(0);
  await expect.poll(() => titlesIn(column(page, 'W1'))).toEqual([]);
  await expect.poll(async () => (await titlesIn(column(page, 'W2'))).sort()).toEqual(['X', 'Y']);
  await expect(page.getByLabel('Active board')).toHaveValue(b.id);
  expect(loads.length).toBeGreaterThanOrEqual(1);
  await move.dispose();
  await stale.dispose();
  await current.dispose();
});

test('BCU-1.10: a held reload cannot undo a move or start the stopped item flash early', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { project, workflow } = await seedBareWorkflow(request, 'Same Board Read Race Project');
  const [w1, w2] = await addWorkphases(request, workflow.id, ['W1', 'W2']);
  await seedColumn(request, workflow.id, w1.id);
  await seedColumn(request, workflow.id, w2.id);
  const x = await seedItem(request, { title: 'X', projectId: project.id, workphaseId: w1.id });
  const y = await seedItem(request, { title: 'Y', projectId: project.id, workphaseId: w2.id });
  const board = await fetchDefaultBoard(request, workflow.id);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(project.name);
  const first = column(page, 'W1');
  const second = column(page, 'W2');
  await expect(article(first, 'X')).toBeVisible();
  await expect(article(second, 'Y')).toBeVisible();

  const move = await holdNextDeferredWrite(page, 'PATCH', '**/api/items/*/move');
  await pickUp(page, article(first, 'X'));
  await hoverTo(page, await gapBetween(first, second));
  await awaitPoppedOut(page, tuning);
  await settleOnBottomBand(page, dragRegion(second));
  await release(page);
  await move.arrived();
  await expect(article(second, 'X')).toBeVisible();

  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await page.getByLabel('Seconds into the drag').fill('0.5');
  await page.getByRole('button', { name: 'Arm', exact: true }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  const stale = await holdNextRead(page, `**/api/boards/${board.id}`);
  await pickUp(page, article(second, 'Y'));
  await stale.arrived();
  await page.mouse.up();
  await expect(page.getByText('Loading board…')).toBeVisible();
  const answered = successfulWrite(page, 'PATCH', `/api/items/${x.id}/move`);
  move.release();
  await answered;
  await expect.poll(async () => (await fetchItem(request, x.id)).workphaseId).toBe(w2.id);

  const current = await holdNextRead(page, `**/api/boards/${board.id}`);
  stale.release();
  await current.arrived();
  await expect(page.getByText('Loading board…')).toBeVisible();
  await expect(page.locator('[data-stop-flash]')).toHaveCount(0);
  await page.clock.pauseAt(new Date());
  current.release();
  await expect.poll(() => titlesIn(first)).toEqual([]);
  await expect.poll(async () => (await titlesIn(second)).sort()).toEqual(['X', 'Y']);
  expect((await fetchItem(request, y.id)).workphaseId).toBe(w2.id);
  const flash = article(second, 'Y');
  await expect(flash).toHaveAttribute('data-stop-flash', 'true');
  await expect(flash).toHaveCSS('animation-duration', `${STOP_FLASH_MS / 1000}s`);
  await expect(flash).toHaveCSS('animation-iteration-count', '1');
  await page.clock.runFor(STOP_FLASH_MS - 1);
  await expect(flash).toHaveAttribute('data-stop-flash', 'true');
  await page.clock.runFor(1);
  await expect(flash).not.toHaveAttribute('data-stop-flash', 'true');
  await move.dispose();
  await stale.dispose();
  await current.dispose();
});

test('BCU-1.9: a failed board switch leaves the selected board without the old board columns', async ({
  page,
  request,
  projectSidebar,
}) => {
  const { project, workflow } = await seedBareWorkflow(request, 'Failed Switch Project');
  const [w1, w2] = await addWorkphases(request, workflow.id, ['W1', 'W2']);
  const a = await fetchDefaultBoard(request, workflow.id);
  await seedColumn(request, workflow.id, w1.id, w2.id);
  const b = await seedBoard(request, workflow.id, 'Board B');
  expect((await fetchBoard(request, b.id)).columns.map(c => c.entryWorkphaseId)).toEqual([w1.id, w2.id]);
  await projectSidebar.openBoard(project.name);
  const selected = page.getByLabel('Active board');
  await expect(selected).toHaveValue(a.id);
  await expect(page.getByRole('group', { name: 'W1 – W2' })).toBeVisible();

  const failed = await holdNextRead(page, `**/api/boards/${b.id}`, 'refuse');
  await selected.selectOption(b.id);
  await failed.arrived();
  await expect(page.getByText('Loading board…')).toBeVisible();
  failed.release();
  await expect(page.getByText('Loading board…')).toHaveCount(0);
  await expect(page.locator('[data-selected-board-id]')).toHaveAttribute('data-selected-board-id', b.id);
  await expect(page.getByRole('group', { name: 'W1 – W2' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'W1' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'W2' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Manage columns' })).toHaveCount(0);
  await failed.dispose();
});
