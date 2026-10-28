import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { CARD_LIST_REGION_SELECTOR, DRAG_OVERLAY_ATTR } from '../../client/src/components/workflow/dragRegions';
import {
  DEFAULT_DRAG_TUNING,
  DRAG_TUNING_STORAGE_KEY,
  type DragTuning,
} from '../../client/src/components/workflow/dragTuning';

// The one recipe for driving this app's @dnd-kit drags from Playwright: the
// board's, and the project sidebar's.
//
// dnd-kit's PointerSensor (activationConstraint: { distance: 5 }) needs a
// real pointerdown, movement past that 5px threshold to activate the drag,
// several intermediate pointermoves so its rect/collision recalculation
// keeps up, then pointerup to drop. Playwright's `dragTo()`/`dragAndDrop()`
// simulate native HTML5 DnD instead and never trigger dnd-kit at all.
//
// `resolveTarget` is a callback, not a static point: hovering another
// column draws the dragged card's ghost there (the ordinal preview — at
// its kept position for the middle band, first/last for the edge bands),
// shifting whichever card used to sit at that slot. A point
// measured once before the drag started can go stale the moment that
// reflow happens, so this approaches in two passes: once toward the
// target's pre-drag position (close enough to cross into the target column
// and draw the ghost), then again after re-measuring the target's
// post-reflow position for the final, precise approach. Every measurement
// is in layout space (`boxOf`), which is the space dnd-kit resolves
// collisions in — see its comment for the trap that avoids.
//
// Under the pop machine a release in another column resolves by *band* of
// that column's region unless the cursor rested there past the pop
// threshold, so a cross-column `dragTo` onto a card lands by the band the
// card sits in, not the card. A spec that needs a particular band seeds the
// pop threshold (`POP_OUT_ONLY`), waits for the pop out (`awaitPoppedOut`),
// and aims at the band.
export type Point = { x: number; y: number };

// Pointer down on `source` and past the activation distance — the drag is
// now live (onDragStart has fired) but nothing has been dropped. Pair with
// `release` or `cancel`. Exposed on its own so a spec can assert what the
// board shows *during* a drag without committing a drop.
//
// Deliberately no wait after activation: the in-context sortable preview
// starts animating the moment the drag begins, and the other suites' card
// targeting is tuned to the timing of an immediate approach. The gap that
// matters is the one *before* pickup — see `release`.
export async function pickUp(page: Page, source: Locator): Promise<Point> {
  return pickUpAt(page, await center(source));
}

// `pickUp` at a point, for a press on part of an element, such as a row's indent.
export async function pickUpAt(page: Page, start: Point): Promise<Point> {
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
// carries `DRAG_OVERLAY_ATTR` for exactly this wait.
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
  await expect(page.locator(`[${DRAG_OVERLAY_ATTR}]`)).toHaveCount(0, { timeout: 2000 });
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
// be nearest a different card's collision rect ("after A" resolving as
// "before E"). Layout shifts — the ghost
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

// The element's box as it is painted right now, every transform included: what the user sees,
// where `boxOf` is what dnd-kit's collision sees. For asserting where something is drawn, such as
// the ghost under the cursor, never for aiming a drag.
export async function paintedBoxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element not visible/measurable');
  return box;
}

// A point on the element's vertical centre line, `fraction` of the way down
// its box — the one shape every "aim at part of a card / a band of a
// region" helper reduces to.
export async function atFraction(locator: Locator, fraction: number): Promise<Point> {
  const box = await boxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height * fraction };
}

export async function center(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.5);
}

// The top/bottom quarter of a card or Stub row. Neither picks a side of the
// row hovered, in a column, a sub-row or a Descendants section alike:
// dnd-kit's shuffle decides the ghost's slot, so aim at the row whose slot
// the ghost should take, and the drop lands there —
// `dragCollision.ts::dropAnchorFor`'s own lean, not a raw which-half read, so
// long as the dragged item is in the hovered row's list.
export async function topQuarter(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.15);
}

export async function bottomQuarter(locator: Locator): Promise<Point> {
  return atFraction(locator, 0.85);
}

// How far past the ghost's middle `setBackDownLeaning` carries the dragged
// copy — well clear of the middle either way, well short of the next card.
const LEAN_PX = 15;

// Pick a card up and set it back down in its own slot, the dragged copy
// just above or below the ghost's middle. The card's own row is `over`
// (nothing shuffles), and the lean picks which neighbor the drop names: up,
// "after" the card above; down, "before" the card below. One slot in the
// column, but not in the workflow-wide order when items from another
// workphase sit between the two neighbors — which is what a case using
// this is for.
export async function setBackDownLeaning(page: Page, card: Locator, lean: 'up' | 'down') {
  const home = await center(card);
  await pickUp(page, card);
  await hoverTo(page, { x: home.x, y: home.y + (lean === 'up' ? -LEAN_PX : LEAN_PX) });
  await release(page);
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

// The Descendants layer's live gap and depth, as the board root reports them
// (`data-drag-projection`): `"<gap>:<depth>:<valid>"`, the gap counted among all
// the section's rows without the dragged subtree, the depth from the Card's
// own children at 0. Retries until it matches.
export async function awaitProjection(page: Page, projection: string | RegExp, timeout?: number) {
  await expect(dragMachine(page)).toHaveAttribute('data-drag-projection', projection, { timeout });
}

// The hold that opens the hierarchy modal, as the board root reports it (`data-drag-modal-hold`):
// `"<overflow row owner id>:<dwell|cue>"`. `null` asserts no hold is running. Retries until it
// matches.
export async function awaitModalHold(page: Page, hold: string | RegExp | null, timeout?: number) {
  if (hold === null) await expect(dragMachine(page)).not.toHaveAttribute('data-drag-modal-hold', /./, { timeout });
  else await expect(dragMachine(page)).toHaveAttribute('data-drag-modal-hold', hold, { timeout });
}

// `null` asserts no context at all (popped out).
export async function awaitDragContext(page: Page, regionKey: string | null, timeout?: number) {
  if (regionKey === null) await expect(dragMachine(page)).not.toHaveAttribute('data-drag-context', /./, { timeout });
  else await expect(dragMachine(page)).toHaveAttribute('data-drag-context', regionKey, { timeout });
}

// "Drop past the end of the column": just inside the bottom edge of its
// drag region — its bounded box (a region stops at the column body, not
// its outer group), not the column group's footer/"+ Add item" row below
// that box, which is nowhere to the pop machine. In another column that
// lands in the bottom band (after the last item). In the card's own column
// it's in-context, where dnd-kit's closestCorners (a nearest-corner
// heuristic, not a hit test) resolves to the column container or its last
// card depending on the column's height — the append the other suites
// assert. A Card carries `[data-drag-region]` too, and so does its
// Descendants section, so a bare `.last()` would pick one of those instead of the column's own region (or, in expanded mode, its
// last sub-row) — landing inside a card rather than genuinely past the
// column's content. `CARD_LIST_REGION_SELECTOR` names the column/sub-row
// kinds positively: an "anything but `card:`" exclusion would aim at the last
// Card's section once a column has Stubs.
export async function pastColumnEnd(columnGroup: Locator): Promise<Point> {
  const region = columnGroup.locator(CARD_LIST_REGION_SELECTOR).last();
  const box = (await region.count()) > 0 ? await boxOf(region) : await boxOf(columnGroup);
  return { x: box.x + box.width / 2, y: box.y + box.height - 5 };
}

// Seeds the dev/test panel's own storage key with `override` merged over
// the defaults, before the page loads — the one recipe for tuning a drag
// gesture spec. Returns the merged tuning so a caller can still
// compute a wait off the *configured* value, never a literal.
export async function seedDragTuning(page: Page, override: Partial<DragTuning> = {}): Promise<DragTuning> {
  const tuning = { ...DEFAULT_DRAG_TUNING, ...override };
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    DRAG_TUNING_STORAGE_KEY,
    JSON.stringify(tuning),
  ] as const);
  return tuning;
}

// Holds every move response for `ms(n)`, `n` counting the moves from 0. The request still
// reaches the server at once, so the server's order of operations is the real one and only the
// client's view of it is delayed: a drop stays marked pending until the held response lands.
export async function delayMoveResponses(page: Page, ms: (n: number) => number) {
  let n = 0;
  await page.route('**/api/items/*/move', async (route: Route) => {
    const wait = ms(n++);
    const response = await route.fetch();
    await new Promise(r => setTimeout(r, wait));
    await route.fulfill({ response });
  });
}

// A threshold seeded far longer than any single hover in these gestures
// could last, so an accidental pop under a slow run never fires — never a
// value anything computes a wait *from*.
const NEVER_MS = 60_000;

// One named slack, added atop however many of the configured clocks a wait
// has to cover. Not tuned by feel like the clocks themselves — just enough margin
// for the sample-driven cascade after the last clock's own due time to
// actually land before Playwright's own wait gives up.
const CLOCK_SLACK_MS = 2000;

// A wait long enough to cover every one of `clocks` firing in sequence,
// plus one slack margin — the one spelling of "these thresholds, back to
// back, plus a little room," used wherever a spec waits past more than one
// clock (a two- or three-layer pop cascade) rather than re-adding the same
// margin at each call site.
export function clocksMargin(...clocks: number[]): number {
  return clocks.reduce((sum, ms) => sum + ms, 0) + CLOCK_SLACK_MS;
}

// Every pop clock absurdly high: nothing pops, ever — a spec whose subject
// isn't pop timing at all (drag-target classification; an in-context
// reorder that merely brushes across another column) seeds this so an
// incidental pop can't fire mid-gesture.
export const NO_POP: Partial<DragTuning> = {
  popDelayMs: NEVER_MS,
  popInDelayMs: NEVER_MS,
  cardZoomDwellMs: NEVER_MS,
  cardPopInDelayMs: NEVER_MS,
  descendantsPopInDelayMs: NEVER_MS,
};
// A band only ever means anything at Board layer — locked always commits
// its own context, regardless of a foreign hover. So a case that wants to reach a
// *band* needs to actually get to Board layer first: a short pop-out delay,
// paired with a pop-in delay long enough that resting in the target's own
// middle band (also its pop-eligible zone) never completes a second,
// unwanted pop before the case releases.
export const POP_OUT_ONLY: Partial<DragTuning> = {
  popDelayMs: 150,
  popInDelayMs: NEVER_MS,
  cardPopInDelayMs: NEVER_MS,
};
// Short enough for both clocks to run out while the cursor rests: pop out
// of the origin context, then in to whichever one it's resting over.
export const SUSTAINED: Partial<DragTuning> = { popDelayMs: 150, popInDelayMs: 150, cardPopInDelayMs: NEVER_MS };

// Waits for a Card drag to actually reach Board layer — a band only ever
// resolves a release from there. The cursor doesn't
// have to move again: the pop timer fires on its own once `tuning.popDelayMs`
// has elapsed.
export async function awaitPoppedOut(page: Page, tuning: DragTuning) {
  await awaitDragState(page, 'popped-out', clocksMargin(tuning.popDelayMs));
}
