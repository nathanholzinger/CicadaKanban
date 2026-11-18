import { settledWrites, watchWrites } from '../helpers/requestHarness';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { fetchItem, moveItem } from '../helpers/seed';
import {
  awaitDragContext,
  boxOf,
  center,
  dragMachine,
  hoverTo,
  paintedBoxOf,
  pickUp,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import { article, hierarchyModal, itemPanel, itemRow, overflowRow, dragRegion } from '../helpers/boardLocators';
import { expectInside, modalState, sectionRows, seedOverflowTree } from '../helpers/overflowTree';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

// The Sheet over the hierarchy modal: opened by a click on a row, drawn above the modal, and the modal
// held open under it. The modal is read as a whole (`modalState`): its rows in order at their indents,
// and its list scrolled where it was.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// Picks a row of the modal up by its title.
const pickUpRow = (page: Page, modal: Locator, id: string, title: string) =>
  pickUp(page, itemRow(modal, id).getByRole('button', { name: title, exact: true }));

const sheetHeading = (page: Page, title: string) => itemPanel(page).getByRole('heading', { name: title, exact: true });

test('DRAG-7.28: a click on a row in the modal opens that item’s Sheet above it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Row Click Project';
  const { p, r, r1 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  const placed = await boxOf(modal);
  const before = await modalState(modal, p.id);
  const writes = watchWrites(page);

  await itemRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }).click();

  // R1's Sheet, not P's, the modal as it was under it, and nothing written.
  const sheet = itemPanel(page);
  await expect(sheet).toHaveClass(/translate-x-0/);
  await expect(sheetHeading(page, 'R1')).toBeVisible();
  await expect(sheetHeading(page, 'P')).toHaveCount(0);
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(placed);
  expect(await modalState(modal, p.id)).toEqual(before);

  // The Sheet is above the modal: at a point where the two overlap, the topmost element belongs to the Sheet.
  const windowWidth = page.viewportSize()!.width;
  await expect
    .poll(async () => {
      const box = await paintedBoxOf(sheet);
      return box.x + box.width;
    })
    .toBe(windowWidth);
  const modalBox = await paintedBoxOf(modal);
  const sheetBox = await paintedBoxOf(sheet);
  const left = Math.max(sheetBox.x, modalBox.x);
  const right = Math.min(sheetBox.x + sheetBox.width, modalBox.x + modalBox.width);
  expect(right, 'the Sheet and the modal overlap').toBeGreaterThan(left);
  const overlap = { x: (left + right) / 2, y: modalBox.y + modalBox.height / 2 };
  await expectInside(modal, overlap);
  await expectInside(sheet, overlap);
  await expect
    .poll(() =>
      page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest('[role="complementary"]')?.getAttribute('aria-label') ?? null,
        overlap,
      ),
    )
    .toBe('Item details');

  // And the Sheet takes the pointer: its title opens for editing, and Escape ends that edit before it
  // closes anything.
  await sheetHeading(page, 'R1').click();
  await expect(sheet.getByRole('textbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet.getByRole('textbox')).toHaveCount(0);
  await expect(sheet).toHaveClass(/translate-x-0/);
  await expect(modal).toBeVisible();

  expect(await settledWrites(page, writes)).toEqual([]);
});

test('DRAG-7.28: carrying a row in the modal opens no Sheet, and the release still places by gap and depth', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Row Drag Project';
  const { p, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  const sheet = itemPanel(page);

  // R1, the row a click opens a Sheet for, is pressed and carried to the gap after R2, at R2's level:
  // no Sheet opens while it is carried, nor on the release that follows.
  const from = await pickUpRow(page, modal, r1.id, 'R1');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect(sheet).toHaveClass(/translate-x-full/);
  // Carried down, an aim at the row after the gap reads the gap after that row, so the aim is at R2.
  await expect
    .poll(async () => {
      await hoverTo(page, { x: from.x, y: (await topQuarter(itemRow(modal, r2.id))).y });
      return dragMachine(page).getAttribute('data-drag-projection');
    })
    .toBe('4:3:true');
  await expect(sheet).toHaveClass(/translate-x-full/);
  await release(page);

  // R1 is R's last child, after R2, with R1a still its child, and the Sheet stayed shut.
  await expect
    .poll(async () => (await fetchItem(request, r1.id)).position)
    .toBeGreaterThan((await fetchItem(request, r2.id)).position);
  expect((await fetchItem(request, r1.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, r1a.id)).parentId).toBe(r1.id);
  await expect(sheet).toHaveClass(/translate-x-full/);
  await expect(modal).toBeVisible();
});

// A window tall enough for the board and short enough that the modal's list scrolls, and wide enough
// that the modal's X lies clear of the Sheet's panel, so a click on it reaches the Sheet's backdrop.
const SCROLLING_WINDOW = { width: 1600, height: 360 };
const SCROLLED_BY = 30;

// Closing the Sheet over the hierarchy modal (DRAG-7.32), each way from a fresh state: only the Sheet closes,
// and the same modal is left where it was, with the same rows at the same indents and the same scroll
// offset, and nothing written. The next Escape then closes the modal. These wait for the Sheet to be in place;
// the test after them presses Escape while it is still sliding in.
const CLOSE_WAYS = ['Escape', 'its X', 'its backdrop', 'its backdrop over the modal’s own X'] as const;

for (const way of CLOSE_WAYS) {
  test(`DRAG-7.32: closing the Sheet over the hierarchy modal by ${way} closes only the Sheet and returns to the modal as it was`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Hierarchy Modal Sheet Close Project';
    const { p, r, r1 } = await seedOverflowTree(request, name);
    await page.setViewportSize(SCROLLING_WINDOW);
    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();
    await overflowRow(page, r.id).click();
    const modal = hierarchyModal(page, 'P');
    await expect(modal).toBeVisible();

    // The Given: the modal's list is scrolled, with R1 still in view to press.
    await dragRegion(modal, descendantsRegionKey(p.id)).evaluate((list, by) => (list.scrollTop = by), SCROLLED_BY);
    const before = await modalState(modal, p.id);
    expect(before.scrollTop, 'the modal’s list scrolls').toBe(SCROLLED_BY);
    expect(before.rows.length).toBeGreaterThan(0);
    const placed = await boxOf(modal);
    const modalX = await center(modal.getByRole('button', { name: 'Close', exact: true }));
    const writes = watchWrites(page);

    // R1's Sheet opens above the modal, and is in place.
    const sheet = itemPanel(page);
    await itemRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }).click();
    await expect(sheetHeading(page, 'R1')).toBeVisible();
    await expect(sheet).toHaveClass(/translate-x-0/);
    await expect
      .poll(async () => {
        const box = await paintedBoxOf(sheet);
        return box.x + box.width;
      })
      .toBe(SCROLLING_WINDOW.width);

    // The modal's own X, its backdrop and Escape don't dismiss the modal while the Sheet is open: each way
    // of closing the Sheet closes only it.
    if (way === 'Escape') await page.keyboard.press('Escape');
    else if (way === 'its X') await sheet.getByRole('button', { name: 'Close panel' }).click();
    else if (way === 'its backdrop') await page.mouse.click(5, 200);
    else await page.mouse.click(modalX.x, modalX.y);
    await expect(sheet).toHaveClass(/translate-x-full/);

    // The same modal, at its prior place, with the same rows, indents and scroll offset; nothing written.
    await expect(modal).toBeVisible();
    expect(await boxOf(modal)).toEqual(placed);
    expect(await modalState(modal, p.id)).toEqual(before);
    expect(await settledWrites(page, writes)).toEqual([]);

    // With the Sheet gone, the next Escape closes the modal.
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
}

// Escape while the Sheet is still sliding in (DRAG-7.32): the Sheet has begun opening and is visible above the
// modal, so that keypress closes only the Sheet. The page's animations are slowed through the browser's own
// animation timeline, so that the Sheet is shown to be mid-entrance when Escape is pressed, which a fast
// slide can't be relied on for.
test('DRAG-7.32: Escape pressed while the Sheet is still sliding in over the hierarchy modal closes only the Sheet', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Sheet Early Escape Project';
  const { p, r, r1 } = await seedOverflowTree(request, name);
  await page.setViewportSize(SCROLLING_WINDOW);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  await dragRegion(modal, descendantsRegionKey(p.id)).evaluate((list, by) => (list.scrollTop = by), SCROLLED_BY);
  const before = await modalState(modal, p.id);
  expect(before.scrollTop, 'the modal’s list scrolls').toBe(SCROLLED_BY);
  const placed = await boxOf(modal);
  const writes = watchWrites(page);

  // The Given: the Sheet is visible above the modal and not yet in place.
  const animations = await page.context().newCDPSession(page);
  await animations.send('Animation.setPlaybackRate', { playbackRate: 0.05 });
  const sheet = itemPanel(page);
  await itemRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }).click();
  await expect(sheetHeading(page, 'R1')).toBeVisible();
  const entering = await paintedBoxOf(sheet);
  expect(entering.x + entering.width, 'the Sheet is still sliding in').toBeGreaterThan(SCROLLING_WINDOW.width);
  expect(entering.x, 'and is on the screen').toBeLessThan(SCROLLING_WINDOW.width);

  await page.keyboard.press('Escape');
  await expect(sheet).toHaveClass(/translate-x-full/);
  await animations.send('Animation.setPlaybackRate', { playbackRate: 1 });

  // Only the Sheet closed: the same modal, at its prior place, with the same rows, indents and scroll offset.
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(placed);
  expect(await modalState(modal, p.id)).toEqual(before);
  expect(await settledWrites(page, writes)).toEqual([]);

  // With the Sheet gone, the next Escape closes the modal.
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

test('DRAG-7.33: a child link in the Sheet replaces the Sheet over the same modal, down to the last child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Sheet Links Project';
  const { p, r } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  const placed = await boxOf(modal);
  const before = await modalState(modal, p.id);
  const writes = watchWrites(page);
  const sheet = itemPanel(page);
  const followChild = (title: string) => sheet.getByRole('button').filter({ hasText: title }).first().click();
  const onlyShows = async (title: string) => {
    await expect(sheetHeading(page, title)).toBeVisible();
    // One Sheet, showing the named item, over the same modal.
    await expect(page.getByRole('complementary', { name: 'Item details', exact: true })).toHaveCount(1);
    await expect(sheet.getByRole('heading', { level: 2 })).toHaveText(title);
    await expect(modal).toBeVisible();
    expect(await boxOf(modal)).toEqual(placed);
    expect(await modalState(modal, p.id)).toEqual(before);
  };

  // R's Sheet from its row, then its child R1, then R1's child R1a.
  await itemRow(modal, r.id).getByRole('button', { name: 'R', exact: true }).click();
  await onlyShows('R');
  await followChild('R1');
  await onlyShows('R1');
  await followChild('R1a');
  await onlyShows('R1a');

  // Closing the last Sheet returns to the modal.
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveClass(/translate-x-full/);
  await expect(modal).toBeVisible();
  expect(await modalState(modal, p.id)).toEqual(before);
  expect(await settledWrites(page, writes)).toEqual([]);
});

test('DRAG-7.34: an edit made in the Sheet appears in the open modal, which is not closed and reopened', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Sheet Edit Project';
  const { p, r, r1, r1a } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  const before = await modalState(modal, p.id);

  await itemRow(modal, r1.id).getByRole('button', { name: 'R1', exact: true }).click();
  await sheetHeading(page, 'R1').click();
  await itemPanel(page).getByRole('textbox').fill('Renamed child');
  await itemPanel(page).getByRole('textbox').press('Enter');

  // The row now reads the new title, in the same place, among the same rows, at the same indents,
  // and the other rows keep their titles.
  await expect(sheetHeading(page, 'Renamed child')).toBeVisible();
  await expect(itemRow(modal, r1.id)).toContainText('Renamed child');
  await expect(itemRow(modal, r1.id)).not.toContainText('R1');
  await expect(modal).toBeVisible();
  const during = await modalState(modal, p.id);
  expect(during.rows.map(row => [row.id, row.indent])).toEqual(before.rows.map(row => [row.id, row.indent]));
  expect(during.rows.filter(row => row.id !== r1.id)).toEqual(before.rows.filter(row => row.id !== r1.id));

  // R1 is still under R, with R1a beneath it, and the modal is the updated one once the Sheet closes.
  expect((await fetchItem(request, r1.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, r1a.id)).parentId).toBe(r1.id);
  await page.keyboard.press('Escape');
  await expect(itemPanel(page)).toHaveClass(/translate-x-full/);
  await expect(modal).toBeVisible();
  await expect(itemRow(modal, r1.id)).toContainText('Renamed child');
  expect(await modalState(modal, p.id)).toEqual(during);
});

for (const [way, close] of [
  ['its X', (page: Page) => itemPanel(page).getByRole('button', { name: 'Close panel' }).click()],
  ['its backdrop', (page: Page) => page.mouse.click(5, 200)],
  ['Escape', (page: Page) => page.keyboard.press('Escape')],
] as const) {
  test(`DRAG-7.35: the modal closes at once when its last attached descendant is detached from its open Sheet, and the Sheet closed by ${way} returns to the board`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = `Hierarchy Modal Emptied Under Sheet ${way}`;
    const { p, a, b, x, r } = await seedOverflowTree(request, name);
    // A is P's only attached child, once B and X are detached.
    for (const detached of [b, x]) await moveItem(request, detached.id, { isAttached: false });
    await page.setViewportSize({ width: 1600, height: 720 });
    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();
    await overflowRow(page, r.id).click();
    const modal = hierarchyModal(page, 'P');
    await expect(modal).toBeVisible();
    await itemRow(modal, a.id).getByRole('button', { name: 'A', exact: true }).click();
    await expect(sheetHeading(page, 'A')).toBeVisible();
    const writes = watchWrites(page);

    // A successful edit detaches A: P has no attached descendants left, and the modal goes at once,
    // with A's Sheet still open.
    await itemPanel(page).getByLabel('Attached').click();
    await expect(modal).toHaveCount(0);
    await expect(itemPanel(page)).toHaveClass(/translate-x-0/);
    await expect(sheetHeading(page, 'A')).toBeVisible();
    expect((await fetchItem(request, a.id)).isAttached).toBe(0);

    // Closing the Sheet shows the board, and the modal does not come back.
    await close(page);
    await expect(itemPanel(page)).toHaveClass(/translate-x-full/);
    await expect(modal).toHaveCount(0);
    await expect(article(page, 'P')).toBeVisible();
    expect(await sectionRows(page, p.id)).toEqual([]);
    // The detach was the one write.
    expect((await settledWrites(page, writes)).length).toBe(1);
  });
}
