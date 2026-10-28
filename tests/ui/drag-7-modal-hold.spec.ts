import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { fetchDefaultBoard, fetchItem, moveItem, seedItem } from '../helpers/seed';
import {
  atFraction,
  awaitDragContext,
  awaitModalHold,
  awaitProjection,
  boardReload,
  boxOf,
  cancel,
  clocksMargin,
  dragMachine,
  hoverTo,
  paintedBoxOf,
  pickUp,
  refuseMoves,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import { article, hierarchyModal, itemRow, overflowRow } from '../helpers/boardLocators';
import { holdAt, placementShown, seedOverflowTree } from '../helpers/overflowTree';
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
// A dwell long enough that a hold which started over still reads as the dwell a few frames later,
// and a cue too long to run out.
const STEADY_CUE = { modalHoldDwellMs: 1500, modalHoldCueMs: 60_000 };
// Short, for the cases that are not about the stages.
const QUICK = { modalHoldDwellMs: 200, modalHoldCueMs: 300 };
const opens = (tuning: { modalHoldDwellMs: number; modalHoldCueMs: number }) => ({
  timeout: clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs),
});
// Waits out a hold's whole length and then some, for a case that asserts no hold ran: a check that
// no modal is there passes at once, so it has to come after the wait.
const outwait = (page: Page, tuning: { modalHoldDwellMs: number; modalHoldCueMs: number }) =>
  page.waitForTimeout(tuning.modalHoldDwellMs + tuning.modalHoldCueMs + 500);

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
  const tuning = await seedDragTuning(page, { ...NO_POP, ...STEADY_CUE });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`, clocksMargin(tuning.modalHoldDwellMs));

  // Up and down across the ghost's middle: the line it names flips between R and the overflow row,
  // and the gap and the level stay, so the cue runs on. Each read is taken once, a few frames after
  // the move: a hold that started over would show its dwell, for as long as the dwell is, where a
  // read that retries would wait for the cue to come round again and pass.
  const row = await boxOf(overflowRow(page, r.id));
  for (const dy of [2, 14, 5, 16, 3]) {
    await hoverTo(page, { x: row.x + row.width / 2, y: row.y + dy });
    await awaitProjection(page, '3:3:true');
    await page.waitForTimeout(100);
    expect(await dragMachine(page).getAttribute('data-drag-modal-hold')).toBe(`${r.id}:cue`);
  }
  await release(page);
});

test('DRAG-7.15, DRAG-7.19: the modal opens with the ghost’s spot under the cursor, so a release right after commits the same placement, and the modal stays where it opened', async ({
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
  const opened = await boxOf(modal);
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

  // The modal a hold opened stays open after the release, in the place it opened.
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(opened);

  // From the gap below it: the gap after R2, at R2's level. X is R's child now, out of the
  // section's sight, so it is B that is dragged.
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

// The modal's middle is the window's, as one a click opens sits (DRAG-7.7).
async function expectCentered(page: Page, modal: Locator) {
  const viewport = page.viewportSize()!;
  await expect(modal).toBeVisible();
  await expect
    .poll(async () => {
      const box = await boxOf(modal);
      return Math.max(
        Math.abs(box.x + box.width / 2 - viewport.width / 2),
        Math.abs(box.y + box.height / 2 - viewport.height / 2),
      );
    })
    .toBeLessThan(2);
}

// The modal opened under the cursor, away from the window's middle, which a case about where it
// sits afterward has to start from.
async function expectOffCenter(page: Page, modal: Locator) {
  const viewport = page.viewportSize()!;
  const box = await boxOf(modal);
  const offBy = Math.max(
    Math.abs(box.x + box.width / 2 - viewport.width / 2),
    Math.abs(box.y + box.height / 2 - viewport.height / 2),
  );
  expect(offBy).toBeGreaterThan(40);
}

test('DRAG-7.25: after a reload that follows a release in it, a modal a hold opened is centered', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Reload After Release Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');
  await refuseMoves(page);

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectOffCenter(page, modal);

  // The write is refused, so the client reloads the board from the server, with the modal open
  // over it.
  const reloaded = boardReload(page);
  await release(page);
  await reloaded;
  await expectCentered(page, modal);
  expect((await fetchItem(request, x.id)).parentId).toBe(p.id);
});

test('DRAG-7.25: after a reload that lands mid-drag, a modal a hold opened is centered', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Reload Mid Drag Project';
  const { p, r, r1, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // The first release's write is refused after a delay, so the reload it causes lands while the
  // next drag is under way.
  await page.route('**/api/items/*/move', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'refused' }) });
  });
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectOffCenter(page, modal);
  const reloaded = boardReload(page);
  await release(page);

  await pickUp(page, modalRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await reloaded;

  // The drag is over, and the modal is open over the reloaded board, centered.
  await expect(dragMachine(page)).toHaveCount(0);
  await expectCentered(page, modal);
  await page.mouse.up();
});

// A release without moving the cursor commits what the ghost shows in the modal: the parent it sits
// under and the siblings it lies between, read off the painted rows. Returns what was shown.
async function expectReleaseCommitsShown(
  page: Page,
  request: Parameters<typeof fetchItem>[0],
  modal: Locator,
  x: { id: string },
  p: { id: string },
) {
  const shown = await placementShown(modal, x.id);
  const written = page.waitForResponse(res => res.request().method() === 'PATCH' && res.url().endsWith('/move'));
  await release(page);
  expect((await written).ok()).toBe(true);
  const placed = await fetchItem(request, x.id);
  expect(placed.parentId).toBe(shown.parentId ?? p.id);
  if (shown.prevId) expect(placed.position).toBeGreaterThan((await fetchItem(request, shown.prevId)).position);
  if (shown.nextId) expect(placed.position).toBeLessThan((await fetchItem(request, shown.nextId)).position);
  return shown;
}

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

  // A release without moving the cursor commits what the ghost shows, and that is not R's first
  // child.
  const shown = await placementShown(modal, x.id);
  expect([shown.parentId, shown.prevId]).not.toEqual([r.id, null]);
  await expectReleaseCommitsShown(page, request, modal, x, p);
});

test('DRAG-7.16: a modal kept inside the window at the top edge reads the ghost afresh from the cursor', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Top Edge Project';
  const { p, r, t, x, extras } = await seedLongTree(request, name, 12);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's last child, deep in a list that fills the window: placed with that spot under the cursor,
  // the modal would cross the top edge, so it is pulled down to the margin, and its list scrolls
  // to bring the spot back under the cursor.
  const last = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  await expect(modal).toBeVisible(opens(tuning));
  const box = await boxOf(modal);
  expect(Math.abs(box.y - MODAL_EDGE_MARGIN_PX)).toBeLessThanOrEqual(0.5);
  await expectInside(modal, last.at());
  await expectGhostUnder(modal, x.id, last.at());
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // A release commits what the ghost shows: R's last child, after the last extra.
  const shown = await expectReleaseCommitsShown(page, request, modal, x, p);
  expect([shown.parentId, shown.prevId]).toEqual([r.id, extras[extras.length - 1].id]);
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

test('DRAG-7.17: from the gap above R’s overflow row, a list that scrolls puts the ghost’s spot under the cursor too', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Long List Above Project';
  const count = 20;
  const tree = await seedOverflowTree(request, name);
  const { p, q, r, r1, x } = tree;
  // S, a sibling before R with `count` children of its own behind an overflow row, so R's first
  // child lies far down the modal's list.
  const s = await seedItem(request, { title: 'S', parentId: q.id });
  await moveItem(request, s.id, { parentId: q.id, anchorId: r.id, side: 'before' });
  for (let i = 0; i < count; i++) await seedItem(request, { title: `S${i}`, parentId: s.id });
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's first child, after A, Q, S and its children, and R.
  const first = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  const gap = 4 + count;
  await awaitProjection(page, `${gap}:3:true`);
  await expect(modal).toBeVisible(opens(tuning));
  const list = modal.locator(`[data-drag-region="${descendantsRegionKey(p.id)}"]`);
  expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expectInside(modal, first.at());
  await expectGhostUnder(modal, x.id, first.at());
  await awaitProjection(page, `${gap}:3:true`);
  await release(page);

  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
});

test('DRAG-7.12: a modal a hold opens carries the drag’s classification: a row too deep for the dragged item is de-emphasized, and R is not', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Classification Project';
  const { workflow, p, r, r1, r1a, x } = await seedOverflowTree(request, name);
  const cap: number = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;

  // X carries a chain of `cap - 6` descendants, so it fits as R's child (depth 5, its deepest
  // descendant at cap - 1) and as R1's, but not as R1a's (depth 7, its deepest at cap + 1).
  let tail: { id: string } = x;
  for (let level = 1; level <= cap - 6; level++)
    tail = await seedItem(request, { title: `X${level}`, parentId: tail.id });

  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // The modal opens during the drag, and the classification, read once at its start, is on its
  // rows: R1a is Depth-capped and drawn dimmer than R, which is valid.
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await expect(modal).toBeVisible(opens(tuning));
  await expect(modalRow(modal, r1a.id)).toHaveAttribute('data-drop-state', 'depth-capped');
  for (const fits of [r, r1]) await expect(modalRow(modal, fits.id)).toHaveAttribute('data-drop-state', 'valid');
  const opacity = (id: string) => modalRow(modal, id).evaluate(el => parseFloat(getComputedStyle(el).opacity));
  expect(await opacity(r1a.id)).toBeLessThan(1);
  expect(await opacity(r.id)).toBe(1);
  await cancel(page);
});

test('DRAG-7.10, DRAG-7.18: after leaving a modal a hold opened, a hold beside an overflow row opens it again in the same drag', async ({
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

test('DRAG-7.21: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Over Cap Project';
  const { p, r, t, x, workflow } = await seedOverflowTree(request, name);
  const cap: number = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;

  // X would sit at depth 5 under R (P is 1, A 2, Q 3, R 4). A chain of `cap - 4` descendants puts
  // its deepest one at cap + 1, so every placement among R's children is past the cap, and one
  // level up, as R's next sibling, it just fits.
  let tail: { id: string } = x;
  for (let level = 1; level <= cap - 4; level++)
    tail = await seedItem(request, { title: `X${level}`, parentId: tail.id });

  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const writes = watchWrites(page);
  const modal = hierarchyModal(page, 'P');

  // Above the overflow row: R's first child, past the cap. Waited out for the whole hold and more:
  // no dwell, no cue, no modal, and a release commits nothing.
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:false');
  await outwait(page, tuning);
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await expect(modal).toHaveCount(0);
  await release(page);
  expect(writes).toEqual([]);
  expect((await fetchItem(request, x.id)).parentId).toBe(p.id);

  // Below it: R's last child, past the cap the same way. Tabbed one level left, R's next sibling
  // fits, so it is a valid state, and no hold runs there either: it runs at the overflow row's
  // level only.
  const aim = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, '6:3:false');
  await outwait(page, tuning);
  await awaitModalHold(page, null);
  await expect(modal).toHaveCount(0);
  await aim(L - 1);
  await awaitProjection(page, '6:2:true');
  await outwait(page, tuning);
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await expect(modal).toHaveCount(0);
  await cancel(page);
  expect(writes).toEqual([]);
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
  await cancel(page);

  // With a short dwell, the next hold takes the new cue: the cue is still showing well past the
  // default cue's length, and the modal hasn't opened.
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await dwell.fill('300');
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`, clocksMargin(300));
  await page.waitForTimeout(DEFAULT_DRAG_TUNING.modalHoldCueMs + 700);
  await awaitModalHold(page, `${r.id}:cue`);
  await expect(hierarchyModal(page, 'P')).toHaveCount(0);
  await cancel(page);

  await page.reload();
  await projectSidebar.showBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await expect(dwell).toHaveValue('300');
  await expect(cue).toHaveValue('7000');
});
