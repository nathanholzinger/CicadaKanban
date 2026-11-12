import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { fetchItem, fetchItemTypes, pickWorkphases, seedItem, seedTemplatedWorkflow } from '../helpers/seed';
import { awaitDragContext, boxOf, cancel, paintedBoxOf, pickUp } from '../helpers/dragGesture';
import { article, dragOverlay, hierarchyModal, itemRow, overflowRow } from '../helpers/boardLocators';
import { dragBoxOf } from '../helpers/boardDragSurface';
import { descendantsRegionKey } from '../../client/src/components/workflow/dragRegions';

// DRAG-3.25: every Stub-sized row has one fixed height `s`, with a type pill or without: a section's rows,
// its overflow row, the hierarchy modal's rows and the section's rows under the modal's backdrop, and a
// picked-up Stub's ghost and carried copy. The heights are compared with each other, never with a number.
//
// The helpers here read the screen: boxes in layout space (`boxOf`, `dragBoxOf`) for a row's height, and
// painted boxes for where the carried copy and its branch line are. The branch line is found by the
// app's `data-carried-branch` attribute, the one hook the app provides for it.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

test.use({ viewport: { width: 1600, height: 1000 } });

const LONG = 'A title far longer than any row can hold on its one line, '.repeat(4).trim();

// P holds A (typed, with the chain Q, R and R's two children behind R's overflow row), B (untyped, a leaf),
// C (typed, a long title), D (untyped, a long title), E (untyped, with a child E1) and F (typed, a leaf).
async function seedHeightTree(request: APIRequestContext, name: string) {
  const types = await fetchItemTypes(request);
  const story = types.find(t => t.name === 'Story') ?? types[1];
  const task = types.find(t => t.name === 'Task') ?? types[2];
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: todo.id });
  const child = (title: string, parentId: string, type?: string) =>
    seedItem(request, { title, parentId, ...(type ? { type } : {}) });
  const a = await child('A', p.id, story.id);
  const q = await child('Q', a.id);
  const r = await child('R', q.id, task.id);
  const r1 = await child('R1', r.id, story.id);
  const r2 = await child('R2', r.id);
  const b = await child('B', p.id);
  const c = await child(`C ${LONG}`, p.id, task.id);
  const d = await child(`D ${LONG}`, p.id);
  const e = await child('E', p.id);
  const e1 = await child('E1', e.id);
  const f = await child('F', p.id, story.id);
  // The Given: each typed item is saved with its type, and each untyped one with none.
  for (const [item, type] of [
    [a, story.id],
    [r, task.id],
    [r1, story.id],
    [c, task.id],
    [f, story.id],
  ] as const) {
    expect((await fetchItem(request, item.id)).type, `${item.title.slice(0, 2)} is typed`).toBe(type);
  }
  for (const item of [p, q, r2, b, d, e, e1]) {
    expect((await fetchItem(request, item.id)).type, `${item.title.slice(0, 2)} is untyped`).toBeNull();
  }
  return { p, a, q, r, r1, r2, b, c, d, e, e1, f, story, task };
}

// The fixed row height, taken from an untyped row with a short title (B).
const rowHeight = async (row: Locator) => (await boxOf(row)).height;

async function expectRowHeight(row: Locator, s: number, what: string) {
  expect(await rowHeight(row), `${what} has the fixed row height`).toBeCloseTo(s, 1);
}

// A typed row's pill is no taller than its title's line.
async function expectPillFitsTitleLine(row: Locator, typeName: string, title: string, what: string) {
  const pill = await boxOf(row.getByText(typeName, { exact: true }));
  const line = await boxOf(row.getByText(title, { exact: true }));
  expect(pill.height, `${what}: the pill fits the title's line`).toBeLessThanOrEqual(line.height + 0.5);
}

// A row the section draws under the modal's backdrop has no drag registration, so it is found by its title
// inside the Card: the title's parent is the row's box.
const staticRow = (page: Page, title: string) =>
  article(page, 'P').getByText(title, { exact: true }).locator('xpath=..');

test('DRAG-3.25: a section’s typed, untyped and long-title Stub rows and its overflow row are one height, and a pill fits the title’s line', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Stub Row Height Section Project';
  const t = await seedHeightTree(request, name);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();

  const s = await rowHeight(itemRow(page, t.b.id));
  expect(s, 'the fixed height is a positive number').toBeGreaterThan(0);
  const typed: Array<[typeof t.a, string]> = [
    [t.a, t.story.name],
    [t.r, t.task.name],
    [t.c, t.task.name],
    [t.f, t.story.name],
  ];
  for (const [item, typeName] of typed) {
    const row = itemRow(page, item.id);
    await expectRowHeight(row, s, `typed row ${item.title.slice(0, 12)}`);
    await expectPillFitsTitleLine(row, typeName, item.title, `typed row ${item.title.slice(0, 12)}`);
  }
  for (const item of [t.q, t.b, t.d, t.e, t.e1]) {
    await expectRowHeight(itemRow(page, item.id), s, `untyped row ${item.title.slice(0, 12)}`);
  }
  await expectRowHeight(overflowRow(page, t.r.id), s, 'the overflow row');
});

test('DRAG-3.25: the hierarchy modal’s typed and untyped rows and the section’s rows under its backdrop are one height', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Stub Row Height Modal Project';
  const t = await seedHeightTree(request, name);
  await projectSidebar.openBoard(name);
  await expect(article(page, 'P')).toBeVisible();
  const s = await rowHeight(itemRow(page, t.b.id));

  // The title's parent is the row's box: with no modal open, on a registered row, it is the same box.
  const registered = await boxOf(itemRow(page, t.b.id));
  const parent = await boxOf(staticRow(page, t.b.title));
  expect(parent.height, 'the title’s parent is as tall as the row').toBeCloseTo(registered.height, 1);
  expect(parent.y, 'and starts where the row does').toBeCloseTo(registered.y, 1);

  await overflowRow(page, t.r.id).click();
  const modal = hierarchyModal(page, 'P');
  await expect(modal).toBeVisible();

  // Every row of the modal, typed and untyped, long titles included.
  for (const item of [t.a, t.q, t.r, t.r1, t.r2, t.b, t.c, t.d, t.e, t.e1, t.f]) {
    await expectRowHeight(itemRow(modal, item.id), s, `modal row ${item.title.slice(0, 12)}`);
  }
  // And the rows the section still draws under the backdrop, found by title inside the Card.
  for (const item of [t.a, t.q, t.r, t.b, t.c, t.d, t.e, t.e1, t.f]) {
    await expectRowHeight(staticRow(page, item.title), s, `static section row ${item.title.slice(0, 12)}`);
  }
});

// A Stub picked up from its section or from the modal: its ghost and its carried copy each have a box of
// the fixed height, the carried border inside it. With a branch, the carried copy's second line hangs below
// that box and adds nothing to it, and the ghost has none.
for (const source of ['section', 'modal'] as const) {
  for (const typed of [true, false]) {
    for (const branch of [false, true]) {
      test(`DRAG-3.25: a ${typed ? 'typed' : 'untyped'} Stub ${branch ? 'with a branch' : 'without one'} picked up from ${source === 'section' ? 'its section' : 'the modal'} has a ghost and a carried copy of the fixed height${branch ? ', and the branch line hangs below the copy' : ''}`, async ({
        page,
        request,
        projectSidebar,
      }) => {
        const name = `Stub Row Height Pickup ${source} ${typed ? 'typed' : 'untyped'} ${branch ? 'branch' : 'leaf'}`;
        const t = await seedHeightTree(request, name);
        await projectSidebar.openBoard(name);
        await expect(article(page, 'P')).toBeVisible();
        const s = await rowHeight(itemRow(page, t.b.id));

        // The carried Stub: A (typed, with a branch), E (untyped, with a branch), F (typed leaf), B (untyped leaf).
        const item = typed ? (branch ? t.a : t.f) : branch ? t.e : t.b;
        let scope: Page | Locator = page;
        if (source === 'modal') {
          await overflowRow(page, t.r.id).click();
          scope = hierarchyModal(page, 'P');
          await expect(scope).toBeVisible();
        }

        // The row's own button: a typed row's accessible name includes its pill, so the title alone isn't the name.
        // The Given: a typed Stub draws its pill, an untyped one does not.
        const typeName = typed ? t.story.name : t.task.name;
        await expect(itemRow(scope, item.id).getByText(typeName, { exact: true })).toHaveCount(typed ? 1 : 0);
        await pickUp(page, itemRow(scope, item.id).getByRole('button').first());
        await awaitDragContext(page, descendantsRegionKey(t.p.id));
        const copy = dragOverlay(page);
        await expect(copy).toHaveCount(1);

        // The ghost and the carried copy are the fixed height. The copy's border is inside it: its box, which
        // includes the border, is the fixed height.
        await expectRowHeight(itemRow(scope, item.id), s, 'the in-list ghost');
        expect((await dragBoxOf(copy)).height, 'the carried copy has the fixed height').toBeCloseTo(s, 1);

        // The branch line: on the carried copy alone, below its box, adding nothing to its height.
        const lines = copy.locator('[data-carried-branch]');
        await expect(lines).toHaveCount(branch ? 1 : 0);
        await expect(itemRow(scope, item.id).locator('[data-carried-branch]')).toHaveCount(0);
        if (branch) {
          const box = await paintedBoxOf(copy);
          const line = await paintedBoxOf(lines.first());
          expect(line.y, 'the branch line lies below the copy’s box').toBeGreaterThanOrEqual(box.y + box.height - 1);
          expect((await dragBoxOf(copy)).height, 'the line adds nothing to the copy’s height').toBeCloseTo(s, 1);
        }
        await cancel(page);
      });
    }
  }
}
