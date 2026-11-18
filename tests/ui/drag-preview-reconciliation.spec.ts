import { test, expect } from '../fixtures';
import { moveItem, pinItemPosition } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  cancel,
  topQuarter,
  bottomQuarter,
  gapBetween,
  boardReload,
  seedDragTuning,
  awaitPoppedOut,
  NO_POP,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import {
  delayMoveResponses,
  holdNextWrite,
  refuseMoves,
  settledWrites,
  successfulWrite,
  watchBoardLoads,
  watchWrites,
} from '../helpers/requestHarness';
import { article, column, dragRegion, titlesIn } from '../helpers/boardLocators';
import { columnOrder } from '../helpers/itemRepositioningScenario';
import { ANSWER, dropXAtEndOfInProgress, seed, openBoard, settleOnBottomBand } from '../helpers/boardDragScenario';
import { paintedCardOrder } from '../helpers/boardDragSurface';

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

for (const withPairs of [true, false]) {
  test(`${withPairs ? 'DRAG-6.7' : 'DRAG-6.5, DRAG-6.7'}: a stale response ${withPairs ? 'with' : 'without'} reindex pairs ${
    withPairs ? 'resyncs the board to the server once' : 'is discarded and the board does not reload'
  }`, async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    // Pinned this high, the first move's append reindexes the column's scope; at 1, 2 and 3 it does not.
    if (withPairs) {
      await pinItemPosition(request, s.items.A.id, 1100);
      await pinItemPosition(request, s.items.B.id, 1200);
      await pinItemPosition(request, s.items.C.id, 1300);
    }
    await seedDragTuning(page, NO_POP);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');
    const loads = watchBoardLoads(page);
    const held = await holdNextWrite(page, ANSWER);

    // Write 1 carries Item A to the end of the column, and its answer is held.
    await pickUp(page, article(inProgress, 'Item A'));
    await hoverTo(page, await bottomQuarter(article(page, 'Item C')));
    await release(page);
    const first = await held.arrived();
    const pairs = (first.body as { reindexed?: unknown[] }).reindexed ?? [];
    expect(pairs.length > 0, 'the held answer carries reindex pairs only when the scope was pinned high').toBe(
      withPairs,
    );

    // Write 2 carries it back above Item C, and its answer arrives first.
    await pickUp(page, article(inProgress, 'Item A'));
    await hoverTo(page, await topQuarter(article(page, 'Item C')));
    await release(page);
    await expect(article(inProgress, 'Item A')).not.toHaveAttribute('data-pending', 'true');
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('BAC');
    expect(loads).toHaveLength(0);

    // Write 1's answer is released after write 2's.
    const stale = page.waitForResponse(res => res.request().method() === 'PATCH' && res.url() === first.request.url);
    const reloaded = withPairs ? boardReload(page) : undefined;
    held.release();
    await stale;
    await reloaded;
    await settledWrites(page, []);

    // The board is the server's, every reindexed item included, and it was read once or not at all.
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item B', 'Item A', 'Item C']);
    expect(loads).toHaveLength(withPairs ? 1 : 0);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('BAC');
    await held.dispose();
  });
}

test("DRAG-6.5: write 1's answer arriving before write 2's leaves the item in write 2's result", async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seed(request);
  await seedDragTuning(page, NO_POP);
  await openBoard(page, projectSidebar);
  const inProgress = column(page, 'In Progress');
  const a = article(inProgress, 'Item A');

  // Write 1 carries Item A to the end of the column, and its answer is held.
  const first = await holdNextWrite(page, ANSWER);
  await pickUp(page, a);
  await hoverTo(page, await bottomQuarter(article(page, 'Item C')));
  await release(page);
  const firstWrite = await first.arrived();

  // Write 2 carries it back above Item C straight away, and its answer is held too.
  const second = await holdNextWrite(page, ANSWER);
  await pickUp(page, a);
  await hoverTo(page, await topQuarter(article(page, 'Item C')));
  await release(page);
  await second.arrived();
  await expect(a).toHaveAttribute('data-pending', 'true');

  // Write 1's answer arrives first, then write 2's.
  const firstAnswered = page.waitForResponse(
    res => res.request().method() === 'PATCH' && res.url() === firstWrite.request.url,
  );
  first.release();
  await firstAnswered;
  second.release();

  // The item ends in write 2's result: its slot on screen, and its position on the server.
  await expect(a).not.toHaveAttribute('data-pending', 'true');
  await expect.poll(() => titlesIn(inProgress)).toEqual(['Item B', 'Item A', 'Item C']);
  expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('BAC');
  await first.dispose();
  await second.dispose();
});

for (const ending of ['Escape', 'a release where nothing is written'] as const) {
  for (const state of ['still in flight', 'already landed'] as const) {
    test(`DRAG-6.8: ${ending} on a re-drag with write 1 ${state} leaves the item ${
      state === 'still in flight' ? 'pending at its dropped slot' : 'at its saved position, unmarked'
    }`, async ({ page, request, projectSidebar }) => {
      const s = await seed(request);
      const tuning = await seedDragTuning(page, POP_OUT_ONLY);
      await openBoard(page, projectSidebar);
      const todo = column(page, 'Todo');
      const inProgress = column(page, 'In Progress');
      const writes = watchWrites(page);
      const held = state === 'still in flight' ? await holdNextWrite(page, ANSWER) : undefined;

      const landed =
        state === 'already landed' ? successfulWrite(page, 'PATCH', `/api/items/${s.items.X.id}/move`) : undefined;
      await dropXAtEndOfInProgress(page, tuning);
      const x = inProgress.getByRole('article', { name: 'Item X', exact: true });
      await landed;
      if (held) await held.arrived();
      if (state === 'still in flight') await expect(x).toHaveAttribute('data-pending', 'true');
      else await expect(x).not.toHaveAttribute('data-pending', 'true');
      expect(await titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C', 'Item X']);

      // X is picked up again and the drag ends without writing.
      await pickUp(page, x);
      if (ending === 'Escape') {
        await cancel(page);
      } else {
        await hoverTo(page, await gapBetween(todo, inProgress));
        await awaitPoppedOut(page, tuning);
        await release(page);
      }

      // X is where write 1 put it, and never back at its old slot.
      expect(await titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C', 'Item X']);
      await expect(article(todo, 'Item X')).toHaveCount(0);
      if (state === 'still in flight') await expect(x).toHaveAttribute('data-pending', 'true');
      else await expect(x).not.toHaveAttribute('data-pending', 'true');
      expect(await settledWrites(page, writes)).toHaveLength(1);

      if (held) {
        held.release();
        await expect(x).not.toHaveAttribute('data-pending', 'true');
      }
      expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
      await held?.dispose();
    });
  }
}

test('DRAG-6.9: a response that lands mid-drag of the same item leaves its ghost at the placement of the drag, and a release commits against the reconciled board', async ({
  page,
  request,
  projectSidebar,
}) => {
  const s = await seed(request);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await openBoard(page, projectSidebar);
  const inProgress = column(page, 'In Progress');
  const writes = watchWrites(page);
  const held = await holdNextWrite(page, ANSWER);
  await dropXAtEndOfInProgress(page, tuning);
  await held.arrived();
  const x = inProgress.getByRole('article', { name: 'Item X', exact: true });
  await expect(x).toHaveAttribute('data-pending', 'true');

  // X is picked up again and carried to Item B's top quarter, where the cursor then stays still.
  await pickUp(page, x);
  await hoverTo(page, await topQuarter(article(page, 'Item B')));
  await hoverTo(page, await topQuarter(article(page, 'Item B')));

  // Write 1's answer lands. The marker is clear, and with no pointer movement the ghost is at the
  // drag's placement, between Item A and Item B.
  const answered = successfulWrite(page, 'PATCH', `/api/items/${s.items.X.id}/move`);
  held.release();
  await answered;
  await expect(x).not.toHaveAttribute('data-pending', 'true');
  await expect.poll(() => paintedCardOrder(inProgress)).toEqual(['Item A', 'Item X', 'Item B', 'Item C']);

  // The drag goes on: a release commits the placement against the reconciled board.
  await release(page);
  await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('AXBC');
  const moves = (await settledWrites(page, writes)).filter(w => w.url.includes(`/api/items/${s.items.X.id}/move`));
  expect(moves).toHaveLength(2);
  expect([s.items.A.id, s.items.B.id]).toContain((moves[1].body as { anchorId?: string }).anchorId);
  await held.dispose();
});
