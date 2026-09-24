import type { Locator } from '@playwright/test';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import {
  seedTemplatedWorkflow,
  pickWorkphases,
  seedItem,
  fetchItem,
  fetchDefaultBoard,
  columnForWorkphase,
} from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  center,
  gapBetween,
  awaitDragContext,
  awaitPoppedOut,
  seedDragTuning,
  clocksMargin,
} from '../helpers/dragGesture';
import { article, column } from '../helpers/boardLocators';
import { DRAG_REGION_ATTR, cardRegionKey, columnRegionKey } from '../../client/src/components/workflow/dragRegions';

// Epic 3.5 Story 4's Column → Card zoom-in (docs/wiki/board-drag-interaction
// §1.1, §3), reached after the drag has passed through Board layer.
//
// Regression, found in the Story 6 hands-on (2026-09-23): at Board layer
// `DragCarveFrame` renders a column's carve-out zones and dividers around
// its cards, which moves the cards to a different child slot, so React
// remounts them on the way into and out of Board layer. The drag cached
// the Card elements just before that render, so every Card in a column it
// entered through Board layer measured as nothing and could never be
// zoomed into. A drag that never reaches Board layer (a Stub's pops out
// of its own Card, DRAG-5.4) doesn't remount anything and never hit it.
//
// `cardPopInDelayMs` is long enough that the column-layer state is still
// there to observe (and to re-aim from) before the Card zoom-in fires. The
// pop into a column aims at its region's center, its middle band, never
// at a card: a column's last card can sit in its bottom band.

function regionOf(group: Locator, regionKey: string): Locator {
  return group.locator(`[${DRAG_REGION_ATTR}="${regionKey}"]`);
}

test.describe('Card zoom-in after passing through Board layer', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('a Card in a different column: pop out, pop into its column, then zoom into it and attach', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Zoom In Other Column Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = columnForWorkphase(board, todo.id);
    const inProgressCol = columnForWorkphase(board, inProgress.id);
    const x = await seedItem(request, { title: 'X', projectId: project.id, workphaseId: todo.id });
    const q = await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: inProgress.id });

    const tuning = await seedDragTuning(page, { popDelayMs: 150, popInDelayMs: 150, cardPopInDelayMs: 1500 });
    await projectSidebar.openBoard(name);
    const todoGroup = column(page, 'Todo');
    const inProgressGroup = column(page, 'In Progress');

    await pickUp(page, article(page, 'X'));
    await awaitDragContext(page, columnRegionKey(todoCol.id));
    await hoverTo(page, await gapBetween(todoGroup, inProgressGroup));
    await awaitPoppedOut(page, tuning);

    await hoverTo(page, await center(regionOf(inProgressGroup, columnRegionKey(inProgressCol.id))));
    await awaitDragContext(page, columnRegionKey(inProgressCol.id), clocksMargin(tuning.popInDelayMs));
    // Locking in redraws the column (the zones gone): aim at Q where it now sits.
    await hoverTo(page, await center(article(inProgressGroup, 'Q')));
    await awaitDragContext(page, cardRegionKey(q.id), clocksMargin(tuning.cardPopInDelayMs));
    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(q.id);
    expect(updated.isAttached).toBe(1);
  });

  test("a Card in the drag's own column: pop out, pop back in, then zoom into it and attach", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Zoom In Same Column Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = columnForWorkphase(board, todo.id);
    const x = await seedItem(request, { title: 'X', projectId: project.id, workphaseId: todo.id });
    const q = await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    const tuning = await seedDragTuning(page, { popDelayMs: 150, popInDelayMs: 150, cardPopInDelayMs: 1500 });
    await projectSidebar.openBoard(name);
    const todoGroup = column(page, 'Todo');
    const inProgressGroup = column(page, 'In Progress');

    await pickUp(page, article(page, 'X'));
    await awaitDragContext(page, columnRegionKey(todoCol.id));
    await hoverTo(page, await gapBetween(todoGroup, inProgressGroup));
    await awaitPoppedOut(page, tuning);

    await hoverTo(page, await center(regionOf(todoGroup, columnRegionKey(todoCol.id))));
    await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(tuning.popInDelayMs));
    await hoverTo(page, await center(article(todoGroup, 'Q')));
    await awaitDragContext(page, cardRegionKey(q.id), clocksMargin(tuning.cardPopInDelayMs));
    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(q.id);
    expect(updated.isAttached).toBe(1);
  });
});
