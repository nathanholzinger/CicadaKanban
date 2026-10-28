import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, fetchItem, moveItem } from '../helpers/seed';
import {
  awaitProjection,
  boxOf,
  cancel,
  center,
  dragMachine,
  hoverTo,
  pickUp,
  pickUpAt,
  release,
  seedDragTuning,
  topQuarter,
  NO_POP,
} from '../helpers/dragGesture';
import { article, dragOverlay, hierarchyModal, itemPanel, itemRow, overflowRow } from '../helpers/boardLocators';
import { dropLineOn, holdAt, sectionRows, seedOverflowTree } from '../helpers/overflowTree';
import { watchWrites } from '../helpers/projectTreeDrag';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../../client/src/components/cardMetrics';
import { DEFAULT_DRAG_TUNING } from '../../client/src/components/workflow/dragTuning';

// A Card's section shows a set number of levels, and an overflow row stands for the hidden
// children of a row at the last shown level. The cases assert what the board draws and what a
// release writes, never a duration.
//
// Where a case drags `X`, it's a Stub of `P` picked up in its own section, which starts at the
// Descendants layer with no pop. Placement there is the same for any item at that layer.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

const L = DEFAULT_DRAG_TUNING.sectionLevels;

test('DRAG-7.1, DRAG-7.2: a section shows L levels below its Card, and an overflow row counts the hidden children', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Render Project';
  const { p, a, q, r, t, r1, r2, r1a, f, g, b, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);

  // A to Q to R are levels 1 to 3. R's children are the next level, so they're behind its
  // overflow row, which reads for R1 and R2 and not R1a or the Free child F.
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toEqual([a.id, q.id, r.id, `overflow:${r.id}`, t.id, b.id, x.id]);
  for (const hidden of [r1, r2, r1a]) await expect(itemRow(page, hidden.id)).toHaveCount(0);
  await expect(overflowRow(page, r.id)).toHaveText('2 children');
  await expect(overflowRow(page, r.id)).not.toHaveAttribute('data-item-id', /./);
  await expect(overflowRow(page, r.id)).toHaveCSS('padding-left', `${descendantsIndentPx(L)}px`);
  await expect(itemRow(page, r.id)).toHaveCSS('padding-left', `${descendantsIndentPx(L - 1)}px`);

  // T's only child is Free, so T has no overflow row. F and G show on the board as Cards of
  // their own.
  await expect(overflowRow(page, t.id)).toHaveCount(0);
  await expect(article(page, f.title)).toBeVisible();
  await expect(article(page, g.title)).toBeVisible();
});

test('DRAG-7.1, DRAG-7.2: the levels count from the Card, and one hidden child reads "1 child"', async ({
  page,
  request,
  projectSidebar,
}) => {
  // P is a Free child of Top, one level down in the workflow. Its section still shows L levels
  // below P.
  const name = 'Overflow Row Count From Card Project';
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const top = await seedItem(request, { title: 'Top', projectId: project.id, workphaseId: todo.id });
  const p = await seedItem(request, { title: 'P', parentId: top.id, isAttached: false, workphaseId: todo.id });
  const a = await seedItem(request, { title: 'A', parentId: p.id });
  const q = await seedItem(request, { title: 'Q', parentId: a.id });
  const r = await seedItem(request, { title: 'R', parentId: q.id });
  const r1 = await seedItem(request, { title: 'R1', parentId: r.id });

  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  expect(await sectionRows(page, p.id)).toEqual([a.id, q.id, r.id, `overflow:${r.id}`]);
  await expect(itemRow(page, r1.id)).toHaveCount(0);
  await expect(overflowRow(page, r.id)).toHaveText('1 child');
});

test('DRAG-7.1, DRAG-1.34: the level count is a tuning-panel value, taken at once and kept across a reload', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Tuning Project';
  const { p, a, q, r, t, r1, r2, r1a, b, x } = await seedOverflowTree(request, name);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await expect(overflowRow(page, r.id)).toHaveText('2 children');

  // One more level shows R1 and R2, with an overflow row under R1 for R1a, and R has none.
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  const levels = page.getByRole('spinbutton', { name: 'Levels a section shows' });
  await expect(levels).toHaveValue(String(L));
  await levels.fill(String(L + 1));
  await expect
    .poll(() => sectionRows(page, p.id))
    .toEqual([a.id, q.id, r.id, r1.id, `overflow:${r1.id}`, r2.id, t.id, b.id, x.id]);
  await expect(overflowRow(page, r1.id)).toHaveText('1 child');
  await expect(overflowRow(page, r.id)).toHaveCount(0);
  await expect(itemRow(page, r1a.id)).toHaveCount(0);

  await page.reload();
  await projectSidebar.showBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  await expect(overflowRow(page, r1.id)).toHaveText('1 child');
});

test('DRAG-7.3, DRAG-7.2: between a row and its overflow row, the one state is the row’s first child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row First Child Project';
  const { p, r, r1, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);

  // Aimed at the top of R's overflow row, the ghost sits between R and it, at level L + 1
  // whichever way the pointer is tabbed.
  const aim = await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, `${3}:${L}:true`);
  await aim(5);
  await awaitProjection(page, `${3}:${L}:true`);
  await aim(-5);
  await awaitProjection(page, `${3}:${L}:true`);
  await release(page);

  // R's first child, before R1. It's at a hidden level, so the section doesn't show it, and
  // the overflow row counts it.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  const placed = await fetchItem(request, x.id);
  expect(placed.isAttached).toBe(1);
  expect(placed.position).toBeLessThan((await fetchItem(request, r1.id)).position);
  await expect(overflowRow(page, r.id)).toHaveText('3 children');
  await expect(itemRow(page, x.id)).toHaveCount(0);
});

test('DRAG-7.4, DRAG-7.2: below an overflow row, the item is the row’s last child, and none lies right of the overflow row', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Last Child Project';
  const { p, r, r2, t, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);

  // The gap between R's overflow row and T is after R's whole subtree. Its states are L,
  // aligned with R, and L + 1, aligned with the overflow row. Tabbing right stops at the
  // overflow row's level, and left stops at T's.
  const aim = await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L);
  await awaitProjection(page, `${6}:${L}:true`);
  await aim(L + 6);
  await awaitProjection(page, `${6}:${L}:true`);
  await aim(L - 1);
  await awaitProjection(page, `${6}:${L - 1}:true`);
  await aim(-6);
  await awaitProjection(page, `${6}:${L - 1}:true`);
  await aim(L);
  await awaitProjection(page, `${6}:${L}:true`);
  await release(page);

  // R's last child, after R2.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  const placed = await fetchItem(request, x.id);
  expect(placed.isAttached).toBe(1);
  expect(placed.position).toBeGreaterThan((await fetchItem(request, r2.id)).position);
  await expect(overflowRow(page, r.id)).toHaveText('3 children');
});

test('DRAG-7.4: tabbed left of the overflow row, the item is R’s next sibling, after its hidden levels', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Next Sibling Project';
  const { p, q, r, t, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);

  await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L - 1);
  await awaitProjection(page, `${6}:${L - 1}:true`);
  await release(page);

  // Q's child, between R and T. R keeps its two attached children.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(q.id);
  const placed = await fetchItem(request, x.id);
  expect(placed.isAttached).toBe(1);
  expect(placed.position).toBeGreaterThan((await fetchItem(request, r.id)).position);
  expect(placed.position).toBeLessThan((await fetchItem(request, t.id)).position);
  await expect(overflowRow(page, r.id)).toHaveText('2 children');
  await expect(itemRow(page, x.id)).toBeVisible();
});

test('DRAG-7.5: below a last-level row with no attached children, one tab right makes the item its only attached child', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Only Child Project';
  const { p, t, g, b, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);

  // The gap between T and B offers every level from 1 to L + 1, and no deeper.
  const aim = await holdAt(page, x, p, () => topQuarter(itemRow(page, b.id)), L - 1);
  await awaitProjection(page, `${7}:${L - 1}:true`);
  await aim(L + 6);
  await awaitProjection(page, `${7}:${L}:true`);
  await release(page);

  // T's only attached child, one level deeper than the section shows. G is still its Free
  // child.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(t.id);
  expect((await fetchItem(request, x.id)).isAttached).toBe(1);
  const free = await fetchItem(request, g.id);
  expect([free.parentId, free.isAttached]).toEqual([t.id, 0]);
  await expect(overflowRow(page, t.id)).toHaveText('1 child');
  await expect(itemRow(page, x.id)).toHaveCount(0);
});

test('DRAG-7.1, DRAG-1.34: the drop math takes the level count the section is drawn with', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Level Count Drop Project';
  const { p, r1, r2, t, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, { ...NO_POP, sectionLevels: L + 1 });
  await projectSidebar.openBoard(name);

  // One more level shows R2 at the last one, so below it the gap offers a state one level
  // deeper, R2's only child, which three levels would have put behind an overflow row.
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toContain(r2.id);
  await expect(itemRow(page, r1.id)).toBeVisible();
  await holdAt(page, x, p, () => topQuarter(itemRow(page, t.id)), L + 6);
  await awaitProjection(page, `${6}:${L + 1}:true`);
  await release(page);

  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r2.id);
  expect((await fetchItem(request, x.id)).isAttached).toBe(1);
  await expect(overflowRow(page, r2.id)).toHaveText('1 child');
});

test('DRAG-7.4: with no row below the overflow row at its level, B is Bottom, and the states run from the first level to the hidden children’s level', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Bottom Is B Project';
  const { p, a, q, r, t, b, x } = await seedOverflowTree(request, name);
  // T is moved out of the way, under B, so the gap under R's overflow row has B as its Bottom.
  await moveItem(request, t.id, { parentId: b.id });
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toEqual([a.id, q.id, r.id, `overflow:${r.id}`, b.id, t.id, x.id]);

  // Every level from B's to the overflow row's, the shallower ones walking R's ancestors, and no
  // deeper: an offset past the overflow row's level clamps to it.
  const aim = await holdAt(page, x, p, () => topQuarter(itemRow(page, b.id)), 0);
  await awaitProjection(page, `${6}:0:true`);
  await aim(L - 1);
  await awaitProjection(page, `${6}:${L - 1}:true`);
  await aim(L + 6);
  await awaitProjection(page, `${6}:${L}:true`);
  await aim(-6);
  await awaitProjection(page, `${6}:0:true`);
  await aim(1);
  await awaitProjection(page, `${6}:1:true`);
  await release(page);

  // One level in: A's child, after Q and its whole subtree.
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(a.id);
  expect((await fetchItem(request, x.id)).position).toBeGreaterThan((await fetchItem(request, q.id)).position);
});

// A press on an overflow row's count goes no further: it picks up neither the row nor the Card it
// is part of, and a click on it opens the modal and not the Card's Sheet.
test('DRAG-7.22: a press and drag from an overflow row’s count starts no drag, and a click on it opens the modal, not the Card’s Sheet', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Press Project';
  const { r, p } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const before = await sectionRows(page, p.id);
  const writes = watchWrites(page);
  const modal = hierarchyModal(page, 'P');

  // A click opens the modal, and P's Sheet stays shut.
  await overflowRow(page, r.id).click();
  await expect(modal).toBeVisible();
  await expect(itemPanel(page)).toHaveClass(/translate-x-full/);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  // A press that moves well past the distance that starts a drag anywhere else starts none.
  const start = await pickUp(page, overflowRow(page, r.id));
  await hoverTo(page, { x: start.x + 60, y: start.y + 80 });
  await expect(dragMachine(page)).toHaveCount(0);
  await expect(dragOverlay(page)).toHaveCount(0);
  await release(page);

  expect(await sectionRows(page, p.id)).toEqual(before);
  await expect(modal).toHaveCount(0);
  expect(writes).toEqual([]);
});

test('DRAG-7.24: a press on an overflow row’s indent is the Card’s: it carries the Card, and a click opens the Card’s Sheet, not the modal', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Indent Project';
  const { r } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // The wrapper's left padding, left of the count.
  const box = await boxOf(overflowRow(page, r.id));
  const indent = { x: box.x + 6, y: box.y + box.height / 2 };
  const modal = hierarchyModal(page, 'P');
  const writes = watchWrites(page);

  // A click there opens P's Sheet, and the modal stays shut.
  await page.mouse.click(indent.x, indent.y);
  await expect(itemPanel(page)).toHaveClass(/translate-x-0/);
  await expect(modal).toHaveCount(0);
  await page.mouse.click(8, 8);
  await expect(itemPanel(page)).toHaveClass(/translate-x-full/);

  // A press that moves past the distance that starts a drag carries P.
  const start = await pickUpAt(page, indent);
  await hoverTo(page, { x: start.x + 60, y: start.y + 80 });
  await expect(dragMachine(page)).toHaveAttribute('data-drag-state', /./);
  await expect(dragOverlay(page)).toHaveCount(1);
  await expect(dragOverlay(page)).toHaveAttribute('aria-label', 'P');
  await cancel(page);
  expect(writes).toEqual([]);
});

test('DRAG-7.27: a dragged R carries its overflow row, which is never a neighbor, and at the first level its children show', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Carried Project';
  const { p, a, q, r, t, r1, r1a, r2, b, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // R is picked up in the section and held over its own row. Every gap reads as though its
  // overflow row weren't there: the gap after Q runs to T, R's own gap, and the line is never
  // drawn on the overflow row.
  const aim = await holdAt(page, r, p, () => center(itemRow(page, r.id)), 0);
  await awaitProjection(page, `${2}:${L - 1}:true`);
  await expect.poll(() => dropLineOn(page)).not.toBeNull();
  expect((await dropLineOn(page))?.row).not.toBe(`overflow:${r.id}`);

  // Aimed at X, level 1 is B's next sibling.
  const home = aim.at();
  const x0 = home.x - (L - 1) * DESCENDANTS_INDENT_PX;
  await hoverTo(page, { x: x0, y: (await topQuarter(itemRow(page, x.id))).y });
  await hoverTo(page, { x: x0, y: (await topQuarter(itemRow(page, x.id))).y });
  await awaitProjection(page, `${4}:0:true`);
  expect((await dropLineOn(page))?.row).not.toBe(`overflow:${r.id}`);
  await release(page);

  // R is P's child after B, with its children still its own. At the first level its children
  // are at levels 2 and 3, within the section, and nothing is hidden.
  await expect.poll(async () => (await fetchItem(request, r.id)).parentId).toBe(p.id);
  const moved = await fetchItem(request, r.id);
  expect(moved.position).toBeGreaterThan((await fetchItem(request, b.id)).position);
  expect(moved.position).toBeLessThan((await fetchItem(request, x.id)).position);
  for (const child of [r1, r2]) expect((await fetchItem(request, child.id)).parentId).toBe(r.id);
  await expect.poll(() => sectionRows(page, p.id)).toEqual([a.id, q.id, t.id, b.id, r.id, r1.id, r1a.id, r2.id, x.id]);
  await expect(overflowRow(page, r.id)).toHaveCount(0);
});

test('DRAG-7.29: the side highlight can name an overflow row, and a release still places by gap and depth', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Overflow Row Side Highlight Project';
  const { p, r, r1, x } = await seedOverflowTree(request, name);
  await seedDragTuning(page, NO_POP);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  // The ghost is in the gap above the overflow row. As the carried copy crosses the ghost's middle,
  // the line is drawn on R, then on the overflow row, the gap and the level unchanged.
  await holdAt(page, x, p, () => topQuarter(overflowRow(page, r.id)), 0);
  await awaitProjection(page, '3:3:true');
  const row = await boxOf(overflowRow(page, r.id));
  let onOverflow = false;
  for (const dy of [2, 20, 2, 20]) {
    await hoverTo(page, { x: row.x + row.width / 2, y: row.y + dy });
    await awaitProjection(page, '3:3:true');
    await expect.poll(() => dropLineOn(page)).not.toBeNull();
    onOverflow = (await dropLineOn(page))!.row === `overflow:${r.id}`;
    if (onOverflow) break;
  }
  expect(onOverflow).toBe(true);

  // A release with the line on the overflow row places X by the gap and depth: R's first child.
  await release(page);
  await expect.poll(async () => (await fetchItem(request, x.id)).parentId).toBe(r.id);
  expect((await fetchItem(request, x.id)).position).toBeLessThan((await fetchItem(request, r1.id)).position);
});

test('DRAG-7.30: a section shows at least one level', async ({ page, request, projectSidebar }) => {
  const name = 'Overflow Row One Level Project';
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const a = await seedItem(request, { title: 'A', parentId: p.id });
  const r = await seedItem(request, { title: 'R', parentId: a.id });
  const t = await seedItem(request, { title: 'T', parentId: a.id });
  const b = await seedItem(request, { title: 'B', parentId: p.id });

  // Two levels show A, then R and T under it.
  await seedDragTuning(page, { ...NO_POP, sectionLevels: 2 });
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  expect(await sectionRows(page, p.id)).toEqual([a.id, r.id, t.id, b.id]);

  // Set below one in the panel, it shows one: A and B, with an overflow row under A for R and T.
  await page.getByRole('button', { name: 'Drag tuning' }).click();
  await page.getByRole('spinbutton', { name: 'Levels a section shows' }).fill('0');
  await expect.poll(() => sectionRows(page, p.id)).toEqual([a.id, `overflow:${a.id}`, b.id]);
  await expect(overflowRow(page, a.id)).toHaveText('2 children');
  for (const hidden of [r, t]) await expect(itemRow(page, hidden.id)).toHaveCount(0);
});
