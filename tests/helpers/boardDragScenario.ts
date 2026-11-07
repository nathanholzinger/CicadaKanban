import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { resetAndSeedDb } from './db';
import {
  seedTemplatedWorkflow,
  pickWorkphases,
  seedPositionedItems,
  fetchDefaultBoard,
  deleteColumn,
  updateColumn,
  type SeededColumn,
} from './seed';
import { boxOf, center, hoverTo, dragMachine, clocksMargin, type Point } from './dragGesture';
import { column, dragRegion } from './boardLocators';
import type { DragTuning } from '../../client/src/components/workflow/dragTuning';
import { columnRegionKey } from '../../client/src/components/workflow/dragRegions';

// Shared board fixtures and band aims. Band geometry is read from the rendered
// carve-outs, and the final aim waits for the drag machine to name that band.

const PROJECT = 'Drag Bands Project';
// `cardPopInDelayMs` is a separate clock from `popInDelayMs`: it fires from
// hovering one of the *locked* context's own Cards, so a case here that
// briefly hovers a sibling card in-context right before releasing
// (DRAG-1.3, DRAG-3.4, DRAG-6.5) is exposed to it too, even though none of
// these is about attaching at all — every preset
// (tests/helpers/dragGesture.ts) keeps it absurdly high for the same reason
// `popDelayMs`/`popInDelayMs` are in `NO_POP`, so a slow run can't pop by
// accident.
// Enough for both clocks to run out while the cursor rests: pop out, then in.
export const popThrough = (tuning: DragTuning) => clocksMargin(tuning.popDelayMs, tuning.popInDelayMs);

export interface Scenario {
  projectId: string;
  workflow: { id: string };
  boardId: string;
  columns: SeededColumn[];
  phase: Record<'todo' | 'inProgress' | 'review' | 'done', { id: string; name: string }>;
  items: Record<'X' | 'A' | 'B' | 'C', { id: string }>;
}

// Flow workflow (Todo / In Progress / Review / Done) on its 1:1 default
// board. X in Todo at 2.5; A, B, C in In Progress at 1, 2, 3 — so a
// workphase-only move of X lands it *between* B and C by its kept position,
// which is what tells the middle band apart from either edge band.
export async function seed(request: APIRequestContext): Promise<Scenario> {
  await resetAndSeedDb();
  const { project, workflow } = await seedTemplatedWorkflow(request, PROJECT);
  const [todo, inProgress, review, done] = pickWorkphases(workflow, 'Todo', 'In Progress', 'Review', 'Done');
  const board = await fetchDefaultBoard(request, workflow.id);
  const items = await seedPositionedItems(request, [
    { key: 'A', projectId: project.id, workphaseId: inProgress.id, position: 1 },
    { key: 'B', projectId: project.id, workphaseId: inProgress.id, position: 2 },
    { key: 'X', projectId: project.id, workphaseId: todo.id, position: 2.5 },
    { key: 'C', projectId: project.id, workphaseId: inProgress.id, position: 3 },
  ]);
  return {
    projectId: project.id,
    workflow,
    boardId: board.id,
    columns: board.columns,
    phase: { todo, inProgress, review, done },
    items,
  };
}

// In Progress and Review folded into one column (merged, or expanded into
// two sub-rows), with Y seeded into Review at 5 — the fixture DRAG-3.6,
// DRAG-3.7, DRAG-3.8 and DRAG-1.6 share. Returns the surviving column and Y.
export async function foldReviewIntoInProgress(
  request: APIRequestContext,
  s: Scenario,
  displayMode: 'merged' | 'expanded',
): Promise<{ col: Scenario['columns'][number]; y: { id: string } }> {
  const col = s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!;
  const reviewCol = s.columns.find(c => c.entryWorkphaseId === s.phase.review.id)!;
  await deleteColumn(request, reviewCol.id);
  await updateColumn(request, col.id, {
    startWorkphaseId: s.phase.inProgress.id,
    endWorkphaseId: s.phase.review.id,
    displayMode,
  });
  const { Y: y } = await seedPositionedItems(request, [
    { key: 'Y', projectId: s.projectId, workphaseId: s.phase.review.id, position: 5 },
  ]);
  return { col, y };
}

export async function openBoard(page: Page, projectSidebar: { openBoard: (name: string) => Promise<void> }) {
  await projectSidebar.openBoard(PROJECT);
  await expect(page.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
}

// The region key the board root reports for a column (`data-drag-context`),
// spelled by the client's own key builder rather than re-typed here.
export function columnKeyOf(s: Scenario, workphaseId: string): string {
  return columnRegionKey(s.columns.find(c => c.entryWorkphaseId === workphaseId)!.id);
}

// A band is content-anchored pixels (`dragBands.ts::bandFor`), sized by the
// shortCard's own fixed height and the card lists' shared gap (neither is a
// tunable) and the region's own card count/terminal-ness — never a fraction
// of the region's height — so a band is targeted by locating the carve-out
// that marks it (`BandGuides.tsx::DragCarveFrame`), never by recomputing
// that arithmetic here. A carve-out only exists while this
// region *isn't* the live hover target, which every case below arranges by
// construction (it measures the point before moving there).
//
// Popping out grows *every* region on the board at once (each reserves its
// own carve-out the instant Board layer is reached), and in an expanded
// column that simultaneous, board-wide reflow can be enough to trip
// dnd-kit's own auto-scroll of the shared sub-row body — animated, so a
// box measured mid-scroll is stale before the mouse ever gets there.
// `stableBoxOf` waits for a locator's own box to stop moving before an
// exact carve-out point trusts it.
export async function stableBoxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  let previous = await boxOf(locator);
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 100));
    const current = await boxOf(locator);
    if (Math.abs(current.y - previous.y) < 0.5 && Math.abs(current.height - previous.height) < 0.5) return current;
    previous = current;
  }
  return previous;
}
export async function stableCenter(locator: Locator): Promise<Point> {
  const box = await stableBoxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
export function carveZone(region: Locator, edge: 'top' | 'bottom' | 'single'): Locator {
  return region.locator(`[data-carve-zone="${edge}"]`);
}
export function carveDivider(region: Locator, edge: 'top' | 'bottom'): Locator {
  return region.locator(`[data-carve-divider="${edge}"]`);
}

// Landing on the top/bottom carve-out itself makes *this* region the live
// hover target, which is exactly what collapses that carve-out (a real
// ghost takes the reservation over) — pulling the rest of the region's
// content up to fill the space the two dead zones held, and (in
// an expanded column) possibly nudging a sibling sub-row's own scroll
// position too. A point aimed at the dead zone's own (pre-collapse)
// center, or even at the post-collapse divider, can still land in the
// wrong band once all of that has actually settled — dnd-kit's own
// sortable animation alone takes a real ~200ms, and nothing here can be
// sure every one of these has finished just by waiting a guessed margin.
// So this doesn't guess: it hovers roughly toward the edge, then reads the
// machine's own verdict (`data-drag-band`, set from `pop.hover.band`) and
// nudges further the same direction, a real re-sample each time, until
// the machine itself agrees — the one source that's always right about
// what a release right now would actually commit.
export async function settleOnBand(page: Page, region: Locator, edge: 'top' | 'bottom'): Promise<void> {
  const rough = await stableCenter(carveZone(region, edge));
  await hoverTo(page, rough);
  let point = rough;
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await dragMachine(page).getAttribute('data-drag-band')) === edge) return;
    const box = await boxOf(region);
    const step = edge === 'top' ? -8 : 8;
    point = { x: point.x, y: Math.max(box.y + 2, Math.min(box.y + box.height - 2, point.y + step)) };
    await hoverTo(page, point);
  }
  throw new Error(`never settled on the "${edge}" band`);
}
export async function settleOnTopBand(page: Page, region: Locator): Promise<void> {
  return settleOnBand(page, region, 'top');
}
export async function settleOnBottomBand(page: Page, region: Locator): Promise<void> {
  return settleOnBand(page, region, 'bottom');
}
// The single band a terminal or truly-empty region collapses to — any
// point in it is a workphase-only move, whatever the fixture's tuning.
// Unlike the top/bottom carve-outs, landing here doesn't shrink the
// region out from under itself (dragBands.ts::bandFor never gives it a
// boundary to collapse toward — it's always one band, whatever's inside).
export async function singleBandPoint(region: Locator): Promise<Point> {
  return stableCenter(carveZone(region, 'single'));
}
// The exact pixel the top/bottom band boundary sits at — for a case that
// (unlike settleOnBand above) is already resting inside the region when
// it calls this, so hovering there has already forced the collapse this
// reads the settled result of.
export async function bandDivider(region: Locator, edge: 'top' | 'bottom'): Promise<Point> {
  const box = await stableBoxOf(carveDivider(region, edge));
  return { x: box.x + box.width / 2, y: box.y };
}

// A point in In Progress's own middle band — used as the *first* move from
// a different locked origin (DRAG-3.4, and DRAG-1.5's "locked to each context in turn"),
// before the drag has necessarily reached Board layer at all, so it can't
// read the carve-out or the divider off (neither renders until then). The
// region's own dead center is a safe stand-in instead: with this fixture's
// 3 small cards, half its total height (carve-outs and all) falls nowhere
// near either edge. Once the drag is actually at Board layer and past THRESHOLD, the
// callers below re-read the machine's own state rather than trusting this
// point further.
export async function middleGapPoint(page: Page): Promise<Point> {
  return center(dragRegion(column(page, 'In Progress')));
}
