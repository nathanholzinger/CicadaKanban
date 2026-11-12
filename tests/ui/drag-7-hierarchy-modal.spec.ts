import { delayMoveResponses, refuseMoves, settledWrites, watchWrites } from '../helpers/requestHarness';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  columnForWorkphase,
  deleteItem,
  fetchDefaultBoard,
  fetchItem,
  moveItem,
  pickWorkphases,
  seedItem,
  seedTemplatedWorkflow,
} from '../helpers/seed';
import {
  atFraction,
  awaitDragContext,
  awaitDragState,
  awaitProjection,
  boardReload,
  boxOf,
  cancel,
  center,
  clocksMargin,
  dragMachine,
  hoverTo,
  moveOnce,
  paintedBoxOf,
  pickUp,
  release,
  seedDragTuning,
  tabBy,
  topQuarter,
  NO_POP,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import { dragBoxOf, leanAtGhost, mergeRange, releaseMove, withinExcess } from '../helpers/boardDragSurface';
import {
  article,
  dragOverlay,
  hierarchyModal,
  itemPanel,
  itemRow,
  overflowRow,
  dragRegion,
} from '../helpers/boardLocators';
import {
  dropLineOn,
  expectCentered,
  expectInside,
  holdAt,
  holdFreeAt,
  modalState,
  pointOutsideModal,
  rowIds,
  sectionRows,
  seedGivenTree,
  seedOverflowTree,
} from '../helpers/overflowTree';

import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../../client/src/components/cardMetrics';
import { DEFAULT_DRAG_TUNING, type DragTuning } from '../../client/src/components/workflow/dragTuning';

// The hierarchy modal: a Card's whole hierarchy, opened by a click on an overflow row. While it's
// open it is the Card's Descendants layer, drawn whole. The cases assert what it draws and what a
// release writes, never a duration.
//
// Where a case drags a row, it's a Stub of `P` picked up in the modal, which starts at the
// Descendants layer with no pop.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// Picks a row of the modal up by its title.
const pickUpRow = (page: Page, modal: Locator, id: string, title: string) =>
  pickUp(page, itemRow(modal, id).getByRole('button', { name: title, exact: true }));

// Picks `row` up in the open modal, pulls it out to P's own box, which closes the modal and leaves
// the drag in the column, and zooms it back into P's section from there (P named for the dwell
// and the cue), where the cursor rests mid-way down it.
async function pullOutAndZoomBack(page: Page, modal: Locator, cardId: string, row: { id: string; title: string }) {
  await pickUpRow(page, modal, row.id, row.title);
  await awaitDragContext(page, descendantsRegionKey(cardId));
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: card.y + card.height * 0.08 });
  await expect(modal).toHaveCount(0);
  // The pull-out reached P's column, not just the modal's close: the drag is locked there until the zoom.
  await expect(dragMachine(page)).toHaveAttribute('data-drag-context', /^column:/);
  const section = dragRegion(page, descendantsRegionKey(cardId));
  await hoverTo(page, await atFraction(section, 0.5));
  await awaitDragContext(page, descendantsRegionKey(cardId));
}

// Drags R2 in the open modal to the gap between R1 and R1a and lets go, with every move refused:
// the client reloads the board from the server.
async function releaseRefusedMove(page: Page, modal: Locator, rows: { r2: { id: string }; r1a: { id: string } }) {
  await refuseMoves(page);
  await pickUpRow(page, modal, rows.r2.id, 'R2');
  await hoverTo(page, await topQuarter(itemRow(modal, rows.r1a.id)));
  await hoverTo(page, await topQuarter(itemRow(modal, rows.r1a.id)));
  await awaitProjection(page, '4:4:true');
  const reloaded = boardReload(page);
  await release(page);
  await reloaded;
}

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
  expect(await rowIds(modal)).toEqual([a, q, r, r1, r1a, r2, t, b, x].map(i => i.id));
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
    await expect(itemRow(modal, item.id)).toHaveCSS('padding-left', `${descendantsIndentPx(depth)}px`);
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
  await expect(hierarchyModal(page, 'P')).toBeVisible();
  const fromT = await rowIds(hierarchyModal(page, 'P'));
  await page.keyboard.press('Escape');
  await expect(hierarchyModal(page, 'P')).toHaveCount(0);

  await overflowRow(page, r.id).click();
  await expect(hierarchyModal(page, 'P')).toBeVisible();
  expect(await rowIds(hierarchyModal(page, 'P'))).toEqual(fromT);
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

test('DRAG-7.9, DRAG-7.28: a drag in the modal starts at the Descendants layer, and between R1 and R1a the one state is R1’s first child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal First Child Project';
  const { todo, p, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R2 is picked up in the modal, and its drag starts at P's Descendants layer with no pop. Aimed
  // at the top of R1a, the ghost sits between R1 and R1a.
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await awaitProjection(page, '4:4:true');

  // It is the one state there: an offset three levels to either side reads the same, and so does none.
  const at = await topQuarter(itemRow(modal, r1a.id));
  for (const levels of [-3, 3, 0]) {
    await tabBy(page, at, levels);
    await awaitProjection(page, '4:4:true');
  }
  await release(page);

  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);
  const placed = await fetchItem(request, r2.id);
  // R2 stays attached throughout, with P's workphase.
  expect([placed.isAttached, placed.workphaseId]).toEqual([1, todo.id]);
  expect(placed.position).toBeLessThan((await fetchItem(request, r1a.id)).position);
});

// The gap R2 sits in is between R1a and T. One tab right of R2's own depth, aligned with R1a, it is R1's last child.
test('DRAG-7.9: in the gap R2 sits in, one tab right of its own depth, it is R1’s last child, after R1a', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Last Child Project';
  const { todo, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // The Given: R2 is attached under R, with P's workphase, and R1a is the row right before it.
  const given = await fetchItem(request, r2.id);
  expect([given.parentId, given.isAttached, given.workphaseId]).toEqual([r.id, 1, todo.id]);
  const order = await rowIds(modal);
  expect(order.indexOf(r1a.id)).toBe(order.indexOf(r2.id) - 1);

  // R2's own gap is between R1a and T, at depth 3. One level deeper is aligned with R1a.
  const from = await pickUpRow(page, modal, r2.id, 'R2');
  const own = await center(itemRow(modal, r2.id));
  await hoverTo(page, { x: from.x + DESCENDANTS_INDENT_PX, y: own.y });
  await awaitProjection(page, '5:4:true');
  await release(page);

  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);
  const placed = await fetchItem(request, r2.id);
  expect([placed.isAttached, placed.workphaseId]).toEqual([1, todo.id]);
  expect(placed.position).toBeGreaterThan((await fetchItem(request, r1a.id)).position);
});

test('DRAG-7.9, DRAG-7.19: set back down in its own gap and depth, an item writes nothing, and the modal stays open where it is', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Own Slot Project';
  const { todo, r, r2 } = await seedOverflowTree(request, name);
  const before = await fetchItem(request, r2.id);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  const placedBefore = await boxOf(modal);

  const from = await pickUpRow(page, modal, r2.id, 'R2');
  const writes = watchWrites(page);
  await hoverTo(page, { x: from.x, y: from.y });
  await awaitProjection(page, '5:3:true');
  await release(page);

  expect(await settledWrites(page, writes)).toEqual([]);
  const after = await fetchItem(request, r2.id);
  expect([after.parentId, after.position]).toEqual([before.parentId, before.position]);
  // R2 stays attached, with P's workphase.
  expect([before.isAttached, before.workphaseId]).toEqual([1, todo.id]);
  expect([after.isAttached, after.workphaseId]).toEqual([1, todo.id]);
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(placedBefore);
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
  await expect(itemRow(modal, tOk.id)).toHaveAttribute('data-drop-state', 'valid');
  await expect(itemRow(modal, tOver.id)).toHaveAttribute('data-drop-state', 'depth-capped');

  // Below the deepest row, tabbed right to the level under it: past the cap, so invalid. The
  // state is reached, and a release in it writes nothing. The deepest row is the list's last, and
  // the gap under it takes the cursor at the row's lower edge, not a quarter up from it: the
  // sortable puts the ghost in the last slot only once the carried copy has passed the slot's
  // middle, which a few pixels' measuring slack can put out of reach of a row's lower quarter.
  const last = itemRow(modal, tOver.id);
  const writes = watchWrites(page);
  const tabbed = from.x + (cap - 2) * DESCENDANTS_INDENT_PX;
  const lastBox = await boxOf(last);
  const below = { x: tabbed, y: lastBox.y + lastBox.height + 2 };
  await hoverTo(page, below);
  await hoverTo(page, below);
  await awaitProjection(page, new RegExp(`^\\d+:${cap - 2}:false$`));
  await release(page);

  expect(await settledWrites(page, writes)).toEqual([]);
  const kept = await fetchItem(request, x.id);
  expect(kept.parentId).toBe(p.id);
  // X stays attached, with P's workphase.
  expect([kept.isAttached, kept.workphaseId]).toEqual([1, todo.id]);
});

// Leaving the modal (DRAG-7.10, DRAG-1.14). A pointer sample outside the modal's box and inside `K`, the
// Card's column or expanded sub-row, that satisfies the pop-out clock or the distance pops once, to `K`:
// the item is Free, bounded by `K`, both copies shortCard, and a release after Card `CardQ` writes `K`'s
// placement. The variants are how the modal was opened and what is carried (a click on an overflow row and
// a Stub of the modal; a hold and P's own Stub; a hold and a Free Card zoomed into P), where P sits (a
// merged column, an expanded sub-row) and what pops it (the clock, or one sample of the distance).
//
// Reads the screen for the modal, the copies' forms, the drop line and the boxes; the layer is read from
// the app's `data-drag-context` attribute, and the writes are the requests the page sent.

type Arrival = 'click' | 'hold-stub' | 'hold-free';
const ARRIVALS: readonly Arrival[] = ['click', 'hold-stub', 'hold-free'];
const ARRIVAL_WORDS: Record<Arrival, string> = {
  click: 'a Stub carried from a modal a click opened',
  'hold-stub': 'P’s own Stub carried into a modal a hold opened',
  'hold-free': 'a Free Card zoomed into P, carried into a modal a hold opened',
};
// The clock variants seed the pop-out delay with the distance off. The distance variants seed the distance
// with every pop clock off, so only one pointer sample can pop them.
const POP_DELAY_MS = 300;
// Wide enough that the cursor's small movements in K, such as the lean at the release, never reach it, and
// narrow enough that one sample from the modal to a Card in K does.
const POP_DISTANCE_PX = 150;
const HOLD_QUICK = { modalHoldDwellMs: 200, modalHoldCueMs: 300 };
// The zoom into P needs the full hold, and the same hold would zoom the Free Card into CardQ if the cursor
// lingered there after the pop, so it is longer than the aim at CardQ takes.
const ZOOM = { cardZoomDwellMs: 1500, cardPopInDelayMs: 800 };

type Threshold = 'clock' | 'distance';

function leavingTuning(arrival: Arrival, threshold: Threshold) {
  return {
    ...NO_POP,
    popSnapMs: 0,
    ...(threshold === 'clock' ? { popDelayMs: POP_DELAY_MS, popDistancePx: 0 } : { popDistancePx: POP_DISTANCE_PX }),
    ...(arrival === 'click' ? {} : HOLD_QUICK),
    ...(arrival === 'hold-free' ? ZOOM : {}),
  };
}

// The overflow tree, with `CardQ`, a Card beside P in `K` for the release to name, and `Z`, the Free Card a
// hold-free variant zooms into P. `K` is the Todo column, or, expanded, the Todo sub-row of the column
// Todo and In Progress make; its sibling sub-row is In Progress.
async function seedLeaving(request: APIRequestContext, name: string, expanded: boolean, withZ: boolean) {
  const tree = await seedOverflowTree(request, name);
  const { project, workflow, todo } = tree;
  const cardQ = await seedItem(request, { title: 'CardQ', projectId: project.id, workphaseId: todo.id });
  // Z is only there for the variant that carries it: left in K, it would be CardQ's next Card, and the
  // line after CardQ would be drawn before Z.
  const z = withZ ? await seedItem(request, { title: 'Z', projectId: project.id, workphaseId: todo.id }) : null;
  // Z comes before P, so its own slot is far from CardQ, where the release is.
  if (z) await moveItem(request, z.id, { anchorId: tree.p.id, side: 'before' });
  const board = await fetchDefaultBoard(request, workflow.id);
  if (!expanded) {
    const key = columnRegionKey(columnForWorkphase(board, todo.id).id);
    return { ...tree, cardQ, z, regionKey: key, siblingKey: null, doing: null };
  }
  const [doing] = pickWorkphases(workflow, 'In Progress');
  const column = await mergeRange(request, board, todo.id, doing.id, 'expanded');
  const siblingKey = subrowRegionKey(column, doing.id);
  return { ...tree, cardQ, z, regionKey: subrowRegionKey(column, todo.id), siblingKey, doing };
}

type Leaving = Awaited<ReturnType<typeof seedLeaving>>;

// Carries the item the arrival names into an open modal, with the drag at P's Descendants layer.
async function carryIntoModal(page: Page, arrival: Arrival, t: Leaving, tuning: DragTuning) {
  const { p, r, r2, x, z } = t;
  const modal = hierarchyModal(page, 'P');
  if (arrival === 'click') {
    await overflowRow(page, r.id).click();
    await expect(modal).toBeVisible();
    await pickUpRow(page, modal, r2.id, 'R2');
    await awaitDragContext(page, descendantsRegionKey(p.id));
    return { modal, item: r2 };
  }
  // A hold beside R's overflow row opens it, with the ghost between R and the row, as R's first child.
  const opened = { timeout: clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs) };
  if (arrival === 'hold-stub') {
    await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
    await expect(modal).toBeVisible(opened);
    await awaitDragContext(page, descendantsRegionKey(p.id));
    return { modal, item: x };
  }
  if (!z) throw new Error('the hold-free variant seeds Z');
  await holdFreeAt(page, z, p, tuning, () => topQuarter(overflowRow(page, r.id)), 0);
  await expect(modal).toBeVisible(opened);
  await awaitDragContext(page, descendantsRegionKey(p.id));
  return { modal, item: z };
}

// Where the cursor rests to pop: in P's box when part of it lies outside the modal, else (or when asked)
// on CardQ, which lies in `K` beside it.
async function restPoint(page: Page, modal: Locator, t: Leaving, where: 'P' | 'CardQ', clearPx: number) {
  if (where === 'P') {
    const inP = await pointOutsideModal(article(page, 'P'), modal, clearPx);
    if (inP) return { point: inP, owner: 'P' as const };
  }
  const onQ = await pointOutsideModal(itemRow(page, t.cardQ.id), modal, clearPx);
  if (!onQ) throw new Error('no point in K lies outside the modal');
  return { point: onQ, owner: 'CardQ' as const };
}

async function expectLeavesOnce(
  page: Page,
  request: APIRequestContext,
  projectSidebar: ProjectSidebarPage,
  {
    arrival,
    expanded,
    threshold,
    where,
  }: { arrival: Arrival; expanded: boolean; threshold: Threshold; where: 'P' | 'CardQ' },
) {
  const name = `Leaving ${arrival} ${expanded ? 'sub-row' : 'column'} ${threshold} ${where}`;
  // A window tall enough that P, F, G and CardQ are all in view in K, as the other board drag specs use.
  await page.setViewportSize({ width: 1800, height: 1100 });
  const t = await seedLeaving(request, name, expanded, arrival === 'hold-free');
  const tuning = await seedDragTuning(page, leavingTuning(arrival, threshold));
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const { modal, item } = await carryIntoModal(page, arrival, t, tuning);
  const region = dragRegion(page, t.regionKey);

  // The Given: the item is a Stub of P's (attached) or a Free Card, with its parent as it was, and the drag
  // is at P's Descendants layer with the modal open.
  const before = await fetchItem(request, item.id);
  expect(before.isAttached).toBe(arrival === 'hold-free' ? 0 : 1);
  await expect(modal).toBeVisible();
  await awaitDragContext(page, descendantsRegionKey(t.p.id));
  const writes = watchWrites(page);

  // The cursor goes to a point in `K` outside the modal's box. In P's own box when there is one, no further
  // exit from P is needed.
  const rest = await restPoint(page, modal, t, where, threshold === 'distance' ? POP_DISTANCE_PX : 1);
  if (arrival === 'click' && where === 'P')
    expect(rest.owner, 'part of P’s box lies outside a centered modal').toBe('P');
  if (threshold === 'clock') await hoverTo(page, rest.point);
  else await moveOnce(page, rest.point);
  await awaitDragContext(page, t.regionKey, clocksMargin(POP_DELAY_MS));

  // One pop: the modal is closed and the drag is locked in `K`, not at Board. Both copies are shortCard.
  await expect(modal).toHaveCount(0);
  await expect(dragMachine(page)).toHaveAttribute('data-drag-state', 'locked');
  await expect(itemRow(region, item.id)).toHaveAttribute('role', 'article');
  await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'short-card');
  // The ghost is a shortCard as well: a full Card is also an article, but it is not as tall as the copy.
  expect((await dragBoxOf(itemRow(region, item.id))).height).toBeCloseTo(
    (await dragBoxOf(dragOverlay(page))).height,
    1,
  );
  expect(writes, 'the pop writes nothing').toEqual([]);

  // The release is after CardQ, the ghost and the line there, with the carried copy inside `K`.
  // The Cards beside it shuffle as the ghost passes them (F and G, the Free children of R and T, are
  // Cards in K too), so the aim is taken again after each pass.
  let aim = await atFraction(itemRow(page, t.cardQ.id), 0.85);
  for (let pass = 0; pass < 3; pass++) {
    await hoverTo(page, aim);
    aim = await atFraction(itemRow(page, t.cardQ.id), 0.85);
  }
  await hoverTo(page, aim);
  await leanAtGhost(page, itemRow(region, item.id), aim, 'up');
  // A line that never comes carries the machine's state in the failure, to say where the drag was.
  try {
    await expect.poll(() => dropLineOn(page)).toEqual({ row: t.cardQ.id, side: 'after' });
  } catch (error) {
    const machine = await dragMachine(page).evaluate(el => [...el.attributes].map(a => `${a.name}=${a.value}`));
    throw new Error(
      `${(error as Error).message}
the drag machine: ${machine.join(' ')}`,
      { cause: error },
    );
  }
  // "Bounded by K": the carried copy's box against K's, read here while it is carried and asserted last, so
  // that a copy outside K doesn't stop the clauses after it from being checked.
  const overhang = await withinExcess(dragOverlay(page), region, expanded ? 'both' : 'x');
  await awaitDragContext(page, t.regionKey);
  await releaseMove(page, item.id);

  // K's placement, {anchorId: CardQ, side: after}: one request, no attach into P, the parent as it was.
  const sent = await settledWrites(page, writes);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({ anchorId: t.cardQ.id, side: 'after' });
  expect(sent[0].body).not.toHaveProperty('parentId');
  expect((sent[0].body as { isAttached?: boolean }).isAttached).not.toBe(true);
  const after = await fetchItem(request, item.id);
  expect([after.isAttached, after.parentId, after.workphaseId]).toEqual([0, before.parentId, t.todo.id]);
  expect(after.position).toBeGreaterThan((await fetchItem(request, t.cardQ.id)).position);
  expect(overhang, 'the carried copy was bounded by K').toBeLessThanOrEqual(2);
}

// Every arrival leaves on the clock. The distance, one pointer sample, is carried by P's own Stub alone
// (DRAG-1.14): which threshold fires changes nothing about the arrival, and the pop machine's own tests
// decide it.
for (const arrival of ARRIVALS) {
  for (const expanded of [false, true]) {
    for (const threshold of arrival === 'hold-stub' ? (['clock', 'distance'] as const) : (['clock'] as const)) {
      test(`DRAG-7.10${threshold === 'distance' ? ', DRAG-1.14' : ''}: ${ARRIVAL_WORDS[arrival]} pops once to ${expanded ? 'its expanded sub-row' : 'its column'} on ${threshold === 'clock' ? 'the clock' : 'one sample of the distance'}, Free, and a release after Card Q writes that placement`, async ({
        page,
        request,
        projectSidebar,
      }) => {
        await expectLeavesOnce(page, request, projectSidebar, { arrival, expanded, threshold, where: 'P' });
      });
    }
  }
}

test('DRAG-7.10: resting beyond P’s box, inside its column, pops once to the column, as the clock runs there too', async ({
  page,
  request,
  projectSidebar,
}) => {
  await expectLeavesOnce(page, request, projectSidebar, {
    arrival: 'click',
    expanded: false,
    threshold: 'clock',
    where: 'CardQ',
  });
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
  const regions = dragRegion(page, descendantsRegionKey(p.id));
  await expect(regions).toHaveCount(1);
  await expect(dragRegion(modal, descendantsRegionKey(p.id))).toHaveCount(1);
  for (const row of [a, q, r, t]) await expect(itemRow(page, row.id)).toHaveCount(1);

  // The cursor rests on P's own section, behind the backdrop and left of the modal's box, at the
  // height of R2's own row: were the section's rows candidates, the ghost would go to a gap among
  // them. It stays in R2's own gap, among the modal's rows.
  const ownRow = await center(itemRow(modal, r2.id));
  await pickUpRow(page, modal, r2.id, 'R2');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await awaitProjection(page, /^5:\d+:true$/);
  const behind = await boxOf(article(page, 'P'));
  const rest = { x: behind.x + 6, y: ownRow.y };
  await expectInside(article(page, 'P'), rest);
  await hoverTo(page, rest);
  await awaitProjection(page, /^5:\d+:true$/);
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await expect(modal).toBeVisible();

  // The carried copy stays inside the modal's list, measured where it is painted: it follows the
  // cursor by a transform, which a layout-space box would not see.
  const list = await paintedBoxOf(regions);
  const carried = await paintedBoxOf(dragOverlay(page));
  expect(carried.x).toBeGreaterThanOrEqual(list.x - 1);
  expect(carried.x + carried.width).toBeLessThanOrEqual(list.x + list.width + 1);
  expect(carried.y).toBeGreaterThanOrEqual(list.y - 1);
  expect(carried.y + carried.height).toBeLessThanOrEqual(list.y + list.height + 1);
  await cancel(page);
});

test('DRAG-7.19: after a release in the modal it stays open where it is, showing the item where it landed, marked pending until the response lands', async ({
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
  await delayMoveResponses(page, () => 1500);

  await pickUpRow(page, modal, r2.id, 'R2');
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await awaitProjection(page, '4:4:true');
  await release(page);

  // Still open, in the same place, with R2 under R1 and before R1a, at R1a's level, and marked
  // pending while the response is held.
  await expect(modal).toBeVisible();
  const moved = itemRow(modal, r2.id);
  await expect(moved).toHaveAttribute('data-pending', 'true');
  expect(await boxOf(modal)).toEqual(placedBefore);
  const ids = await rowIds(modal);
  expect(ids.indexOf(r2.id)).toBe(ids.indexOf(r1.id) + 1);
  expect(ids.indexOf(r1a.id)).toBe(ids.indexOf(r2.id) + 1);
  await expect(moved).toHaveCSS('padding-left', `${descendantsIndentPx(4)}px`);

  // Once the response lands the mark clears, and R2 is in the same place.
  await expect(moved).not.toHaveAttribute('data-pending', 'true', { timeout: 5000 });
  expect(await boxOf(modal)).toEqual(placedBefore);
  expect(await rowIds(modal)).toEqual(ids);
  await expect.poll(async () => (await fetchItem(request, r2.id)).parentId).toBe(r1.id);

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
  await expect(modal).toBeVisible();
  const rowsBefore = await rowIds(modal);
  const placedBefore = await boxOf(modal);

  await pickUpRow(page, modal, r2.id, 'R2');
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  const writes = watchWrites(page);
  await cancel(page);

  // Nothing was written, R2 is back where it was picked up, and the modal is open in the same place.
  await expect(modal).toBeVisible();
  expect(await boxOf(modal)).toEqual(placedBefore);
  expect(await rowIds(modal)).toEqual(rowsBefore);
  expect(await settledWrites(page, writes)).toEqual([]);
  expect((await fetchItem(request, r2.id)).parentId).toBe(r.id);

  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

// Back in the section after a pull out of the modal (DRAG-7.6). On the case's own tree, where B is P's last
// attached child, a click opens the modal, an item is picked up in it and pulled out past the pop-out
// threshold, which pops once to P's column and closes the modal (DRAG-7.10), and the cursor then rests on
// P's section until the side highlight has named P for the full zoom-in hold.
const BACK_IN = { ...NO_POP, popSnapMs: 0, popDelayMs: POP_DELAY_MS, cardZoomDwellMs: 650, cardPopInDelayMs: 350 };

test('DRAG-7.6, DRAG-7.2: a Stub whose own slot is behind an overflow row starts back in the section as P’s last child, and R’s overflow row leaves it out of its count', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Hidden Slot Project';
  const { p, r, r1, r1a, b } = await seedGivenTree(request, name);
  await seedDragTuning(page, BACK_IN);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // The Given: R1 is R's attached child, behind R's overflow row, which reads "2 children".
  await expect(overflowRow(page, r.id)).toHaveText('2 children');
  const given = await fetchItem(request, r1.id);
  expect([given.parentId, given.isAttached]).toEqual([r.id, 1]);
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R1 comes back with the ghost in the last gap, below B, at level 1, and R's overflow row reads "1 child".
  await pullOutAndZoomBack(page, modal, p.id, r1);
  await awaitProjection(page, '6:0:true');
  await expect(overflowRow(page, r.id)).toHaveText('1 child');
  await release(page);

  // R1 is P's last attached child, after B, with R1a still its child.
  await expect.poll(async () => (await fetchItem(request, r1.id)).parentId).toBe(p.id);
  const moved = await fetchItem(request, r1.id);
  expect(moved.isAttached).toBe(1);
  expect(moved.position).toBeGreaterThan((await fetchItem(request, b.id)).position);
  const grandchild = await fetchItem(request, r1a.id);
  expect([grandchild.parentId, grandchild.isAttached]).toEqual([r1.id, 1]);
});

test('DRAG-7.6: a Stub whose own slot the section shows comes back in that slot, and a release there writes nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Own Slot Back Project';
  const { p, q, r } = await seedGivenTree(request, name);
  await seedDragTuning(page, BACK_IN);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  expect((await fetchItem(request, r.id)).parentId).toBe(q.id);
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  // R, picked up in the modal and pulled out the same way, comes back with its ghost in its own slot, between Q and T, at R's level.
  await pullOutAndZoomBack(page, modal, p.id, r);
  await awaitProjection(page, `2:${DEFAULT_DRAG_TUNING.sectionLevels - 1}:true`);
  const writes = watchWrites(page);
  await release(page);

  expect(await settledWrites(page, writes)).toEqual([]);
  const kept = await fetchItem(request, r.id);
  expect([kept.parentId, kept.isAttached]).toEqual([q.id, 1]);
});

test('DRAG-7.6: released in the column before zooming back in, a Stub from the modal is Free, keeps its parent, and is placed by the column’s within-action', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Column Release Project';
  const { workflow, todo, p, r, r1 } = await seedGivenTree(request, name);
  const todoCol = columnForWorkphase(await fetchDefaultBoard(request, workflow.id), todo.id);
  // A zoom hold that can't run out before the release, so the drag stays in the column.
  await seedDragTuning(page, { ...BACK_IN, cardZoomDwellMs: 20_000, cardPopInDelayMs: 20_000 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');

  await pickUpRow(page, modal, r1.id, 'R1');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const card = await boxOf(article(page, 'P'));
  await hoverTo(page, { x: card.x + 6, y: card.y + card.height * 0.08 });
  await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(POP_DELAY_MS));
  await expect(modal).toHaveCount(0);

  // The column's within-action is the anchor and side the ghost and the line name just before the release.
  await expect.poll(() => dropLineOn(page)).not.toBeNull();
  const named = await dropLineOn(page);
  const writes = watchWrites(page);
  await releaseMove(page, r1.id);
  const sent = await settledWrites(page, writes);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({ isAttached: false, anchorId: named?.row, side: named?.side });
  const detached = await fetchItem(request, r1.id);
  expect([detached.isAttached, detached.parentId, detached.workphaseId]).toEqual([0, r.id, todo.id]);
});

// A hidden Stub returned to its pickup slot after reopening the modal (DRAG-7.31): R2 is picked up in the
// modal, pulled out to P's column, zoomed back into P (its own slot is hidden, so it starts as P's last child),
// the modal is reopened by a hold, and the ghost is moved back to R2's original gap, after R1a and before T,
// at R2's level. The modal shows the whole hierarchy, so the set-down there is not a move.
test('DRAG-7.31: a hidden Stub returned to its pickup slot after reopening the modal writes nothing, and the modal stays open showing it there', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Hidden Stub Returned Project';
  const { p, r, r1a, r2, t, todo } = await seedGivenTree(request, name);
  const tuning = await seedDragTuning(page, { ...BACK_IN, ...HOLD_QUICK });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  const before = await fetchItem(request, r2.id);
  expect([before.parentId, before.isAttached, before.workphaseId]).toEqual([r.id, 1, todo.id]);
  const writes = watchWrites(page);

  // Out of the modal and back into P by the zoom hold: the ghost starts as P's last child, R2's own slot
  // being behind R's overflow row (7 rows without R2, so the last gap is 7).
  await pullOutAndZoomBack(page, modal, p.id, r2);
  await awaitProjection(page, '7:0:true');

  // A hold beside R's overflow row, in the gap above it, reopens the modal.
  const middle = await atFraction(dragRegion(page, descendantsRegionKey(p.id)), 0.5);
  const aim = async () => tabBy(page, { x: middle.x, y: (await topQuarter(overflowRow(page, r.id))).y }, 0);
  await aim();
  await aim();
  await awaitProjection(page, '3:3:true');
  await expect(modal).toBeVisible({ timeout: clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs) });
  await awaitDragContext(page, descendantsRegionKey(p.id));

  // The ghost goes back to R2's original gap: after R1a, before T, at R2's level. The modal opened with the
  // ghost's spot under the cursor, so the cursor's x reads R1's level, which is R2's; it moves up and down
  // from there, and the aim is taken again until the modal reads that gap.
  await expect
    .poll(async () => {
      await hoverTo(page, { x: middle.x, y: (await topQuarter(itemRow(modal, t.id))).y });
      return dragMachine(page).getAttribute('data-drag-projection');
    })
    .toBe('5:3:true');
  await release(page);

  // No request was sent, from the pickup through the release. R2 is as it was.
  expect(await settledWrites(page, writes)).toEqual([]);
  const after = await fetchItem(request, r2.id);
  expect([after.parentId, after.isAttached, after.position, after.workphaseId]).toEqual([
    r.id,
    1,
    before.position,
    todo.id,
  ]);

  // The modal is still open, showing R2 in its original slot: after R1a, before T, at R2's level.
  await expect(modal).toBeVisible();
  const ids = await rowIds(modal);
  expect(ids.indexOf(r2.id)).toBe(ids.indexOf(r1a.id) + 1);
  expect(ids.indexOf(t.id)).toBe(ids.indexOf(r2.id) + 1);
  await expect(itemRow(modal, r2.id)).toHaveCSS('padding-left', `${descendantsIndentPx(3)}px`);
});

// From an expanded sub-row, reaching Board or a sibling sub-row takes another pop out of K (DRAG-7.10). After
// the one pop out of the modal the drag is locked in K, the Todo sub-row, so the In Progress sub-row beside
// it is nowhere new until K's own pop out fires.
test('DRAG-7.10: in an expanded sub-row, reaching Board takes another pop out of the sub-row', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Leaving Sub-row To Board Project';
  await page.setViewportSize({ width: 1800, height: 1100 });
  const t = await seedLeaving(request, name, true, false);
  const tuning = await seedDragTuning(page, leavingTuning('click', 'clock'));
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const { modal } = await carryIntoModal(page, 'click', t, tuning);
  const rest = await restPoint(page, modal, t, 'P', 1);
  // No further exit from P's box is needed: the cursor rests inside it, outside the modal.
  expect(rest.owner, 'part of P’s box lies outside a centered modal').toBe('P');
  await hoverTo(page, rest.point);
  await awaitDragContext(page, t.regionKey, clocksMargin(POP_DELAY_MS));
  await expect(modal).toHaveCount(0);
  await expect(dragMachine(page)).toHaveAttribute('data-drag-state', 'locked');

  // The cursor goes to the sibling sub-row, outside K. K's pop-out clock runs from there, and at its end the
  // drag is at Board, where no context is locked.
  await hoverTo(page, await center(dragRegion(page, t.siblingKey!)));
  await awaitDragState(page, 'popped-out', clocksMargin(POP_DELAY_MS));
  await awaitDragContext(page, null);
  await cancel(page);
});

test('DRAG-7.10: in an expanded sub-row, the sibling sub-row beside it is not reached by the one pop: a release over it is the sub-row’s own placement', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Leaving Sub-row Sibling Project';
  await page.setViewportSize({ width: 1800, height: 1100 });
  const t = await seedLeaving(request, name, true, false);
  // A distance wide enough that the sibling sub-row's first rows are nearer K than it.
  const tuning = await seedDragTuning(page, { ...leavingTuning('click', 'distance'), popDistancePx: 60 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const { modal, item } = await carryIntoModal(page, 'click', t, tuning);
  const region = dragRegion(page, t.regionKey);
  const sibling = dragRegion(page, t.siblingKey!);
  const writes = watchWrites(page);

  // The one pop, on one sample of the distance.
  const rest = await restPoint(page, modal, t, 'P', tuning.popDistancePx);
  expect(rest.owner, 'part of P’s box lies outside a centered modal').toBe('P');
  await moveOnce(page, rest.point);
  await awaitDragContext(page, t.regionKey);
  await expect(modal).toHaveCount(0);

  // The Given: the sibling sub-row lies below K, and a point just inside it is nearer K's box than the distance.
  const kBox = await boxOf(region);
  const sBox = await boxOf(sibling);
  const over = { x: sBox.x + sBox.width / 2, y: sBox.y + 4 };
  expect(over.y, 'the sibling sub-row is below K').toBeGreaterThan(kBox.y + kBox.height);
  expect(over.y - (kBox.y + kBox.height), 'nearer K than the distance').toBeLessThan(tuning.popDistancePx);

  // Over the sibling sub-row the drag is still locked in K, and the release is K's: after its last Card,
  // in K's workphase, not the sibling's.
  await moveOnce(page, over);
  await expect(dragMachine(page)).toHaveAttribute('data-drag-state', 'locked');
  await awaitDragContext(page, t.regionKey);
  await expect.poll(() => dropLineOn(page)).toEqual({ row: t.cardQ.id, side: 'after' });
  await releaseMove(page, item.id);
  const sent = await settledWrites(page, writes);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({ anchorId: t.cardQ.id, side: 'after' });
  const after = await fetchItem(request, item.id);
  expect([after.isAttached, after.workphaseId]).toEqual([0, t.todo.id]);
});

// A single excursion out of the modal that satisfies neither pop-out threshold leaves the modal open and the
// drag at its Descendants layer (DRAG-7.10), and with the distance off, a cursor outside the modal's box for
// less than the pop-out delay pops nothing (DRAG-1.14). The clock's reset across excursions is the pop
// machine's, in `popSession.test.ts`.
test('DRAG-7.10, DRAG-1.14: with the distance off, an excursion out of the modal shorter than the pop-out delay leaves the drag in it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Clock Excursion Project';
  await page.setViewportSize({ width: 1800, height: 1100 });
  const t = await seedLeaving(request, name, false, false);
  const tuning = await seedDragTuning(page, { ...leavingTuning('click', 'clock'), popDelayMs: 3000 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const { modal } = await carryIntoModal(page, 'click', t, tuning);
  expect(tuning.popDistancePx, 'the distance is off').toBe(0);

  const rest = await restPoint(page, modal, t, 'P', 1);
  await hoverTo(page, rest.point);
  await page.waitForTimeout(tuning.popDelayMs / 10);
  await hoverTo(page, await center(modal.getByRole('heading', { name: 'P', exact: true })));
  await awaitDragContext(page, descendantsRegionKey(t.p.id));
  await expect(modal).toBeVisible();
  await cancel(page);
});

test('DRAG-7.10: an excursion out of the modal shorter than the pop-out distance leaves the drag in it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Distance Excursion Project';
  await page.setViewportSize({ width: 1800, height: 1100 });
  const t = await seedLeaving(request, name, false, false);
  const tuning = await seedDragTuning(page, { ...leavingTuning('click', 'distance'), popDistancePx: 600 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const { modal } = await carryIntoModal(page, 'click', t, tuning);

  // The Given: the point is outside the modal's box and nearer to it than the distance.
  const rest = await restPoint(page, modal, t, 'P', 1);
  const m = await boxOf(modal);
  const gapX = Math.max(m.x - rest.point.x, 0, rest.point.x - (m.x + m.width));
  const gapY = Math.max(m.y - rest.point.y, 0, rest.point.y - (m.y + m.height));
  expect(Math.hypot(gapX, gapY)).toBeGreaterThan(0);
  expect(Math.hypot(gapX, gapY)).toBeLessThan(tuning.popDistancePx);

  await moveOnce(page, rest.point);
  await moveOnce(page, await center(modal.getByRole('heading', { name: 'P', exact: true })));
  await awaitDragContext(page, descendantsRegionKey(t.p.id));
  await expect(modal).toBeVisible();
  await cancel(page);
});

test('DRAG-7.23, DRAG-7.25: after a release in the modal whose write failed, the reloaded board leaves it open, centered, with the rows as the server has them', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Failed Release Project';
  const { p, a, b, r, r2, r1a } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  const rowsBefore = await rowIds(modal);

  // B is moved ahead of A on the server behind the open page's back, so the reloaded board's rows
  // differ from the ones the drag started with, and only a client that draws the reload shows them.
  await moveItem(request, b.id, { parentId: p.id, anchorId: a.id, side: 'before' });
  await releaseRefusedMove(page, modal, { r2, r1a });

  // The board came back from the server with B first and R2 where it was, and the modal is open
  // over it, where a click opened it.
  await expect(modal).toBeVisible();
  await expect.poll(() => rowIds(modal)).toEqual([b.id, ...rowsBefore.filter(id => id !== b.id)]);
  await expect(itemRow(modal, r2.id)).not.toHaveAttribute('data-pending', 'true');
  expect((await fetchItem(request, r2.id)).parentId).toBe(r.id);
  await expectCentered(page, modal);
});

test('DRAG-7.23, DRAG-6.15: a reload that lands mid-drag in the modal stops the drag, writes nothing for it, and leaves the modal open', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Reload Mid Drag Project';
  const { p, r, r1, r1a, r2 } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();
  const rowsBefore = await rowIds(modal);

  // The first release's write is refused after a delay, so the reload it causes lands while the
  // next drag is under way.
  await refuseMoves(page, { afterMs: 1500 });
  const writes = watchWrites(page);
  await pickUpRow(page, modal, r2.id, 'R2');
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await hoverTo(page, await topQuarter(itemRow(modal, r1a.id)));
  await awaitProjection(page, '4:4:true');
  const reloaded = boardReload(page);
  await release(page);

  await pickUpRow(page, modal, r1a.id, 'R1a');
  await awaitDragContext(page, descendantsRegionKey(p.id));
  await reloaded;

  // The drag is over, with no carried copy left and no write for it, and the modal is open over
  // the reloaded board.
  await expect(dragMachine(page)).toHaveCount(0);
  await expect(dragOverlay(page)).toHaveCount(0);
  await expect(modal).toBeVisible();
  await expect.poll(() => rowIds(modal)).toEqual(rowsBefore);
  await page.mouse.up();
  expect(await settledWrites(page, writes)).toHaveLength(1);
  expect((await fetchItem(request, r1a.id)).parentId).toBe(r1.id);
  expect((await fetchItem(request, r2.id)).parentId).toBe(r.id);
});

test('DRAG-7.26: the modal closes when the reloaded board no longer has its Card', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Card Gone Project';
  const { p, r, r2, r1a } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();

  // P is deleted behind the open page's back, and a refused release reloads the board.
  await deleteItem(request, p.id);
  await releaseRefusedMove(page, modal, { r2, r1a });

  await expect(modal).toHaveCount(0);
  await expect(article(page, 'P')).toHaveCount(0);
});

test('DRAG-7.26: the modal closes when the reloaded board leaves its Card with no attached descendants', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Hierarchy Modal Nothing Left Project';
  const { p, a, b, x, r, r2, r1a } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await overflowRow(page, r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();

  // Every attached child of P is detached, so P still has its descendants, with none of them
  // attached: A and B keep their subtrees, and each is a Free Card on the board now.
  for (const detached of [a, b, x]) await moveItem(request, detached.id, { isAttached: false });
  await releaseRefusedMove(page, modal, { r2, r1a });

  await expect(modal).toHaveCount(0);
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toEqual([]);
  expect((await fetchItem(request, a.id)).parentId).toBe(p.id);
  await expect(article(page, 'A')).toBeVisible();
});

// The Sheet over the modal: opened by a click on a row, drawn above the modal, and the modal held
// open under it. The modal is read as a whole (`modalState`): its rows in order at their indents,
// and its list scrolled where it was.

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
// offset, and nothing written. The next Escape then closes the modal. The Sheet is taken as open once it
// is in place: it slides in, and an Escape pressed in its first moments was lost in 4 of 40 runs. That is
// an adjacent finding about the app, recorded in Results and the Open questions, not a case gap.
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
