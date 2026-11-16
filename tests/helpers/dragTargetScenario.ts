import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { leanAtGhost, mergeRange, seedBoardFixture } from './boardDragSurface';
import { dragRegion, hierarchyModal, itemRow, overflowRow } from './boardLocators';
import {
  awaitDragContext,
  center,
  clocksMargin,
  hoverTo,
  paintedBoxOf,
  NO_POP,
  pickUp,
  release,
  seedDragTuning,
  tabBy,
  topQuarter,
} from './dragGesture';
import {
  addWorkphases,
  fetchItem,
  moveItem,
  pinItemPosition,
  reorderWorkphases,
  seedColumn,
  seedItem,
  type SeededItem,
} from './seed';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import type { DragTuning } from '../../client/src/components/workflow/dragTuning';
import { dropLineOn } from './overflowTree';

// Checked target fixtures and observations of the board's drag attributes.
// Saved-state restoration reads the API; it never predicts a classification.
export type TargetBoard = Awaited<ReturnType<typeof targetBoard>>;
export type TargetState = 'valid' | 'cycle-forming' | 'depth-capped';
export type TargetTier = 'parent' | 'anchor' | 'neither';

export const TARGET_ZOOM = { cardZoomDwellMs: 650, cardPopInDelayMs: 350, popSnapMs: 0 };

// Picks the Card's own title, excluding the independently draggable Stubs in its expanded section.
export function pickUpTargetCard(page: Page, card: SeededItem) {
  return pickUp(page, itemRow(page, card.id).getByText(card.title, { exact: true }));
}

export async function targetBoard(request: APIRequestContext, name: string) {
  const board = await seedBoardFixture(request, name);
  expect(board.board.itemDepthCap).toBeGreaterThanOrEqual(6);
  return { ...board, name, cap: board.board.itemDepthCap };
}

export async function seedNonTargetPlaces(request: APIRequestContext, board: TargetBoard) {
  const unsorted = await seedItem(request, { title: 'Unsorted item', projectId: board.project.id });
  const expandedId = await mergeRange(request, board.board, board.todo.id, board.doing.id, 'expanded');
  const [a, b] = await addWorkphases(request, board.workflow.id, ['Broken start', 'Broken end']);
  await seedColumn(request, board.workflow.id, a.id, b.id);
  await reorderWorkphases(
    request,
    [board.todo, board.doing, board.review, board.done, b, a].map((phase, position) => ({ id: phase.id, position })),
  );
  return { unsorted, expandedId };
}

export async function targetRoot(request: APIRequestContext, board: TargetBoard, title: string, phase = board.todo.id) {
  const row = await seedItem(request, { title, projectId: board.project.id, workphaseId: phase });
  expect(await fetchItem(request, row.id)).toMatchObject({
    projectId: board.project.id,
    parentId: null,
    isAttached: 0,
    workphaseId: phase,
  });
  return row;
}

export async function modalTargets(request: APIRequestContext, name: string, heightOffset = 6) {
  const board = await targetBoard(request, name);
  const p = await targetRoot(request, board, 'P');
  const [a, q, r, r1, mid, low] = await targetChain(request, p, 6, 'P row ');
  const tail = await targetChild(request, q, 'Tail');
  const x = await targetRoot(request, board, 'X');
  const height = board.cap - heightOffset;
  expect(height, 'the fixture leaves room for the Free-linked branch').toBeGreaterThanOrEqual(5);
  const branch = await targetChain(request, x, height, 'X branch ');
  const d = await seedItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: board.todo.id });
  const freeBranch = await targetChain(request, d, 4, 'D row ');
  return { ...board, p, a, q, r, r1, mid, low, tail, x, height, branch, d, freeBranch };
}

// Reads painted adjacency to aim at a requested Card; the caller asserts the named relation separately.
export async function nameTargetNeighbor(page: Page, carried: SeededItem, target: SeededItem) {
  const point = await center(itemRow(page, target.id));
  await hoverTo(page, point);
  const ghost = await paintedBoxOf(itemRow(page, carried.id));
  const neighbor = await paintedBoxOf(itemRow(page, target.id));
  await leanAtGhost(page, itemRow(page, carried.id), point, neighbor.y < ghost.y ? 'up' : 'down');
  await expect.poll(() => dropLineOn(page)).toMatchObject({ row: target.id });
  return (await dropLineOn(page))!;
}

export async function targetChild(request: APIRequestContext, parent: SeededItem, title: string) {
  const row = await seedItem(request, { title, parentId: parent.id });
  expect(await fetchItem(request, row.id)).toMatchObject({
    parentId: parent.id,
    isAttached: 1,
    workphaseId: parent.workphaseId,
  });
  return row;
}

export async function targetChain(request: APIRequestContext, root: SeededItem, count: number, prefix: string) {
  const rows: SeededItem[] = [];
  let parent = root;
  for (let level = 1; level <= count; level++) {
    const row = await targetChild(request, parent, `${prefix}${level}`);
    rows.push(row);
    parent = row;
  }
  return rows;
}

// A Free Card's real parent chain is checked through the API before a pickup uses its depth.
export async function freeTargetAtDepth(request: APIRequestContext, board: TargetBoard, title: string, depth: number) {
  expect(depth).toBeGreaterThanOrEqual(1);
  if (depth === 1) {
    const row = await targetRoot(request, board, title);
    return { row, ancestors: [] as SeededItem[] };
  }
  const root = await targetRoot(request, board, `${title} ancestor 1`);
  expect(await fetchItem(request, root.id)).toMatchObject({ parentId: null, isAttached: 0 });
  const ancestors = [root, ...(await targetChain(request, root, depth - 2, `${title} ancestor `))];
  const parent = ancestors[ancestors.length - 1];
  const row = await seedItem(request, {
    title,
    parentId: parent.id,
    isAttached: false,
    workphaseId: board.todo.id,
  });
  expect(await fetchItem(request, row.id)).toMatchObject({ parentId: parent.id, isAttached: 0 });
  expect(ancestors).toHaveLength(depth - 1);
  return { row, ancestors };
}

export async function openTargets(
  page: Page,
  sidebar: ProjectSidebarPage,
  board: TargetBoard,
  overrides: Partial<DragTuning> = {},
) {
  const tuning = await seedDragTuning(page, { ...NO_POP, sectionLevels: board.cap, ...overrides });
  await sidebar.openBoard(board.name);
  await expect(dragRegion(page)).toBeVisible();
  await expect(page.locator('[data-drop-tier]')).toHaveCount(0);
  return tuning;
}

// Reads the app's legality and tier attributes on the active representation, never painted opacity.
export async function expectTarget(scope: Page | Locator, row: SeededItem, state: TargetState, tier?: TargetTier) {
  await expect(itemRow(scope, row.id)).toBeVisible();
  await expect(itemRow(scope, row.id)).toHaveAttribute('data-drop-state', state);
  if (tier) await expect(itemRow(scope, row.id)).toHaveAttribute('data-drop-tier', tier);
}

// Reads whole API item responses, including fields a refused write must leave unchanged.
export async function savedTargetRows(request: APIRequestContext, rows: readonly SeededItem[]) {
  const saved: SeededItem[] = [];
  for (const row of rows) saved.push(await fetchItem(request, row.id));
  return saved;
}

// Restores the same IDs through checked setup writes and position pins, then reads every row back.
export async function restoreTargetRows(request: APIRequestContext, baseline: readonly SeededItem[]) {
  for (const row of baseline) {
    const current = await fetchItem(request, row.id);
    if (
      current.parentId !== row.parentId ||
      current.isAttached !== row.isAttached ||
      current.workphaseId !== row.workphaseId
    ) {
      await moveItem(request, row.id, {
        parentId: row.parentId,
        isAttached: row.isAttached === 1,
        ...(row.isAttached ? {} : { workphaseId: row.workphaseId }),
      });
    }
  }
  for (const row of baseline) if (row.position !== null) await pinItemPosition(request, row.id, row.position);
  for (const row of baseline) {
    expect(await fetchItem(request, row.id)).toMatchObject({
      id: row.id,
      parentId: row.parentId,
      isAttached: row.isAttached,
      workphaseId: row.workphaseId,
      position: row.position,
    });
  }
}

// Samples app attributes/DOM assertions throughout a configured opportunity for an unwanted hold.
// It asserts absence, not a particular clock duration or the appearance of a progress animation.
export async function observeTargetAbsence(page: Page, budget: number, observe: () => Promise<void>) {
  const until = Date.now() + budget;
  do {
    await observe();
    await page.waitForTimeout(40);
  } while (Date.now() < until);
  await observe();
}

// Moves an already-live drag into the named Card and reads the app's context attribute.
export async function zoomTarget(page: Page, card: SeededItem, tuning: DragTuning) {
  await hoverTo(page, await center(itemRow(page, card.id).getByText(card.title, { exact: true })));
  await hoverTo(page, await center(itemRow(page, card.id).getByText(card.title, { exact: true })));
  await expect.poll(() => dropLineOn(page)).toMatchObject({ row: card.id });
  await awaitDragContext(
    page,
    descendantsRegionKey(card.id),
    clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
  );
}

// Reaches an attachment preview by the live drag surface; the caller controls the write's gate.
export async function previewTargetAttach(
  page: Page,
  item: SeededItem,
  target: SeededItem,
  columnKey: string,
  tuning: DragTuning,
  sourceCard?: SeededItem,
) {
  await pickUp(
    page,
    sourceCard ? itemRow(page, item.id).getByRole('button', { name: item.title, exact: true }) : itemRow(page, item.id),
  );
  if (sourceCard) {
    await hoverTo(page, await center(itemRow(page, target.id)));
    await awaitDragContext(page, columnKey, clocksMargin(tuning.popDelayMs));
  }
  await zoomTarget(page, target, tuning);
  await release(page);
}

// Reaches a Free preview by popping a Stub into its column before releasing beside another Card.
export async function previewTargetDetach(
  page: Page,
  item: SeededItem,
  neighbor: SeededItem,
  columnKey: string,
  tuning: DragTuning,
) {
  await pickUp(page, itemRow(page, item.id).getByRole('button', { name: item.title, exact: true }));
  await hoverTo(page, await center(itemRow(page, neighbor.id)));
  await awaitDragContext(page, columnKey, clocksMargin(tuning.popDelayMs));
  await release(page);
}

// Aims the live ghost beside a rendered overflow control, then observes the actual modal/context.
export async function openTargetModal(
  page: Page,
  carried: SeededItem,
  card: SeededItem,
  owner: SeededItem,
  levels: number,
  tuning: DragTuning,
) {
  await aimTargetOverflow(page, carried, owner, levels);
  const modal = hierarchyModal(page, card.title);
  await expect(modal).toBeVisible({ timeout: clocksMargin(tuning.modalHoldDwellMs, tuning.modalHoldCueMs) });
  await awaitDragContext(page, descendantsRegionKey(card.id));
  return modal;
}

// Uses the ghost's current screen position and the overflow control's screen position to aim a hold.
export async function aimTargetOverflow(page: Page, carried: SeededItem, owner: SeededItem, levels: number) {
  const from = await center(itemRow(page, carried.id));
  for (let pass = 0; pass < 2; pass++) {
    const target = await topQuarter(overflowRow(page, owner.id));
    await tabBy(page, { x: from.x, y: target.y }, levels);
  }
}
