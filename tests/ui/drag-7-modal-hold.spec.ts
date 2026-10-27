import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { fetchDefaultBoard, fetchItem, seedItem } from '../helpers/seed';
import {
  atFraction,
  awaitDragContext,
  awaitModalHold,
  awaitProjection,
  boxOf,
  clocksMargin,
  dragMachine,
  hoverTo,
  paintedBoxOf,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import { article, hierarchyModal, itemRow, overflowRow } from '../helpers/boardLocators';
import { holdAt, seedOverflowTree } from '../helpers/overflowTree';
import { watchWrites } from '../helpers/projectTreeDrag';
import { descendantsRegionKey, cardRegionKey } from '../../client/src/components/workflow/dragRegions';
import { DEFAULT_DRAG_TUNING } from '../../client/src/components/workflow/dragTuning';
import { MODAL_EDGE_MARGIN_PX } from '../../client/src/components/workflow/modalPlacement';

// The hold that opens the hierarchy modal during a drag: while the ghost sits directly above or
// below an overflow row, at its level, a silent dwell and then a cue end in the modal opening
// under the cursor. The cases assert what the board shows at each stage and what a release
// writes. The dwell and the cue are seeded values: only the clock's logic is asserted here, and
// whether they feel right is DRAG-7.20, by hand.
//
// Where a case drags `X` or `B`, it's a Stub of `P` picked up in its own section, which starts at
// the Descendants layer with no pop. Any item at that layer can open the modal.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// A dwell and a cue long enough to watch each stage in, and short enough for a case to wait out.
const HOLD = { modalHoldDwellMs: 600, modalHoldCueMs: 900 };
// A cue too long to run out during a case that asserts across it.
const LONG_CUE = { modalHoldDwellMs: 300, modalHoldCueMs: 60_000 };
// Short, for the cases that are not about the stages.
const QUICK = { modalHoldDwellMs: 200, modalHoldCueMs: 300 };
const opens = (tuning: { modalHoldDwellMs: number; modalHoldCueMs: number }) => ({
  timeout: clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs),
});

// The levels a section shows, which the cases hold at the default.
const L = DEFAULT_DRAG_TUNING.sectionLevels;

const modalRow = (modal: Locator, id: string) => modal.locator(`[data-item-id="${id}"]`);

// The cue drawn on an overflow row: the fill bar a hold runs, timed by an animation of the cue's
// length (`dragChrome.tsx::ZoomCue`).
const cueOn = (page: Page, ownerId: string) => overflowRow(page, ownerId).locator('[style*="cue-fill"]');

// The cursor is inside the modal's box. The modal is smaller than the window, so keeping it inside
// the window never takes it off the cursor.
async function expectInside(modal: Locator, cursor: { x: number; y: number }) {
  const box = await boxOf(modal);
  expect(cursor.x).toBeGreaterThanOrEqual(box.x);
  expect(cursor.x).toBeLessThanOrEqual(box.x + box.width);
  expect(cursor.y).toBeGreaterThanOrEqual(box.y);
  expect(cursor.y).toBeLessThanOrEqual(box.y + box.height);
}

// The ghost is drawn under the cursor: the dragged item's own row in the modal, painted where the
// cursor is. The row slides into its slot as any row does, so this waits for it to settle.
async function expectGhostUnder(modal: Locator, ghostId: string, cursor: { x: number; y: number }) {
  await expect
    .poll(async () => {
      const box = await paintedBoxOf(modalRow(modal, ghostId));
      return cursor.y >= box.y - 1 && cursor.y <= box.y + box.height + 1;
    })
    .toBe(true);
}

test('DRAG-7.13: a hold above R’s overflow row is a silent dwell, then a cue on the row, ending in the modal opening', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Stages Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...HOLD });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // The ghost between R and its overflow row: R's first child.
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');

  // The dwell shows nothing new; the cue shows on the overflow row.
  await awaitModalHold(page, `${r.id}:dwell`);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await awaitModalHold(page, `${r.id}:cue`, clocksMargin(tuning.modalHoldDwellMs));
  await expect(cueOn(page, r.id)).toHaveCount(1);
  await expect(modal).toHaveCount(0);

  // When the cue completes the modal opens, with no pop: the drag is still at P's Descendants layer.
  await expect(modal).toBeVisible(opens(tuning));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await awaitModalHold(page, null);
  await release(page);
});

test('DRAG-7.13: a release before the cue completes commits where the ghost is, and the modal never opens', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Early Release Project';
  const { p, r, r1, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, { ...NO_POP, ...LONG_CUE });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`);
  await release(page);

  await expect(hierarchyModal(page, 'P')).toHaveCount(0);
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
});

test('DRAG-7.13: any item at the layer opens it: B, below the overflow row, as R’s last child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Below Project';
  const { p, r, r2, t, b } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // The gap between R's overflow row and T, at the overflow row's level: R's last child.
  await holdAt(page, b, p, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, '6:3:true');
  await expect(hierarchyModal(page, 'P')).toBeVisible(opens(tuning));
  await awaitProjection(page, '6:3:true');
  await release(page);

  await expect.poll(async () => (await fetchItem(request, b.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, b.id)).position).toBeGreaterThan((await fetchItem(request, r2.id)).position);
});

test('DRAG-7.14: the hold starts over when the ghost changes level or gap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Reset Project';
  const { p, r, a, t, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, { ...NO_POP, ...LONG_CUE });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // Below the overflow row, at its level: the hold runs, and shows its cue.
  const aim = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, '6:3:true');
  await awaitModalHold(page, `${r.id}:cue`);

  // One tab left is R's next sibling, beside the overflow row and not on it: the cue goes at once.
  await aim(L - 1);
  await awaitProjection(page, '6:2:true');
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);

  // Tabbing back starts a fresh dwell.
  await aim(L);
  await awaitProjection(page, '6:3:true');
  await awaitModalHold(page, `${r.id}:dwell`);
  await awaitModalHold(page, `${r.id}:cue`);

  // Another gap altogether.
  await hoverTo(page, await topQuarter(itemRow(page, a.id)));
  await hoverTo(page, await topQuarter(itemRow(page, a.id)));
  await awaitModalHold(page, null);
  await release(page);
});

test('DRAG-7.14: the hold runs only with the cursor inside the section: resting outside it ends the hold', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Outside Section Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, { ...NO_POP, ...LONG_CUE });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  const aim = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`);

  // P's own padding, left of the section, at the same height: the carried copy is held to the
  // section, so the ghost stays in its gap and its level, beside the overflow row. The drag is
  // still the section's, nothing pops, and the hold is over.
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: aim.at().y });
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // Back in, the hold starts again.
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`);
  await release(page);
});

test('DRAG-7.14: the carried copy moving within the gap, across the ghost’s middle, does not reset the hold', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Within Gap Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, { ...NO_POP, ...LONG_CUE });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`);

  // Up and down across the ghost's middle: the line it names flips between R and the overflow row,
  // and the gap and the level stay, so the cue runs on.
  const row = await boxOf(overflowRow(page, r.id));
  for (const dy of [2, 14, 5, 16, 3]) {
    await hoverTo(page, { x: row.x + row.width / 2, y: row.y + dy });
    await awaitProjection(page, '3:3:true');
    await awaitModalHold(page, `${r.id}:cue`);
  }
  await release(page);
});

test('DRAG-7.15: the modal opens with the ghost’s spot under the cursor, so a release right after commits the same placement', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Under Cursor Project';
  const { p, r, r1, r2, t, b, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // From the gap above the overflow row: the gap before R1, at R1's level. The ghost is under the
  // cursor, between R and R1, and no pop happened.
  const first = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectInside(modal, first.at());
  await expectGhostUnder(modal, x.id, first.at());
  await expect
    .poll(async () => {
      const above = await paintedBoxOf(modalRow(modal, r.id));
      const ghost = await paintedBoxOf(modalRow(modal, x.id));
      const below = await paintedBoxOf(modalRow(modal, r1.id));
      return ghost.y >= above.y + above.height - 1 && ghost.y + ghost.height <= below.y + 1;
    })
    .toBe(true);
  await awaitProjection(page, '3:3:true');
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // Nothing moves on a nudge of the cursor, either.
  await hoverTo(page, { x: first.at().x + 1, y: first.at().y + 1 });
  await awaitProjection(page, '3:3:true');
  await release(page);
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);

  // From the gap below it: the gap after R2, at R2's level. X is R's child now, out of the
  // section's sight, so it is B that is dragged.
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  const last = await holdAt(page, b, p, () => topQuarter(itemRow(page, t.id)), L);
  await expect(modal).toBeVisible(opens(tuning));
  await expectInside(modal, last.at());
  await expectGhostUnder(modal, b.id, last.at());
  await awaitProjection(page, '7:3:true');
  await release(page);
  await expect.poll(async () => (await fetchItem(request, b.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, b.id)).position).toBeGreaterThan((await fetchItem(request, r2.id)).position);
});

// The same tree with `count` more children under R, so R's children run longer than the modal.
async function seedLongTree(request: Parameters<typeof seedOverflowTree>[0], name: string, count: number) {
  const tree = await seedOverflowTree(request, name);
  const extras: Array<{ id: string }> = [];
  for (let i = 0; i < count; i++) extras.push(await seedItem(request, { title: `E${i}`, parentId: tree.r.id }));
  return { ...tree, extras };
}

test('DRAG-7.16: a modal kept inside the window at the bottom edge reads the ghost afresh from the cursor', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Bottom Edge Project';
  const { p, r, x } = await seedLongTree(request, name, 20);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's first child, with a modal as tall as the window allows: placing it under the cursor would
  // cross the bottom edge, so it is pulled up inside it.
  const first = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await expect(modal).toBeVisible(opens(tuning));
  const box = await boxOf(modal);
  const windowHeight = page.viewportSize()!.height;
  expect(box.y).toBeGreaterThanOrEqual(MODAL_EDGE_MARGIN_PX - 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(windowHeight - MODAL_EDGE_MARGIN_PX + 0.5);
  expect(box.y + box.height).toBeGreaterThanOrEqual(windowHeight - MODAL_EDGE_MARGIN_PX - 0.5);

  // The cursor is in the modal, and the ghost is where the cursor reads against the rows, which
  // is no longer R's first child.
  await expectInside(modal, first.at());
  await expectGhostUnder(modal, x.id, first.at());
  await expect(dragMachine(page)).not.toHaveAttribute('data-drag-projection', '3:3:true');
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // A release commits what the ghost shows: not R's first child.
  const writes = watchWrites(page);
  await release(page);
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  const placed = await fetchItem(request, x.id);
  const moved = placed.parentId !== r.id || placed.position > (await fetchItem(request, r.id)).position;
  expect(moved).toBe(true);
});

test('DRAG-7.16: a modal kept inside the window at the right edge reads the depth at the cursor’s x', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Right Edge Project';
  await page.setViewportSize({ width: 700, height: 720 });
  const { p, r2, t, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's last child. The modal, placed under the cursor, would cross the right edge; pulled inside
  // it, it puts the cursor further right along the rows' indents, so the ghost reads deeper:
  // R2's first child, the deepest state at that gap.
  const last = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, '6:3:true');
  await expect(modal).toBeVisible(opens(tuning));
  const box = await boxOf(modal);
  expect(box.x).toBeGreaterThanOrEqual(MODAL_EDGE_MARGIN_PX - 0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(700 - MODAL_EDGE_MARGIN_PX + 0.5);
  await expectInside(modal, last.at());
  await awaitProjection(page, '6:4:true');
  await release(page);

  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r2.id);
});

test('DRAG-7.17: when R’s children run longer than the modal, its list scrolls to put the ghost’s spot under the cursor', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Long List Project';
  const count = 20;
  const { p, r, t, x, extras } = await seedLongTree(request, name, count);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's last child, after its last child E19: deep in a list that scrolls.
  const last = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  // A, Q, R, R1, R1a and R2 come before R's added children.
  const gap = 6 + count;
  await awaitProjection(page, `${gap}:3:true`);
  await expect(modal).toBeVisible(opens(tuning));
  const list = modal.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`);
  expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expectInside(modal, last.at());
  await expectGhostUnder(modal, x.id, last.at());
  await awaitProjection(page, `${gap}:3:true`);
  await release(page);

  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeGreaterThan(
    (await fetchItem(request, extras[count - 1].id)).position,
  );
});

test('DRAG-7.18: after leaving the modal, a hold beside an overflow row opens it again in the same drag', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Reopen Project';
  const { p, r, r1, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, {
    ...NO_POP,
    ...QUICK,
    popDelayMs: 150,
    descendantsPopInDelayMs: 150,
  });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));

  // Out of the modal to P's own box: the modal closes, and the drag is at the Card layer.
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: card.y + card.height * 0.08 });
  await awaitDragContext(page, cardRegionKey(p.id), clocksMargin(tuning.popDelayMs));
  await expect(modal).toHaveCount(0);

  // Back into the section, and a hold beside the overflow row again.
  const section = page.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`);
  await hoverTo(page, await atFraction(section, 0.5));
  await awaitDragContext(page, descendantsRegionKey(p.id), clocksMargin(tuning.descendantsPopInDelayMs));
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await awaitProjection(page, '3:3:true');
  await expect(modal).toBeVisible(opens(tuning));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await release(page);

  // A release in it places the item by gap and depth: R's first child.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
});

test('a ghost in an over-cap state beside an overflow row starts no hold', async ({
  page,
  request,
  projectSidebar,
}) => {
  // The case for this edge is waiting on the PO; a Card’s zoom-in never starts on an invalid target.
  const name = 'Modal Hold Over Cap Project';
  const { p, r, x, workflow } = await seedOverflowTree(request, name);
  const cap: number = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;

  // X is a child of R at depth 5 (P is 1, A 2, Q 3, R 4). A chain of `cap - 4` descendants puts
  // its deepest one at cap + 1, so every placement among R's children is past the cap.
  let tail: { id: string } = x;
  for (let level = 1; level <= cap - 4; level++)
    tail = await seedItem(request, { title: `X${level}`, parentId: tail.id });

  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const writes = watchWrites(page);

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:false');
  // Well past the whole hold: no cue, no modal.
  await expect(hierarchyModal(page, 'P')).toHaveCount(0, { timeout: opens(tuning).timeout });
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await release(page);

  expect(writes).toEqual([]);
  expect((await fetchItem(request, x.id)).parentId).toBe(p.id);
});

test('DRAG-1.34: the modal hold’s dwell and cue are tuning-panel values, taken by the next hold and kept across a reload', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Tuning Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  await page.getByRole('button', { name: 'Drag tuning' }).click();
  const dwell = page.getByRole('spinbutton', { name: 'Hierarchy modal hold dwell (ms)' });
  const cue = page.getByRole('spinbutton', { name: 'Hierarchy modal hold cue (ms)' });
  await expect(dwell).toHaveValue(String(DEFAULT_DRAG_TUNING.modalHoldDwellMs));
  await expect(cue).toHaveValue(String(DEFAULT_DRAG_TUNING.modalHoldCueMs));
  await dwell.fill('4000');
  await cue.fill('7000');
  // The open panel pushes the board down; the values are state, so it can be closed.
  await page.getByRole('button', { name: 'Drag tuning' }).click();

  // The next hold takes the new dwell: well past the default one, it is still the silent dwell.
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:dwell`);
  await page.waitForTimeout(DEFAULT_DRAG_TUNING.modalHoldDwellMs + 700);
  await awaitModalHold(page, `${r.id}:dwell`);
  await release(page);

  await page.reload();
  await projectSidebar.showBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await expect(dwell).toHaveValue('4000');
  await expect(cue).toHaveValue('7000');
});
