import type { APIRequestContext, Locator, Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases, seedPositionedItems, fetchDefaultBoard } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  center,
  topQuarter,
  bottomQuarter,
  boxOf,
  gapBetween,
  awaitDragState,
  awaitDragContext,
  type Point,
} from '../helpers/dragGesture';
import { columnOrder, fullOrder } from '../helpers/itemRepositioningScenario';
import { DEFAULT_DRAG_TUNING, DRAG_TUNING_STORAGE_KEY, type DragTuning } from '../../client/src/components/workflow/dragTuning';
import { DRAG_REGION_ATTR, columnRegionKey, subrowRegionKey } from '../../client/src/components/workflow/dragRegions';

// Epic 3.5 Story 3 — docs/wiki/board-drag-interaction §1–§3 (contexts and
// popping), §5 (Card → column drop bands), §10 (ordinal preview and
// reconciliation). Cases from docs/test-plans/board-drag-interaction/
// drag-1-contexts-and-popping.md, drag-3-card-column-bands.md and
// drag-6-preview-reconciliation.md.
//
// Every threshold and band is the *configured* value: each case seeds the
// dev/test panel's storage key before the page loads and reads the numbers
// back from that same object — never a literal 0.5 s or 20%. Momentary cases
// seed a delay far longer than a Playwright hover so a slow run can't pop by
// accident; sustained cases seed a short one and wait explicitly past it.
//
// Feel — the clamp, the snap, the ghost's look — is manual by design
// (epic-3-5-decisions.md Q1); these assert resolution and end state.

const PROJECT = 'Drag Bands Project';
// `cardPopInDelayMs` (Story 4, re-plan 2026-09-16) is a separate clock from
// `popInDelayMs`: it fires from hovering one of the *locked* context's own
// Cards, so a case here that briefly hovers a sibling card in-context right
// before releasing (DRAG-1.3, DRAG-3.4, DRAG-6.5) is exposed to it too, even
// though none of these predate Story 4 or are about attaching at all — kept
// absurdly high across every preset below for the same reason `popDelayMs`/
// `popInDelayMs` are in MOMENTARY, so a slow run can't pop by accident.
const NO_CARD_POP = { cardPopInDelayMs: 30_000 };
const MOMENTARY: Partial<DragTuning> = { popDelayMs: 30_000, popInDelayMs: 30_000, ...NO_CARD_POP };
const SUSTAINED: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: 150, ...NO_CARD_POP };
// Re-plan (2026-09-16): a band only ever means anything at Board layer —
// locked always commits its own context, regardless of a foreign hover
// (docs/wiki/board-drag-interaction §1–§3, re-planned). So every band case
// below needs to actually *reach* Board layer first: a short pop-out delay,
// paired with a pop-in delay long enough that resting in the target's own
// middle band (which is also its pop-eligible zone) never completes the
// second pop before the test releases.
const POP_OUT_ONLY: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: 30_000, ...NO_CARD_POP };
// Enough for both clocks to run out while the cursor rests: pop out, then in.
const popThrough = (tuning: DragTuning) => tuning.popDelayMs + tuning.popInDelayMs + 300;

// Four columns plus the sidebar overflow the default 1280px viewport, and a
// band point measured in a column that is partly off-screen depends on
// dnd-kit's auto-scroll having kicked in — timing, not behavior. Wide
// enough that every column is fully on screen.
test.use({ viewport: { width: 1600, height: 900 } });

interface Scenario {
  projectId: string;
  workflow: { id: string };
  boardId: string;
  columns: Array<{ id: string; entryWorkphaseId: string; displayName: string }>;
  phase: Record<'todo' | 'inProgress' | 'review' | 'done', { id: string; name: string }>;
  items: Record<'X' | 'A' | 'B' | 'C', { id: string }>;
}

// Flow workflow (Todo / In Progress / Review / Done) on its 1:1 default
// board. X in Todo at 2.5; A, B, C in In Progress at 1, 2, 3 — so a
// workphase-only move of X lands it *between* B and C by its kept position,
// which is what tells the middle band apart from either edge band.
async function seed(request: APIRequestContext): Promise<Scenario> {
  await request.post(`${API}/test/reset`);
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
// two sub-rows), with Y seeded into Review at 5 — the fixture DRAG-3.6/3.7
// and DRAG-3.8/1.6 share. Returns the surviving column and Y.
async function foldReviewIntoInProgress(
  request: APIRequestContext,
  s: Scenario,
  displayMode: 'merged' | 'expanded',
): Promise<{ col: Scenario['columns'][number]; y: { id: string } }> {
  const col = s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!;
  const reviewCol = s.columns.find(c => c.entryWorkphaseId === s.phase.review.id)!;
  await request.delete(`${API}/columns/${reviewCol.id}`);
  await request.put(`${API}/columns/${col.id}`, {
    data: { startWorkphaseId: s.phase.inProgress.id, endWorkphaseId: s.phase.review.id, displayMode },
  });
  const { Y: y } = await seedPositionedItems(request, [
    { key: 'Y', projectId: s.projectId, workphaseId: s.phase.review.id, position: 5 },
  ]);
  return { col, y };
}

async function seedTuning(page: Page, override: Partial<DragTuning>): Promise<DragTuning> {
  const tuning = { ...DEFAULT_DRAG_TUNING, ...override };
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [DRAG_TUNING_STORAGE_KEY, JSON.stringify(tuning)] as const,
  );
  return tuning;
}

async function openBoard(page: Page, projectSidebar: { openBoard: (name: string) => Promise<void> }) {
  await projectSidebar.openBoard(PROJECT);
  await expect(page.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
}

// Waits for the drag to actually reach Board layer at wherever it's
// currently hovering — a band only ever resolves a release from there
// (re-plan 2026-09-16). The cursor doesn't have to move again: the pop
// timer fires on its own once `tuning.popDelayMs` has elapsed.
async function popOutFully(page: Page, tuning: DragTuning) {
  await awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000);
}

function column(page: Page, name: string): Locator {
  return page.getByRole('group', { name, exact: true });
}

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true });
}

// The region key the board root reports for a column (`data-drag-context`),
// spelled by the client's own key builder rather than re-typed here.
function columnKeyOf(s: Scenario, workphaseId: string): string {
  return columnRegionKey(s.columns.find(c => c.entryWorkphaseId === workphaseId)!.id);
}

// Story 8 re-plan (2026-09-16): a band is content-anchored pixels now
// (dragRegions.ts::bandFor), sized by the configured `ghostCardHeightPx`
// and the region's own card count/terminal-ness — never a fraction of the
// region's height — so a band is targeted by locating the carve-out that
// marks it (BandGuides.tsx's `DragCarveFrame`), never by recomputing that
// arithmetic here. A carve-out only exists while this region *isn't* the
// live hover target, which every case below arranges by construction (it
// measures the point before moving there).
//
// Popping out grows *every* region on the board at once (each reserves its
// own carve-out the instant Board layer is reached), and in an expanded
// column that simultaneous, board-wide reflow can be enough to trip
// dnd-kit's own auto-scroll of the shared sub-row body — animated, so a
// box measured mid-scroll is stale before the mouse ever gets there.
// `stableBoxOf` waits for a locator's own box to stop moving before an
// exact carve-out point trusts it.
async function stableBoxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  let previous = await boxOf(locator);
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 100));
    const current = await boxOf(locator);
    if (Math.abs(current.y - previous.y) < 0.5 && Math.abs(current.height - previous.height) < 0.5) return current;
    previous = current;
  }
  return previous;
}
async function stableCenter(locator: Locator): Promise<Point> {
  const box = await stableBoxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
function carveZone(region: Locator, edge: 'top' | 'bottom' | 'single'): Locator {
  return region.locator(`[data-carve-zone="${edge}"]`);
}
function carveDivider(region: Locator, edge: 'top' | 'bottom'): Locator {
  return region.locator(`[data-carve-divider="${edge}"]`);
}

// Landing on the top/bottom carve-out itself makes *this* region the live
// hover target, which is exactly what collapses that carve-out (Story 8:
// a real ghost takes the reservation over) — pulling the rest of the
// region's content up to fill the space the two dead zones held, and (in
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
async function settleOnBand(page: Page, region: Locator, edge: 'top' | 'bottom'): Promise<void> {
  const rough = await stableCenter(carveZone(region, edge));
  await hoverTo(page, rough);
  let point = rough;
  const bandAttr = page.locator('[data-drag-state]');
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await bandAttr.getAttribute('data-drag-band')) === edge) return;
    const box = await boxOf(region);
    const step = edge === 'top' ? -8 : 8;
    point = { x: point.x, y: Math.max(box.y + 2, Math.min(box.y + box.height - 2, point.y + step)) };
    await hoverTo(page, point);
  }
  throw new Error(`never settled on the "${edge}" band`);
}
async function settleOnTopBand(page: Page, region: Locator): Promise<void> {
  return settleOnBand(page, region, 'top');
}
async function settleOnBottomBand(page: Page, region: Locator): Promise<void> {
  return settleOnBand(page, region, 'bottom');
}
// The single band a terminal or truly-empty region collapses to — any
// point in it is a workphase-only move, whatever the fixture's tuning.
// Unlike the top/bottom carve-outs, landing here doesn't shrink the
// region out from under itself (dragRegions.ts::bandFor never gives it a
// boundary to collapse toward — it's always one band, whatever's inside).
async function singleBandPoint(region: Locator): Promise<Point> {
  return stableCenter(carveZone(region, 'single'));
}
// The exact pixel the top/bottom band boundary sits at — for a case that
// (unlike settleOnBand above) is already resting inside the region when
// it calls this, so hovering there has already forced the collapse this
// reads the settled result of.
async function bandDivider(region: Locator, edge: 'top' | 'bottom'): Promise<Point> {
  const box = await stableBoxOf(carveDivider(region, edge));
  return { x: box.x + box.width / 2, y: box.y };
}

// A point in In Progress's own middle band — used as the *first* move from
// a different locked origin (DRAG-3.4, "locked to each context in turn"),
// before the drag has necessarily reached Board layer at all, so it can't
// read the carve-out or the divider off (Story 8: neither renders until
// then). The region's own dead center is a safe stand-in instead: with
// this fixture's 3 small cards, half its total height (carve-outs and all)
// falls nowhere near either edge whatever `ghostCardHeightPx` is configured
// to. Once the drag is actually at Board layer and past THRESHOLD, the
// callers below re-read the machine's own state rather than trusting this
// point further.
async function middleGapPoint(page: Page): Promise<Point> {
  return center(regionOf(column(page, 'In Progress')));
}

function regionOf(col: Locator): Locator {
  return col.locator(`[${DRAG_REGION_ATTR}]`).first();
}

async function item(request: APIRequestContext, id: string) {
  return (await request.get(`${API}/items/${id}`)).json();
}

async function titlesIn(col: Locator): Promise<string[]> {
  return col.getByRole('article').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''));
}

test.describe('Card → column drop bands', () => {
  test('DRAG-3.1 / 3.2: the top band places before the first item, the bottom band after the last (DRAG-3.5: at the configured carve-outs)', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo; a band only resolves a release once the drag
    // has actually reached Board layer (re-plan 2026-09-16) — and In
    // Progress's own carve-out (Story 8) only renders there too, so it has
    // to pop out first before reading the top one off, then land squarely
    // inside it.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await popOutFully(page, tuning);
    await settleOnTopBand(page, regionOf(inProgress));
    // The live ghost previews X first, in the hovered column's own list —
    // Story 8's replacement for the retired tinted band highlight.
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item X', 'Item A', 'Item B', 'Item C']);
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('XABC');
    let x = await item(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.inProgress.id);
    expect(x.position).toBeLessThan(1);

    // Back to Todo, then squarely inside the bottom carve-out.
    await request.patch(`${API}/items/${x.id}/move`, { data: { workphaseId: s.phase.todo.id, position: 2.5 } });
    await openBoard(page, projectSidebar);
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await popOutFully(page, tuning);
    await settleOnBottomBand(page, regionOf(inProgress));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
    x = await item(request, s.items.X.id);
    expect(x.position).toBeGreaterThan(3);
  });

  test('DRAG-3.3 / DRAG-1.3 (momentary): the middle band released before THRESHOLD is a workphase-only move — position kept, the hovered card ignored', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo — pop out to Board layer first (re-plan
    // 2026-09-16); a bare hover on In Progress never previews anything
    // while still locked elsewhere (rule 1), only once genuinely there.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await center(regionOf(inProgress)));
    await popOutFully(page, tuning);
    // The ghost now shows X where its kept position falls (DRAG-3.11).
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item X', 'Item C']);

    // Release squarely over a card that sits in the middle band, before
    // popInDelayMs (seeded absurdly high) could ever complete a pop-in.
    // Under a pop that would anchor against it; without one it's the
    // band's meaning, and the card under the cursor is ignored. The middle
    // band's own bounds come from the divider lines themselves (Story 8
    // re-plan) — content-anchored pixels, not a fraction of the region.
    const region = regionOf(inProgress);
    const middle = { from: (await bandDivider(region, 'top')).y, to: (await bandDivider(region, 'bottom')).y };
    let hovered: string | null = null;
    for (const title of ['Item A', 'Item B', 'Item C']) {
      const p = await center(article(page, title));
      if (p.y > middle.from + 10 && p.y < middle.to - 10) {
        hovered = title;
        await hoverTo(page, p);
        break;
      }
    }
    expect(hovered, 'fixture: some card must sit in the middle band').not.toBeNull();
    await awaitDragState(page, 'popped-out');
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
    expect((await item(request, s.items.X.id)).position).toBe(2.5);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABXC');
  });

  test('DRAG-3.4 / DRAG-1.3 (sustained) / DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');
    const contextKey = columnKeyOf(s, s.phase.inProgress.id);

    await pickUp(page, article(page, 'Item X'));
    await awaitDragState(page, 'locked');
    await hoverTo(page, await middleGapPoint(page));

    // Popped in (out first, then in — both clocks run while the cursor
    // rests): the context is now In Progress, and the card is locked to
    // *it* (§3).
    await awaitDragContext(page, contextKey, popThrough(tuning));
    await awaitDragState(page, 'locked');

    // In-context now: the hovered card decides, not the band (DRAG-1.5).
    await hoverTo(page, await bottomQuarter(article(page, 'Item A')));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('AXBC');
    expect((await item(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('popping out: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');
    const todoKey = columnKeyOf(s, s.phase.todo.id);

    // Rest in the gap between Todo and In Progress — outside the context,
    // over no region at all.
    await pickUp(page, article(page, 'Item X'));
    await awaitDragContext(page, todoKey);
    await hoverTo(page, await gapBetween(todo, inProgress));

    // Popped out: no context, not locked, and the card is still drawn where it was.
    await awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000);
    await awaitDragContext(page, null);
    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();

    // A release over nothing while popped out writes nothing …
    // (asserted separately below); here, come back and rest in Todo's middle
    // band: the card pops back into the column it left.
    await hoverTo(page, await center(regionOf(todo)));
    await awaitDragContext(page, todoKey, tuning.popInDelayMs + 2000);
    await awaitDragState(page, 'locked');
    await release(page);

    // In-context release in Todo, X the only card: nothing to reorder against.
    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    const x = await item(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.todo.id);
  });

  test('popped out, a release in a column is still that column\'s band', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, { popDelayMs: 150, popInDelayMs: 30_000 });
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000);

    // Popped out, over In Progress's bottom band: after the last item.
    await settleOnBottomBand(page, regionOf(inProgress));
    await awaitDragState(page, 'popped-out');
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
  });

  test('a card is locked to each context it pops into in turn — In Progress, then Review', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);

    const inProgress = column(page, 'In Progress');
    const review = column(page, 'Review');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await middleGapPoint(page));
    await awaitDragContext(page, columnKeyOf(s, s.phase.inProgress.id), popThrough(tuning));
    await awaitDragState(page, 'locked');

    // From In Progress, on to Review (empty): out, then in, again. Review's
    // own carve-out (Story 8) only renders at Board layer, so pop out of
    // In Progress — via the gap, never Review's own bounds directly — before
    // reading it off.
    await hoverTo(page, await gapBetween(inProgress, review));
    await popOutFully(page, tuning);
    await hoverTo(page, await singleBandPoint(regionOf(review)));
    await awaitDragContext(page, columnKeyOf(s, s.phase.review.id), popThrough(tuning));
    await awaitDragState(page, 'locked');
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);
    expect((await item(request, s.items.X.id)).position).toBe(2.5);
  });

  test('DRAG-1.3 (momentary): brushing across another column while reordering never leaves the context', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);

    // A reorder inside In Progress that wanders over Todo on the way.
    await pickUp(page, article(page, 'Item C'));
    await hoverTo(page, await center(column(page, 'Todo')));
    await hoverTo(page, await topQuarter(article(page, 'Item A')));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('CAB');
    expect((await item(request, s.items.C.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('Board layer, a release between columns or over Unsorted writes nothing and leaves the card where it was', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // Re-plan 2026-09-16: this is only a genuine no-op once the drag has
    // actually reached Board layer — while still locked to Todo, a release
    // anywhere (the gap included) would commit Todo's own within-action
    // instead (covered by the "in another region" unit-level cases; not
    // reachable through this same gesture, since popping out is what a
    // sustained move away from Todo *means*).
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await center(regionOf(inProgress)));
    await popOutFully(page, tuning);
    await expect(inProgress.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    // The gap between the two columns — nowhere, Board layer's own no-op.
    await hoverTo(page, await gapBetween(todo, inProgress));
    await release(page);

    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    await expect(page.locator('[data-pending]')).toHaveCount(0);
    const x = await item(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.todo.id);
    expect(x.position).toBe(2.5);
  });

  test('DRAG-3.6 / 3.7: a merged column takes the entry workphase for an outsider and leaves a covered-set member alone', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    // Long enough that a hover on the way somewhere can't pop out, short
    // enough to hold past deliberately; popping back in is not wanted here.
    const tuning = await seedTuning(page, { popDelayMs: 1000, popInDelayMs: 30_000 });
    // In Progress + Review merged into one column; Y sits in Review (non-entry).
    const { y } = await foldReviewIntoInProgress(request, s, 'merged');
    await openBoard(page, projectSidebar);
    const merged = page.getByRole('group', { name: /In Progress/ }).first();
    const todo = column(page, 'Todo');

    // DRAG-3.7 — Y is a member of the merged column, so the column is its
    // own context and a band drop there is only reachable *after* leaving:
    // pop out over Todo, come back to the merged column's top band, release.
    // A reorder before A; Y stays in Review, not the entry workphase.
    await pickUp(page, article(page, 'Item Y'));
    await hoverTo(page, await center(regionOf(todo)));
    await awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000);
    await settleOnTopBand(page, regionOf(merged));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('YABXC');
    expect((await item(request, y.id)).workphaseId).toBe(s.phase.review.id);

    // DRAG-3.6 — X (an outsider, in Todo) to the top band: the entry
    // workphase. X starts locked to Todo, so this also has to pop out to
    // Board layer first — merged's own carve-out (Story 8) only renders
    // there too — before reading the top one off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, merged));
    await popOutFully(page, tuning);
    await settleOnTopBand(page, regionOf(merged));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('XYABC');
    expect((await item(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('DRAG-3.8 / DRAG-1.6: an expanded column resolves per sub-row — exact workphase, first/last of that sub-row', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    const { col } = await foldReviewIntoInProgress(request, s, 'expanded');
    await openBoard(page, projectSidebar);
    const reviewRow = page.locator(`[${DRAG_REGION_ATTR}="${subrowRegionKey(col.id, s.phase.review.id)}"]`);

    // X from Todo into the Review sub-row's top band: before Y, exactly
    // Review. X starts locked to Todo, so it also has to pop out to Board
    // layer first — reviewRow's own carve-out (Story 8) only renders there,
    // and only once reviewRow itself isn't already the live hover target —
    // so the approach reaches Board layer *before* reading it off, via a
    // point in the gap left of the column, at the row's own height (going
    // straight in would cross the In Progress sub-row first, inserting the
    // ghost there and pushing Review down under the pointer).
    await pickUp(page, article(page, 'Item X'));
    const rowMid = await center(reviewRow);
    await hoverTo(page, { x: (await boxOf(reviewRow)).x - 16, y: rowMid.y });
    await popOutFully(page, tuning);
    await settleOnTopBand(page, reviewRow);
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABCXY');
    expect((await item(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);

    // DRAG-1.6: from the In Progress sub-row, a release in the sibling
    // Review sub-row (once popped fully out of In Progress's own sub-row)
    // is that sub-row's band — a real workphase change. Same reasoning:
    // reach Board layer via the gap (never reviewRow's own bounds, or its
    // carve-out would already be reading as the live hover target once
    // reviewRow itself is the sole thing not `!hoveredHere`) before reading
    // its bottom carve-out off.
    await pickUp(page, article(page, 'Item C'));
    // Re-measured, not the same `rowMid` as above — Review now holds X
    // too, so its region is taller than when that was first read.
    const rowMidNow = await center(reviewRow);
    await hoverTo(page, { x: (await boxOf(reviewRow)).x - 16, y: rowMidNow.y });
    await popOutFully(page, tuning);
    // Popping out grows In Progress's own carve-out too (every region
    // does, simultaneously), and in this expanded column both sub-rows
    // share one scroll body — tall enough now that Review's bottom
    // carve-out can scroll out of the body's own visible box (wiki §5:
    // scrolled out of view is scrolled out of reach) even though it's
    // still fully in the fixture. Scroll it into view before reading the
    // point off, same as a real user would have to. And give In Progress's
    // own reflow (plus whatever scroll adjustment it triggers) time to
    // fully settle *before* entering Review at all — entering while a
    // sibling region is still resizing would freeze Review's own band
    // math against a transient, not-yet-final measurement of it, and
    // that freeze (deliberately) never re-reads live afterward.
    await stableBoxOf(reviewRow);
    await reviewRow.locator('[data-carve-zone="bottom"]').scrollIntoViewIfNeeded();
    await settleOnBottomBand(page, reviewRow);
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABXYC');
    expect((await item(request, s.items.C.id)).workphaseId).toBe(s.phase.review.id);
  });

  test('DRAG-3.9: a done column produces no anchor — every band is a workphase-only move', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await request.patch(`${API}/items/${s.items.A.id}/move`, { data: { workphaseId: s.phase.done.id } });
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const done = column(page, 'Done');

    // X starts locked to Todo; Done's own single-band carve-out (Story 8)
    // only renders once genuinely at Board layer, so pop out first — via
    // any point outside Todo, not necessarily Done itself — before reading
    // it off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, column(page, 'In Progress')));
    await popOutFully(page, tuning);
    await hoverTo(page, await singleBandPoint(regionOf(done)));
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.done.id);
    const x = await item(request, s.items.X.id);
    expect(x.position).toBeNull();
    expect(x.completedAt).not.toBeNull();
  });

  test('DRAG-3.10: an empty column is a workphase-only move in any band', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const review = column(page, 'Review');

    // Same reasoning: pop out from Todo before reading Review's own
    // (empty) single-band carve-out off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, column(page, 'In Progress')));
    await popOutFully(page, tuning);
    await hoverTo(page, await singleBandPoint(regionOf(review)));
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);
    expect((await item(request, s.items.X.id)).position).toBe(2.5);
  });
});

test.describe('ordinal preview and reconciliation', () => {
  // Holds every move response for `ms` — the request still reaches the
  // server immediately, so the server's order of operations is the real one
  // and only the *client's* view of it is delayed.
  async function delayMoveResponses(page: Page, ms: (n: number) => number) {
    let n = 0;
    await page.route('**/api/items/*/move', async (route: Route) => {
      const wait = ms(n++);
      const response = await route.fetch();
      await new Promise(r => setTimeout(r, wait));
      await route.fulfill({ response });
    });
  }

  test('DRAG-6.1 / 6.2: the drop is drawn at its slot and marked pending until the response lands, then settles unchanged', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    await delayMoveResponses(page, () => 1500);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo; In Progress's own carve-out (Story 8) only
    // renders once genuinely at Board layer, so pop out first.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await popOutFully(page, tuning);
    await settleOnBottomBand(page, regionOf(inProgress));
    await release(page);

    // Pending: X is last in In Progress, marked, with no number invented for it.
    const x = inProgress.getByRole('article', { name: 'Item X', exact: true });
    await expect(x).toHaveAttribute('data-pending', 'true');
    expect(await titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C', 'Item X']);

    // Reconciled: the marker clears and the picture is the one already drawn.
    await expect(x).not.toHaveAttribute('data-pending', 'true', { timeout: 5000 });
    expect(await titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C', 'Item X']);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
  });

  test('DRAG-6.5: re-dragging a pending item — the later write wins even when its response lands first', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    // Write 1's response is held well past write 2's.
    await delayMoveResponses(page, n => (n === 0 ? 2500 : 0));
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // Write 1: X after C (bottom band) — X starts locked to Todo, so this
    // pops out to Board layer first (re-plan 2026-09-16), and In Progress's
    // own carve-out (Story 8) only renders there too.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await popOutFully(page, tuning);
    await settleOnBottomBand(page, regionOf(inProgress));
    await release(page);
    const x = inProgress.getByRole('article', { name: 'Item X', exact: true });
    await expect(x).toHaveAttribute('data-pending', 'true');

    // Write 2, while write 1 is still in flight: X before A, in-context.
    await pickUp(page, x);
    await hoverTo(page, await topQuarter(article(page, 'Item A')));
    await release(page);

    // Write 2's response lands first and clears the marker; write 1's arrives
    // later and must not be applied over it.
    await expect(x).not.toHaveAttribute('data-pending', 'true');
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item X', 'Item A', 'Item B', 'Item C']);
    await page.waitForTimeout(3000);
    expect(await titlesIn(inProgress)).toEqual(['Item X', 'Item A', 'Item B', 'Item C']);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('XABC');
  });
});
