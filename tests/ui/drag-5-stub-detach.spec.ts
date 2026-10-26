import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
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
  atFraction,
  topQuarter,
  awaitDragContext,
  seedDragTuning,
  clocksMargin,
  NO_POP,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import { article, column, itemRow } from '../helpers/boardLocators';
import { cardRegionKey, columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

// A Stub's drag through the Descendants, Card and Column layers. The cases
// assert reachability (`data-drag-context`) and write correctness.

test.describe('Stub detach — a Stub drags through the Descendants/Card/Column layers', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test("DRAG-1.1, DRAG-5.9: a Stub's drag starts at its containing Card's Descendants layer, and a same-parent reorder commits with no pop at all", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Sibling Reorder Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    await seedItem(request, { title: 'S2', parentId: p.id });
    // X starts *last*, not adjacent to S1 — a genuine two-hop move to the
    // front (DRAG-5.9's first bullet), rather than a move to a neighbor it's
    // already sitting beside (which the server would resolve to nearly the
    // same slot it already occupies).
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    const originalX = await fetchItem(request, x.id);

    await seedDragTuning(page, NO_POP); // nothing about this case is timing-dependent
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();

    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    // The drag starts already inside the Descendants layer — no pop needed
    // to reach it (contrast a Free Card, which always starts at Board/
    // Column layer and only reaches a Card by zooming in).
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Toward the front of the list — dnd-kit's own sortable strategy
    // shifts S1/S2 live as X's ghost approaches, so the first pass is aimed
    // at rows that then move; re-aiming after it settles targets the real,
    // current layout (which of S1/S2 ends up the resolved anchor is the
    // sortable strategy's own call, not this test's concern — a real
    // anchor+side commit is).
    await hoverTo(page, await topQuarter(itemRow(page, s1.id)));
    await hoverTo(page, await topQuarter(itemRow(page, s1.id)));
    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(p.id);
    expect(updated.isAttached).toBe(1);
    // A genuine reorder committed — not the identity of "stayed exactly
    // where it was".
    expect(updated.position).not.toBe(originalX.position);

    // Still nested — never became Free, never left the Card.
    await expect(article(page, 'P').getByText('X')).toBeVisible();
    await expect(article(page, 'X')).not.toBeVisible();
  });

  test("DRAG-1.1, DRAG-5.13: a grandchild Stub's drag starts in its containing Card's whole section, not its parent Stub's sub-list", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Grandchild Stub Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s1a = await seedItem(request, { title: 'S1a', parentId: s1.id });

    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P').getByText('S1a')).toBeVisible();

    await pickUp(page, itemRow(page, s1a.id).getByRole('button', { name: 'S1a' }));
    // The section is P's whole Descendants layer, not S1's — even though
    // S1a's real, direct parent is S1, not P.
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await release(page);

    const unchanged = await fetchItem(request, s1a.id);
    expect(unchanged.parentId).toBe(s1.id); // a release with nothing hovered writes nothing
  });

  test("DRAG-5.13: a grandchild Stub popped out to its containing Card's layer keeps its row and its own children drawn, and a release there writes nothing", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Grandchild Stub Set Back Down Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await seedItem(request, { title: 'S1', parentId: p.id });
    const s1a = await seedItem(request, { title: 'S1a', parentId: s1.id });
    const s1a1 = await seedItem(request, { title: 'S1a1', parentId: s1a.id });
    const before = await fetchItem(request, s1a.id);

    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    await pickUp(page, itemRow(page, s1a.id).getByRole('button', { name: 'S1a', exact: true }));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await hoverTo(page, await atFraction(article(page, 'P'), 0.08));
    await awaitDragContext(page, cardRegionKey(p.id), clocksMargin(tuning.popDelayMs));

    // The Card layer's drop for P's own Stub is "set it back down", so its row
    // stays where it is, with its children, rather than drawing as an attach
    // ghost under S1 (which has no `data-item-id` and none of its children).
    await expect(itemRow(page, s1a.id)).toBeVisible();
    await expect(itemRow(page, s1a1.id)).toBeVisible();

    await release(page);

    const after = await fetchItem(request, s1a.id);
    expect(after.parentId).toBe(s1.id);
    expect(after.isAttached).toBe(1);
    expect(after.position).toBe(before.position);
    await expect(itemRow(page, s1a.id)).toBeVisible();
  });

  test('DRAG-5.12: released back at its own containing Card\'s layer, nothing is written — the Card layer\'s auto-drop for its own Stub is "set it back down"', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Set Back Down Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    await seedItem(request, { title: 'S1', parentId: p.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    await seedItem(request, { title: 'S2', parentId: p.id });
    const before = await fetchItem(request, x.id);

    // A real, short pop-out threshold — but popInDelayMs/cardPopInDelayMs
    // never complete, so nothing beyond the first pop can fire.
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // A point inside P's own card body (its title area) but outside the
    // attached-children section — pops Descendants → Card, and then stays
    // there: the cursor never leaves the Card's own box, so the second
    // pop-out clock (Card → column) never even starts.
    await hoverTo(page, await atFraction(article(page, 'P'), 0.08));
    await awaitDragContext(page, cardRegionKey(p.id), clocksMargin(tuning.popDelayMs));

    await release(page);

    const after = await fetchItem(request, x.id);
    expect(after.parentId).toBe(p.id);
    expect(after.isAttached).toBe(1);
    expect(after.position).toBe(before.position);
    await expect(article(page, 'P').getByText('X')).toBeVisible();
  });

  test('DRAG-5.1, DRAG-5.10: two pops detach the Stub into its own column — attachment clears, parentId and the inherited workphase are preserved, and it renders as a Card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Detach To Column Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = columnForWorkphase(board, todo.id);
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    // A second, unrelated Card — so the column has somewhere unambiguously
    // outside P's own (tall, 1-child) card to rest the cursor. P's card
    // shrinks the moment X's placement previews Free (its own nested row
    // leaves), which would otherwise make "past the column's content" land
    // back inside P itself.
    await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Q sits outside P's whole card, so both pop-outs eventually fire on
    // the shared clock, back to back, with no further pointer movement (one
    // layer per pop, DRAG-1.17) — cardPopInDelayMs is never (POP_OUT_ONLY), so
    // resting on Q's card at column layer goes no further.
    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(tuning.popDelayMs, tuning.popDelayMs));

    // DRAG-5.10: from the moment it's locked in the column, it's a Card — gone
    // from P's own section, present as its own article (scoped to the
    // column, since the floating DragOverlay copy also matches by role and
    // name mid-drag).
    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(article(column(page, 'Todo'), 'X')).toBeVisible();

    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.isAttached).toBe(0); // detached
    expect(updated.parentId).toBe(p.id); // parent preserved (ATT-7.1)
    expect(updated.workphaseId).toBe(todo.id); // DRAG-5.2: already covered — no workphase change
    expect(updated.position).not.toBeNull(); // now positioned in the workflow-wide scope

    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(article(column(page, 'Todo'), 'X')).toBeVisible();
  });

  // A yank far enough to clear both the Descendants and Card layers' own
  // pop-out distances in one pointer sample must cascade through every hop
  // it's due for — not strand at the intermediate Card layer until a timer
  // (disabled here — only the distance term can ever fire) self-corrects
  // it. A release in that exact window is what shows it: with
  // `pop.contextKey` reporting the fully-cascaded layer but the measured
  // regions still scoped to the intermediate one, `placementRegion` would
  // find nothing and the release would write nothing at all.
  test('DRAG-5.11, DRAG-1.14: a yank past both pop-out distances in one sample cascades Descendants -> Card -> Column, and an immediate release detaches', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Cascade Distance Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    // popDelayMs/popInDelayMs/cardPopInDelayMs are all NO_POP's "never"
    // value — nothing here can advance on a timer, or on a second
    // pointermove (there isn't one): only the cascade itself can ever move
    // past the first hop, and only the write proves it landed with a usable
    // region — a `data-drag-context` read can report the right layer while
    // the regions are still scoped wrong.
    await seedDragTuning(page, { ...NO_POP, popDistancePx: 10 });
    await projectSidebar.openBoard(name);

    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Well outside P's whole card — one hoverTo, one sample; the Card
    // fully contains its own Descendants section, so a point this far past
    // the Card is automatically far past the section too, and both hops'
    // own distance thresholds clear in the same evaluation.
    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.isAttached).toBe(0);
    expect(updated.parentId).toBe(p.id);
    expect(updated.workphaseId).toBe(todo.id);
  });

  test("DRAG-5.4, DRAG-4.12: zoomed into a different Card instead, it reparents — attached as that Card's last child, never a detach that leaves parentId at P", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Reparent To Different Card Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = columnForWorkphase(board, todo.id);
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    const q = await seedItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    // The first two pops (out of Descendants, out of the Card) run the
    // shared clock back to back, same as DRAG-5.1's own test; landing squarely
    // on Q the whole time lets the third clock (the zoom-in into Q:
    // cardZoomDwellMs, then cardPopInDelayMs) start the moment the second pop lands.
    const tuning = await seedDragTuning(page, {
      popDelayMs: 150,
      popInDelayMs: NO_POP.popInDelayMs,
      cardPopInDelayMs: 150,
    });
    await projectSidebar.openBoard(name);

    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    // The second pop (Card → column) lands the moment P's own card shrinks
    // — losing X's nested row — which shifts Q. Wait for that pop to land,
    // then re-aim at Q's *now-settled* position before waiting on the
    // third clock (the dwell, then cardPopInDelayMs): an aim taken before the
    // layout shifted points at where Q was, and here the drag itself caused
    // the shift.
    await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(tuning.popDelayMs, tuning.popDelayMs));
    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    await awaitDragContext(page, cardRegionKey(q.id), clocksMargin(tuning.cardZoomDwellMs, tuning.cardPopInDelayMs));

    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(q.id);
    expect(updated.isAttached).toBe(1);
    expect(updated.workphaseId).toBe(todo.id); // inherited from Q, same column here

    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(article(page, 'Q').getByText('X')).toBeVisible();
  });

  // A Stub's row unregisters from the Descendants section and re-registers
  // as a Card row for the same id mid-drag. If dnd-kit's own bookkeeping
  // (or a type/role mismatch) ever left that id
  // confused about what kind of row it now is, the *very next* drag of the
  // same item — an ordinary reorder — would be the first thing to break.
  test('immediately after a detach, the same item drags and reorders normally as a Card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Post Detach Redrag Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = columnForWorkphase(board, todo.id);
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id });
    await seedItem(request, { title: 'Other', projectId: project.id, workphaseId: todo.id });

    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    // Detach X — same cascade as DRAG-5.1's own test above, resting on "Other"
    // (outside P's whole card, unaffected by P's own shrink) rather than
    // "past the column's content," which P's tall, single-child card would
    // otherwise swallow entirely.
    await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await hoverTo(page, await atFraction(article(page, 'Other'), 0.5));
    await awaitDragContext(page, columnRegionKey(todoCol.id), clocksMargin(tuning.popDelayMs, tuning.popDelayMs));
    await release(page);
    await expect(article(page, 'X')).toBeVisible();

    // Now drag X again — a plain Card, reordered against Other. If the
    // active row's own `data.current` had gone stale (still reading as a
    // Stub, or the collision closure still scoping to a Descendants
    // sibling list), this would either fail to move at all or collide with
    // the wrong candidates.
    // Onto P, the column's first card: dnd-kit's shuffle gives the ghost
    // P's slot, so X lands first wherever the detach left it (the ghost's
    // slot decides, not a side of the card hovered).
    await pickUp(page, article(page, 'X'));
    await awaitDragContext(page, columnRegionKey(todoCol.id));
    await hoverTo(page, await atFraction(article(page, 'P'), 0.5));
    await release(page);

    const reordered = await fetchItem(request, x.id);
    const pAfter = await fetchItem(request, p.id);
    expect(reordered.parentId).toBe(p.id); // preserved from the earlier detach
    expect(reordered.isAttached).toBe(0);
    expect(reordered.position).toBeLessThan(pAfter.position);
  });
});
