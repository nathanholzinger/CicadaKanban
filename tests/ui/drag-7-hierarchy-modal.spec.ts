import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  columnForWorkphase,
  fetchDefaultBoard,
  fetchItem,
  pickWorkphases,
  seedItem,
  seedTemplatedWorkflow,
} from '../helpers/seed';
import {
  atFraction,
  awaitDragContext,
  awaitProjection,
  bottomQuarter,
  boxOf,
  cancel,
  center,
  clocksMargin,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import { article, hierarchyModal, itemRow, overflowRow } from '../helpers/boardLocators';
import { sectionRows, seedOverflowTree } from '../helpers/overflowTree';
import { watchWrites } from '../helpers/projectTreeDrag';
import { cardRegionKey, columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../../client/src/components/cardMetrics';

// The hierarchy modal: a Card's whole hierarchy, opened by a click on an overflow row. While it's
// open it is the Card's Descendants layer, drawn whole. The cases assert what it draws and what a
// release writes, never a duration.
//
// Where a case drags a row, it's a Stub of `P` picked up in the modal, which starts at the
// Descendants layer with no pop.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// A row of the modal, by item id.
const modalRow = (modal: Locator, id: string) => modal.locator(`[data-item-id="${id}"]`);

// The modal's rows in order, by id.
const modalRowIds = (modal: Locator) =>
  modal
    .locator('[data-item-id], [data-overflow-row]')
    .evaluateAll(els =>
      els.map(el => el.getAttribute('data-item-id') ?? `overflow:${el.getAttribute('data-overflow-row')}`),
    );

// Picks a row of the modal up by its title.
const pickUpRow = (page: Page, modal: Locator, id: string, title: string) =>
  pickUp(page, modalRow(modal, id).getByRole('button', { name: title, exact: true }));

test('DRAG-7.7: clicking an overflow row opens the hierarchy modal, centered, with every attached descendant at its level', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Open Project';
  const { a, q, r, t, r1, r2, r1a, b, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const writes = watchWrites(page);

  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();

  // Centered in the window.
  const viewport = page.viewportSize()!;
  const box = await boxOf(modal);
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2);

  // P's attached descendants at every level, in the order the section draws them, each at its
  // level, with no overflow row. F and G are Free, so they show on the board as Cards of their own.
  expect(await modalRowIds(modal)).toEqual([a, q, r, r1, r1a, r2, t, b, x].map(i => i.id));
  const levels: Array<[{ id: string }, number]> = [
    [a, 0],
    [q, 1],
    [r, 2],
    [r1, 3],
    [r1a, 4],
    [r2, 3],
    [t, 2],
    [b, 0],
    [x, 0],
  ];
  for (const [item, depth] of levels) {
    await expect(modalRow(modal, item.id)).toHaveCSS('padding-left', `${descendantsIndentPx(depth)}px`);
  }
  await expect(modal.getByText('F', { exact: true })).toHaveCount(0);
  await expect(modal.getByText('G', { exact: true })).toHaveCount(0);

  expect(writes).toEqual([]);
});

test('DRAG-7.7: any of the section’s overflow rows opens the same modal, the Card’s whole hierarchy', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Two Overflow Rows Project';
  const { p, r, t } = await seedOverflowTree(request, name);
  await seedItem(request, { title: 'T1', parentId: t.id });
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toContain(`overflow:${t.id}`);

  await overflowRow(page, t.id).click();
  const fromT = await modalRowIds(hierarchyModal(page, 'P'));
  await page.keyboard.press('Escape');
  await expect(hierarchyModal(page, 'P')).toHaveCount(0);

  await overflowRow(page, r.id).click();
  expect(await modalRowIds(hierarchyModal(page, 'P'))).toEqual(fromT);
  expect(fromT).toHaveLength(10);
});

test('DRAG-7.8: with no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Close Project';
  const { p, r } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const before = await sectionRows(page, p.id);
  const writes = watchWrites(page);
  const modal = hierarchyModal(page, 'P');

  await overflowRow(page, r.id).click();
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toHaveCount(0);

  await overflowRow(page, r.id).click();
  await expect(modal).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(modal).toHaveCount(0);

  await overflowRow(page, r.id).click();
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  // The board is as it was: P's section and its overflow row.
  expect(await sectionRows(page, p.id)).toEqual(before);
  await expect(overflowRow(page, r.id)).toHaveText('2 children');
  expect(writes).toEqual([]);
});

test('DRAG-7.9: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal First Child Project';
  const { p, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R2 is picked up in the modal, and its drag starts at P's Descendants layer with no pop. Aimed
  // at the top of R1a, the ghost sits between R1 and R1a.
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await hoverTo(page, await topQuarter(modalRow(modal, r1a.id)));
  await hoverTo(page, await topQuarter(modalRow(modal, r1a.id)));
  await awaitProjection(page, '4:4:true');
  await release(page);

  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);
  const placed = await fetchItem(request, r2.id);
  expect(placed.isAttached).toBe(1);
  expect(placed.position).toBeLessThan((await fetchItem(request, r1a.id)).position);
});

test('DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1’s last child, after R1a', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Last Child Project';
  const { r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R2's own gap is between R1a and T, at depth 3. One level deeper is aligned with R1a.
  const from = await pickUpRow(page, modal, r2.id, 'R2');
  const own = await center(modalRow(modal, r2.id));
  await hoverTo(page, { x: from.x + DESCENDANTS_INDENT_PX, y: own.y });
  await awaitProjection(page, '5:4:true');
  await release(page);

  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);
  expect((await fetchItem(request, r2.id)).position).toBeGreaterThan((await fetchItem(request, r1a.id)).position);
});

test('DRAG-7.9: set back down in its own gap and depth, an item writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Own Slot Project';
  const { r, r2 } = await seedOverflowTree(request, name);
  const before = await fetchItem(request, r2.id);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  const from = await pickUpRow(page, modal, r2.id, 'R2');
  const writes = watchWrites(page);
  await hoverTo(page, { x: from.x, y: from.y });
  await awaitProjection(page, '5:3:true');
  await release(page);

  expect(writes).toEqual([]);
  const after = await fetchItem(request, r2.id);
  expect([after.parentId, after.position]).toEqual([before.parentId, before.position]);
});

test('DRAG-7.9, DRAG-7.12: a tab state past the depth cap is reachable in the modal and writes nothing, and the rows carry the drag’s classification', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Over Cap Project';
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const cap: number = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;

  // X has one child, so it's two levels tall. The deepest parent it may have sits at depth
  // cap - 2, counting P as 1, and one more level under it is too deep for it. The chain's levels
  // are all in the modal, whatever the section draws.
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const x = await seedItem(request, { title: 'X', parentId: p.id });
  await seedItem(request, { title: 'XC', parentId: x.id });
  let tail: { id: string } = p;
  const chain: Array<{ id: string }> = [];
  for (let level = 1; level <= cap - 2; level++) {
    tail = await seedItem(request, { title: `C${level}`, parentId: tail.id });
    chain.push(tail);
  }
  const tOk = chain[cap - 4];
  const tOver = chain[cap - 3];

  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, chain[2].id).click();
  const modal = hierarchyModal(page, 'P');

  const from = await pickUpRow(page, modal, x.id, 'X');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  // The classification is the drag's, read once at its start: the same rows read the same in the
  // modal as in the section.
  await expect(modalRow(modal, tOk.id)).toHaveAttribute('data-drop-state', 'valid');
  await expect(modalRow(modal, tOver.id)).toHaveAttribute('data-drop-state', 'depth-capped');

  // Below the deepest row, tabbed right to the level under it: past the cap, so invalid. The
  // state is reached, and a release in it writes nothing.
  const last = modalRow(modal, tOver.id);
  const writes = watchWrites(page);
  const tabbed = from.x + (cap - 2) * DESCENDANTS_INDENT_PX;
  await hoverTo(page, { x: tabbed, y: (await bottomQuarter(last)).y });
  await hoverTo(page, { x: tabbed, y: (await bottomQuarter(last)).y });
  await awaitProjection(page, new RegExp(`^\\d+:${cap - 2}:false$`));
  await release(page);

  expect(writes).toEqual([]);
  expect((await fetchItem(request, x.id)).parentId).toBe(p.id);
});

test('DRAG-7.10: leaving the modal for the Card’s box closes it, and the drag is at the Card layer; a second pop detaches', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Pop Out Project';
  const { p, r, r2 } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // A point inside P's own box and outside the modal's: the left edge of P, which the centered
  // modal doesn't reach.
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: card.y + card.height * 0.08 });
  await awaitDragContext(page, cardRegionKey(p.id), clocksMargin(tuning.popDelayMs));
  await expect(modal).toHaveCount(0);
  await release(page);

  // The Card layer's auto-drop: R2 is set back down.
  expect((await fetchItem(request, r2.id)).parentId).toBe(r.id);
  await expect(article(page, 'P')).toBeVisible();
});

test('DRAG-7.10: a second pop, out of the Card’s box, detaches the item: two pops, as from the section', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Detach Project';
  const { project, workflow, todo, p, r, r2 } = await seedOverflowTree(request, name);
  // A second Card, so the column has somewhere outside P's own box to rest the cursor.
  await seedItem(request, { title: 'Other', projectId: project.id, workphaseId: todo.id });
  const todoCol = columnForWorkphase(await fetchDefaultBoard(request, workflow.id), todo.id);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const other = await boxOf(article(page, 'Other'));
  await hoverTo(page, { x: other.x + 6, y: other.y + other.height / 2 });
  await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(tuning.popDelayMs, tuning.popDelayMs));
  await expect(modal).toHaveCount(0);
  await release(page);

  const detached = await fetchItem(request, r2.id);
  expect(detached.isAttached).toBe(0);
  expect(detached.parentId).toBe(r.id);
  expect(detached.workphaseId).toBe(todo.id);
});

test('DRAG-7.10: the modal’s header is part of the modal: a cursor resting over it pops nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Header Project';
  const { p, r, r2 } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // The header holds the title and the X, above the list that is the layer's region. Resting there
  // past the pop-out delay is still inside the modal.
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await hoverTo(page, await center(modal.getByRole('heading', { name: 'P', exact: true })));
  await page.waitForTimeout(tuning.popDelayMs * 3);
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect(modal).toBeVisible();
  await cancel(page);
});

test('DRAG-7.11: while the modal is open, the Card and its section under the backdrop take no part in the drag', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Sole Layer Project';
  const { p, a, q, r, t, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // One element carries the section's key, the modal's list, and each row is registered once:
  // the section's own rows draw static under the backdrop.
  const regions = page.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`);
  await expect(regions).toHaveCount(1);
  await expect(modal.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`)).toHaveCount(1);
  for (const row of [a, q, r, t]) await expect(itemRow(page, row.id)).toHaveCount(1);

  // The cursor rests on P's own section row for A, behind the backdrop: left of the modal's box.
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const behind = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: behind.x + 6, y: behind.y + behind.height * 0.5 });
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect(modal).toBeVisible();

  // The carried copy stays inside the modal's list, and the drag is still the modal's.
  const list = await boxOf(regions);
  const carried = await boxOf(page.locator('[data-drag-overlay]'));
  expect(carried.x).toBeGreaterThanOrEqual(list.x - 1);
  expect(carried.x + carried.width).toBeLessThanOrEqual(list.x + list.width + 1);
  expect(carried.y).toBeGreaterThanOrEqual(list.y - 1);
  expect(carried.y + carried.height).toBeLessThanOrEqual(list.y + list.height + 1);
  await cancel(page);
});

test('DRAG-7.19: after a release in the modal it stays open where it is, showing the item where it landed', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Release Project';
  const { p, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  const placedBefore = await boxOf(modal);

  await pickUpRow(page, modal, r2.id, 'R2');
  await hoverTo(page, await topQuarter(modalRow(modal, r1a.id)));
  await hoverTo(page, await topQuarter(modalRow(modal, r1a.id)));
  await awaitProjection(page, '4:4:true');
  await release(page);

  // Still open, in the same place, with R2 under R1 and before R1a, at R1a's level.
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(placedBefore);
  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);
  const ids = await modalRowIds(modal);
  expect(ids.indexOf(r2.id)).toBe(ids.indexOf(r1.id) + 1);
  expect(ids.indexOf(r1a.id)).toBe(ids.indexOf(r2.id) + 1);
  await expect(modalRow(modal, r2.id)).toHaveCSS('padding-left', `${descendantsIndentPx(4)}px`);

  // The item can be picked up again from its row in the modal.
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await cancel(page);
});

test('DRAG-7.19: Escape during a drag in the modal cancels the drag and leaves it open; with no drag running, Escape closes it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Cancel Project';
  const { r, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  const rowsBefore = await modalRowIds(modal);

  await pickUpRow(page, modal, r2.id, 'R2');
  await hoverTo(page, await topQuarter(modalRow(modal, r1a.id)));
  const writes = watchWrites(page);
  await cancel(page);

  // Nothing was written, R2 is back where it was picked up, and the modal is open.
  await expect(modal).toBeVisible();
  expect(await modalRowIds(modal)).toEqual(rowsBefore);
  expect(writes).toEqual([]);
  expect((await fetchItem(request, r2.id)).parentId).toBe(r.id);

  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

test('DRAG-7.6: back in the section, a Stub whose own slot is behind an overflow row starts as the Card’s last child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Hidden Slot Project';
  const { p, r, r1, r1a, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, descendantsPopInDelayMs: 150 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R1 is picked up in the modal, and pulled out of it to P's own box: the modal closes, and the
  // drag is at the Card layer.
  await pickUpRow(page, modal, r1.id, 'R1');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: card.y + card.height * 0.08 });
  await awaitDragContext(page, cardRegionKey(p.id), clocksMargin(tuning.popDelayMs));
  await expect(modal).toHaveCount(0);

  // Zoomed back into the section, the ghost is in the last gap, at the first level, as P's last
  // child, and not in R1's own slot, which the section doesn't draw. R's overflow row leaves R1
  // out of its count meanwhile.
  const section = page.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`);
  await hoverTo(page, await atFraction(section, 0.5));
  await awaitDragContext(page, descendantsRegionKey(p.id), clocksMargin(tuning.descendantsPopInDelayMs));
  await awaitProjection(page, '7:0:true');
  await expect(overflowRow(page, r.id)).toHaveText('1 child');
  await release(page);

  // R1 is P's last child, after X, with R1a still its child.
  await expect.poll(async () => (await fetchItem(request, r1.id)).parentId).toBe(p.id);
  const moved = await fetchItem(request, r1.id);
  expect(moved.isAttached).toBe(1);
  expect(moved.position).toBeGreaterThan((await fetchItem(request, x.id)).position);
  expect((await fetchItem(request, r1a.id)).parentId).toBe(r1.id);
});

// A press on an overflow row goes no further: it picks up neither the row nor the Card it is part of.
test('a press and drag from an overflow row picks nothing up', async ({ page, request, projectSidebar }) => {
  const name = 'Overflow Row Press Project';
  const { r, p } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const before = await sectionRows(page, p.id);
  const writes = watchWrites(page);

  const start = await center(overflowRow(page, r.id));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 60, start.y + 80, { steps: 10 });
  await expect(page.locator('[data-drag-state]')).toHaveCount(0);
  await page.mouse.up();

  expect(await sectionRows(page, p.id)).toEqual(before);
  await expect(hierarchyModal(page, 'P')).toHaveCount(0);
  expect(writes).toEqual([]);
});
