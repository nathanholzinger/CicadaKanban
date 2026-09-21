import { expect, type Locator, type Page } from '@playwright/test';
import { DRAG_REGION_ATTR } from '../../client/src/components/workflow/dragRegions';
import { DEFAULT_DRAG_TUNING, DRAG_TUNING_STORAGE_KEY, type DragTuning } from '../../client/src/components/workflow/dragTuning';

// The one recipe for driving this app's @dnd-kit board from Playwright
// (extracted in Epic 3.5 Story 1 from three per-spec copies — see
// docs/planning/epic-3-5-decisions.md Q2).
//
// dnd-kit's PointerSensor (activationConstraint: { distance: 5 }) needs a
// real pointerdown, movement past that 5px threshold to activate the drag,
// several intermediate pointermoves so its rect/collision recalculation
// keeps up, then pointerup to drop. Playwright's `dragTo()`/`dragAndDrop()`
// simulate native HTML5 DnD instead and never trigger dnd-kit at all.
//
// `resolveTarget` is a callback, not a static point: hovering another
// column draws the dragged card's ghost there (Epic 3.5 Story 3's ordinal
// placement — at its kept position for the middle band, first/last for the
// edge bands), shifting whichever card used to sit at that slot. A point
// measured once before the drag started can go stale the moment that
// reflow happens, so this approaches in two passes: once toward the
// target's pre-drag position (close enough to cross into the target column
// and draw the ghost), then again after re-measuring the target's
// post-reflow position for the final, precise approach. Every measurement
// is in layout space (`boxOf`), which is the space dnd-kit resolves
// collisions in — see its comment for the trap that avoids.
//
// Under the pop machine (docs/wiki/board-drag-interaction §2–§5) a release
// in another column resolves by *band* of that column's region unless the
// cursor rested there past the pop threshold, so a cross-column `dragTo`
// onto a card lands by the band the card sits in, not the card. Story 3's
// own spec (drag-column-bands.spec.ts) seeds the threshold and drives the
// bands directly; the older suites' cross-column cases happen to land in
// bands whose meaning matches what they assert.
export type Point = { x: number; y: number };

// Pointer down on `source` and past the activation distance — the drag is
// now live (onDragStart has fired) but nothing has been dropped. Pair with
// `release` or `cancel`. Exposed on its own (Epic 3.5 Story 2) so a spec can
// assert what the board shows *during* a drag without committing a drop.
//
// Deliberately no wait after activation: the in-context sortable preview
// starts animating the moment the drag begins, and the older suites' card
// targeting is tuned to the timing of an immediate approach. The gap that
// matters is the one *before* pickup — see `release`.
export async function pickUp(page: Page, source: Locator): Promise<Point> {
  const start = await center(source);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y + 10, { steps: 5 });
  return start;
}

// Hover the live drag over a point, in enough steps for dnd-kit's collision
// detection to keep up.
export async function hoverTo(page: Page, target: Point) {
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await page.mouse.move(target.x, target.y, { steps: 2 }); // let the re-bucket preview/reflow settle
}

// Drop wherever the pointer is, and wait for dnd-kit to be idle again: a
// pointerdown that lands while its drop animation is still winding down can
// fail to activate the next drag, and a spec that then hovers and releases
// asserts against a gesture that never happened. The DragOverlay copy
// carries `data-drag-overlay` for exactly this wait.
export async function release(page: Page) {
  await page.mouse.up();
  await settled(page);
}

// Abandon the drag without dropping: dnd-kit's PointerSensor cancels on
// Escape (onDragCancel fires, nothing is written), then the button is let go.
export async function cancel(page: Page) {
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await settled(page);
}

async function settled(page: Page) {
  await expect(page.locator('[data-drag-overlay]')).toHaveCount(0, { timeout: 2000 });
}

export async function dragTo(page: Page, source: Locator, resolveTarget: () => Promise<Point>) {
  await pickUp(page, source);
  await hoverTo(page, await resolveTarget());
  // Re-resolve after the reflow (see header comment) for the precise approach.
  const settled = await resolveTarget();
  await page.mouse.move(settled.x, settled.y, { steps: 10 });
  await page.mouse.move(settled.x, settled.y, { steps: 2 });
  await release(page);
}

// The element's box in *layout* space — its bounding rect with every CSS
// transform on it and its ancestors subtracted. That is the space dnd-kit's
// collision detection works in: droppable rects are measured at drag start
// and not re-measured while the sortable preview slides neighbours around
// with transforms, so a point aimed at a card's *visual* rect mid-drag can
// be nearest a different card's collision rect (found the hard way in the
// 3.a cases — "after A" resolving as "before E"). Layout shifts — the ghost
// inserted into another column's list — are real re-measures and show up
// here as they should.
export async function boxOf(locator: Locator) {
  const box = await locator.evaluate(el => {
    const rect = el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const transform = getComputedStyle(node).transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        dx += matrix.e;
        dy += matrix.f;
      }
    }
    return { x: rect.x - dx, y: rect.y - dy, width: rect.width, height: rect.height };
  });
  if (box.width === 0 && box.height === 0) throw new Error('drag target not visible/measurable');
  return box;
}

// A point on the element's vertical centre line, `fraction` of the way down
// its box — the one shape every "aim at part of a card / a band of a
// region" helper reduces to (audit epic-3-5-story-3 #7).
export async function atFraction(locator: Locator, fraction: number): Promise<Point> {
  const box = await boxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height * fraction };
}

export async function center(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.5);
}

// These aim at the literal top/bottom quarter a user would target for "drop
// before/after this card" — the in-context anchor + side resolution
// (resolveDropSide reads which half of the hovered card the dragged card's
// center is in).
export async function topQuarter(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.15);
}

export async function bottomQuarter(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.85);
}

// The point midway across the horizontal gap between two side-by-side
// elements (`left`'s right edge to `right`'s left edge), at `left`'s
// vertical centre — over no column, no region, nothing droppable.
export async function gapBetween(left: Locator, right: Locator): Promise<Point> {
  const a = await boxOf(left);
  const b = await boxOf(right);
  return { x: (a.x + a.width + b.x) / 2, y: a.y + a.height / 2 };
}

// The pop machine's state as the board root reports it (`data-drag-state`,
// `data-drag-context`). These retry until the attribute matches, so a spec
// waits for a clock to run out by asserting the state it produces rather
// than sleeping a guessed margin past the threshold. `timeout` must cover
// every clock that has to fire first (e.g. pop-out then pop-in).
export const dragMachine = (page: Page) => page.locator('[data-drag-state]');

export async function awaitDragState(page: Page, state: 'locked' | 'popped-out', timeout?: number) {
  await expect(dragMachine(page)).toHaveAttribute('data-drag-state', state, { timeout });
}

// `null` asserts no context at all (popped out).
export async function awaitDragContext(page: Page, regionKey: string | null, timeout?: number) {
  if (regionKey === null) await expect(dragMachine(page)).not.toHaveAttribute('data-drag-context', /./, { timeout });
  else await expect(dragMachine(page)).toHaveAttribute('data-drag-context', regionKey, { timeout });
}

// "Drop past the end of the column": just inside the bottom edge of its
// drag region — its bounded box (wiki §1; a region stops at the column
// body, not its outer group, since wiki–code reconciliation #20), not the
// column group's footer/"+ Add item" row below that box, which is nowhere
// to the pop machine. In another column that lands in the bottom band
// (after the last item — Story 3). In the card's own column it's
// in-context, where dnd-kit's closestCorners (a nearest-corner heuristic,
// not a hit test) resolves to the column container or its last card
// depending on the column's height — the append the older suites assert.
// Story 4 (planning): a Card now carries `[data-drag-region]` too (`card:`
// keys), so a bare `.last()` here would pick the column's own *last card*
// instead of its region wrapper (or, in expanded mode, its last sub-row) —
// landing 5px above a card's bottom edge, inside it, rather than genuinely
// past the column's content. Excluded by key prefix, not by re-deriving
// which element is "the column's own" some other way.
export async function pastColumnEnd(columnGroup: Locator): Promise<Point> {
  const region = columnGroup.locator(`[${DRAG_REGION_ATTR}]:not([${DRAG_REGION_ATTR}^="card:"])`).last();
  const box = (await region.count()) > 0 ? await boxOf(region) : await boxOf(columnGroup);
  return { x: box.x + box.width / 2, y: box.y + box.height - 5 };
}

// Seeds the dev/test panel's own storage key with `override` merged over
// the defaults, before the page loads — the one recipe for tuning a drag
// gesture spec, previously spelled independently (down to the same
// `addInitScript` body) in at least four specs (audit
// epic-3-5-story-4 #6). Returns the merged tuning so a caller can still
// compute a wait off the *configured* value, never a literal.
export async function seedDragTuning(page: Page, override: Partial<DragTuning> = {}): Promise<DragTuning> {
  const tuning = { ...DEFAULT_DRAG_TUNING, ...override };
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [DRAG_TUNING_STORAGE_KEY, JSON.stringify(tuning)] as const,
  );
  return tuning;
}

// A threshold seeded far longer than any single hover in these gestures
// could last, so an accidental pop under a slow run never fires — never a
// value anything computes a wait *from* (audit epic-3-5-story-4 #6/#27:
// this used to be spelled inconsistently, 30s in some presets and 60s in
// others, with no reason for the difference).
const NEVER_MS = 60_000;

// Every threshold absurdly high: nothing pops, ever — a spec whose subject
// isn't pop timing at all (drag-target classification; an in-context
// reorder that merely brushes across another column) seeds this so an
// incidental pop can't fire mid-gesture.
export const NO_POP: Partial<DragTuning> = { popDelayMs: NEVER_MS, popInDelayMs: NEVER_MS, cardPopInDelayMs: NEVER_MS };
// Re-plan (2026-09-16): a band only ever means anything at Board layer —
// locked always commits its own context, regardless of a foreign hover
// (docs/wiki/board-drag-interaction §1–§3). So a case that wants to reach a
// *band* needs to actually get to Board layer first: a short pop-out delay,
// paired with a pop-in delay long enough that resting in the target's own
// middle band (also its pop-eligible zone) never completes a second,
// unwanted pop before the case releases.
export const POP_OUT_ONLY: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: NEVER_MS, cardPopInDelayMs: NEVER_MS };
// Short enough for both clocks to run out while the cursor rests: pop out
// of the origin context, then in to whichever one it's resting over.
export const SUSTAINED: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: 150, cardPopInDelayMs: NEVER_MS };

// Waits for a Card drag to actually reach Board layer — a band only ever
// resolves a release from there (re-plan 2026-09-16). The cursor doesn't
// have to move again: the pop timer fires on its own once `tuning.popDelayMs`
// has elapsed.
export async function awaitPoppedOut(page: Page, tuning: DragTuning) {
  await awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000);
}
