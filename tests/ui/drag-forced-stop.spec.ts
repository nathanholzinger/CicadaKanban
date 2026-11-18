import type { APIRequestContext, Locator, Page } from '@playwright/test';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { test, expect } from '../fixtures';
import { seed, openBoard } from '../helpers/boardDragScenario';
import {
  article,
  column,
  flashingRows,
  hierarchyModal,
  itemRow,
  loadingBoard,
  overflowRow,
  stopBanner,
  titlesIn,
} from '../helpers/boardLocators';
import {
  atFraction,
  awaitDragContext,
  awaitDragState,
  awaitPoppedOut,
  boxOf,
  awaitProjection,
  boardReload,
  bottomQuarter,
  cancel,
  center,
  gapBetween,
  hoverTo,
  NO_POP,
  paintedBoxOf,
  pickUp,
  POP_OUT_ONLY,
  release,
  seedDragTuning,
  topQuarter,
} from '../helpers/dragGesture';
import { columnOrder } from '../helpers/itemRepositioningScenario';
import { holdAt, rowIds, sectionRows, seedOverflowTree } from '../helpers/overflowTree';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import type { DragTuning } from '../../client/src/components/workflow/dragTuning';
import { resetAndSeedDb } from '../helpers/db';
import {
  fetchBoard,
  fetchDefaultBoard,
  fetchItem,
  moveItem,
  pickWorkphases,
  pinItemPosition,
  seedItem,
  seedTemplatedWorkflow,
} from '../helpers/seed';
import { holdForcedStopCause, type ForcedStopCause, type HeldCause } from '../helpers/forcedStopCause';
import {
  advance,
  expectBannerSays,
  expectDragOver,
  FLASH_MS,
  landStop,
  recordStopCue,
  scrollState,
  sentenceFor,
  type StopCueRecord,
} from '../helpers/stopRun';
import { settledWrites, watchWrites, type RecordedWrite } from '../helpers/requestHarness';

test.use({ viewport: { width: 1600, height: 900 } });

test.beforeEach(async () => {
  await resetAndSeedDb();
});

const CAUSES: ForcedStopCause[] = ['failed-item-drop', 'stale-reindex', 'failed-column-reorder'];
const CAUSE_NAME: Record<ForcedStopCause, string> = {
  'failed-item-drop': 'a failed item drop',
  'stale-reindex': 'a stale response',
  'failed-column-reorder': 'a failed column reorder',
};

// One drag that a stop interrupts: the item `X` is picked up in some place, an earlier write of another
// item (or a column) is held, and the cause lets its answer land while `X` is live. A scene is the
// arrangement of one place: what is on the board, how the cause's earlier writes are made there, how
// `X` is picked up, and what the reloaded board must show.
interface StopScene {
  boardId: string;
  writes: RecordedWrite[];
  /** The id of the item the drag holds, to say nothing was written for it. */
  xId: string;
  /** X's drawn row on the reloaded board, which alone carries the flash. */
  xRow: () => Locator;
  /** An item that is not X, whose row must carry no flash. */
  bystanderRow: () => Locator;
  /** Makes the cause's earlier writes, asserting their Given, and returns the held answer. */
  earlier: (cause: ForcedStopCause) => Promise<HeldCause>;
  pickUpX: () => Promise<unknown>;
  /** Asserts X, and the board, are where the server has them after the reload. */
  expectServerState: (cause: ForcedStopCause) => Promise<void>;
}

// The earlier write of a drop: Item A is carried to the end of In Progress and let go, and its move is held.
async function dropAAfterC(page: Page) {
  await pickUp(page, article(column(page, 'In Progress'), 'Item A'));
  await hoverTo(page, await bottomQuarter(article(page, 'Item C')));
  await release(page);
}

// A free Card `X` in Todo, dragged while the board's other Free Cards A, B and C sit in In Progress.
// For a stale response the three are pinned at the positions where the next append reindexes their scope.
async function columnScene(
  page: Page,
  request: APIRequestContext,
  projectSidebar: ProjectSidebarPage,
  cause: ForcedStopCause,
  tuning: Partial<DragTuning> = {},
): Promise<
  StopScene & {
    tuning: DragTuning;
    reviewId: string;
    serverMovesXToReview: () => Promise<void>;
    xInReview: () => Locator;
  }
> {
  const s = await seed(request);
  if (cause === 'stale-reindex') {
    await pinItemPosition(request, s.items.A.id, 1100);
    await pinItemPosition(request, s.items.B.id, 1200);
    await pinItemPosition(request, s.items.C.id, 1300);
  }
  const seeded = await seedDragTuning(page, { ...NO_POP, ...tuning });
  await openBoard(page, projectSidebar);
  const writes = watchWrites(page);
  const todo = column(page, 'Todo');
  const inProgress = column(page, 'In Progress');
  const columns = (await fetchBoard(request, s.boardId)).columns.map(c => c.entryWorkphaseId);
  return {
    tuning: seeded,
    reviewId: s.phase.review.id,
    boardId: s.boardId,
    writes,
    xId: s.items.X.id,
    xRow: () => article(todo, 'Item X'),
    xInReview: () => article(column(page, 'Review'), 'Item X'),
    serverMovesXToReview: async () => {
      await moveItem(request, s.items.X.id, { workphaseId: s.phase.review.id });
    },
    bystanderRow: () => article(inProgress, 'Item A'),
    earlier: async c => {
      const held = await holdForcedStopCause(page, c);
      if (c === 'failed-column-reorder') {
        // Done's handle is carried to the first column and let go: the reorder is the held write.
        await pickUp(page, column(page, 'Done').getByTitle('Drag to reorder'));
        await hoverTo(page, await atFraction(todo, 0.1));
        await release(page);
      } else {
        await dropAAfterC(page);
        await expect(article(inProgress, 'Item A')).toHaveAttribute('data-pending', 'true');
        if (c === 'stale-reindex') {
          // A second move of the same item, which answers first: A lands before C.
          await pickUp(page, article(inProgress, 'Item A'));
          await hoverTo(page, await topQuarter(article(page, 'Item C')));
          await release(page);
        }
      }
      await held.arrived();
      return held;
    },
    pickUpX: async () => {
      await pickUp(page, article(todo, 'Item X'));
      await awaitDragState(page, 'locked');
    },
    expectServerState: async c => {
      await expect(article(todo, 'Item X')).toBeVisible();
      await expect
        .poll(() => titlesIn(inProgress))
        .toEqual(c === 'stale-reindex' ? ['Item B', 'Item A', 'Item C'] : ['Item A', 'Item B', 'Item C']);
      expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe(
        c === 'stale-reindex' ? 'BAC' : 'ABC',
      );
      expect((await fetchBoard(request, s.boardId)).columns.map(col => col.entryWorkphaseId)).toEqual(columns);
    },
  };
}

// What the server saves for an item's place, to say a stop left it as it was.
async function savedPlace(request: APIRequestContext, id: string) {
  const { parentId, workphaseId, position } = await fetchItem(request, id);
  return { parentId, workphaseId, position };
}

// Done's drag handle carried to the first column and let go: a column reorder, which is the held write.
async function reorderDoneFirst(page: Page) {
  await pickUp(page, column(page, 'Done').getByTitle('Drag to reorder'));
  await hoverTo(page, await atFraction(column(page, 'Todo'), 0.1));
  await release(page);
}

// The overflow tree's Card `P`, in a Stub's drag in its section or a row's drag in its open hierarchy
// modal. `Item B`, a Stub of P's, is the earlier drop's item; the drag the stop interrupts holds `X`
// in the section and `R1a` in the modal. For a stale response P's children A, B and X are pinned at
// the positions where the next append reindexes their scope.
async function treeScene(
  page: Page,
  request: APIRequestContext,
  projectSidebar: ProjectSidebarPage,
  cause: ForcedStopCause,
  place: 'section' | 'modal',
  { fillers = 0 }: { fillers?: number } = {},
): Promise<StopScene & { ids: { p: string; r: string; x: string }; modal: Locator }> {
  const name = place === 'modal' ? 'Stop Modal Project' : 'Stop Section Project';
  const { project, workflow, todo, p, a, b, r, r1a, x } = await seedOverflowTree(request, name);
  const boardId = (await fetchDefaultBoard(request, workflow.id)).id;
  // With Cards above P in Todo, P's section lies below the fold at the top of the page.
  for (let i = 1; i <= fillers; i++) {
    const filler = await seedItem(request, { title: `Filler ${i}`, projectId: project.id, workphaseId: todo.id });
    await pinItemPosition(request, filler.id, i);
  }
  if (fillers > 0) await pinItemPosition(request, p.id, 1000);
  if (cause === 'stale-reindex') {
    await pinItemPosition(request, a.id, 1100);
    await pinItemPosition(request, b.id, 1200);
    await pinItemPosition(request, x.id, 1300);
  }
  const held = place === 'modal' ? r1a : x;
  const savedBefore = await savedPlace(request, held.id);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const writes = watchWrites(page);
  const modal = hierarchyModal(page, 'P');
  const rows = () => (place === 'modal' ? rowIds(modal) : sectionRows(page, p.id));
  const at = (id: string) => (place === 'modal' ? itemRow(modal, id) : itemRow(page, id));
  const button = (id: string, title: string) => at(id).getByRole('button', { name: title, exact: true });
  let initial: string[] = [];
  const openModal = async () => {
    await overflowRow(page, r.id).click();
    await expect(modal).toBeVisible();
  };
  // Item B, carried to the end of P's rows (or, for the second move, above Item A) and let go.
  const dropB = async (target: () => ReturnType<typeof bottomQuarter>) => {
    await holdAt(page, b, p, target, 0);
    await release(page);
  };
  return {
    ids: { p: p.id, r: r.id, x: x.id },
    modal,
    boardId,
    writes,
    xId: held.id,
    xRow: () => at(held.id),
    bystanderRow: () => at(b.id),
    earlier: async c => {
      const heldCause = await holdForcedStopCause(page, c);
      if (c === 'failed-column-reorder') {
        await reorderDoneFirst(page);
        if (place === 'modal') await openModal();
        initial = await rows();
      } else {
        if (place === 'modal') await openModal();
        if (fillers > 0) await at(x.id).scrollIntoViewIfNeeded();
        initial = await rows();
        await dropB(() => bottomQuarter(at(x.id)));
        await expect(at(b.id)).toHaveAttribute('data-pending', 'true');
        // A second move of the same item, which answers first: B lands above A.
        if (c === 'stale-reindex') await dropB(() => topQuarter(at(a.id)));
      }
      await heldCause.arrived();
      return heldCause;
    },
    pickUpX: async () => {
      if (fillers > 0) await at(held.id).scrollIntoViewIfNeeded();
      await pickUp(page, button(held.id, held.title));
      await awaitDragContext(page, descendantsRegionKey(p.id));
    },
    expectServerState: async c => {
      if (place === 'modal') await expect(modal).toBeVisible();
      const expected = c === 'stale-reindex' ? [b.id, ...initial.filter(id => id !== b.id)] : initial;
      await expect.poll(rows).toEqual(expected);
      // X keeps its parent and workphase. The reindex that the earlier move caused renumbers its
      // siblings, X among them, so a stale response's X has the number the server gave it.
      const saved = await savedPlace(request, held.id);
      expect(saved).toEqual(c === 'stale-reindex' ? { ...savedBefore, position: saved.position } : savedBefore);
    },
  };
}

// The stop run (D04): one item drag, in one place, stopped by one cause while the reload's read is held.
async function stopRun(page: Page, cue: StopCueRecord, scene: StopScene, cause: ForcedStopCause) {
  const earlier = await scene.earlier(cause);
  await expect(stopBanner(page)).toHaveCount(0);
  const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);

  // While the read is held: the drag is over, and the banner says why.
  await expectDragOver(page);
  await expectBannerSays(page, cause);

  // The reloaded board draws: the banner is the one already there, and only X flashes.
  read.release();
  await scene.expectServerState(cause);
  await expectDragOver(page);
  await expect(flashingRows(page)).toHaveCount(1);
  await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
  await expect(scene.bystanderRow()).not.toHaveAttribute('data-stop-flash', 'true');
  await expect(stopBanner(page)).toHaveText(sentenceFor(cause));
  expect(await cue.added()).toEqual([sentenceFor(cause)]);
  expect(await cue.removed()).toBe(0);
  expect(await cue.changed()).toEqual([]);

  // Nothing was written for X, then or when the held pointer is let go.
  const written = (all: readonly RecordedWrite[]) => all.filter(w => w.url.includes(scene.xId));
  expect(written(scene.writes)).toEqual([]);
  const sent = scene.writes.length;
  await page.mouse.up();
  expect(await settledWrites(page, scene.writes)).toHaveLength(sent);
  await earlier.dispose();
}

// A column runs under each cause. A Stub's section and the modal run under the stale response, the cause with the most
// moving parts. The other four cells are skipped: held back for batch 4j, to weigh what crossing every cause with
// every place proves against its cost.
for (const cause of CAUSES) {
  const placeTest = cause === 'stale-reindex' ? test : test.skip;

  test(`DRAG-6.15, DRAG-6.16, DRAG-6.20: ${CAUSE_NAME[cause]} stops an item drag in a column`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const cue = await recordStopCue(page);
    await stopRun(page, cue, await columnScene(page, request, projectSidebar, cause), cause);
  });

  placeTest(
    `DRAG-6.15, DRAG-6.16, DRAG-6.20: ${CAUSE_NAME[cause]} stops a Stub's drag in a Card's descendants section`,
    async ({ page, request, projectSidebar }) => {
      const cue = await recordStopCue(page);
      await stopRun(page, cue, await treeScene(page, request, projectSidebar, cause, 'section'), cause);
    },
  );

  placeTest(
    `DRAG-6.15, DRAG-6.16, DRAG-6.20: ${CAUSE_NAME[cause]} stops a row's drag in the hierarchy modal`,
    async ({ page, request, projectSidebar }) => {
      const cue = await recordStopCue(page);
      await stopRun(page, cue, await treeScene(page, request, projectSidebar, cause, 'modal'), cause);
    },
  );
}

test('DRAG-6.15, DRAG-6.20: the flash is at the reloaded place of the stopped item when the reload moved it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cause = 'failed-item-drop';
  const cue = await recordStopCue(page);
  const scene = await columnScene(page, request, projectSidebar, cause);
  const earlier = await scene.earlier(cause);
  const read = await landStop(page, earlier, scene.boardId, async () => {
    await scene.pickUpX();
    // The server has X in Review by the time the drag ends, which the open board doesn't know.
    await scene.serverMovesXToReview();
  });
  await expectDragOver(page);
  read.release();

  // X is drawn in Review and flashes there, and nothing else does, in Todo or beside it.
  await expect(scene.xInReview()).toBeVisible();
  await expect(scene.xInReview()).toHaveAttribute('data-stop-flash', 'true');
  await expect(flashingRows(page)).toHaveCount(1);
  await expect(article(column(page, 'Todo'), 'Item X')).toHaveCount(0);
  await expect(scene.bystanderRow()).not.toHaveAttribute('data-stop-flash', 'true');
  await expectBannerSays(page, cause);
  expect(await cue.added()).toEqual([sentenceFor(cause)]);
  await page.mouse.up();
  await settledWrites(page, scene.writes);
  // The flash changed neither item's saved place: X is in Review, where the server had put it, and
  // In Progress is as the refused drop left it.
  expect((await fetchItem(request, scene.xId)).workphaseId).toBe(scene.reviewId);
  await expect.poll(() => titlesIn(column(page, 'In Progress'))).toEqual(['Item A', 'Item B', 'Item C']);
  await earlier.dispose();
});

// A stop and the reload it causes, with the pointer let go: the reloaded board is drawn and the page's
// clock is where the stop left it.
async function stopAndReload(page: Page, scene: StopScene, cause: ForcedStopCause) {
  const earlier = await scene.earlier(cause);
  const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);
  read.release();
  await expect(scene.xRow()).toBeVisible();
  await page.mouse.up();
  return earlier;
}

for (const part of ['fully visible', 'fade'] as const) {
  test(`DRAG-6.18: a click leaves the banner up and the next drag's pickup removes it, in its ${part} part`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const cause = 'failed-item-drop';
    const scene = await columnScene(page, request, projectSidebar, cause);
    const earlier = await stopAndReload(page, scene, cause);
    await expectBannerSays(page, cause);

    if (part === 'fully visible') {
      // A click on the banner, where it is drawn, and one elsewhere on the board.
      const onBanner = await center(stopBanner(page));
      await page.mouse.click(onBanner.x, onBanner.y);
      await expectBannerSays(page, cause);
      const elsewhere = await atFraction(column(page, 'Done'), 0.8);
      await page.mouse.click(elsewhere.x, elsewhere.y);
      await expectBannerSays(page, cause);
    } else {
      // The last quarter of the banner's lifetime, with the banner not yet gone.
      await advance(page, Math.ceil(scene.tuning.forcedStopCueMs * 0.75));
      await expectBannerSays(page, cause);
    }

    // The next drag removes it at pickup.
    await pickUp(page, article(column(page, 'In Progress'), 'Item B'));
    await expect(stopBanner(page)).toHaveCount(0);
    await cancel(page);
    await expect(stopBanner(page)).toHaveCount(0);
    await earlier.dispose();
  });
}

for (const cause of ['failed-item-drop', 'stale-reindex'] as const) {
  test(`DRAG-6.19: the banner for ${CAUSE_NAME[cause]} stays until its lifetime passes, and the reload does not restart it`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const scene = await columnScene(page, request, projectSidebar, cause);
    const lifetime = scene.tuning.forcedStopCueMs;
    const earlier = await scene.earlier(cause);
    const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);

    // Part of the lifetime goes while the board loads, and the banner is still there.
    const loading = Math.floor(lifetime / 2);
    await advance(page, loading);
    await expectBannerSays(page, cause);

    // The reloaded board draws with the banner as it was; the reload didn't restart the lifetime.
    read.release();
    await expect(scene.xRow()).toBeVisible();
    await expectBannerSays(page, cause);
    await advance(page, lifetime - loading - 1);
    await expectBannerSays(page, cause);
    await advance(page, 1);
    await expect(stopBanner(page)).toHaveCount(0);
    await page.mouse.up();
    await earlier.dispose();
  });
}

// An item the stop leaves hidden: the one the drag holds is put, on the server, where the reloaded board
// does not draw it, and a hidden place can then be opened to bring it into view.
interface HiddenScene {
  boardId: string;
  writes: RecordedWrite[];
  earlier: () => Promise<HeldCause>;
  pickUpX: () => Promise<unknown>;
  hideXOnServer: () => Promise<void>;
  /** Asserts X is not drawn and its hidden place is as it was. */
  expectStillHidden: () => Promise<void>;
  /** Brings X into view the way a user would: opens the section, or the modal from the overflow row. */
  reveal: () => Promise<void>;
  xRevealed: () => Locator;
  /** The hidden place itself, which lies below the fold at the top of the page. */
  hiddenPlace: () => Locator;
  /** What the server saves for X's place. */
  savedX: () => ReturnType<typeof savedPlace>;
}

// The element lies below the window's bottom edge at the top of the page, so a stop that scrolled to
// reveal it would have to move something. Reads the screen, in layout space.
async function expectBelowFold(page: Page, locator: Locator) {
  const box = await boxOf(locator);
  expect(box.y, 'the hidden place lies below the fold').toBeGreaterThanOrEqual(page.viewportSize()!.height);
}

const HIDDEN_PLACES = ['in a collapsed section', 'behind an overflow row'] as const;

// `P`'s Stubs `Z` and `X` with `P2`, a Card with an attached child, beside it. The drag holds `X`; the
// server moves `X` into `P2` while it is held, and the reloaded board draws every section collapsed.
// `Z` is the earlier drop's item.
async function collapsedScene(
  page: Page,
  request: APIRequestContext,
  projectSidebar: ProjectSidebarPage,
): Promise<HiddenScene> {
  const name = 'Stop Collapsed Project';
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const z = await seedItem(request, { title: 'Z', parentId: p.id });
  const x = await seedItem(request, { title: 'X', parentId: p.id });
  for (let i = 1; i <= 12; i++) {
    await seedItem(request, { title: `Filler ${i}`, projectId: project.id, workphaseId: todo.id });
  }
  const p2 = await seedItem(request, { title: 'P2', projectId: project.id, workphaseId: todo.id });
  await seedItem(request, { title: 'C2', parentId: p2.id });
  const boardId = (await fetchDefaultBoard(request, workflow.id)).id;
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  // Cards open expanded by the board's setting, which a reload applies afresh, so the setting is
  // turned off: the cards stay open for now, and every section is collapsed once the board reloads.
  const showByDefault = page.getByLabel('Show attached children by default');
  await showByDefault.click();
  await expect(showByDefault).not.toBeChecked();
  await expect.poll(async () => (await fetchDefaultBoard(request, workflow.id)).showAttachedChildren).toBe(0);
  const writes = watchWrites(page);
  return {
    boardId,
    writes,
    earlier: async () => {
      const held = await holdForcedStopCause(page, 'failed-item-drop');
      await holdAt(page, z, p, () => bottomQuarter(itemRow(page, x.id)), 0);
      await release(page);
      await expect(itemRow(page, z.id)).toHaveAttribute('data-pending', 'true');
      await held.arrived();
      return held;
    },
    pickUpX: async () => {
      await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X', exact: true }));
      await awaitDragContext(page, descendantsRegionKey(p.id));
    },
    hideXOnServer: async () => {
      await moveItem(request, x.id, { parentId: p2.id });
    },
    expectStillHidden: async () => {
      await expect(article(page, 'P2').getByTitle('Show attached children')).toBeVisible();
      await expect(itemRow(page, x.id)).toHaveCount(0);
    },
    reveal: async () => {
      await article(page, 'P2').getByTitle('Show attached children').click();
    },
    xRevealed: () => itemRow(article(page, 'P2'), x.id),
    hiddenPlace: () => article(page, 'P2'),
    savedX: () => savedPlace(request, x.id),
  };
}

// The overflow tree's `X`, a Stub of `P`, put under `R` on the server while its drag is held, so that
// the reloaded board draws it behind `R`'s overflow row. Bringing it into view is a click on that row,
// which opens the hierarchy modal.
async function overflowHiddenScene(
  page: Page,
  request: APIRequestContext,
  projectSidebar: ProjectSidebarPage,
): Promise<HiddenScene> {
  const scene = await treeScene(page, request, projectSidebar, 'failed-item-drop', 'section', { fillers: 12 });
  const { p, r, x } = scene.ids;
  return {
    boardId: scene.boardId,
    writes: scene.writes,
    earlier: () => scene.earlier('failed-item-drop'),
    pickUpX: scene.pickUpX,
    hideXOnServer: async () => {
      await moveItem(request, x, { parentId: r });
    },
    expectStillHidden: async () => {
      await expect(overflowRow(page, r)).toBeVisible();
      await expect(hierarchyModal(page, 'P')).toHaveCount(0);
      await expect(itemRow(page, x)).toHaveCount(0);
      expect(await sectionRows(page, p)).not.toContain(x);
    },
    reveal: async () => {
      await overflowRow(page, r).click();
      await expect(hierarchyModal(page, 'P')).toBeVisible();
    },
    xRevealed: () => itemRow(hierarchyModal(page, 'P'), x),
    hiddenPlace: () => overflowRow(page, r),
    savedX: () => savedPlace(request, x),
  };
}

// The stop that hides its item: the reloaded board draws no flash, opens nothing, scrolls nothing, and the
// banner still explains. Returns the held answer, to dispose at the end.
async function hiddenStop(page: Page, scene: HiddenScene) {
  const cause = 'failed-item-drop';
  // At the top of the page nothing is scrolled, and the hidden place lies below the fold.
  expect(await scrollState(page)).toBe('');
  await expectBelowFold(page, scene.hiddenPlace());
  const earlier = await scene.earlier();
  const read = await landStop(page, earlier, scene.boardId, async () => {
    await scene.pickUpX();
    await scene.hideXOnServer();
  });
  read.release();
  await scene.expectStillHidden();
  await expect(flashingRows(page)).toHaveCount(0);
  await expectBannerSays(page, cause);
  // The reloaded board is at the top of the page again and nothing has scrolled to the hidden place.
  expect(await scrollState(page)).toBe('');
  await expectBelowFold(page, scene.hiddenPlace());
  await page.mouse.up();
  return earlier;
}

const hiddenScene = (place: (typeof HIDDEN_PLACES)[number]) =>
  place === 'in a collapsed section' ? collapsedScene : overflowHiddenScene;

for (const place of HIDDEN_PLACES) {
  test(`DRAG-6.21, DRAG-6.28: a stopped item hidden ${place} is not revealed, and flashes for the rest of the window once opened`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const scene = await hiddenScene(place)(page, request, projectSidebar);
    const earlier = await hiddenStop(page, scene);
    const saved = await scene.savedX();
    const sent = scene.writes.length;

    // Opened part-way through the window, it flashes only until the window ends.
    const opened = Math.floor(FLASH_MS / 2);
    await advance(page, opened);
    await scene.reveal();
    await expect(scene.xRevealed()).toBeVisible();
    await expect(scene.xRevealed()).toHaveAttribute('data-stop-flash', 'true');
    await expect(flashingRows(page)).toHaveCount(1);
    await advance(page, FLASH_MS - opened - 1);
    await expect(scene.xRevealed()).toHaveAttribute('data-stop-flash', 'true');
    await advance(page, 1);
    await expect(scene.xRevealed()).not.toHaveAttribute('data-stop-flash', 'true');
    // Opening changed no saved place and wrote nothing.
    expect(await scene.savedX()).toEqual(saved);
    expect(scene.writes).toHaveLength(sent);
    await earlier.dispose();
  });

  test(`DRAG-6.28: a stopped item hidden ${place} and opened once the window has ended does not flash`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const scene = await hiddenScene(place)(page, request, projectSidebar);
    const earlier = await hiddenStop(page, scene);
    const saved = await scene.savedX();
    const sent = scene.writes.length;

    await advance(page, FLASH_MS);
    await scene.reveal();
    await expect(scene.xRevealed()).toBeVisible();
    await expect(scene.xRevealed()).not.toHaveAttribute('data-stop-flash', 'true');
    await expect(flashingRows(page)).toHaveCount(0);
    await expectBannerSays(page, 'failed-item-drop');
    expect(await scene.savedX()).toEqual(saved);
    expect(scene.writes).toHaveLength(sent);
    await earlier.dispose();
  });
}

// The column the stop interrupts: Review's handle is carried toward the first slot, which is where the
// column drag is when the stop lands.
async function dragReviewTowardFirst(page: Page) {
  await pickUp(page, column(page, 'Review').getByTitle('Drag to reorder'));
  // The first column as the board draws it now, which a column reorder still in flight may have changed.
  await hoverTo(page, await atFraction(page.locator('main [role="group"]').first(), 0.1));
  // The columns slide by transform, so the painted order is read: Review is over the first slot.
  await expect.poll(async () => (await paintedColumnNames(page))[0]).toBe('Review');
}

// The columns' names by their painted place, left to right. Reads the screen.
async function paintedColumnNames(page: Page): Promise<string[]> {
  const groups = page.locator('main [role="group"]');
  const placed = await Promise.all(
    Array.from({ length: await groups.count() }, async (_, i) => ({
      name: (await groups.nth(i).getAttribute('aria-label')) ?? '',
      x: (await paintedBoxOf(groups.nth(i))).x,
    })),
  );
  return placed.sort((a, b) => a.x - b.x).map(c => c.name);
}

// The columns' names in the order the board draws them. Reads the screen.
const columnNames = (page: Page) =>
  page.locator('main [role="group"]').evaluateAll(els => els.map(el => el.getAttribute('aria-label')));

const SERVER_COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

for (const cause of CAUSES) {
  test(`DRAG-6.25, DRAG-6.26: ${CAUSE_NAME[cause]} stops a column drag, which saves no reorder and moves no item`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const cue = await recordStopCue(page);
    const scene = await columnScene(page, request, projectSidebar, cause);
    const earlier = await scene.earlier(cause);
    const read = await landStop(page, earlier, scene.boardId, () => dragReviewTowardFirst(page));
    await expectDragOver(page);
    await expectBannerSays(page, cause);

    read.release();
    await expect(article(column(page, 'Todo'), 'Item X')).toBeVisible();
    await scene.expectServerState(cause);
    expect(await columnNames(page)).toEqual(SERVER_COLUMNS);
    await expectBannerSays(page, cause);
    expect(await cue.added()).toEqual([sentenceFor(cause)]);
    expect(await cue.removed()).toBe(0);
    expect(await cue.changed()).toEqual([]);
    // Neither the stopped column nor any item has the flash.
    await expect(flashingRows(page)).toHaveCount(0);
    expect(await cue.flashed()).toEqual([]);

    // The interrupted drag wrote no reorder and moved no item, then or on release: the only writes are the
    // cause's own earlier ones.
    const sent = (matching: RegExp) => scene.writes.filter(w => matching.test(w.url)).length;
    const reorders = cause === 'failed-column-reorder' ? 1 : 0;
    const itemWrites = { 'failed-item-drop': 1, 'stale-reindex': 2, 'failed-column-reorder': 0 }[cause];
    expect(sent(/\/api\/columns\/reorder$/)).toBe(reorders);
    expect(sent(/\/api\/items\//)).toBe(itemWrites);
    await page.mouse.up();
    await settledWrites(page, scene.writes);
    expect(sent(/\/api\/columns\/reorder$/)).toBe(reorders);
    expect(sent(/\/api\/items\//)).toBe(itemWrites);
    await earlier.dispose();
  });
}

test('DRAG-6.26: after a column drag is stopped, a click leaves the banner and the next drag clears it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cause = 'failed-item-drop';
  const scene = await columnScene(page, request, projectSidebar, cause);
  const earlier = await scene.earlier(cause);
  const read = await landStop(page, earlier, scene.boardId, () => dragReviewTowardFirst(page));
  read.release();
  await expect(article(column(page, 'Todo'), 'Item X')).toBeVisible();
  await page.mouse.up();
  await expectBannerSays(page, cause);

  const onBanner = await center(stopBanner(page));
  await page.mouse.click(onBanner.x, onBanner.y);
  await expectBannerSays(page, cause);
  const elsewhere = await atFraction(column(page, 'Done'), 0.8);
  await page.mouse.click(elsewhere.x, elsewhere.y);
  await expectBannerSays(page, cause);

  await pickUp(page, article(column(page, 'In Progress'), 'Item B'));
  await expect(stopBanner(page)).toHaveCount(0);
  await cancel(page);
  await earlier.dispose();
});

test('DRAG-6.26: the banner of a stopped column drag expires at its lifetime from the stop, and the reload does not restart it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cause = 'stale-reindex';
  const scene = await columnScene(page, request, projectSidebar, cause);
  const lifetime = scene.tuning.forcedStopCueMs;
  const earlier = await scene.earlier(cause);
  const read = await landStop(page, earlier, scene.boardId, () => dragReviewTowardFirst(page));
  const loading = Math.floor(lifetime / 2);
  await advance(page, loading);
  await expectBannerSays(page, cause);

  read.release();
  await expect(article(column(page, 'Todo'), 'Item X')).toBeVisible();
  await advance(page, lifetime - loading - 1);
  await expectBannerSays(page, cause);
  await advance(page, 1);
  await expect(stopBanner(page)).toHaveCount(0);
  await page.mouse.up();
  await earlier.dispose();
});

// D13: the flash window, measured from the reloaded board's first draw.
const WINDOW_LIFETIME = { forcedStopCueMs: 10_000 };

for (const cause of CAUSES) {
  test(`DRAG-6.27: after ${CAUSE_NAME[cause]}, a reload longer than the window spends none of it, and the flash ends at its length with the banner still up`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const scene = await columnScene(page, request, projectSidebar, cause, WINDOW_LIFETIME);
    const earlier = await scene.earlier(cause);
    const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);

    // The reload takes longer than the window while the board loads.
    await advance(page, FLASH_MS + 100);
    await expect(loadingBoard(page)).toBeVisible();

    // The flash starts at the first draw and lasts the whole window.
    read.release();
    await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
    await advance(page, FLASH_MS - 1);
    await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
    await advance(page, 1);
    await expect(scene.xRow()).not.toHaveAttribute('data-stop-flash', 'true');
    await expectBannerSays(page, cause);
    await page.mouse.up();
    await earlier.dispose();
  });
}

test('DRAG-6.27: a new drag before the window ends ends the flash at its pickup, and ending that drag does not replay it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cause = 'failed-item-drop';
  const cue = await recordStopCue(page);
  const scene = await columnScene(page, request, projectSidebar, cause, WINDOW_LIFETIME);
  const earlier = await scene.earlier(cause);
  const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);
  read.release();
  await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
  await page.mouse.up();

  await advance(page, Math.floor(FLASH_MS / 2));
  await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
  await pickUp(page, article(column(page, 'In Progress'), 'Item B'));
  await expect(flashingRows(page)).toHaveCount(0);
  const flashedBefore = (await cue.flashed()).length;

  // Ending the new drag replays nothing, straight away or once the window would have run out.
  await cancel(page);
  await expect(flashingRows(page)).toHaveCount(0);
  expect((await cue.flashed()).length).toBe(flashedBefore);
  await advance(page, FLASH_MS);
  await expect(flashingRows(page)).toHaveCount(0);
  expect((await cue.flashed()).length).toBe(flashedBefore);
  await earlier.dispose();
});

test('DRAG-6.27: another reload before the window ends ends the flash at its start, and draws none of its own', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cause = 'failed-item-drop';
  const cue = await recordStopCue(page);
  const scene = await columnScene(page, request, projectSidebar, cause, WINDOW_LIFETIME);
  const inProgress = column(page, 'In Progress');
  const earlier = await scene.earlier(cause);

  // A second drop, whose answer is held too: its refusal is the reload that comes with no drag running.
  const later = await holdForcedStopCause(page, 'failed-item-drop');
  await pickUp(page, article(inProgress, 'Item C'));
  await hoverTo(page, await topQuarter(article(page, 'Item B')));
  await release(page);
  await later.arrived();

  const read = await landStop(page, earlier, scene.boardId, scene.pickUpX);
  read.release();
  await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
  await page.mouse.up();
  await advance(page, Math.floor(FLASH_MS / 2));
  await expect(scene.xRow()).toHaveAttribute('data-stop-flash', 'true');
  const flashedBefore = (await cue.flashed()).length;

  const reloaded = boardReload(page);
  await later.land();
  await reloaded;
  await expect(flashingRows(page)).toHaveCount(0);
  // The board that reload drew has X in it, drawn without a flash.
  await expect(scene.xRow()).toBeVisible();
  await expect(scene.xRow()).not.toHaveAttribute('data-stop-flash', 'true');
  await expect(article(inProgress, 'Item C')).toBeVisible();
  await expect.poll(() => titlesIn(inProgress)).toEqual(['Item A', 'Item B', 'Item C']);
  await expect(flashingRows(page)).toHaveCount(0);
  expect((await cue.flashed()).length).toBe(flashedBefore);
  await later.dispose();
  await earlier.dispose();
});

// D09: nothing was in the user's hand to stop, so no cue shows.
async function expectNoCue(page: Page, cue: StopCueRecord) {
  await expect(stopBanner(page)).toHaveCount(0);
  await expect(flashingRows(page)).toHaveCount(0);
  expect(await cue.added()).toEqual([]);
  expect(await cue.flashed()).toEqual([]);
}

test('DRAG-6.22: an Escape cancel shows no banner and no flash', async ({ page, request, projectSidebar }) => {
  const cue = await recordStopCue(page);
  const scene = await columnScene(page, request, projectSidebar, 'failed-item-drop');
  await scene.pickUpX();
  await cancel(page);
  await expectNoCue(page, cue);
  expect(await settledWrites(page, scene.writes)).toHaveLength(0);
});

test('DRAG-6.22: a release where nothing is written shows no banner and no flash', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cue = await recordStopCue(page);
  const s = await seed(request);
  const tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await openBoard(page, projectSidebar);
  const writes = watchWrites(page);
  await pickUp(page, article(column(page, 'Todo'), 'Item X'));
  await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
  await awaitPoppedOut(page, tuning);
  await release(page);
  await expectNoCue(page, cue);
  expect(await settledWrites(page, writes)).toHaveLength(0);
  expect(await titlesIn(column(page, 'Todo'))).toEqual(['Item X']);
  expect(await columnOrder(request, s.workflow.id, s.phase.inProgress.id)).toBe('ABC');
});

test('DRAG-6.22: a Stub released at its own gap and depth shows no banner and no flash', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cue = await recordStopCue(page);
  const scene = await treeScene(page, request, projectSidebar, 'failed-item-drop', 'section');
  const { p, x } = scene.ids;

  // X is picked up and set back down where the pointer first pressed, so its ghost is in its own slot:
  // projection `8:0:true`, gap index 8 (after all eight of P's rows without X: A, Q, R, R1, R1a, R2, T, B)
  // at depth 0 among P's children.
  const from = await pickUp(page, itemRow(page, x).getByRole('button', { name: 'X', exact: true }));
  await awaitDragContext(page, descendantsRegionKey(p));
  await hoverTo(page, from);
  await awaitProjection(page, '8:0:true');
  await release(page);
  await expectNoCue(page, cue);
  expect(await settledWrites(page, scene.writes)).toHaveLength(0);
});

for (const cause of CAUSES) {
  for (const ending of ['released', 'cancelled'] as const) {
    test(`DRAG-6.22: ${CAUSE_NAME[cause]} that resyncs the board with no drag running, after a drag was ${ending}, shows no banner and no flash`, async ({
      page,
      request,
      projectSidebar,
    }) => {
      const cue = await recordStopCue(page);
      const scene = await columnScene(page, request, projectSidebar, cause);
      const earlier = await scene.earlier(cause);
      // The drag that made the earlier write has been released. For the second form a later drag is picked
      // up and cancelled too. The held answer then lands with nothing in the user's hand.
      if (ending === 'cancelled') {
        await scene.pickUpX();
        await cancel(page);
      }
      await earlier.trigger();
      await scene.expectServerState(cause);
      await expectNoCue(page, cue);
      await earlier.dispose();
    });
  }
}
