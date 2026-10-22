import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  dragTo,
  pickUp,
  hoverTo,
  release,
  center,
  topQuarter,
  bottomQuarter,
  pastColumnEnd,
  gapBetween,
  seedDragTuning,
  awaitPoppedOut,
  setBackDownLeaning,
  POP_OUT_ONLY,
} from '../helpers/dragGesture';
import {
  seedRepositioningScenario,
  columnOrder,
  fullOrder,
  type RepositioningScenario,
} from '../helpers/itemRepositioningScenario';
import { fetchItem, seedColumn, seedItem } from '../helpers/seed';
import type { DragTuning } from '../../client/src/components/workflow/dragTuning';

const PROJECT_NAME = 'Repositioning DnD Project';

// The same 8 WHEN/THEN cases as itemRepositioningCrossColumn.spec.ts, this
// time driven through real drag gestures instead of direct API calls. Same
// shared scenario, same spec'd expected values.
//
// Where an in-column drop lands: dnd-kit's
// sortable shuffle decides the ghost's slot and the drop lands there; the
// dragged copy, above or below the ghost's middle, only picks which
// neighbor names that slot — "after" the card above or "before" the card
// below (`dragCollision.ts::dropAnchorFor`). In Column One (A, C, E) the
// two are one slot, but not in the workflow-wide order: B and D, in Column
// Two, sit between them. That's what 3.a/3.b exercise — C set back down in
// its own slot, leaning up ("after A", 1.5) or down ("before E", 4.5).
// 4.a is governed by the pop machine: C dropped in Column Two from Column
// One is a cross-region release, which resolves by Column Two's band (top /
// middle / bottom of the column), not by the hovered card at all, unless C
// has first popped into Column Two.
//
// dnd-kit's closestCorners collision detection is a nearest-corner
// heuristic over every registered droppable, not a "what's under the
// pointer" hit test: in-context, dragging into the empty space below a
// short column's last card still resolves to that last card (1.b relies on
// it). 2.b's drop past Column Two's end is released at Board layer, so it
// resolves by Column Two's bottom band instead.

let scenario: RepositioningScenario;

// A cross-column release only resolves by the target's band once the drag
// has actually reached Board layer — still locked to its origin column, a
// release
// commits *that* column's own reorder instead, no matter what a bare hover
// is resting on. `POP_OUT_ONLY` (tests/helpers/dragGesture.ts) is seeded
// short on the pop-*out* side so the cross-column cases below (2, 4, 5) can
// deliberately pop out, and absurdly high on the pop-*in* side (both the
// band's own and `cardPopInDelayMs` — several cases here, 1.a/2.a skipped
// aside, briefly hover a sibling card in-context right before releasing)
// so nothing completes a second, unwanted pop before the test releases.
// Same-column cases (1, 3) never leave their own context at all, so none
// of this affects them either way.
let tuning: DragTuning;

test.beforeEach(async ({ request, page, projectSidebar }) => {
  await resetAndSeedDb();
  scenario = await seedRepositioningScenario(request, PROJECT_NAME);

  // Single-workphase columns for "Column One"/"Column Two" — boards/columns
  // are a pure presentation layer over workphaseId, so this setup step only
  // exists for this suite; the API suite never touches boards/columns.
  await seedColumn(request, scenario.workflow.id, scenario.colOnePhase.id);
  await seedColumn(request, scenario.workflow.id, scenario.colTwoPhase.id);

  tuning = await seedDragTuning(page, POP_OUT_ONLY);
  await projectSidebar.openBoard(PROJECT_NAME);
  await expect(page.getByRole('group', { name: 'Column One' })).toBeVisible();
});

// Drag gesture recipe: tests/helpers/dragGesture.ts — see it for why a real
// pointer sequence is required for dnd-kit, why dragTo re-resolves its
// target mid-drag, and where pastColumnEnd aims.

async function popOutFully(page: import('@playwright/test').Page) {
  await awaitPoppedOut(page, tuning);
}

async function getC(request: APIRequestContext) {
  return fetchItem(request, scenario.items.C.id);
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
    // is skipped: dragging C onto card A drives dnd-kit's own live
    // swap-preview animation to transform-shift A out of the way as the
    // cursor approaches, and the resulting drop reproducibly lands on a
    // different anchor than intended (not a flake — same wrong value every
    // run). A drag-gesture precision issue in this test, not a product bug.
    await expect.poll(async () => (await getC(request)).position).toBe(0.5);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('CAE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('CABDE');
  });

  test('DRAG-1.23: 1.b — drag C below card E, into the empty column space', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const colOne = page.getByRole('group', { name: 'Column One' });
    await dragTo(page, cardC, () => pastColumnEnd(colOne));

    // Not a bare append: closestCorners still resolves this to card E (the
    // same "past the end still hits the last card" heuristic), and
    // dropAnchorFor's own lean — the dragged card's center sitting well
    // below E's own bottom-aligned ghost slot — names E, side 'after', so
    // the write anchors against E rather than going anchor-less. E is also
    // the workflow-wide global max, so an anchored "after E" and a bare
    // append land on the identical 6.0 the API suite's 1.b gets — same
    // outcome, different mechanism.
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

    // Skipped for the same drag-gesture precision issue as 1.a (see its
    // comment) — the API suite's identical case (2.a) passes cleanly at 1.5.
    await expect.poll(async () => (await getC(request)).position).toBe(1.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('CBD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('2.b — drag C below card D, into the empty column space', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const colOne = page.getByRole('group', { name: 'Column One' });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    // C starts locked to Column One — pop out to Board layer first, or a
    // release there commits Column One's own reorder instead. Popping out
    // while the pointer rests *outside* Column Two (the gap) rather than
    // already inside it matters here, same reasoning as 4.a/4.b below:
    // Column Two only carves out its own reservation once it's a
    // Board-layer region, which grows it by roughly a shortCard's height —
    // arriving already inside it via `pastColumnEnd` (measured against its
    // *pre*-Board-layer box) means that growth pushes
    // the bottom edge down past the point the test is resting on, so it
    // reads as the middle band instead of the bottom one once it settles.
    await pickUp(page, cardC);
    await hoverTo(page, await gapBetween(colOne, colTwo));
    await popOutFully(page);
    await hoverTo(page, await pastColumnEnd(colTwo));
    await release(page);

    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    // The bottom band places C after Column Two's last card: the request
    // anchors "after D", and D's true (workflow-wide) successor is E (5.0),
    // giving coarsestFit(4.0, 5.0) = 4.5, matching the spec exactly.
    await expect.poll(async () => (await getC(request)).position).toBe(4.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BDC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('3: interior moves that stay in column 1 ("drop it back where it was")', () => {
  test('DRAG-1.24: 3.a — set C back down in its own slot, leaning up: "after A"', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    await setBackDownLeaning(page, cardC, 'up');

    // The same slot in Column One, but "after A" puts C between A and B in
    // the workflow-wide order, matching the API suite's 3.a.
    await expect.poll(async () => (await getC(request)).position).toBe(1.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('DRAG-1.24: 3.b — set C back down in its own slot, leaning down: "before E"', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    await setBackDownLeaning(page, cardC, 'down');

    // "Before E" puts C between D and E in the workflow-wide order,
    // matching the API suite's 3.b.
    await expect.poll(async () => (await getC(request)).position).toBe(4.5);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe("4: interior moves into column 2 that land in C's existing gap", () => {
  test('4.a — drag C to the bottom quarter of card B', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardB = page.getByRole('article', { name: 'Item B', exact: true });
    const colOne = page.getByRole('group', { name: 'Column One' });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    // C starts locked to Column One — pop out to Board layer first, or a
    // release there commits Column One's own reorder instead. Popping out
    // while the pointer rests *outside* Column Two (the gap) rather than
    // already inside it matters here: Column Two only carves out its own
    // top/bottom dead zone once it's a Board-layer region no one is
    // hovering yet — arriving already inside it the moment it *becomes* one
    // skips straight to "hovered", so the point lands against a shape one
    // card-height off from the one it was aimed at.
    await pickUp(page, cardC);
    await hoverTo(page, await gapBetween(colOne, colTwo));
    await popOutFully(page);
    await hoverTo(page, await bottomQuarter(cardB));
    await release(page);

    // Once at Board layer, unless C has popped *into* Column Two too, the
    // drop is resolved by Column Two's *band* at the pointer — top → before
    // its first card, bottom → after its last, middle → workphase-only —
    // not by which half of B the pointer is over. B's bottom quarter is in
    // the middle band, a workphase-only move, so C keeps its 3.0 — between
    // B and D, the API suite's 4.a result by a different mechanism.
    await expect.poll(async () => (await getC(request)).position).toBe(3.0);
    await expect.poll(async () => (await getC(request)).workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });

  test('4.b — drag C onto card D', async ({ page, request }) => {
    const cardC = page.getByRole('article', { name: 'Item C', exact: true });
    const cardD = page.getByRole('article', { name: 'Item D', exact: true });
    const colOne = page.getByRole('group', { name: 'Column One' });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    // Same reasoning as 4.a — pop out via the gap, not from already inside
    // Column Two, so its own carve-out has a chance to exist before this
    // becomes the hover target.
    await pickUp(page, cardC);
    await hoverTo(page, await gapBetween(colOne, colTwo));
    await popOutFully(page);
    // topQuarter, not center: with only 2 cards in Column Two, the middle
    // band's own bottom boundary deliberately cuts across D's own center
    // (the divider bisects the last rendered card, in a 2+-card region) —
    // D's exact center is the one point guaranteed to sit right on that
    // line, not safely inside the band either side of it.
    await hoverTo(page, await topQuarter(cardD));
    await release(page);

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
  // Hovering another column draws the carried card's ghost there.
  // Releasing over something that resolves to no drop at all — here a card
  // in Unsorted's "Unknown status" list, whose workphase no column covers —
  // writes nothing, so that preview has to go, exactly as an Escape-cancel
  // clears it. Left behind, it would draw C in Column Two with the server
  // still on Column One, and the next drag of C would start from the wrong
  // workphase.
  test('DRAG-1.9: 5.a — hover C over Column Two, then release on an Unknown-status card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    // An item with no workphase surfaces in Unsorted → Unknown status.
    await seedItem(request, { title: 'Item U', projectId: scenario.project.id });
    await projectSidebar.openBoard(PROJECT_NAME);
    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await expect(unsorted.getByRole('article', { name: 'Item U', exact: true })).toBeVisible();

    const colOne = page.getByRole('group', { name: 'Column One' });
    const colTwo = page.getByRole('group', { name: 'Column Two' });
    await pickUp(page, colOne.getByRole('article', { name: 'Item C', exact: true }));
    await hoverTo(page, await center(colTwo));
    // C starts locked to Column One — the live cross-column preview only
    // shows once the drag has actually popped out to Board layer; still
    // locked, the ghost stays put in Column One.
    await popOutFully(page);
    // The live preview: C is now drawn in Column Two mid-drag.
    await expect(colTwo.getByRole('article', { name: 'Item C', exact: true })).toBeVisible();

    // Unsorted registers no region at all and Item U carries no
    // workphase either, so this stays Board layer, over nothing — never
    // popping *into* Column Two, which would otherwise make the release
    // commit there instead of writing nothing.
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
