import type { Locator } from '@playwright/test';
import { test, expect } from '../fixtures';
import { moveItem, pinItemPosition, fetchItem, deleteColumn, updateColumn } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  center,
  topQuarter,
  boxOf,
  gapBetween,
  awaitDragState,
  awaitDragContext,
  seedDragTuning,
  awaitPoppedOut,
  clocksMargin,
  NO_POP,
  POP_OUT_ONLY,
  SUSTAINED,
  type Point,
} from '../helpers/dragGesture';
import { article, column, dragRegion, titlesIn } from '../helpers/boardLocators';
import { columnOrder, fullOrder } from '../helpers/itemRepositioningScenario';
import { subrowRegionKey } from '../../client/src/components/workflow/dragRegions';
import {
  seed,
  openBoard,
  foldReviewIntoInProgress,
  columnKeyOf,
  popThrough,
  stableBoxOf,
  settleOnTopBand,
  settleOnBottomBand,
  singleBandPoint,
  bandDivider,
  middleGapPoint,
} from '../helpers/boardDragScenario';

// Four columns and the sidebar must fit without triggering horizontal auto-scroll.
test.use({ viewport: { width: 1600, height: 900 } });

test.describe('Card → column drop bands', () => {
  test('DRAG-3.1, DRAG-3.2, DRAG-3.11: the top band places before the first item, the bottom band after the last', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo; a band only resolves a release once the drag
    // has actually reached Board layer — and In Progress's own carve-out
    // only renders there too, so it has to pop out first before reading the
    // top one off, then land squarely inside it.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitPoppedOut(page, tuning);
    await settleOnTopBand(page, dragRegion(inProgress));
    // The live ghost previews X first, in the hovered column's own list.
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item X', 'Item A', 'Item B', 'Item C']);
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('XABC');
    let x = await fetchItem(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.inProgress.id);
    expect(x.position).toBeLessThan(1);

    // Back to Todo, then squarely inside the bottom carve-out.
    await moveItem(request, x.id, { workphaseId: s.phase.todo.id });
    await pinItemPosition(request, x.id, 2.5);
    await openBoard(page, projectSidebar);
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitPoppedOut(page, tuning);
    await settleOnBottomBand(page, dragRegion(inProgress));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
    x = await fetchItem(request, s.items.X.id);
    expect(x.position).toBeGreaterThan(3);
  });

  // A region's *own rendered height* must be identical whether or not it's
  // the live hover target, exactly, in each of the three reservation shapes
  // (`dragBands.ts::bandBoundaries`): a positional region with real cards, a
  // genuinely empty one, and a terminal one that still has cards. This
  // keeps that true through any card-chrome change — it doesn't probe
  // *why*, unit tests already do that; it just measures the real rendered
  // box before and after.
  test('DRAG-3.17: the reservation invariant — hovering a region never changes its own rendered height, for a positional, an empty, and a terminal-with-cards region alike', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    // A into Done — terminal, but not empty, the third reservation shape.
    await moveItem(request, s.items.A.id, { workphaseId: s.phase.done.id });
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress'); // positional: B, C
    const review = column(page, 'Review'); // genuinely empty
    const done = column(page, 'Done'); // terminal, with A

    const neutral = () => gapBetween(todo, inProgress);

    async function assertHeightUnchangedOnHover(col: Locator, middle: () => Promise<Point>) {
      const before = await stableBoxOf(dragRegion(col));
      await hoverTo(page, await middle());
      const after = await stableBoxOf(dragRegion(col));
      expect(after.height).toBeCloseTo(before.height, 0);
      // Back to nowhere, so the next region's own "before" reading is also
      // taken while it genuinely isn't the hover target.
      await hoverTo(page, await neutral());
    }

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await neutral());
    await awaitPoppedOut(page, tuning);

    await assertHeightUnchangedOnHover(inProgress, () => center(dragRegion(inProgress)));
    await assertHeightUnchangedOnHover(review, () => singleBandPoint(dragRegion(review)));
    await assertHeightUnchangedOnHover(done, () => singleBandPoint(dragRegion(done)));

    await release(page);
  });

  // An expanded column's own sub-row is a *droppable* card list with its
  // own padding, unlike a merged column's, whose droppable padding sits one
  // level up, outside this region entirely — so a genuinely empty sub-row
  // could shift by the padding alone (12px) the moment it stops being the
  // live hover target. Same invariant as above, read off the sub-row's own
  // region rather than a merged column's.
  test("DRAG-3.17: the reservation invariant — an expanded column's own empty sub-row doesn't shift by its droppable padding either", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    // Fold Review into In Progress as an expanded column — deliberately not
    // `foldReviewIntoInProgress` (used elsewhere in this file), which always
    // seeds a card into Review: this case needs Review's own sub-row to
    // start genuinely empty.
    const inProgressCol = s.columns.find(c => c.entryWorkphaseId === s.phase.inProgress.id)!;
    const reviewCol = s.columns.find(c => c.entryWorkphaseId === s.phase.review.id)!;
    await deleteColumn(request, reviewCol.id);
    await updateColumn(request, inProgressCol.id, {
      startWorkphaseId: s.phase.inProgress.id,
      endWorkphaseId: s.phase.review.id,
      displayMode: 'expanded',
    });
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const reviewRow = dragRegion(page, subrowRegionKey(inProgressCol.id, s.phase.review.id));
    // The merged range's own displayName isn't the literal "In Progress"
    // (the DRAG-3.6, DRAG-3.7 case below meets the same thing) — matched by
    // substring here too.
    const merged = page.getByRole('group', { name: /In Progress/ }).first();

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(column(page, 'Todo'), merged));
    await awaitPoppedOut(page, tuning);

    const before = await stableBoxOf(reviewRow);
    await hoverTo(page, await singleBandPoint(reviewRow));
    const after = await stableBoxOf(reviewRow);
    expect(after.height).toBeCloseTo(before.height, 0);

    await release(page);
  });

  test('DRAG-3.3, DRAG-3.11: the middle band released before THRESHOLD is a workphase-only move — position kept, the hovered card ignored', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const inProgress = column(page, 'In Progress');

    // X starts locked to Todo — pop out to Board layer first; a bare hover
    // on In Progress never previews anything while still locked elsewhere
    // (wiki board-drag-interaction §1.1, rule 1), only once genuinely there.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await center(dragRegion(inProgress)));
    await awaitPoppedOut(page, tuning);
    // The ghost now shows X where its kept position falls (DRAG-3.11).
    await expect.poll(() => titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item X', 'Item C']);

    // Release squarely over a card that sits in the middle band, before
    // popInDelayMs (seeded absurdly high) could ever complete a pop-in.
    // Under a pop that would anchor against it; without one it's the
    // band's meaning, and the card under the cursor is ignored. The middle
    // band's own bounds come from the divider lines themselves —
    // content-anchored pixels, not a fraction of the region.
    const region = dragRegion(inProgress);
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

    await expect.poll(async () => (await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
    expect((await fetchItem(request, s.items.X.id)).position).toBe(2.5);
    expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABXC');
  });

  test('DRAG-3.4, DRAG-1.3, DRAG-1.5: holding in the middle band pops out, then in; the release is then anchor + side', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);
    const contextKey = columnKeyOf(s, s.phase.inProgress.id);

    await pickUp(page, article(page, 'Item X'));
    await awaitDragState(page, 'locked');
    await hoverTo(page, await middleGapPoint(page));

    // Popped in (out first, then in — both clocks run while the cursor
    // rests): the context is now In Progress, and the card is locked to
    // *it*.
    await awaitDragContext(page, contextKey, popThrough(tuning));
    await awaitDragState(page, 'locked');

    // In-context now: the ghost's slot decides, not the band (DRAG-1.5). X's
    // ghost entered at its kept position, between B and C; moved up onto B,
    // dnd-kit's shuffle puts it in B's slot, between A and B, and the drop
    // lands there whichever neighbor the lean names.
    await hoverTo(page, await center(article(page, 'Item B')));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('AXBC');
    expect((await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('DRAG-1.3, DRAG-1.12: the cursor outside the context past THRESHOLD frees the card; it can then pop back into the column it left', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, SUSTAINED);
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
    await awaitDragState(page, 'popped-out', clocksMargin(tuning.popDelayMs));
    await awaitDragContext(page, null);
    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();

    // A release over nothing while popped out writes nothing …
    // (asserted separately below); here, come back and rest in Todo's middle
    // band: the card pops back into the column it left.
    await hoverTo(page, await center(dragRegion(todo)));
    await awaitDragContext(page, todoKey, clocksMargin(tuning.popInDelayMs));
    await awaitDragState(page, 'locked');
    await release(page);

    // In-context release in Todo, X the only card: nothing to reorder against.
    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    const x = await fetchItem(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.todo.id);
  });

  test("DRAG-3.2: popped out, a release in a column is still that column's band", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, { popDelayMs: 150, popInDelayMs: 30_000 });
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, inProgress));
    await awaitDragState(page, 'popped-out', clocksMargin(tuning.popDelayMs));

    // Popped out, over In Progress's bottom band: after the last item.
    await settleOnBottomBand(page, dragRegion(inProgress));
    await awaitDragState(page, 'popped-out');
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABCX');
  });

  test('DRAG-1.5, DRAG-1.23: a card is locked to each context it pops into in turn — In Progress, then Review', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, SUSTAINED);
    await openBoard(page, projectSidebar);

    const inProgress = column(page, 'In Progress');
    const review = column(page, 'Review');

    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await middleGapPoint(page));
    await awaitDragContext(page, columnKeyOf(s, s.phase.inProgress.id), popThrough(tuning));
    await awaitDragState(page, 'locked');

    // From In Progress, on to Review (empty): out, then in, again. Review's
    // own carve-out only renders at Board layer, so pop out of In Progress —
    // via the gap, never Review's own bounds directly — before reading it
    // off.
    await hoverTo(page, await gapBetween(inProgress, review));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await singleBandPoint(dragRegion(review)));
    await awaitDragContext(page, columnKeyOf(s, s.phase.review.id), popThrough(tuning));
    await awaitDragState(page, 'locked');
    await release(page);

    await expect.poll(async () => (await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);
    expect((await fetchItem(request, s.items.X.id)).position).toBe(2.5);
  });

  test('DRAG-1.23: a reorder onto the first card lands in the first slot, even with the cursor passing over another column on the way', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    await seedDragTuning(page, NO_POP);
    await openBoard(page, projectSidebar);

    // A reorder inside In Progress that wanders over Todo on the way.
    await pickUp(page, article(page, 'Item C'));
    await hoverTo(page, await center(column(page, 'Todo')));
    await hoverTo(page, await topQuarter(article(page, 'Item A')));
    await release(page);

    await expect.poll(() => columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('CAB');
    expect((await fetchItem(request, s.items.C.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('DRAG-1.9: at Board layer, a release between columns writes nothing and leaves the card where it was', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const inProgress = column(page, 'In Progress');

    // This is only a genuine no-op once the drag has
    // actually reached Board layer — while still locked to Todo, a release
    // anywhere (the gap included) would commit Todo's own within-action
    // instead (covered by the "in another region" unit-level cases; not
    // reachable through this same gesture, since popping out is what a
    // sustained move away from Todo *means*).
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await center(dragRegion(inProgress)));
    await awaitPoppedOut(page, tuning);
    await expect(inProgress.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    // The gap between the two columns — nowhere, Board layer's own no-op.
    await hoverTo(page, await gapBetween(todo, inProgress));
    await release(page);

    await expect(todo.getByRole('article', { name: 'Item X', exact: true })).toBeVisible();
    await expect(page.locator('[data-pending]')).toHaveCount(0);
    const x = await fetchItem(request, s.items.X.id);
    expect(x.workphaseId).toBe(s.phase.todo.id);
    expect(x.position).toBe(2.5);
  });

  test('DRAG-3.6, DRAG-3.7: a merged column takes the entry workphase for an outsider and leaves a covered-set member alone', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    // Long enough that a hover on the way somewhere can't pop out, short
    // enough to hold past deliberately; popping back in is not wanted here.
    const tuning = await seedDragTuning(page, { popDelayMs: 1000, popInDelayMs: 30_000 });
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
    await hoverTo(page, await center(dragRegion(todo)));
    await awaitDragState(page, 'popped-out', clocksMargin(tuning.popDelayMs));
    await settleOnTopBand(page, dragRegion(merged));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('YABXC');
    expect((await fetchItem(request, y.id)).workphaseId).toBe(s.phase.review.id);

    // DRAG-3.6 — X (an outsider, in Todo) to the top band: the entry
    // workphase. X starts locked to Todo, so this also has to pop out to
    // Board layer first — merged's own carve-out only renders there too —
    // before reading the top one off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, merged));
    await awaitPoppedOut(page, tuning);
    await settleOnTopBand(page, dragRegion(merged));
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('XYABC');
    expect((await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.inProgress.id);
  });

  test('DRAG-3.8, DRAG-1.6: an expanded column resolves per sub-row — exact workphase, first/last of that sub-row', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    const { col } = await foldReviewIntoInProgress(request, s, 'expanded');
    await openBoard(page, projectSidebar);
    const reviewRow = dragRegion(page, subrowRegionKey(col.id, s.phase.review.id));

    // X from Todo into the Review sub-row's top band: before Y, exactly
    // Review. X starts locked to Todo, so it also has to pop out to Board
    // layer first — reviewRow's own carve-out only renders there, and only
    // once reviewRow itself isn't already the live hover target — so the
    // approach reaches Board layer *before* reading it off, via a
    // point in the gap left of the column, at the row's own height (going
    // straight in would cross the In Progress sub-row first, inserting the
    // ghost there and pushing Review down under the pointer).
    await pickUp(page, article(page, 'Item X'));
    const rowMid = await center(reviewRow);
    await hoverTo(page, { x: (await boxOf(reviewRow)).x - 16, y: rowMid.y });
    await awaitPoppedOut(page, tuning);
    await settleOnTopBand(page, reviewRow);
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABCXY');
    expect((await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);

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
    await awaitPoppedOut(page, tuning);
    // Popping out grows In Progress's own carve-out too (every region
    // does, simultaneously), and in this expanded column both sub-rows
    // share one scroll body — tall enough now that Review's bottom
    // carve-out can scroll out of the body's own visible box (DRAG-1.10:
    // scrolled out of view is scrolled out of reach) even though it's
    // still fully in the fixture. Scroll it into view before reading the
    // point off, same as a real user would have to. And give In Progress's
    // own reflow (plus whatever scroll adjustment it triggers) time to
    // fully settle *before* entering Review at all — there's no freeze to
    // wait out (the band reads `contentRect` live, every sample), but a
    // point read off a still-resizing sibling
    // mid-reflow is stale the instant the mouse gets there regardless, so
    // this still waits for the real, current layout before trusting it.
    await stableBoxOf(reviewRow);
    await reviewRow.locator('[data-carve-zone="bottom"]').scrollIntoViewIfNeeded();
    await settleOnBottomBand(page, reviewRow);
    await release(page);
    await expect.poll(() => fullOrder(request, s.workflow.id)).toBe('ABXYC');
    expect((await fetchItem(request, s.items.C.id)).workphaseId).toBe(s.phase.review.id);
  });

  test('DRAG-3.9: a done column produces no anchor — every band is a workphase-only move', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await moveItem(request, s.items.A.id, { workphaseId: s.phase.done.id });
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const done = column(page, 'Done');

    // X starts locked to Todo; Done's own single-band carve-out only renders
    // once genuinely at Board layer, so pop out first — via any point
    // outside Todo, not necessarily Done itself — before reading it off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await singleBandPoint(dragRegion(done)));
    await release(page);

    await expect.poll(async () => (await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.done.id);
    const x = await fetchItem(request, s.items.X.id);
    expect(x.position).toBeNull();
    expect(x.completedAt).not.toBeNull();
  });

  test('DRAG-3.10: an empty column is a workphase-only move in any band', async ({ page, request, projectSidebar }) => {
    const s = await seed(request);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await openBoard(page, projectSidebar);
    const todo = column(page, 'Todo');
    const review = column(page, 'Review');

    // Same reasoning: pop out from Todo before reading Review's own
    // (empty) single-band carve-out off.
    await pickUp(page, article(page, 'Item X'));
    await hoverTo(page, await gapBetween(todo, column(page, 'In Progress')));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await singleBandPoint(dragRegion(review)));
    await release(page);

    await expect.poll(async () => (await fetchItem(request, s.items.X.id)).workphaseId).toBe(s.phase.review.id);
    expect((await fetchItem(request, s.items.X.id)).position).toBe(2.5);
  });
});
