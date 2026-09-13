import type { APIRequestContext, Locator, Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases } from '../helpers/seed';
import { pickUp, hoverTo, release, center, topQuarter, bottomQuarter, boxOf } from '../helpers/dragGesture';
import { columnOrder, fullOrder } from '../helpers/itemRepositioningScenario';
import { DEFAULT_DRAG_TUNING, DRAG_TUNING_STORAGE_KEY, type DragTuning } from '../../client/src/components/workflow/dragTuning';

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
const MOMENTARY: Partial<DragTuning> = { popDelayMs: 30_000, popInDelayMs: 30_000 };
const SUSTAINED: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: 150 };
// Enough for both clocks to run out while the cursor rests: pop out, then in.
const popThrough = (tuning: DragTuning) => tuning.popDelayMs + tuning.popInDelayMs + 300;

// Four columns plus the sidebar overflow the default 1280px viewport, and a
// band point measured in a column that is partly off-screen depends on
// dnd-kit's auto-scroll having kicked in — timing, not behavior. Wide
// enough that every column is fully on screen.
test.use({ viewport: { width: 1600, height: 900 } });

interface Scenario {
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
  const boards = await (await request.get(`${API}/boards?workflowId=${workflow.id}`)).json();
  const board = await (await request.get(`${API}/boards/${boards[0].id}`)).json();

  const items = {} as Scenario['items'];
  const plan: Array<[keyof Scenario['items'], string, number]> = [
    ['A', inProgress.id, 1],
    ['B', inProgress.id, 2],
    ['X', todo.id, 2.5],
    ['C', inProgress.id, 3],
  ];
  for (const [key, workphaseId, position] of plan) {
    const res = await request.post(`${API}/items`, { data: { title: `Item ${key}`, projectId: project.id, workphaseId } });
    expect(res.ok()).toBe(true);
    items[key] = await res.json();
    await request.patch(`${API}/items/${items[key].id}/move`, { data: { position } });
  }
  return {
    workflow,
    boardId: board.id,
    columns: board.columns,
    phase: { todo, inProgress, review, done },
    items,
  };
}

async function seedTuning(page: Page, override: Partial<DragTuning>): Promise<DragTuning> {
  const tuning = { ...DEFAULT_DRAG_TUNING, ...override };
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [DRAG_TUNING_STORAGE_KEY, JSON.stringify(tuning)] as const,
  );
  return tuning;
}

async function openBoard(page: Page, projectSidebar: { select: (name: string) => Promise<void> }) {
  await page.goto('/');
  await projectSidebar.select(PROJECT);
  await page.locator('main').getByRole('button', { name: 'Board', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
}

function column(page: Page, name: string): Locator {
  return page.getByRole('group', { name, exact: true });
}

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true });
}

// A point inside a region's band, by fraction of the region's height — the
// region is the column body (or sub-row block) that carries data-drag-region.
async function bandPoint(region: Locator, fraction: number) {
  const box = await boxOf(region);
  return { x: box.x + box.width / 2, y: box.y + box.height * fraction };
}

function regionOf(col: Locator): Locator {
  return col.locator('[data-drag-region]').first();
}

async function item(request: APIRequestContext, id: string) {
  return (await request.get(`${API}/items/${id}`)).json();
}

async function titlesIn(col: Locator): Promise<string[]> {
  return col.getByRole('article').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''));
}

const machine = (page: Page) => page.locator('[data-drag-state]');

test.describe('Card → column drop bands', () => {
  test('DRAG-3.1 / 3.2: the top band places before the first item, the bottom band after the last (DRAG-3.5: at the configured fractions)', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');

    // Just inside the configured top band.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), tuning.columnTopBand * 0.5));
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');
    // The hovered column's band guide tints the band the cursor is in.
    await expect(page.locator('[data-band-highlight]')).toHaveAttribute('data-band-highlight', 'top');
    await release(page);
    await expect(page.locator('[data-band-highlight]')).toHaveCount(0);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('XABC');
    let x = await item(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.inProgress.id);
    expect(x.position).toBeLessThan(1);

    // Back to Todo, then just inside the configured bottom band.
    await request.patch(`${API}/items/${x.id}/move`, { data: { workphaseId: s.phase.todo.id, position: 2.5 } });
    await openBoard(page, projectSidebar);
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), 1 - tuning.columnBottomBand * 0.5));
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
    const tuning = await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), 0.5));
    // The ghost already shows X where its kept position falls (DRAG-3.11).
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item X', 'Item C']);

    // Release squarely over a card that sits in the middle band. Under a
    // pop that would anchor against it; without one it's the band's
    // meaning, and the card under the cursor is ignored.
    const region = await boxOf(regionOf(inProgress));
    const middle = { from: region.y + region.height * tuning.columnTopBand, to: region.y + region.height * (1 - tuning.columnBottomBand) };
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
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');
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
    const contextKey = `column:${s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!.id}`;

    await pickUp(page, article(page, 'Item X'));
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');
    await hoverTo(page, await bandPoint(regionOf(inProgress), 0.5));
    await page.waitForTimeout(popThrough(tuning));

    // Popped in: the context is now In Progress, and the card is locked to *it* (§3).
    await expect(machine(page)).toHaveAttribute('data-drag-context', contextKey);
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');

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
    const todoKey = `column:${s.columns.find(c => c.entryWorkphaseId === s.phase.todo.id)!.id}`;

    // Rest in the gap between Todo and In Progress — outside the context,
    // over no region at all.
    const todoBox = await boxOf(todo);
    const inProgressBox = await boxOf(inProgress);
    const gap = { x: (todoBox.x + todoBox.width + inProgressBox.x) / 2, y: todoBox.y + todoBox.height / 2 };
    await pickUp(page, article(page, 'Item X'));
    await expect(machine(page)).toHaveAttribute('data-drag-context', todoKey);
    await hoverTo(page, gap);
    await page.waitForTimeout(tuning.popDelayMs + 250);

    // Popped out: no context, not locked, and the card is still drawn where it was.
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'popped-out');
    await expect(machine(page)).not.toHaveAttribute('data-drag-context', /./);
    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();

    // A release over nothing while popped out writes nothing …
    // (asserted separately below); here, come back and rest in Todo's middle
    // band: the card pops back into the column it left.
    await hoverTo(page, await bandPoint(regionOf(todo), 0.5));
    await page.waitForTimeout(tuning.popInDelayMs + 250);
    await expect(machine(page)).toHaveAttribute('data-drag-context', todoKey);
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');
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

    const todoBox = await boxOf(todo);
    const inProgressBox = await boxOf(inProgress);
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, { x: (todoBox.x + todoBox.width + inProgressBox.x) / 2, y: todoBox.y + todoBox.height / 2 });
    await page.waitForTimeout(tuning.popDelayMs + 250);
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'popped-out');

    // Popped out, over In Progress's bottom band: after the last item.
    await hoverTo(page, await bandPoint(regionOf(inProgress), 1 - tuning.columnBottomBand * 0.5));
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'popped-out');
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
  });

  test('a card is locked to each context it pops into in turn — In Progress, then Review', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);
    const keyOf = (workphaseId: string) => `column:${s.columns.find(c => c.entryWorkphaseId === workphaseId)!.id}`;

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(column(page, 'In Progress')), 0.5));
    await page.waitForTimeout(popThrough(tuning));
    await expect(machine(page)).toHaveAttribute('data-drag-context', keyOf(s.phase.inProgress.id));
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');

    // From In Progress, on to Review (empty): out, then in, again.
    await hoverTo(page, await bandPoint(regionOf(column(page, 'Review')), 0.5));
    await page.waitForTimeout(popThrough(tuning));
    await expect(machine(page)).toHaveAttribute('data-drag-context', keyOf(s.phase.review.id));
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'locked');
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);
    expect((await item(request, s.items.X.id)).position).toBe(2.5);
  });

  test('DRAG-1.4: brushing across another column while reordering never leaves the context', async ({ page, request, projectSidebar }) => {
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

  test('a release between columns or over Unsorted writes nothing and leaves the card where it was', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), 0.5));
    await expect(inProgress.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    // The gap between the two columns.
    const todoBox = await boxOf(todo);
    const inProgressBox = await boxOf(inProgress);
    await hoverTo(page, { x: (todoBox.x + todoBox.width + inProgressBox.x) / 2, y: todoBox.y + todoBox.height / 2 });
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
    const col = s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!;
    const reviewCol = s.columns.find(c => c.entryWorkphaseId === s.phase.review.id)!;
    await request.delete(`${API}/columns/${reviewCol.id}`);
    await request.put(`${API}/columns/${col.id}`, {
      data: { startWorkphaseId: s.phase.inProgress.id, endWorkphaseId: s.phase.review.id },
    });
    const projectId = (await item(request, s.items.A.id)).projectId;
    const y = await (await request.post(`${API}/items`, { data: { title: 'Item Y', projectId, workphaseId: s.phase.review.id } })).json();
    await request.patch(`${API}/items/${y.id}/move`, { data: { position: 5 } });
    await openBoard(page, projectSidebar);
    const merged = page.getByRole('group', { name: /In Progress/ }).first();
    const todo = column(page, 'Todo');

    // DRAG-3.7 — Y is a member of the merged column, so the column is its
    // own context and a band drop there is only reachable *after* leaving:
    // pop out over Todo, come back to the merged column's top band, release.
    // A reorder before A; Y stays in Review, not the entry workphase.
    await pickUp(page, article(page, 'Item Y'));
    await hoverTo(page, await bandPoint(regionOf(todo), 0.5));
    await page.waitForTimeout(tuning.popDelayMs + 250);
    await expect(machine(page)).toHaveAttribute('data-drag-state', 'popped-out');
    await hoverTo(page, await bandPoint(regionOf(merged), tuning.columnTopBand * 0.5));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('YABXC');
    expect((await item(request, y.id)).workphaseId).toBe(s.phase.review.id);

    // DRAG-3.6 — X (an outsider, in Todo) to the top band: the entry workphase.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(merged), tuning.columnTopBand * 0.5));
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
    const tuning = await seedTuning(page, MOMENTARY);
    const col = s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!;
    const reviewCol = s.columns.find(c => c.entryWorkphaseId === s.phase.review.id)!;
    await request.delete(`${API}/columns/${reviewCol.id}`);
    await request.put(`${API}/columns/${col.id}`, {
      data: { startWorkphaseId: s.phase.inProgress.id, endWorkphaseId: s.phase.review.id, displayMode: 'expanded' },
    });
    const y = await (await request.post(`${API}/items`, { data: { title: 'Item Y', projectId: (await item(request, s.items.A.id)).projectId, workphaseId: s.phase.review.id } })).json();
    await request.patch(`${API}/items/${y.id}/move`, { data: { position: 5 } });
    await openBoard(page, projectSidebar);
    const reviewRow = page.locator(`[data-drag-region="subrow:${col.id}:${s.phase.review.id}"]`);

    // X from Todo into the Review sub-row's top band: before Y, exactly Review.
    // Approached at the row's own height (via the gap left of the column):
    // crossing the In Progress sub-row on the way would insert the ghost
    // there and push Review down under the pointer.
    const target = await bandPoint(reviewRow, tuning.columnTopBand * 0.5);
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, { x: (await boxOf(reviewRow)).x - 16, y: target.y });
    await hoverTo(page, target);
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABCXY');
    expect((await item(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);

    // DRAG-1.6: from the In Progress sub-row, a momentary release in the
    // sibling Review sub-row is that sub-row's band — a real workphase change.
    await pickUp(page, article(page, 'Item C'));
    await hoverTo(page, await bandPoint(reviewRow, 1 - tuning.columnBottomBand * 0.5));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABXYC');
    expect((await item(request, s.items.C.id)).workphaseId).toBe(s.phase.review.id);
  });

  test('DRAG-3.9: a done column produces no anchor — every band is a workphase-only move', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, MOMENTARY);
    await request.patch(`${API}/items/${s.items.A.id}/move`, { data: { workphaseId: s.phase.done.id } });
    await openBoard(page, projectSidebar);
    const done = column(page, 'Done');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(done), tuning.columnTopBand * 0.5));
    await release(page);

    await expect.poll(async () => (await item(request, s.items.X.id)).workphaseId).toBe(s.phase.done.id);
    const x = await item(request, s.items.X.id);
    expect(x.position).toBeNull();
    expect(x.completedAt).not.toBeNull();
  });

  test('DRAG-3.10: an empty column is a workphase-only move in any band', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(column(page, 'Review')), tuning.columnTopBand * 0.5));
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
    const tuning = await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);
    await delayMoveResponses(page, () => 1500);
    const inProgress = column(page, 'In Progress');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), 1 - tuning.columnBottomBand * 0.5));
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
    const tuning = await seedTuning(page, MOMENTARY);
    await openBoard(page, projectSidebar);
    // Write 1's response is held well past write 2's.
    await delayMoveResponses(page, n => (n === 0 ? 2500 : 0));
    const inProgress = column(page, 'In Progress');

    // Write 1: X after C (bottom band).
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await bandPoint(regionOf(inProgress), 1 - tuning.columnBottomBand * 0.5));
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
