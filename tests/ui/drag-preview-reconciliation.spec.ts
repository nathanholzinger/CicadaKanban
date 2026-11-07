import { test, expect } from '../fixtures';
import { moveItem } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  topQuarter,
  gapBetween,
  boardReload,
  seedDragTuning,
  awaitPoppedOut,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import { delayMoveResponses, refuseMoves } from '../helpers/requestHarness';
import { article, column, dragRegion, titlesIn } from '../helpers/boardLocators';
import { columnOrder } from '../helpers/itemRepositioningScenario';
import { seed, openBoard, settleOnBottomBand } from '../helpers/boardDragScenario';

test.use({ viewport: { width: 1600, height: 900 } });

test.describe('ordinal preview and reconciliation', () => {
  test('DRAG-6.1, DRAG-6.2: the drop is drawn at its slot and marked pending until the response lands, then settles unchanged', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    await delayMoveResponses(page, () => 1500);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo; In Progress's own carve-out only renders once
    // genuinely at Board layer, so pop out first.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitPoppedOut(page, tuning);
    await settleOnBottomBand(page, dragRegion(inProgress));
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
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    // Write 1's response is held well past write 2's.
    await delayMoveResponses(page, n => (n === 0 ? 2500 : 0));
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // Write 1: X after C (bottom band) — X starts locked to Todo, so this
    // pops out to Board layer first, and In Progress's own carve-out only
    // renders there too.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitPoppedOut(page, tuning);
    await settleOnBottomBand(page, dragRegion(inProgress));
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

  test('DRAG-6.6: a refused drop is not kept — the board reloads and shows the item where the server has it', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // The server has X in Review, which the open board doesn't know: it still draws X in Todo.
    await moveItem(request, s.items.X.id, { workphaseId: s.phase.review.id });
    await expect(article(todo, 'Item X')).toBeVisible();
    await refuseMoves(page);

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitPoppedOut(page, tuning);
    await settleOnBottomBand(page, dragRegion(inProgress));
    const refused = page.waitForResponse(res => res.url().endsWith('/move'));
    const reloaded = boardReload(page);
    await release(page);
    expect((await refused).status()).toBe(400);
    await reloaded;

    // X is where the server has it: not where the board last drew it, and not where it was dropped.
    const review = column(page, 'Review');
    await expect(article(review, 'Item X')).toBeVisible();
    await expect(article(review, 'Item X')).not.toHaveAttribute('data-pending', 'true');
    await expect(article(todo, 'Item X')).toHaveCount(0);
    expect(await titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C']);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABC');
  });
});
