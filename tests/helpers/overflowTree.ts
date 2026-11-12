import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { pickWorkphases, seedItem, seedTemplatedWorkflow, type SeededItem } from './seed';
import { awaitDragContext, boxOf, pickUp, tabBy, type Point } from './dragGesture';
import { zoomIntoCard } from './boardDragSurface';
import { article, itemRow, dragRegion } from './boardLocators';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import { DEFAULT_DRAG_TUNING, type DragTuning } from '../../client/src/components/workflow/dragTuning';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../../client/src/components/cardMetrics';

// The tree of the overflow-row and hierarchy-modal cases, with the section at its default of
// three levels (the tree is built for three, so it checks that the default still is). Card `P` in
// Todo holds A, then B, then X when `withX`. A holds Q, which holds R and T; R holds R1 (which holds
// R1a, which holds Y when `withY`) and R2, and has a Free child F; T has only a Free child G. So the
// section's rows are A, Q, R, R's overflow row, T, B and X, and the modal's are A, Q, R, R1, R1a,
// R2, T, B and X (Y under R1a), without the X and the Y when they are left out.
async function seedTree(
  request: APIRequestContext,
  name: string,
  { withX, withY }: { withX: boolean; withY: boolean },
) {
  // The depths the cases read follow from three levels, which is the default. A retune fails here.
  expect(DEFAULT_DRAG_TUNING.sectionLevels, 'the tree is built for a section of three levels').toBe(3);
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const child = (title: string, parent: { id: string }) => seedItem(request, { title, parentId: parent.id });
  const free = (title: string, parent: { id: string }) =>
    seedItem(request, { title, parentId: parent.id, isAttached: false, workphaseId: todo.id });
  const a = await child('A', p);
  const q = await child('Q', a);
  const r = await child('R', q);
  const t = await child('T', q);
  const r1 = await child('R1', r);
  const r2 = await child('R2', r);
  const r1a = await child('R1a', r1);
  const f = await free('F', r);
  const g = await free('G', t);
  const b = await child('B', p);
  const x = withX ? await child('X', p) : null;
  const y = withY ? await child('Y', r1a) : null;
  return { project, workflow, todo, p, a, q, r, t, r1, r2, r1a, f, g, b, x, y };
}

// The tree above, with `X` a further Stub of `P`'s after `B`, which a case drags where it says `X`
// is a Stub of `P`'s outside the tree. `Y`, an attached child of `R1a`, is there when asked for
// (DRAG-7.12's row).
export async function seedOverflowTree(request: APIRequestContext, name: string, { withY = false } = {}) {
  const tree = await seedTree(request, name, { withX: true, withY });
  return { ...tree, x: tree.x as SeededItem };
}

// The case's own tree (the DRAG-7 file's Terms), where `B` is `P`'s last attached child: no `X`.
// A case that drags `R1`, `R2` or `R` out of the modal and back, and reads where the last gap is,
// is held to this tree (DRAG-7.6).
export async function seedGivenTree(request: APIRequestContext, name: string, { withY = false } = {}) {
  return seedTree(request, name, { withX: false, withY });
}

// Picks `item`, a Stub of `p`, up in its own section, which starts the drag at the Descendants
// layer with no pop, and aims the carried copy at `target`, `depth` indents right of where the
// pointer picked the item up (negative for left). Returns the aim, to tab to another depth over
// the same target; its `at()` is where the cursor was last put. The rows slide aside as the ghost
// approaches, so the aim is made twice, the second at where they settle. It waits on the app's
// `data-drag-context` attribute for the drag to be at P's Descendants layer.
export async function holdAt(
  page: Page,
  item: { id: string; title: string },
  p: { id: string },
  target: () => Promise<Point>,
  depth: number,
) {
  const from = await pickUp(page, itemRow(page, item.id).getByRole('button', { name: item.title, exact: true }));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  let last: Point = from;
  const aim = async (levels: number) => {
    const point = await target();
    last = await tabBy(page, { x: from.x, y: point.y }, levels);
  };
  // The rows slide aside as the ghost approaches, so the second pass aims at where they settle.
  await aim(depth);
  await aim(depth);
  return Object.assign(aim, { at: () => last });
}

// `holdAt` for a Free Card: picks `item` up in its column, zooms it into `p` by the full zoom-in hold over
// the middle of Card `P`, and aims its carried copy at `target`, `depth` indents right of where the cursor
// rested for the zoom (the zoom seeds the ghost at the first level, so that x is depth 0). Returns the
// aim, as `holdAt` does, with the same two passes. It reads the layer from the app's
// `data-drag-context` attribute, and finds Card `p` by its title.
export async function holdFreeAt(
  page: Page,
  item: { id: string },
  p: { id: string; title: string },
  tuning: Pick<DragTuning, 'cardZoomDwellMs' | 'cardPopInDelayMs'>,
  target: () => Promise<Point>,
  depth: number,
) {
  const from = await zoomIntoCard(page, itemRow(page, item.id), article(page, p.title), p.id, tuning);
  let last: Point = from;
  const aim = async (levels: number) => {
    const point = await target();
    last = await tabBy(page, { x: from.x, y: point.y }, levels);
  };
  await aim(depth);
  await aim(depth);
  return Object.assign(aim, { at: () => last });
}

// Where a release would put the ghost in the hierarchy modal, read off what the modal paints:
// the ghost's row at its indent among the other rows, as the user sees them. `parentId` is null
// when the ghost sits at the first level, under the Card itself, and `prevId` and `nextId` are the
// siblings the ghost lies between under that parent (null at either end). A spec compares this
// with what the release wrote, so it holds the ghost's place on screen to the committed one. Throws
// for a ghost at a level with no row one level up above it, which the modal never draws.
export async function placementShown(modal: Locator, ghostId: string) {
  const rows = await modal.locator('[data-item-id]').evaluateAll(
    (els, indent) =>
      els
        .map(el => ({
          id: el.getAttribute('data-item-id') as string,
          y: el.getBoundingClientRect().y,
          depth: Math.round((parseFloat(getComputedStyle(el).paddingLeft) - indent.base) / indent.step),
        }))
        .sort((a, b) => a.y - b.y),
    { base: descendantsIndentPx(0), step: DESCENDANTS_INDENT_PX },
  );
  const at = rows.findIndex(row => row.id === ghostId);
  if (at < 0) throw new Error(`the ghost ${ghostId} has no row in the modal`);
  const { depth } = rows[at];
  const above = rows.slice(0, at).reverse();
  const below = rows.slice(at + 1);

  // The first row above that is shallower than the ghost ends the ghost's siblings and is its
  // parent, so it has to be one level up. Rows above it at the ghost's own level are the ghost's
  // siblings, the nearest being the one before it. At the first level there is no such row: the
  // ghost is under the Card.
  const parentAt = above.findIndex(row => row.depth < depth);
  if (depth > 0 && above[parentAt]?.depth !== depth - 1) {
    const found = parentAt < 0 ? 'no shallower row' : `one at level ${above[parentAt].depth}`;
    throw new Error(`the ghost ${ghostId} at level ${depth} has ${found} above it, not a parent one level up`);
  }
  const siblingsAbove = above.slice(0, parentAt < 0 ? above.length : parentAt).filter(row => row.depth === depth);
  const untilParentEnds = below.findIndex(row => row.depth < depth);
  const siblingsBelow = below.slice(0, untilParentEnds < 0 ? below.length : untilParentEnds);
  return {
    parentId: depth === 0 ? null : above[parentAt].id,
    prevId: siblingsAbove[0]?.id ?? null,
    nextId: siblingsBelow.find(row => row.depth === depth)?.id ?? null,
  };
}

// A point inside `owner`'s box and outside `other`'s, at least `clearPx` from it, found on a grid inside
// `owner`'s box; null when none lies there. Reads the screen, in layout space (`boxOf`).
export async function pointOutsideModal(owner: Locator, other: Locator, clearPx: number): Promise<Point | null> {
  const box = await boxOf(owner);
  const m = await boxOf(other);
  for (const fy of [0.08, 0.5, 0.92]) {
    for (const fx of [0.04, 0.5, 0.96]) {
      const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
      const gapX = Math.max(m.x - point.x, 0, point.x - (m.x + m.width));
      const gapY = Math.max(m.y - point.y, 0, point.y - (m.y + m.height));
      if (Math.hypot(gapX, gapY) >= clearPx) return point;
    }
  }
  return null;
}

// The point is inside the box `locator` draws. Reads the screen, in layout space (`boxOf`).
export async function expectInside(locator: Locator, point: Point) {
  const box = await boxOf(locator);
  expect(point.x).toBeGreaterThanOrEqual(box.x);
  expect(point.x).toBeLessThanOrEqual(box.x + box.width);
  expect(point.y).toBeGreaterThanOrEqual(box.y);
  expect(point.y).toBeLessThanOrEqual(box.y + box.height);
}

// The modal's middle is the window's, as one a click opens sits (DRAG-7.7). Reads the screen.
export async function expectCentered(page: Page, modal: Locator) {
  const viewport = page.viewportSize()!;
  await expect(modal).toBeVisible();
  await expect
    .poll(async () => {
      const box = await boxOf(modal);
      return Math.max(
        Math.abs(box.x + box.width / 2 - viewport.width / 2),
        Math.abs(box.y + box.height / 2 - viewport.height / 2),
      );
    })
    .toBeLessThan(2);
}

// The row the live drop line is drawn on right now, as an item's id or `overflow:<owner id>`, and
// the side of it; null with no line. The line is drawn on the row the side highlight names. Reads
// the app's `data-drop-side` attribute and the `data-item-id` or `data-overflow-row` of the row
// it sits in.
export async function dropLineOn(page: Page): Promise<{ row: string; side: string } | null> {
  const lines = await page.locator('[data-drop-side]').evaluateAll(els =>
    els.map(el => {
      const row = el.closest('[data-item-id], [data-overflow-row]');
      return {
        row: row?.getAttribute('data-item-id') ?? `overflow:${row?.getAttribute('data-overflow-row')}`,
        side: el.getAttribute('data-drop-side') as string,
      };
    }),
  );
  return lines[0] ?? null;
}

// The ids of the rows drawn in `scope`, in order: an item's id, or `overflow:<owner id>`. Reads the
// app's `data-item-id` and `data-overflow-row` attributes in document order, which is the painted
// order after a drag has ended and for a ghost in its own slot, not while rows slide aside.
export function rowIds(scope: Locator): Promise<string[]> {
  return scope
    .locator('[data-item-id], [data-overflow-row]')
    .evaluateAll(els =>
      els.map(el => el.getAttribute('data-item-id') ?? `overflow:${el.getAttribute('data-overflow-row')}`),
    );
}

// The ids of what a Card's section draws, in order (`rowIds`).
export function sectionRows(page: Page, cardId: string): Promise<string[]> {
  return rowIds(dragRegion(page, descendantsRegionKey(cardId)));
}

// What an open hierarchy modal draws and where its list is scrolled: each row's id, title and indent
// in order, and the list's scroll offset, for a spec that says the modal is as it was. Reads the
// DOM: the rows' `data-item-id`, their button text and computed indent, and the list's `scrollTop`.
export interface ModalState {
  rows: Array<{ id: string; title: string; indent: string }>;
  scrollTop: number;
}

export function modalState(modal: Locator, cardId: string): Promise<ModalState> {
  return dragRegion(modal, descendantsRegionKey(cardId)).evaluate(list => ({
    rows: [...list.querySelectorAll<HTMLElement>('[data-item-id]')].map(row => ({
      id: row.getAttribute('data-item-id') ?? '',
      title: row.querySelector('button')?.textContent?.trim() ?? '',
      indent: getComputedStyle(row).paddingLeft,
    })),
    scrollTop: list.scrollTop,
  }));
}
