import { refuseMoves, settledWrites, watchWrites } from '../helpers/requestHarness';
import type { Locator, Page } from '@playwright/test';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { columnForWorkphase, fetchDefaultBoard, fetchItem, moveItem, seedItem } from '../helpers/seed';
import {
  awaitDragContext,
  awaitModalHold,
  awaitProjection,
  boardReload,
  bottomQuarter,
  boxOf,
  cancel,
  center,
  clocksMargin,
  dragMachine,
  hoverTo,
  paintedBoxOf,
  pickUp,
  release,
  seedDragTuning,
  tabBy,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import { article, hierarchyModal, itemRow, overflowRow, dragRegion } from '../helpers/boardLocators';
import {
  expectCentered,
  expectInside,
  holdAt,
  holdFreeAt,
  placementShown,
  pointOutsideModal,
  rowIds,
  seedOverflowTree,
} from '../helpers/overflowTree';

import { columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import { DEFAULT_DRAG_TUNING } from '../../client/src/components/workflow/dragTuning';
import { MODAL_EDGE_MARGIN_PX } from '../../client/src/components/workflow/modalPlacement';

// The hold that opens the hierarchy modal during a drag: while the ghost sits directly above or
// below an overflow row, at its level, a silent dwell and then a cue end in the modal opening
// under the cursor. The cases assert what the board shows at each stage and what a release
// writes. The dwell and the cue are seeded values: only the clock's logic is asserted here, and
// whether they feel right is DRAG-7.20, by hand.
//
// Where a case drags `X`, `B` or `W`, it's a Stub of `P` picked up in its own section, which starts
// at the Descendants layer with no pop. Any item at that layer can open the modal. `X` and `B`
// come up to the overflow row from below it; `W`, first in `P`, comes down to it from above.

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
  page.waitForTimeout(clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs));

// The levels a section shows, which the cases hold at the default.
const L = DEFAULT_DRAG_TUNING.sectionLevels;

// The cue drawn on an overflow row: the fill bar a hold runs, found by the app's `data-drag-cue`
// attribute (`dragChrome.tsx::ZoomCue`).
const cueOn = (page: Page, ownerId: string) => overflowRow(page, ownerId).locator('[data-drag-cue]');

// The ghost is drawn under the cursor: the dragged item's own row in the modal, painted where the
// cursor is. The row slides into its slot as any row does, so this waits for it to settle.
async function expectGhostUnder(modal: Locator, ghostId: string, cursor: { x: number; y: number }) {
  await expect
    .poll(async () => {
      const box = await paintedBoxOf(itemRow(modal, ghostId));
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
  await expect(cueOn(page, r.id), 'the cue is seen on the overflow row').toBeVisible();
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

// A Free Card zoomed into P from outside (DRAG-7.13): the Terms' `X`, held where the hold runs. The zoom
// seeds its ghost at the first level, and the aim moves it beside R's overflow row from there.
const ZOOM_IN = { cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 };

async function seedFreeCard(
  request: Parameters<typeof seedItem>[0],
  tree: Awaited<ReturnType<typeof seedOverflowTree>>,
) {
  const z = await seedItem(request, { title: 'Z', projectId: tree.project.id, workphaseId: tree.todo.id });
  // Z comes before P, so it is in view to pick up and its own slot is far from P.
  await moveItem(request, z.id, { anchorId: tree.p.id, side: 'before' });
  // The Given: Z is a Free Card from outside P.
  const given = await fetchItem(request, z.id);
  expect([given.parentId, given.isAttached]).toEqual([null, 0]);
  return z;
}

test('DRAG-7.13: a Free Card zoomed into P and held above R’s overflow row: a silent dwell, then a cue on the row, ending in the modal opening', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Free Card Stages Project';
  const tree = await seedOverflowTree(request, name);
  const { p, r } = tree;
  const z = await seedFreeCard(request, tree);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...ZOOM_IN, ...HOLD });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // The ghost between R and its overflow row: R's first child.
  await holdFreeAt(page, z, p, tuning, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');

  // The dwell shows nothing new; the cue shows on the overflow row; then the modal opens, with no pop.
  await awaitModalHold(page, `${r.id}:dwell`);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await awaitModalHold(page, `${r.id}:cue`, clocksMargin(tuning.modalHoldDwellMs));
  await expect(cueOn(page, r.id)).toHaveCount(1);
  await expect(cueOn(page, r.id), 'the cue is seen on the overflow row').toBeVisible();
  await expect(modal).toHaveCount(0);
  await expect(modal).toBeVisible(opens(tuning));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await awaitModalHold(page, null);
  await release(page);
});

test('DRAG-7.13: a Free Card zoomed into P and held below R’s overflow row, at its level, opens the modal as R’s last child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Free Card Below Project';
  const tree = await seedOverflowTree(request, name);
  const { p, r, r2, t } = tree;
  const z = await seedFreeCard(request, tree);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...ZOOM_IN, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  await holdFreeAt(page, z, p, tuning, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, '6:3:true');
  await expect(hierarchyModal(page, 'P')).toBeVisible(opens(tuning));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await release(page);

  await expect.poll(async () => (await fetchItem(request, z.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, z.id)).position).toBeGreaterThan((await fetchItem(request, r2.id)).position);
});

for (const gap of ['above', 'below'] as const) {
  test(`DRAG-7.13: a release before the cue completes commits a Free Card zoomed in ${gap} R’s overflow row where its ghost is, and the modal never opens`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `Modal Hold Free Card Early Release ${gap} Project`;
    const tree = await seedOverflowTree(request, name);
    const { p, r, r1, r2, t } = tree;
    const z = await seedFreeCard(request, tree);
    const tuning = await seedDragTuning(page, { ...NO_POP, ...ZOOM_IN, ...LONG_CUE });
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();

    if (gap === 'above') await holdFreeAt(page, z, p, tuning, () => topQuarter(overflowRow(page, r.id)), 0);
    else await holdFreeAt(page, z, p, tuning, () => topQuarter(itemRow(page, t.id)), L);
    await awaitProjection(page, gap === 'above' ? '3:3:true' : '6:3:true');
    await awaitModalHold(page, `${r.id}:cue`);
    await release(page);

    await expect(hierarchyModal(page, 'P')).toHaveCount(0);
    await expect.poll(async () => (await fetchItem(request, z.id)).parentId).toBe(r.id);
    const placed = await fetchItem(request, z.id);
    if (gap === 'above') expect(placed.position).toBeLessThan((await fetchItem(request, r1.id)).position);
    else expect(placed.position).toBeGreaterThan((await fetchItem(request, r2.id)).position);
  });
}

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
  await expect(cueOn(page, r.id)).toHaveCount(0);
  // The ghost has changed gap: still at P's Descendants layer, and no longer in the gap below the overflow row.
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect(dragMachine(page)).toHaveAttribute('data-drag-projection', /^(?!6:)\d+:/);
  await release(page);
});

// The hold runs with the cursor inside the whole Card's box (DRAG-7.14): the Card's title and padding, outside
// the section's smaller box, are inside it. None of these pops anything.
test('DRAG-7.14: the cursor leaving the whole Card’s box ends the hold, and no dwell runs until it is back inside', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Leave Card Project';
  const { p, r, x } = await seedOverflowTree(request, name);
  const tuning = await seedDragTuning(page, { ...NO_POP, modalHoldDwellMs: 1500, modalHoldCueMs: 60_000 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  const aim = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:cue`, clocksMargin(tuning.modalHoldDwellMs));

  // The cursor leaves the Card's box, to the right of it. The carried copy is held to the box, so the ghost
  // stays in its gap, but the hold is over: the cue goes at once and the modal doesn't open.
  const card = await boxOf(article(page, 'P'));
  const outside = { x: card.x + card.width + 120, y: aim.at().y };
  await hoverTo(page, outside);
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, null);
  await expect(cueOn(page, r.id)).toHaveCount(0);
  await expect(hierarchyModal(page, 'P')).toHaveCount(0);
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // No dwell runs for as long as it stays outside: the dwell's length and more, and the hold is still over.
  await page.waitForTimeout(clocksMargin(tuning.modalHoldDwellMs));
  await awaitModalHold(page, null);

  // Back inside the Card's box, with the ghost unchanged, a fresh dwell starts.
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await hoverTo(page, await topQuarter(overflowRow(page, r.id)));
  await awaitProjection(page, '3:3:true');
  await awaitModalHold(page, `${r.id}:dwell`);
  await cancel(page);
});

for (const phase of ['dwell', 'cue'] as const) {
  test(`DRAG-7.14: the cursor moving into the Card’s title or padding during the ${phase} lets the hold run on, and completing it there opens the modal`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `Modal Hold Padding ${phase} Project`;
    const { p, a, r, x } = await seedOverflowTree(request, name);
    // A dwell long enough to move in during it; a cue long enough to move in during it.
    const tuning = await seedDragTuning(page, {
      ...NO_POP,
      ...(phase === 'dwell'
        ? { modalHoldDwellMs: 1500, modalHoldCueMs: 600 }
        : { modalHoldDwellMs: 300, modalHoldCueMs: 4000 }),
    });
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();

    const aim = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
    await awaitProjection(page, '3:3:true');
    await awaitModalHold(page, `${r.id}:${phase}`, phase === 'cue' ? clocksMargin(tuning.modalHoldDwellMs) : undefined);

    // The Card's left padding: inside the Card's box and left of the section's rows, which start at A's.
    const card = await boxOf(article(page, 'P'));
    const rows = await boxOf(itemRow(page, a.id));
    const padding = { x: (card.x + rows.x) / 2, y: aim.at().y };
    expect(padding.x, 'inside the Card').toBeGreaterThan(card.x);
    expect(padding.x, 'left of the section’s rows').toBeLessThan(rows.x);
    await hoverTo(page, padding);
    await awaitProjection(page, '3:3:true');
    // The hold runs on, in the phase it was in: a hold that started over would show its dwell.
    await page.waitForTimeout(100);
    expect(await dragMachine(page).getAttribute('data-drag-modal-hold')).toBe(`${r.id}:${phase}`);

    // Completing it there opens the modal.
    await expect(hierarchyModal(page, 'P')).toBeVisible(opens(tuning));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await cancel(page);
  });
}

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
      const above = await paintedBoxOf(itemRow(modal, r.id));
      const ghost = await paintedBoxOf(itemRow(modal, x.id));
      const below = await paintedBoxOf(itemRow(modal, r1.id));
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

// `W`, an item first in P, so that a hold at either gap beside R's overflow row comes down to it from
// the rows above, where the cases above bring an item up to it. With `childTitle`, it has a child of
// its own.
async function seedFirstItem(
  request: Parameters<typeof seedItem>[0],
  tree: Awaited<ReturnType<typeof seedOverflowTree>>,
  childTitle?: string,
) {
  const w = await seedItem(request, { title: 'W', parentId: tree.p.id });
  await moveItem(request, w.id, { parentId: tree.p.id, anchorId: tree.a.id, side: 'before' });
  const child = childTitle ? await seedItem(request, { title: childTitle, parentId: w.id }) : null;
  return { w, child };
}

// The hold's spot under the cursor (DRAG-7.15), for each gap beside R's overflow row, each way the cursor
// came to it, and an item with and without a child of its own. `W`, first in P, comes down to the gap;
// `X`, last in P, comes up to it. With a child, the child is absent from the section and the modal for the
// whole drag, and drawn under the item once it is released.
type Spot = { gap: 'first' | 'last'; approach: 'down' | 'up'; child: boolean };

async function expectSpotUnderCursor(
  page: Page,
  request: Parameters<typeof seedItem>[0],
  projectSidebar: ProjectSidebarPage,
  { gap, approach, child }: Spot,
) {
  const name = `Modal Hold Spot ${gap} ${approach}${child ? ' With Child' : ''}`;
  const tree = await seedOverflowTree(request, name);
  const { p, r, r1, r2, t, x } = tree;
  const carried =
    approach === 'down'
      ? await seedFirstItem(request, tree, child ? 'WC' : undefined)
      : { w: x, child: child ? await seedItem(request, { title: 'XC', parentId: x.id }) : null };
  const item = carried.w;
  const kid = carried.child;
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // The Given: the item is an attached Stub of P's, and its child, when it has one, is attached under it.
  const given = await fetchItem(request, item.id);
  expect([given.parentId, given.isAttached]).toEqual([p.id, 1]);
  if (kid) {
    const child = await fetchItem(request, kid.id);
    expect([child.parentId, child.isAttached]).toEqual([item.id, 1]);
  }

  // Down to the gap above the overflow row aims at R's row, where the section draws it; down to the gap below,
  // at the lower half of the overflow row. Up to either, at the row below the gap.
  const aimAt =
    gap === 'first'
      ? approach === 'down'
        ? () => center(itemRow(page, r.id))
        : () => topQuarter(overflowRow(page, r.id))
      : approach === 'down'
        ? () => bottomQuarter(overflowRow(page, r.id))
        : () => topQuarter(itemRow(page, t.id));
  const held = await holdAt(page, item, p, aimAt, gap === 'first' ? 0 : L);
  if (kid) await expect(itemRow(page, kid.id)).toHaveCount(0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectInside(modal, held.at());
  await expectGhostUnder(modal, item.id, held.at());
  await awaitDragContext(page, descendantsRegionKey(p.id));
  if (kid) await expect(itemRow(page, kid.id)).toHaveCount(0);

  // A release without moving the cursor writes what the modal draws: first among R's children, before R1, or
  // last, after R2.
  const shown = await expectReleaseCommitsShown(page, request, modal, item, p);
  expect(shown.parentId).toBe(r.id);
  if (gap === 'first') expect([shown.prevId, shown.nextId]).toEqual([null, r1.id]);
  else expect([shown.prevId, shown.nextId]).toEqual([r2.id, null]);
  if (kid) {
    expect((await fetchItem(request, kid.id)).parentId).toBe(item.id);
    await expect
      .poll(async () => {
        const ids = await rowIds(modal);
        return ids.indexOf(kid.id) - ids.indexOf(item.id);
      })
      .toBe(1);
  }
}

for (const spot of [
  { gap: 'first', approach: 'down', child: true },
  { gap: 'last', approach: 'down', child: false },
  { gap: 'last', approach: 'down', child: true },
  { gap: 'first', approach: 'up', child: true },
  { gap: 'last', approach: 'up', child: true },
] as const) {
  test(`DRAG-7.15: held ${spot.approach === 'down' ? 'from above' : 'from below'}, to the gap ${spot.gap === 'first' ? 'above' : 'below'} R’s overflow row, for an item ${spot.child ? 'with a child of its own' : 'without one'}, the modal opens with the ghost’s spot under the cursor and a release right after commits it`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    await expectSpotUnderCursor(page, request, projectSidebar, spot);
  });
}

test('DRAG-7.15: reaching R’s row in a single approach opens the modal with the ghost’s spot under the cursor, and a release right after commits what it draws', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold One Step Project';
  const tree = await seedOverflowTree(request, name);
  const { p, r } = tree;
  const { w, child } = await seedFirstItem(request, tree, 'WC');
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // One approach: picked up, then a single move to the middle of R's row, with no second pass to re-aim.
  await pickUp(page, itemRow(page, w.id).getByRole('button', { name: 'W', exact: true }));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const point = await center(itemRow(page, r.id));
  await hoverTo(page, point);
  await expect(modal).toBeVisible(opens(tuning));
  await expectInside(modal, point);
  await expectGhostUnder(modal, w.id, point);
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // What a release writes is what the modal draws, with the child still W's.
  const shown = await expectReleaseCommitsShown(page, request, modal, w, p);
  expect(shown.parentId).toBe(r.id);
  expect((await fetchItem(request, child!.id)).parentId).toBe(w.id);
});

test('DRAG-7.15: held from above, down to the gap above R’s overflow row, the modal opens with the ghost’s spot under the cursor, and a release right after commits it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold From Above To First Child Project';
  const tree = await seedOverflowTree(request, name);
  const { p, r, r1 } = tree;
  const { w } = await seedFirstItem(request, tree);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's first child, before R1, where the hold from below puts an item: W comes down to it past
  // A, Q and R, and not up from the rows below. The rows between W's slot and the ghost slide up
  // a row as it passes, so the overflow row is drawn where R's own box is, and the aim is there.
  const first = await holdAt(page, w, p, () => center(itemRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectInside(modal, first.at());
  await expectGhostUnder(modal, w.id, first.at());
  await awaitDragContext(page, descendantsRegionKey(p.id));

  const shown = await expectReleaseCommitsShown(page, request, modal, w, p);
  expect([shown.parentId, shown.prevId, shown.nextId]).toEqual([r.id, null, r1.id]);
});

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
  await refuseMoves(page, { afterMs: 1500 });
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opens(tuning));
  await expectOffCenter(page, modal);
  const reloaded = boardReload(page);
  await release(page);

  await pickUp(page, itemRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }));
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
  expect(placed.isAttached, 'the item is attached under its new parent').toBe(1);
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
  const list = dragRegion(modal, descendantsRegionKey(p.id));
  expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expectInside(modal, last.at());
  await expectGhostUnder(modal, x.id, last.at());
  await awaitProjection(page, `${gap}:3:true`);
  await release(page);

  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).isAttached).toBe(1);
  expect((await fetchItem(request, x.id)).position).toBeGreaterThan(
    (await fetchItem(request, extras[count - 1].id)).position,
  );
});

// R's first child, far down a list that scrolls, from the gap above R's overflow row: the other half of the case.
test('DRAG-7.17: from the gap above R’s overflow row, a list that scrolls puts the ghost’s spot under the cursor too', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Long List Above Project';
  const count = 20;
  const tree = await seedOverflowTree(request, name);
  const { p, q, r, r1 } = tree;
  // S, a sibling before R with `count` children of its own behind an overflow row, so R's first
  // child lies far down the modal's list.
  const s = await seedItem(request, { title: 'S', parentId: q.id });
  await moveItem(request, s.id, { parentId: q.id, anchorId: r.id, side: 'before' });
  for (let i = 0; i < count; i++) await seedItem(request, { title: `S${i}`, parentId: s.id });
  // The carried item is W, first in P: picked up at the top of the Card, it doesn't scroll the column, so
  // the cursor rests where the modal's list can bring the spot. The hold is longer than the aim takes.
  const { w } = await seedFirstItem(request, tree);
  const tuning = await seedDragTuning(page, { ...NO_POP, ...HOLD });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  // R's first child, after A, Q, S and its children, and R. W comes down to it, so the rows it passes
  // slide up a row, the overflow row is drawn where R's own box is, and the aim is there.
  const first = await holdAt(page, w, p, () => center(itemRow(page, r.id)), 0);
  const gap = 4 + count;
  await awaitProjection(page, `${gap}:3:true`);
  await expect(modal).toBeVisible(opens(tuning));
  const list = dragRegion(modal, descendantsRegionKey(p.id));
  expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expectInside(modal, first.at());
  await expectGhostUnder(modal, w.id, first.at());
  await awaitProjection(page, `${gap}:3:true`);
  await release(page);

  await expect.poll(async () => (await fetchItem(request, w.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, w.id)).isAttached).toBe(1);
  expect((await fetchItem(request, w.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
});

// After leaving a modal a hold opened, a hold beside an overflow row opens it again in the same drag
// (DRAG-7.18). Out of the modal is one pop, to P's column. Back in is the full zoom-in hold over P. The
// carried item is P's own Stub or a Free Card zoomed in. Nothing is written until the final release.
const ZOOM_BACK = { cardZoomDwellMs: 1500, cardPopInDelayMs: 800, popSnapMs: 0 };

for (const kind of ['stub', 'free'] as const) {
  test(`DRAG-7.18: after leaving a modal a hold opened, ${kind === 'stub' ? 'P’s own Stub' : 'a Free Card zoomed in'} held beside an overflow row opens it again in the same drag`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `Modal Hold Reopen ${kind} Project`;
    await page.setViewportSize({ width: 1800, height: 1100 });
    const tree = await seedOverflowTree(request, name);
    const { workflow, todo, p, r, r1, f, x } = tree;
    const z = kind === 'free' ? await seedFreeCard(request, tree) : null;
    const item = z ?? x;
    const column = columnForWorkphase(await fetchDefaultBoard(request, workflow.id), todo.id);
    const tuning = await seedDragTuning(page, { ...NO_POP, ...QUICK, ...ZOOM_BACK, popDelayMs: 300 });
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();
    const modal = hierarchyModal(page, 'P');
    const writes = watchWrites(page);
    const beside = () => topQuarter(overflowRow(page, r.id));

    // The first opening, by a hold, with the drag at P's Descendants layer.
    if (z) await holdFreeAt(page, z, p, tuning, beside, 0);
    else await holdAt(page, x, p, beside, 0);
    await expect(modal).toBeVisible(opens(tuning));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Out of it: one pop, to P's column, and the modal closes.
    const rest = await pointOutsideModal(itemRow(page, f.id), modal, 1);
    if (!rest) throw new Error('no point in the column lies outside the modal');
    await hoverTo(page, rest);
    await awaitDragContext(page, columnRegionKey(column.id), clocksMargin(tuning.popDelayMs));
    await expect(modal).toHaveCount(0);

    // Back in: the side highlight names P for the full zoom-in hold.
    const middle = await center(article(page, 'P'));
    await hoverTo(page, middle);
    await awaitDragContext(
      page,
      descendantsRegionKey(p.id),
      clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
    );

    // A hold beside the overflow row again: the modal opens again, at the same layer.
    const aim = async () => tabBy(page, { x: middle.x, y: (await beside()).y }, 0);
    await aim();
    await aim();
    await awaitProjection(page, '3:3:true');
    await expect(modal).toBeVisible(opens(tuning));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    expect(writes, 'nothing is written on the way out, back in or on opening').toEqual([]);

    // A release in it places by gap and depth: R's first child.
    await release(page);
    await expect.poll(async () => (await fetchItem(request, item.id)).parentId).toBe(r.id);
    expect((await fetchItem(request, item.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
  });
}

// The tiers a modal a hold opens carries (DRAG-7.12): the drag's, read once at its start. X's chain of
// descendants lets it fit as R's child and as R1's, and not as R1a's. R and R1 are Valid, so Full; R1a is a
// Stub that isn't Valid, whose parent is, so Mid; Y, whose parent R1a isn't Valid, is Low. The wiki names
// the tiers Full, Mid and Low (wiki board-drag-interaction §4.1); the app's attribute names them by what they
// can be: `parent`, `anchor` and `neither`. Reads the app's `data-drop-state` and `data-drop-tier`
// attributes, not the painted strength (DRAG-2.24's).
test('DRAG-7.12: a modal a hold opens carries the drag’s tiers: R and R1 Full, R1a Mid, Y Low, R as it was, and the section rows under the backdrop take none', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Modal Hold Tiers Project';
  const { workflow, p, r, r1, r1a, x, y } = await seedOverflowTree(request, name, { withY: true });
  const cap: number = (await fetchDefaultBoard(request, workflow.id)).itemDepthCap;

  // X carries a chain of `cap - 6` descendants, so it fits as R's child (depth 5, its deepest descendant at
  // cap - 1) and as R1's, but not as R1a's (depth 7, its deepest at cap + 1).
  let tail: { id: string } = x;
  for (let level = 1; level <= cap - 6; level++)
    tail = await seedItem(request, { title: `X${level}`, parentId: tail.id });

  // A dwell long enough to read R in the section before the modal opens.
  const tuning = await seedDragTuning(page, { ...NO_POP, modalHoldDwellMs: 1500, modalHoldCueMs: 300 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const modal = hierarchyModal(page, 'P');

  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  await expect(modal).toHaveCount(0);

  // R is drawn in the section, a parent for X: Full.
  const before = await itemRow(page, r.id).getAttribute('data-drop-tier');
  expect(before).toBe('parent');

  await expect(modal).toBeVisible(opens(tuning));
  // The Given: R and R1 are Valid for X, and R1a is Depth-capped.
  for (const valid of [r, r1]) await expect(itemRow(modal, valid.id)).toHaveAttribute('data-drop-state', 'valid');
  await expect(itemRow(modal, r1a.id)).toHaveAttribute('data-drop-state', 'depth-capped');

  // Full, Mid, Low, and R the tier it had.
  for (const full of [r, r1]) await expect(itemRow(modal, full.id)).toHaveAttribute('data-drop-tier', 'parent');
  await expect(itemRow(modal, r1a.id)).toHaveAttribute('data-drop-tier', 'anchor');
  await expect(itemRow(modal, y!.id)).toHaveAttribute('data-drop-tier', 'neither');
  expect(await itemRow(modal, r.id).getAttribute('data-drop-tier')).toBe(before);

  // The section still draws its rows under the backdrop, and they take no tier.
  await expect(article(page, 'P').getByText('A', { exact: true }).first()).toBeVisible();
  await expect(article(page, 'P').locator('[data-drop-tier]')).toHaveCount(0);
  await cancel(page);
});

test('DRAG-7.21, DRAG-2.22: a ghost in an over-cap state beside an overflow row starts no hold, from either gap, and none runs a level up where it fits', async ({
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
  expect(await settledWrites(page, writes)).toEqual([]);
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
  expect(await settledWrites(page, writes)).toEqual([]);
});
