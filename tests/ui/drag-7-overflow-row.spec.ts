import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { seedTemplatedWorkflow, pickWorkphases, seedItem, fetchItem } from '../helpers/seed';
import {
  pickUp,
  hoverTo,
  release,
  topQuarter,
  awaitDragContext,
  awaitProjection,
  seedDragTuning,
  NO_POP,
  type Point,
} from '../helpers/dragGesture';
import { article, itemRow, overflowRow } from '../helpers/boardLocators';
import { sectionRows, seedOverflowTree } from '../helpers/overflowTree';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';
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

// Picks X up in its own section and aims the carried copy at the top of `target`, `depth` levels
// in from where X's own row starts: its own depth, 0, is where the seed puts it.
async function holdAt(page: Page, x: { id: string }, p: { id: string }, target: () => Promise<Point>, depth: number) {
  const from = await pickUp(page, itemRow(page, x.id).getByRole('button', { name: 'X' }));
  await awaitDragContext(page, descendantsRegionKey(p.id));
  const aim = async (levels: number) => {
    const point = await target();
    await hoverTo(page, { x: from.x + levels * DESCENDANTS_INDENT_PX, y: point.y });
  };
  // The rows slide aside as the ghost approaches, so the second pass aims at where they settle.
  await aim(depth);
  await aim(depth);
  return aim;
}

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
  expect(await sectionRows(page, p.id)).toEqual([
    a.id,
    q.id,
    r.id,
    r1.id,
    `overflow:${r1.id}`,
    r2.id,
    t.id,
    b.id,
    x.id,
  ]);
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

  // Q's child, between R and T. R keeps its three children.
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
