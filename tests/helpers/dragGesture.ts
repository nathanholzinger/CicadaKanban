import type { Locator, Page } from '@playwright/test';

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
// `resolveTarget` is a callback, not a static point: a genuine cross-column
// move triggers handleDragOver's live re-bucket preview, which — since
// BoardColumn unions/sorts a column's covered items by position — inserts
// the dragged card at its real position among the target column's existing
// cards *during* the drag, shifting whichever card used to sit there. A
// point measured once before the drag started can go stale the moment that
// reflow happens, so this approaches in two passes: once toward the
// target's pre-drag position (close enough to cross into the target column
// and trigger the preview), then again after re-measuring the target's
// post-reflow position for the final, precise approach.
//
// This isn't perfectly reliable for every case — dnd-kit's own live
// swap-preview animation can make a target card's box a moving goalpost in
// ways that are sensitive to exact pixel targeting. The API suites prove
// the underlying position math; Epic 3.5's later stories tune the
// drop-placement UX itself (useBoardDnd.ts), which is the time to revisit
// gesture precision.
export type Point = { x: number; y: number };

export async function dragTo(page: Page, source: Locator, resolveTarget: () => Promise<Point>) {
  const start = await center(source);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y + 10, { steps: 5 });

  const rough = await resolveTarget();
  await page.mouse.move(rough.x, rough.y, { steps: 15 });
  await page.mouse.move(rough.x, rough.y, { steps: 2 }); // let the re-bucket preview/reflow settle

  const settled = await resolveTarget();
  await page.mouse.move(settled.x, settled.y, { steps: 10 });
  await page.mouse.move(settled.x, settled.y, { steps: 2 });
  await page.mouse.up();
}

export async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('drag target not visible/measurable');
  return box;
}

export async function center(locator: Locator): Promise<Point> {
  const box = await boxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// These aim at the literal top/bottom quarter a user would target for "drop
// before/after this card". Until Epic 3.5's drop bands land, the app doesn't
// read that distinction — bottomQuarter(A) and center(A) drive dnd-kit to
// the exact same collision today.
export async function topQuarter(locator: Locator): Promise<Point> {
  const box = await boxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height * 0.15 };
}

export async function bottomQuarter(locator: Locator): Promise<Point> {
  const box = await boxOf(locator);
  return { x: box.x + box.width / 2, y: box.y + box.height * 0.85 };
}

// The "drop past the end of the column" attempt. dnd-kit's closestCorners
// is a nearest-neighbor heuristic over every registered droppable's
// corners, not a "what's under the pointer" hit test — even targeting deep
// into the column group's own remaining space (near its true bottom edge,
// well past the last card) never wins collision away from the last card in
// a short column; verified by screenshotting mid-drag. So this still
// resolves to hovering the last card, same as `center`/`topQuarter` would —
// kept as its own named function because it documents that dead end at its
// call sites rather than silently matching an "append" intent.
export async function pastColumnEnd(columnGroup: Locator): Promise<Point> {
  const box = await boxOf(columnGroup);
  return { x: box.x + box.width / 2, y: box.y + box.height - 5 };
}
