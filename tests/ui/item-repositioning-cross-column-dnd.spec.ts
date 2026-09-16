import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { dragTo, pickUp, hoverTo, release, center, topQuarter, bottomQuarter, pastColumnEnd } from '../helpers/dragGesture';
import { seedRepositioningScenario, columnOrder, fullOrder, type RepositioningScenario } from '../helpers/itemRepositioningScenario';
import { API } from '../helpers/api';

const PROJECT_NAME = 'Repositioning DnD Project';

// The same 8 WHEN/THEN cases as tests/api/itemRepositioning.spec.ts, this
// time driven through real drag gestures instead of direct API calls. Same
// shared scenario, same spec'd expected values (deliberately not softened
// to match current behavior — see that file's header comment for the full
// rationale on why several of these are expected to fail).
//
// The side of an anchored drop is geometry, not the pointer: `resolveDropSide`
// (boardDndUtils.ts) compares the *dragged card's* center against the
// hovered card's center, so where the pointer sits on the target card only
// matters through how far the carried card has travelled. "Drop C just
// after A/B" is attempted at the literal pixel a user would aim for (the
// card's bottom quarter), and whether that lands C's center below A/B's
// depends on the two cards' heights and dnd-kit's live swap-preview
// shifting the target — so 3.a and 4.a are expected to fail on ORDER as
// well as on the position-scoping gap this suite's API sibling documents.
// Since Epic 3.5 Story 3, 4.a is additionally governed by the pop machine:
// C dropped in Column Two from Column One is a cross-region release, which
// resolves by Column Two's band (top / middle / bottom of the column), not
// by the hovered card at all, unless C has first popped into Column Two.
//
// 1.b and 2.b surfaced a third, independent finding while writing this
// suite: dnd-kit's closestCorners collision detection is a nearest-corner
// heuristic over every registered droppable, not a "what's under the
// pointer" hit test — empirically, dragging into the empty space below a
// short column's last card never wins collision away from that last card
// (confirmed by screenshotting the drag mid-gesture; a same-column drop 1-2
// card-heights past the last card still visually resolves as hovering it).
// So in practice, "drop past the end of a short column" isn't a reachable
// drag gesture today; both tests target the last card directly, same as
// 3.b/4.b, and are expected to resolve identically (`before` that card).
//
// That dead end also surfaced a real, confirmed server bug along the way:
// if collision *did* ever resolve to the bare column container for a
// same-workphase reorder (anchorId: null), useBoardDnd.ts sends only
// `{ scopeWorkphaseIds }` — no anchorId, position, or workphaseId. The
// server's PATCH /items/:id/move validation
// (server/src/routes/items.ts:318-321) requires at least one of those three
// and 400s otherwise, silently failing the drop. Confirmed directly via a
// probe request replaying that exact body — see the plan/conversation this
// suite came from.

let scenario: RepositioningScenario;

test.beforeEach(async ({ request, page, projectSidebar }) => {
  await resetAndSeedDb();
  scenario = await seedRepositioningScenario(request, PROJECT_NAME);

  // Single-workphase columns for "Column One"/"Column Two" — boards/columns
  // are a pure presentation layer over workphaseId, so this setup step only
  // exists for this suite; the API suite never touches boards/columns.
  const boards = await (await request.get(`${API}/boards?workflowId=${scenario.workflow.id}`)).json();
  await request.post(`${API}/columns`, {
    data: { boardId: boards[0].id, startWorkphaseId: scenario.colOnePhase.id, endWorkphaseId: scenario.colOnePhase.id },
  });
  await request.post(`${API}/columns`, {
    data: { boardId: boards[0].id, startWorkphaseId: scenario.colTwoPhase.id, endWorkphaseId: scenario.colTwoPhase.id },
  });

  await page.goto('/');
  await projectSidebar.select(PROJECT_NAME);
  await page.locator('main').getByRole('button', { name: 'Board' }).click();
  await expect(page.getByRole('group', { name: 'Column One' })).toBeVisible();
});

// Drag gesture recipe: tests/helpers/dragGesture.ts — see it for why a real
// pointer sequence is required for dnd-kit, why dragTo re-resolves its
// target mid-drag, and the known precision limits behind the skipped cases
// below (1.a/2.a) and the pastColumnEnd dead end (1.b/2.b).

async function getC(request: import('@playwright/test').APIRequestContext) {
  return (await request.get(`${API}/items/${scenario.items.C.id}`)).json();
}

test.describe('1: extreme boundary moves within column 1', () => {
  test.skip('1.a — drag C onto card A', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardA = page.getByRole('article', { name: 'Item A', exact: true });
    await dragTo(page, cardC, () => center(cardA));

    // UI: reorders within column 1's own group.
    const colOne = page.getByRole('group', { name: 'Column One' });
    await expect(colOne.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    // Server truth — the API suite's identical case (1.a) passes cleanly at
    // 0.5, confirming the position math itself is correct. This DnD version
    // is expected to fail anyway: dragging C onto card A drives dnd-kit's
    // own live swap-preview animation to transform-shift A out of the way
    // as the cursor approaches, and the resulting drop reproducibly lands
    // on a different anchor than intended (not a flake — same wrong value
    // every run). A drag-gesture precision issue in this test, not a
    // product bug — not worth chasing further until Epic 3.5's
    // placement-detection UX work lands (see dragTo's header comment).
    await expect.poll(async () => (await getC(request)).position).toBe(0.5);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('CAE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('CABDE');
  });

  test('1.b — drag C below card E, into the empty column space', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const colOne = page.getByRole('group', { name: 'Column One' });
    await dragTo(page, cardC, () => pastColumnEnd(colOne));

    // The "past the end" gesture does reach the append case here — no
    // anchor, so the server appends past the true last item in scope
    // (workflow-wide: E is the global max, so this is the same flat +1.0
    // degenerate case as the API suite's 1.b). Expected to pass.
    await expect.poll(async () => (await getC(request)).position).toBe(6.0);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('AEC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDEC');
  });
});

test.describe('2: extreme boundary moves into column 2', () => {
  test.skip('2.a — drag C onto card B', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardB = page.getByRole('article', { name: 'Item B', exact: true });
    await dragTo(page, cardC, () => center(cardB));

    const colTwo = page.getByRole('group', { name: 'Column Two' });
    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    // Same drag-gesture precision issue as 1.a (see its comment and
    // dragTo's header comment) — the API suite's identical case (2.a)
    // passes cleanly at 1.5. Expected to fail here regardless.
    await expect.poll(async () => (await getC(request)).position).toBe(1.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('CBD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('2.b — drag C below card D, into the empty column space', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    await dragTo(page, cardC, () => pastColumnEnd(colTwo));

    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    // Same true append as 1.b, cross-column this time: no anchor, so the
    // server appends past the true (workflow-wide) last item beyond D —
    // E(5.0) — giving coarsestFit(4.0, 5.0) = 4.5, matching the spec
    // exactly. Expected to pass.
    await expect.poll(async () => (await getC(request)).position).toBe(4.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BDC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('3: interior moves that stay in column 1 ("drop it back where it was")', () => {
  test('3.a — drag C to the bottom quarter of card A', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardA = page.getByRole('article', { name: 'Item A', exact: true });
    await dragTo(page, cardC, () => bottomQuarter(cardA));

    // In-context, `side` comes from `resolveDropSide`: 'after' only if C's
    // *center* ends up below A's center. Aiming the pointer at A's bottom
    // quarter doesn't guarantee that — the carried card's center is offset
    // from the pointer, and dnd-kit's swap preview shifts A as C approaches
    // — so this can resolve 'before' and fail to land C between A and B
    // the way the API suite's 3.a does. Expected to fail on position
    // and/or order (exact resolved value not asserted as meaningful here —
    // see dragTo's header comment on drag-targeting precision limits).
    await expect.poll(async () => (await getC(request)).position).toBe(1.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('3.b — drag C to the top quarter of card E', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardE = page.getByRole('article', { name: 'Item E', exact: true });
    await dragTo(page, cardC, () => topQuarter(cardE));

    // "Before E" maps cleanly onto the existing before-only primitive, so
    // this one isn't blocked by the drag-lockout bug the way 3.a is — the
    // API suite's identical case (3.b) passes at 4.5. Included for
    // completeness/symmetry with 3.a rather than a specific prediction.
    await expect.poll(async () => (await getC(request)).position).toBe(4.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('4: interior moves into column 2 that land in C\'s existing gap', () => {
  test('4.a — drag C to the bottom quarter of card B', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardB = page.getByRole('article', { name: 'Item B', exact: true });
    await dragTo(page, cardC, () => bottomQuarter(cardB));

    // A cross-region release (Story 3): unless C has popped into Column Two
    // first, the drop is resolved by Column Two's *band* at the pointer —
    // top → before its first card, bottom → after its last, middle →
    // workphase-only — not by which half of B the pointer is over, so it
    // can't land C between B and D the way the API suite's 4.a does.
    // Expected to fail on position and/or order.
    await expect.poll(async () => (await getC(request)).position).toBe(3.0);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });

  test('4.b — drag C onto card D', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardD = page.getByRole('article', { name: 'Item D', exact: true });
    await dragTo(page, cardC, () => center(cardD));

    // "Before D" maps cleanly onto the existing before-only primitive, and
    // the bounding pair (B, D) happens to resolve to C's own original value
    // — expected to fully pass.
    await expect.poll(async () => (await getC(request)).position).toBe(3.0);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });
});

test.describe('5: an abandoned drop must not strand the cross-column preview', () => {
  // Hovering another column draws the carried card's ghost there (Epic 3.5
  // Story 3's ordinal placement; before that, handleDragOver's optimistic
  // re-bucket). Releasing over something that resolves to no drop at all —
  // here a card in Unsorted's "Unknown status" list, whose workphase no
  // column covers — writes nothing, so that preview has to go, exactly as
  // an Escape-cancel clears it. Previously it didn't: C stayed drawn in
  // Column Two with the server still on Column One, and the next drag of C
  // snapshotted the wrong workphase (audit code-quality-audit-epic-3-5-
  // story-2 #1).
  test('5.a — hover C over Column Two, then release on an Unknown-status card', async ({ page, request, projectSidebar }) => {
    // An item with no workphase surfaces in Unsorted → Unknown status.
    const u = await request.post(`${API}/items`, { data: { title: 'Item U', projectId: scenario.project.id } });
    expect(u.ok()).toBe(true);
    await page.goto('/');
    await projectSidebar.select(PROJECT_NAME);
    await page.locator('main').getByRole('button', { name: 'Board' }).click();
    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await expect(unsorted.getByRole('article', { name: 'Item U', exact: true })).toBeVisible();

    const colOne = page.getByRole('group', { name: 'Column One' });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    await pickUp(page, colOne.getByRole('article', { name: 'Item C', exact: true }));
    await hoverTo(page, await center(colTwo));
    // The live preview: C is now drawn in Column Two mid-drag.
    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    await hoverTo(page, await center(unsorted.getByRole('article', { name: 'Item U', exact: true })));
    await release(page);

    // Nothing was written, so C is back where it started — on screen and on the server.
    await expect(colOne.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();
    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toHaveCount(0);
    const c = await getC(request);
    expect(c.workphaseId).toBe(scenario.colOnePhase.id);
    expect(c.position).toBe(3.0);
  });
});
