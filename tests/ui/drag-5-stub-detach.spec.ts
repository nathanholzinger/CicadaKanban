import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, fetchItem, fetchDefaultBoard } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  atFraction,
  topQuarter,
  awaitDragContext,
  seedDragTuning,
  NO_POP,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import { article, column } from '../helpers/boardLocators';
import { cardRegionKey, columnRegionKey, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

// Epic 3.5 Story 5 — docs/wiki/board-drag-interaction §1, §1.1, §6, §8;
// decisions ratified 2026-09-21. Cases from
// docs/test-plans/board-drag-interaction/drag-5-detach-and-overflow.md.
// TC-11's own two-pop cascade timing stays manual (threshold-timed); these
// assert reachability (`data-drag-context`) and write correctness.

const createItem = seedItem;

function stubRow(page: Page, itemId: string) {
  return page.locator(`[data-item-id="${itemId}"]`);
}

test.describe('Stub detach — a Stub drags through the Descendants/Card/Column layers', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test("DRAG-1.1 / TC-9 (sibling bullets): a Stub's drag starts at its containing Card's Descendants layer, and a same-parent reorder commits with no pop at all", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Sibling Reorder Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await createItem(request, { title: 'S1', parentId: p.id });
    await createItem(request, { title: 'S2', parentId: p.id });
    // X starts *last*, not adjacent to S1 — a genuine two-hop move to the
    // front (TC-9's first bullet), rather than a move to a neighbor it's
    // already sitting beside (which the server would resolve to nearly the
    // same slot it already occupies).
    const x = await createItem(request, { title: 'X', parentId: p.id });
    const originalX = await fetchItem(request, x.id);

    await seedDragTuning(page, NO_POP); // nothing about this case is timing-dependent
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P')).toBeVisible();

    await pickUp(page, stubRow(page, x.id).getByRole('button', { name: 'X' }));
    // The drag starts already inside the Descendants layer — no pop needed
    // to reach it (contrast a Free Card, which always starts at Board/
    // Column layer and only reaches a Card by zooming in).
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Toward the front of the list — dnd-kit's own sortable strategy
    // shifts S1/S2 live as X's ghost approaches, same reflow `dragTo`'s own
    // header comment documents for a cross-column drop; re-aiming after
    // the first pass settles targets the real, current layout (which of
    // S1/S2 ends up the resolved anchor is the sortable strategy's own
    // call, not this test's concern — a real anchor+side commit is).
    await hoverTo(page, await topQuarter(stubRow(page, s1.id)));
    await hoverTo(page, await topQuarter(stubRow(page, s1.id)));
    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(p.id);
    expect(updated.isAttached).toBe(1);
    // A genuine reorder committed — not the identity of "stayed exactly
    // where it was" (decision 2).
    expect(updated.position).not.toBe(originalX.position);

    // Still nested — never became Free, never left the Card.
    await expect(article(page, 'P').getByText('X')).toBeVisible();
    await expect(page.getByRole('article', { name: 'X', exact: true })).not.toBeVisible();
  });

  test("decision 1: a grandchild Stub's drag starts in its containing Card's whole section, not its parent Stub's sub-list", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Grandchild Stub Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await createItem(request, { title: 'S1', parentId: p.id });
    const s1a = await createItem(request, { title: 'S1a', parentId: s1.id });

    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard(name);
    await expect(article(page, 'P').getByText('S1a')).toBeVisible();

    await pickUp(page, stubRow(page, s1a.id).getByRole('button', { name: 'S1a' }));
    // The section is P's whole Descendants layer, not S1's — even though
    // S1a's real, direct parent is S1, not P.
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await release(page);

    const unchanged = await fetchItem(request, s1a.id);
    expect(unchanged.parentId).toBe(s1.id); // a release with nothing hovered writes nothing
  });

  test('TC-12: released back at its own containing Card\'s layer, nothing is written — the Card layer\'s auto-drop for its own Stub is "set it back down"', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Set Back Down Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    await createItem(request, { title: 'S1', parentId: p.id });
    const x = await createItem(request, { title: 'X', parentId: p.id });
    await createItem(request, { title: 'S2', parentId: p.id });
    const before = await fetchItem(request, x.id);

    // A real, short pop-out threshold — but popInDelayMs/cardPopInDelayMs
    // never complete, so nothing beyond the first pop can fire.
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    await pickUp(page, stubRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // A point inside P's own card body (its title area) but outside the
    // attached-children section — pops Descendants → Card, and then stays
    // there: the cursor never leaves the Card's own box, so the second
    // pop-out clock (Card → column) never even starts.
    await hoverTo(page, await atFraction(article(page, 'P'), 0.08));
    await awaitDragContext(page, cardRegionKey(p.id), tuning.popDelayMs + 2000);

    await release(page);

    const after = await fetchItem(request, x.id);
    expect(after.parentId).toBe(p.id);
    expect(after.isAttached).toBe(1);
    expect(after.position).toBe(before.position);
    await expect(article(page, 'P').getByText('X')).toBeVisible();
  });

  test('TC-1/TC-2/TC-10: two pops detach the Stub into its own column — attachment clears, parentId and the inherited workphase are preserved, and it renders as a Card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Detach To Column Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = board.columns.find((c: { entryWorkphaseId: string }) => c.entryWorkphaseId === todo.id);
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await createItem(request, { title: 'X', parentId: p.id });
    // A second, unrelated Card — so the column has somewhere unambiguously
    // outside P's own (tall, 1-child) card to rest the cursor. P's card
    // shrinks the moment X's placement previews Free (its own nested row
    // leaves), which would otherwise make "past the column's content" land
    // back inside P itself.
    const q = await createItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    await pickUp(page, stubRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    // Q sits outside P's whole card, so both pop-outs eventually fire on
    // the shared clock, back to back, with no further pointer movement
    // (wiki §1.1 rule 2/3) — cardPopInDelayMs is never (POP_OUT_ONLY), so
    // resting on Q's card at column layer goes no further.
    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    await awaitDragContext(page, columnRegionKey(todoCol.id), tuning.popDelayMs * 2 + 3000);

    // TC-10: from the moment it's locked in the column, it's a Card — gone
    // from P's own section, present as its own article (scoped to the
    // column, since the floating DragOverlay copy also matches by role and
    // name mid-drag).
    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(column(page, 'Todo').getByRole('article', { name: 'X', exact: true })).toBeVisible();

    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.isAttached).toBe(0); // detached
    expect(updated.parentId).toBe(p.id); // item-attachment §11: parent preserved
    expect(updated.workphaseId).toBe(todo.id); // TC-2: already covered — no workphase change
    expect(updated.position).not.toBeNull(); // now positioned in the workflow-wide scope

    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(column(page, 'Todo').getByRole('article', { name: 'X', exact: true })).toBeVisible();
  });

  test("TC-4: zoomed into a different Card instead, it reparents — attached as that Card's last child, never a detach that leaves parentId at P", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Reparent To Different Card Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = board.columns.find((c: { entryWorkphaseId: string }) => c.entryWorkphaseId === todo.id);
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await createItem(request, { title: 'X', parentId: p.id });
    const q = await createItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });

    // The first two pops (out of Descendants, out of the Card) run the
    // shared clock back to back, same as TC-1's own test; landing squarely
    // on Q the whole time lets the third clock (cardPopInDelayMs, the
    // zoom-in into Q) start the moment the second pop lands.
    const tuning = await seedDragTuning(page, {
      popDelayMs: 150,
      popInDelayMs: NO_POP.popInDelayMs,
      cardPopInDelayMs: 150,
    });
    await projectSidebar.openBoard(name);

    await pickUp(page, stubRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));

    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    // The second pop (Card → column) lands the moment P's own card shrinks
    // — losing X's nested row — which shifts Q. Wait for that pop to land,
    // then re-aim at Q's *now-settled* position before waiting on the
    // third clock (cardPopInDelayMs): the same reflow `dragTo`'s own header
    // comment documents, here caused by the drag itself rather than a
    // cross-column move.
    await awaitDragContext(page, columnRegionKey(todoCol.id), tuning.popDelayMs * 2 + 2000);
    await hoverTo(page, await atFraction(article(page, 'Q'), 0.5));
    await awaitDragContext(page, cardRegionKey(q.id), tuning.cardPopInDelayMs + 2000);

    await release(page);

    const updated = await fetchItem(request, x.id);
    expect(updated.parentId).toBe(q.id);
    expect(updated.isAttached).toBe(1);
    expect(updated.workphaseId).toBe(todo.id); // inherited from Q, same column here

    await expect(article(page, 'P').getByText('X')).not.toBeVisible();
    await expect(article(page, 'Q').getByText('X')).toBeVisible();
  });

  // Decision 4's own regression guard (2026-09-21): a Stub's row
  // unregisters from the Descendants section and re-registers as a Card
  // row for the same id mid-drag. If dnd-kit's own bookkeeping (or a future
  // regression reintroducing a type/role mismatch) ever left that id
  // confused about what kind of row it now is, the *very next* drag of the
  // same item — an ordinary reorder — would be the first thing to break.
  test('decision 4 regression: immediately after a detach, the same item drags and reorders normally as a Card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Post Detach Redrag Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const board = await fetchDefaultBoard(request, workflow.id);
    const todoCol = board.columns.find((c: { entryWorkphaseId: string }) => c.entryWorkphaseId === todo.id);
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const x = await createItem(request, { title: 'X', parentId: p.id });
    const other = await createItem(request, { title: 'Other', projectId: project.id, workphaseId: todo.id });

    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(name);

    // Detach X — same cascade as TC-1's own test above, resting on "Other"
    // (outside P's whole card, unaffected by P's own shrink) rather than
    // "past the column's content," which P's tall, single-child card would
    // otherwise swallow entirely.
    await pickUp(page, stubRow(page, x.id).getByRole('button', { name: 'X' }));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await hoverTo(page, await atFraction(article(page, 'Other'), 0.5));
    await awaitDragContext(page, columnRegionKey(todoCol.id), tuning.popDelayMs * 2 + 3000);
    await release(page);
    await expect(page.getByRole('article', { name: 'X', exact: true })).toBeVisible();

    // Now drag X again — a plain Card, reordered against Other. If the
    // active row's own `data.current` had gone stale (still reading as a
    // Stub, or the collision closure still scoping to a Descendants
    // sibling list), this would either fail to move at all or collide with
    // the wrong candidates.
    await pickUp(page, article(page, 'X'));
    await awaitDragContext(page, columnRegionKey(todoCol.id));
    await hoverTo(page, await atFraction(article(page, 'Other'), 0.15)); // top quarter -> anchor before
    await release(page);

    const reordered = await fetchItem(request, x.id);
    const otherAfter = await fetchItem(request, other.id);
    expect(reordered.parentId).toBe(p.id); // preserved from the earlier detach
    expect(reordered.isAttached).toBe(0);
    expect(reordered.position).toBeLessThan(otherAfter.position);
  });
});
