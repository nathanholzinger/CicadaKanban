import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, fetchDefaultBoard } from '../helpers/seed';
import { pickUp, hoverTo, cancel, center, seedDragTuning, NO_POP } from '../helpers/dragGesture';

// Epic 3.5 Story 2 — docs/wiki/board-drag-interaction §4: every visible
// target is classified against the carried item at drag start, and that
// classification is what the board shows. Cases from
// docs/test-plans/board-drag-interaction/drag-2-target-classification.md.
//
// Asserts the *state* (the `data-drop-state` attribute), never the overlay's
// look — that's Story 8's. Nothing is dropped: the drag is picked up,
// hovered, and cancelled, so no write happens and no outcome is asserted.
//
// Story 4 made a Card a zoom-in target from its own containing column (wiki
// §1.1), so a hover that lingers on a deeply-nested Stub chain's own Card
// (this spec's own X -> D -> D1 / T1 -> T2 -> T3 fixtures, hovered while
// still locked to the same Todo column X started in) accumulates toward a
// genuine pop into it — and several real pointer-move steps across several
// hoverTo calls can accumulate enough wall-clock time to cross the default
// `cardPopInDelayMs` (or, for a genuine cross-column hover, `popDelayMs`/
// `popInDelayMs`). This spec was never about pop timing at all
// (classification never changes mid-drag, hover or not), so it seeds
// `NO_POP` (tests/helpers/dragGesture.ts) purely to keep an incidental pop
// from ever firing here.

const PROJECT = 'Drag Classification Project';

function target(page: Page, id: string) {
  return page.locator(`[data-item-id="${id}"]`);
}

const createItem = seedItem;

test.describe('drag-target classification', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${API}/test/reset`);
  });

  test('every visible target is classified at pickup, stays classified while hovering, and clears on cancel', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, PROJECT);
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const board = await fetchDefaultBoard(request, workflow.id);
    const cap: number = board.itemDepthCap;
    expect(typeof cap).toBe('number');

    // X: the carried Card, with an attached Stub S, a detached child D (its
    // own Card) and D's own child D1 — DRAG-2.2/2.5's fixture.
    const x = await createItem(request, { title: 'X', projectId: project.id, workphaseId: todo.id });
    const s = await createItem(request, { title: 'S', parentId: x.id });
    const d = await createItem(request, { title: 'D', parentId: x.id, isAttached: false, workphaseId: todo.id });
    const d1 = await createItem(request, { title: 'D1', parentId: d.id });

    // X's subtree is 2 levels tall (X -> D -> D1, through the detached
    // branch — ATT-4.5), so the deepest legal parent for X sits at depth
    // cap - 1 - 2. A chain of nested Stubs down to exactly that depth ends
    // in T_ok; one more level under it is T_over — DRAG-2.3/2.7's fixture,
    // parameterized on the cap the board reports, never a literal.
    const xHeight = 2;
    const okDepth = cap - 1 - xHeight;
    expect(okDepth).toBeGreaterThanOrEqual(1);
    let deepest = await createItem(request, { title: 'T1', projectId: project.id, workphaseId: todo.id });
    for (let depth = 2; depth <= okDepth; depth++) {
      deepest = await createItem(request, { title: `T${depth}`, parentId: deepest.id });
    }
    const tOk = deepest;
    const tOver = await createItem(request, { title: `T${okDepth + 1}`, parentId: tOk.id });

    // V: an unrelated Card in the other column, to hover across to.
    const v = await createItem(request, { title: 'V', projectId: project.id, workphaseId: inProgress.id });

    await seedDragTuning(page, NO_POP);
    await projectSidebar.openBoard(PROJECT);
    await expect(page.getByRole('article', { name: 'X', exact: true })).toBeVisible();

    // Nothing is classified before a drag begins.
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);

    await pickUp(page, page.getByRole('article', { name: 'X', exact: true }));

    const expectStates = async () => {
      await expect(target(page, v.id)).toHaveAttribute('data-drop-state', 'valid'); // DRAG-2.1
      await expect(target(page, tOk.id)).toHaveAttribute('data-drop-state', 'valid'); // DRAG-2.3, 2.7 (a Stub)
      await expect(target(page, tOver.id)).toHaveAttribute('data-drop-state', 'depth-capped'); // DRAG-2.3, 2.6
      for (const id of [x.id, d.id, d1.id]) {
        await expect(target(page, id).first()).toHaveAttribute('data-drop-state', 'cycle-forming'); // DRAG-2.2
      }
      // S is X's own attached child, so it renders only nested inside X's
      // own card — and Story 8 collapses that card's attached children
      // while it's the one being dragged (a fixed, small ghost height for
      // the carve-out math), so S isn't in the DOM at all right now, never
      // mind classified. D and D1 above are unaffected: D is detached (its
      // own card, not nested under X), so neither it nor its own child D1
      // depends on X's collapse.
      await expect(target(page, s.id)).toHaveCount(0);
    };
    await expectStates();

    // DRAG-2.4: hover across the board — over the other column, over V,
    // back over a Stub chain — and nothing changes.
    await hoverTo(page, await center(page.getByRole('group', { name: 'In Progress' })));
    await expectStates();
    await hoverTo(page, await center(target(page, v.id)));
    await expectStates();
    await hoverTo(page, await center(target(page, tOk.id)));
    await expectStates();

    await cancel(page);

    // The classification is per-drag: gone once the drag is, and nothing moved.
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);
    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'X', exact: true }),
    ).toBeVisible();
    const reloaded = await (await request.get(`${API}/items/${x.id}`)).json();
    expect(reloaded.workphaseId).toBe(todo.id);
    expect(reloaded.parentId).toBeNull();
  });

  test('a Stub drag is classified exactly like a Card would be — no blanket exclusion (Story 5, DRAG-2.7)', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const name = 'Stub Drag Classification Project';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [todo] = pickWorkphases(workflow, 'Todo');
    const p = await createItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
    const s1 = await createItem(request, { title: 'S1', parentId: p.id });
    const s2 = await createItem(request, { title: 'S2', parentId: p.id });
    const q = await createItem(request, { title: 'Q', projectId: project.id, workphaseId: todo.id });
    const sq = await createItem(request, { title: 'SQ', parentId: q.id });

    await projectSidebar.openBoard(name);
    await expect(target(page, s1.id)).toBeVisible();

    await pickUp(page, target(page, s1.id).getByRole('button', { name: 'S1' }));

    // The interim rule ("everything outside the parent's Stub list is
    // Inert") retired with Story 5: P, Q and Q's own Stub are ordinary
    // Valid targets now (P for the intermediate Card-layer stop, Q for the
    // zoom-in reparent, TC-4) — only S1 itself is Cycle-forming.
    await expect(target(page, s2.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(target(page, s1.id)).toHaveAttribute('data-drop-state', 'cycle-forming');
    await expect(target(page, p.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(target(page, q.id)).toHaveAttribute('data-drop-state', 'valid');
    await expect(target(page, sq.id)).toHaveAttribute('data-drop-state', 'valid');

    await cancel(page);
    await expect(page.locator('[data-drop-state]')).toHaveCount(0);
  });
});
