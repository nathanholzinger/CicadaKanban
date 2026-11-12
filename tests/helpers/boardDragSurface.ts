import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { resetAndSeedDb } from './db';
import {
  columnForWorkphase,
  deleteColumn,
  fetchDefaultBoard,
  pickWorkphases,
  seedTemplatedWorkflow,
  updateColumn,
  type SeededBoard,
} from './seed';
import { dragOverlay } from './boardLocators';
import {
  awaitDragContext,
  center,
  clocksMargin,
  hoverTo,
  paintedBoxOf,
  pickUp,
  release,
  type Point,
} from './dragGesture';
import { successfulWrite, type RecordedWrite } from './requestHarness';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import type { DragTuning } from '../../client/src/components/workflow/dragTuning';

// Shared fixtures and screen observations for board drags. Screen geometry is
// measured from the DOM, independently of the app's placement and clamp results.
export async function seedBoardFixture(request: APIRequestContext, name: string) {
  await resetAndSeedDb();
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo, doing, review, done] = pickWorkphases(workflow, 'Todo', 'In Progress', 'Review', 'Done');
  return { project, workflow, board: await fetchDefaultBoard(request, workflow.id), todo, doing, review, done };
}

export function dragBoxOf(locator: Locator) {
  return paintedBoxOf(locator, { layoutSize: true });
}

export async function setSectionExpanded(card: Locator, expanded: boolean) {
  await expect(card).toBeVisible();
  await expect(card.getByTitle(/^(Show|Hide) attached children$/)).toHaveCount(1);
  const change = card.getByTitle(expanded ? 'Show attached children' : 'Hide attached children', { exact: true });
  if (await change.count()) await change.click();
  await expect(
    card.getByTitle(expanded ? 'Hide attached children' : 'Show attached children', { exact: true }),
  ).toBeVisible();
}

// Picks `source`, a Free Card in a column, up and holds it over the middle of `card` until the full
// zoom-in hold has run, which leaves the drag at `card`'s Descendants layer with `source` a Stub row
// in its section. It reads the layer from the app's `data-drag-context` attribute, and returns the
// point the cursor rests at. The tuning is the one `seedDragTuning` returned.
export async function zoomIntoCard(
  page: Page,
  source: Locator,
  card: Locator,
  cardId: string,
  tuning: Pick<DragTuning, 'cardZoomDwellMs' | 'cardPopInDelayMs'>,
): Promise<Point> {
  await pickUp(page, source);
  const rest = await center(card);
  await hoverTo(page, rest);
  await awaitDragContext(
    page,
    descendantsRegionKey(cardId),
    clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs),
  );
  return rest;
}

// Releases the drag and waits for the server's answer to the item's move. Reads the network answer.
export async function releaseMove(page: Page, id: string) {
  const answered = successfulWrite(page, 'PATCH', `/api/items/${id}/move`);
  await release(page);
  return answered;
}

export async function mergeRange(
  request: APIRequestContext,
  board: SeededBoard,
  start: string,
  end: string,
  displayMode: 'merged' | 'expanded',
) {
  const first = columnForWorkphase(board, start);
  const last = columnForWorkphase(board, end);
  await deleteColumn(request, last.id);
  await updateColumn(request, first.id, { startWorkphaseId: start, endWorkphaseId: end, displayMode });
  return first.id;
}

// Aim the carried box above/below its own ghost's middle, re-reading after
// each shuffle. The named relation is asserted separately by the caller.
export async function leanAtGhost(
  page: Page,
  ghost: Locator,
  from: Point,
  side: 'up' | 'down',
  passes = 3,
): Promise<Point> {
  let point = from;
  for (let i = 0; i < passes; i++) {
    const g = await dragBoxOf(ghost);
    const c = await dragBoxOf(dragOverlay(page));
    point = { x: point.x, y: point.y + g.y + g.height / 2 + (side === 'up' ? -15 : 15) - c.y - c.height / 2 };
    await hoverTo(page, point);
  }
  return point;
}

// How far `copy`'s painted box lies outside `context`'s, in px: the largest overhang on the axes asked
// for, negative when it lies inside. Reads the screen.
export async function withinExcess(copy: Locator, context: Locator, axes: 'x' | 'both' = 'both') {
  const a = await dragBoxOf(copy);
  const b = await dragBoxOf(context);
  return Math.max(
    b.x - a.x,
    a.x + a.width - b.x - b.width,
    ...(axes === 'both' ? [b.y - a.y, a.y + a.height - b.y - b.height] : []),
  );
}

export async function expectWithin(copy: Locator, context: Locator, axes: 'x' | 'both' = 'both') {
  await expect
    .poll(() => withinExcess(copy, context, axes), {
      message: 'the observed drag box stays inside the rendered context',
    })
    .toBeLessThanOrEqual(2);
}

export async function expectFollowing(page: Page, from: Point, to: Point) {
  const before = await dragBoxOf(dragOverlay(page));
  await hoverTo(page, to);
  await expect
    .poll(
      async () => {
        const after = await dragBoxOf(dragOverlay(page));
        return Math.max(Math.abs(after.x - before.x - (to.x - from.x)), Math.abs(after.y - before.y - (to.y - from.y)));
      },
      { message: 'the rendered copy follows the pointer on both axes' },
    )
    .toBeLessThan(2);
}

// The Cards in `scope` by their painted order, top to bottom. Reads each Card's `aria-label` and
// its painted box.
export async function paintedCardOrder(scope: Locator): Promise<string[]> {
  const cards = scope.getByRole('article');
  const rows = await Promise.all(
    Array.from({ length: await cards.count() }, async (_, i) => ({
      title: await cards.nth(i).getAttribute('aria-label'),
      y: (await paintedBoxOf(cards.nth(i))).y,
    })),
  );
  return rows.sort((a, b) => a.y - b.y).map(row => row.title ?? '');
}

// The visible section order, including every nested Stub row, by each row's actual screen box.
export async function paintedItemIds(scope: Locator): Promise<string[]> {
  const rows = scope.locator('[data-item-id]');
  const observed = await Promise.all(
    Array.from({ length: await rows.count() }, async (_, i) => ({
      id: await rows.nth(i).getAttribute('data-item-id'),
      y: (await paintedBoxOf(rows.nth(i))).y,
    })),
  );
  return observed.sort((a, b) => a.y - b.y).map(row => row.id ?? '');
}

// Exactly one move request, for item `id`, with `body`. Reads the requests `watchWrites` recorded.
export function expectOneMove(writes: readonly RecordedWrite[], id: string, body: Record<string, unknown>) {
  expect(writes).toEqual([{ method: 'PATCH', url: expect.stringMatching(new RegExp(`/api/items/${id}/move$`)), body }]);
}
