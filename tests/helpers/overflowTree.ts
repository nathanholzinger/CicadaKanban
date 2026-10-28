import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { pickWorkphases, seedItem, seedTemplatedWorkflow } from './seed';
import { awaitDragContext, hoverTo, pickUp, type Point } from './dragGesture';
import { itemRow } from './boardLocators';
import { DRAG_REGION_ATTR, descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../../client/src/components/cardMetrics';

// The tree of the overflow-row and hierarchy-modal cases, with the section at its default of
// three levels. Card `P` in Todo holds A, then B, then X. A holds Q, which holds R and T; R holds
// R1 (which holds R1a) and R2, and has a Free child F; T has only a Free child G. So the section's
// rows are A, Q, R, R's overflow row, T, B and X, and the modal's are A, Q, R, R1, R1a, R2, T, B
// and X.
export async function seedOverflowTree(request: APIRequestContext, name: string) {
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
  const x = await child('X', p);
  return { project, workflow, todo, p, a, q, r, t, r1, r2, r1a, f, g, b, x };
}

// Picks `item`, a Stub of `p`, up in its own section, which starts the drag at the Descendants
// layer with no pop, and aims the carried copy at `target`, `depth` levels in from where the item's
// own row starts. Returns the aim, to tab to another depth over the same target; its `at()` is
// where the cursor was last put.
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
    last = { x: from.x + levels * DESCENDANTS_INDENT_PX, y: point.y };
    await hoverTo(page, last);
  };
  // The rows slide aside as the ghost approaches, so the second pass aims at where they settle.
  await aim(depth);
  await aim(depth);
  return Object.assign(aim, { at: () => last });
}

// Where a release would put the ghost in the hierarchy modal, read off what the modal paints:
// the ghost's row at its indent among the other rows, as the user sees them. `parentId` is null
// when the ghost sits at the first level, under the Card itself, and `prevId` and `nextId` are the
// siblings the ghost lies between under that parent (null at either end). A spec compares this
// with what the release wrote, so it holds the ghost's place on screen to the committed one.
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

  // The nearest row above at the level of the ghost's parent is its parent. Rows above it at the
  // ghost's own level, before that parent, are siblings, the nearest being the one before it.
  const parentAt = above.findIndex(row => row.depth === depth - 1);
  const siblingsAbove = above.slice(0, parentAt < 0 ? above.length : parentAt).filter(row => row.depth === depth);
  const untilParentEnds = below.findIndex(row => row.depth < depth);
  const siblingsBelow = below.slice(0, untilParentEnds < 0 ? below.length : untilParentEnds);
  return {
    parentId: depth === 0 ? null : (above[parentAt]?.id ?? null),
    prevId: siblingsAbove[0]?.id ?? null,
    nextId: siblingsBelow.find(row => row.depth === depth)?.id ?? null,
  };
}

// The row the live drop line is drawn on right now, as an item's id or `overflow:<owner id>`, and
// the side of it; null with no line. The line is drawn on the row the side highlight names.
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

// The ids of what P's section draws, in order: an item's id, or `overflow:<owner id>`.
export async function sectionRows(page: Page, cardId: string): Promise<string[]> {
  const section = page.locator(`[${DRAG_REGION_ATTR}="${descendantsRegionKey(cardId)}"]`);
  return section
    .locator('[data-item-id], [data-overflow-row]')
    .evaluateAll(els =>
      els.map(el => el.getAttribute('data-item-id') ?? `overflow:${el.getAttribute('data-overflow-row')}`),
    );
}
