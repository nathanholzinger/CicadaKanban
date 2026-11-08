import type { Locator } from '@playwright/test';
import { test, expect } from '../fixtures';
import { fetchItemTypes, seedItem } from '../helpers/seed';
import { column, dragOverlay, dragRegion, itemRow } from '../helpers/boardLocators';
import {
  awaitPoppedOut,
  awaitDragContext,
  boxOf,
  cancel,
  gapBetween,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  POP_OUT_ONLY,
  NO_POP,
} from '../helpers/dragGesture';
import { dragBoxOf, expectWithin, mergeRange, seedBoardFixture, setSectionExpanded } from '../helpers/boardDragSurface';
import { columnForWorkphase } from '../helpers/seed';
import {
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
} from '../../client/src/components/workflow/dragRegions';

test.use({ viewport: { width: 1600, height: 1000 } });

// Measure the space after the title inside the card's content box. This also
// observes an empty slot reserved by a fixed wrapper, without requiring an empty node.
async function descriptionSpace(title: Locator) {
  return title.evaluate(element => {
    const card = element.closest('[data-item-id], [data-drag-overlay]') as HTMLElement;
    let top = 0;
    for (
      let node = element as HTMLElement | null;
      node && node !== card;
      node = node.offsetParent as HTMLElement | null
    )
      top += node.offsetTop;
    const style = getComputedStyle(card);
    return (
      card.offsetHeight -
      parseFloat(style.borderBottomWidth) -
      parseFloat(style.paddingBottom) -
      top -
      (element as HTMLElement).offsetHeight
    );
  });
}

for (const expanded of [false, true]) {
  test(`DRAG-1.28: a locked ${expanded ? 'sub-row' : 'merged column'} bounds the rendered carried box while permitting movement within it`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Rendered Context Bounds');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    for (const title of ['A', 'B', 'C', 'D'])
      await seedItem(request, { title, projectId: s.project.id, workphaseId: s.todo.id });
    const id = expanded
      ? await mergeRange(request, s.board, s.todo.id, s.doing.id, 'expanded')
      : columnForWorkphase(s.board, s.todo.id).id;
    const key = expanded ? subrowRegionKey(id, s.todo.id) : columnRegionKey(id);
    await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
    await projectSidebar.openBoard('Rendered Context Bounds');
    const start = await pickUp(page, itemRow(page, x.id));
    const region = dragRegion(page, key);
    const boundary = expanded ? region : column(page, 'Todo');
    const bounds = await boxOf(region);
    await hoverTo(page, { x: bounds.x - 100, y: start.y + 30 });
    await expectWithin(dragOverlay(page), boundary, expanded ? 'both' : 'x');
    const before = await dragBoxOf(dragOverlay(page));
    await hoverTo(page, { x: bounds.x - 100, y: start.y + 70 });
    const after = await dragBoxOf(dragOverlay(page));
    expect(after.y - before.y).toBeCloseTo(40, 0);
    await expectWithin(dragOverlay(page), boundary, expanded ? 'both' : 'x');
    if (expanded) {
      for (const y of [bounds.y - 50, bounds.y + bounds.height + 50]) {
        await hoverTo(page, { x: bounds.x + bounds.width / 2, y });
        await expectWithin(dragOverlay(page), region);
      }
    }
    await awaitDragContext(page, key);
    await cancel(page);
  });
}

for (const typed of [false, true]) {
  test(`DRAG-3.22: a ${typed ? 'typed' : 'untyped'} Stub starts with two equal row boxes and a carried-only branch line`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Stub Origin Forms');
    const [type] = await fetchItemTypes(request);
    const p = await seedItem(request, { title: 'P', projectId: s.project.id, workphaseId: s.todo.id });
    const a = await seedItem(request, { title: 'A', parentId: p.id });
    const x = await seedItem(request, { title: 'X', parentId: p.id, ...(typed ? { type: type.id } : {}) });
    const child = await seedItem(request, { title: 'XC', parentId: x.id });
    await seedDragTuning(page, { ...NO_POP, popSnapMs: 0 });
    await projectSidebar.openBoard('Stub Origin Forms');
    const reference = await dragBoxOf(itemRow(page, a.id));
    const from = await pickUp(page, itemRow(page, x.id).getByRole('button', { name: /X$/ }));
    await awaitDragContext(page, descendantsRegionKey(p.id));
    await expect(dragOverlay(page)).toHaveAttribute('data-drag-overlay-form', 'stub');
    const copy = await dragBoxOf(dragOverlay(page));
    const ghost = await dragBoxOf(itemRow(page, x.id));
    expect(copy.width).toBe(ghost.width);
    expect(copy.width).toBe(reference.width);
    expect(copy.height).toBe(ghost.height);
    expect(copy.height).toBe(reference.height);
    expect(copy.x).toBeLessThanOrEqual(from.x + 10);
    expect(copy.x + copy.width).toBeGreaterThanOrEqual(from.x + 10);
    expect(copy.y).toBeLessThanOrEqual(from.y + 10);
    expect(copy.y + copy.height).toBeGreaterThanOrEqual(from.y + 10);
    await expect(itemRow(page, child.id)).toHaveCount(0);
    await expect(dragOverlay(page).locator('[data-carried-branch]')).toHaveText('+ 1 child');
    await expect(itemRow(page, x.id).locator('[data-carried-branch]')).toHaveCount(0);
    expect((await dragBoxOf(dragOverlay(page).locator('[data-carried-branch]'))).y).toBeGreaterThanOrEqual(
      copy.y + copy.height - 1,
    );
    await cancel(page);
  });
}

for (const expanded of [false, true]) {
  test(
    'DRAG-3.19: both shortCard copies reserve the same line and box with long or empty descriptions (' +
      (expanded ? 'expanded' : 'collapsed') +
      ')',
    async ({ page, request, projectSidebar }) => {
      const reference = new Map<string, { width: number; height: number; space: number }[]>();
      for (const description of ['A long description that wraps in a full Card. '.repeat(25), '']) {
        const name = 'Compact Card Forms';
        const s = await seedBoardFixture(request, name);
        const [type] = await fetchItemTypes(request);
        const x = await seedItem(request, {
          title: 'X with a long title that must stay on one line when carried',
          description,
          projectId: s.project.id,
          workphaseId: s.todo.id,
          type: type.id,
          assigneeType: 'human',
        });
        const s1 = await seedItem(request, { title: 'S1', parentId: x.id });
        const s2 = await seedItem(request, { title: 'S2', parentId: x.id });
        const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
        await projectSidebar.openBoard(name);
        const full = itemRow(page, x.id);
        await setSectionExpanded(full, expanded);
        if (expanded) await expect(itemRow(page, s1.id)).toBeVisible();
        else await expect(itemRow(page, s1.id)).toHaveCount(0);
        await expect(full.getByText('Human', { exact: true })).toBeVisible();
        const fullHeight = (await boxOf(full)).height;
        await pickUp(page, full);
        for (const layer of ['column', 'board']) {
          if (layer === 'board') {
            await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
            await awaitPoppedOut(page, tuning);
          }
          const ghost = itemRow(page, x.id);
          const copy = dragOverlay(page);
          const ghostBox = await dragBoxOf(ghost);
          const copyBox = await dragBoxOf(copy);
          expect(copyBox.height).toBe(ghostBox.height);
          expect(copyBox.width).toBe(ghostBox.width);
          const observations: { width: number; height: number; space: number }[] = [];
          for (const representation of [ghost, copy]) {
            const title = representation.getByText(x.title, { exact: true });
            await expect(title).toHaveCSS('white-space', 'nowrap');
            const space = await descriptionSpace(title);
            expect(space).toBeGreaterThan(0);
            const bounds = await dragBoxOf(representation);
            observations.push({ width: bounds.width, height: bounds.height, space });
            if (description) {
              const paragraph = representation.getByText(description, { exact: true });
              await expect(paragraph).toBeVisible();
              await expect(paragraph).toHaveCSS('-webkit-line-clamp', '1');
              const height = (await dragBoxOf(paragraph)).height;
              const lineHeight = await paragraph.evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
              // offsetHeight is an integer, so compare with the same explicit rounding.
              expect(height).toBe(Math.round(lineHeight));
            }
            await expect(representation.getByText('Human', { exact: true })).toHaveCount(0);
            await expect(representation.getByTitle(/attached children/)).toHaveCount(0);
            const pills = representation.getByText(type.name, { exact: true }).locator('xpath=ancestor::div[1]');
            await expect(pills).toHaveCount(1);
            const pillCenters = await pills.locator(':scope > span').evaluateAll(elements =>
              elements.map(element => {
                const pill = element as HTMLElement;
                return pill.offsetTop + pill.offsetHeight / 2;
              }),
            );
            expect(pillCenters).toHaveLength(2);
            expect(Math.abs(pillCenters[0] - pillCenters[1])).toBeLessThanOrEqual(1);
          }
          if (description) reference.set(layer, observations);
          else expect(observations).toEqual(reference.get(layer));
          await expect(copy.locator('[data-carried-branch]')).toHaveText('+ 2 children');
          await expect(ghost.locator('[data-carried-branch]')).toHaveCount(0);
          expect((await dragBoxOf(copy.locator('[data-carried-branch]'))).y).toBeGreaterThanOrEqual(
            copyBox.y + copyBox.height - 1,
          );
          await expect(itemRow(page, s1.id)).toHaveCount(0);
          await expect(itemRow(page, s2.id)).toHaveCount(0);
        }
        await release(page);
        await expect.poll(async () => (await boxOf(itemRow(page, x.id))).height).toBeCloseTo(fullHeight, 0);
        if (expanded) {
          await expect(itemRow(page, s1.id)).toBeVisible();
          await expect(itemRow(page, s2.id)).toBeVisible();
        } else {
          await expect(itemRow(page, s1.id)).toHaveCount(0);
          await expect(itemRow(page, s2.id)).toHaveCount(0);
        }
        await pickUp(page, itemRow(page, x.id));
        await release(page);
        await expect.poll(async () => (await boxOf(itemRow(page, x.id))).height).toBeCloseTo(fullHeight, 0);
        if (expanded) {
          await expect(itemRow(page, s1.id)).toBeVisible();
          await expect(itemRow(page, s2.id)).toBeVisible();
        } else {
          await expect(itemRow(page, s1.id)).toHaveCount(0);
          await expect(itemRow(page, s2.id)).toHaveCount(0);
        }
      }
    },
  );
}

for (const boardLayer of [false, true]) {
  test(`DRAG-1.33, DRAG-3.19: release restores the carried branch's collapsed preference from ${boardLayer ? 'Board' : 'Column'}`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    const s = await seedBoardFixture(request, 'Collapsed Branch Restoration');
    const x = await seedItem(request, { title: 'X', projectId: s.project.id, workphaseId: s.todo.id });
    const child = await seedItem(request, { title: 'S', parentId: x.id });
    const tuning = await seedDragTuning(page, { ...POP_OUT_ONLY, popSnapMs: 0 });
    await projectSidebar.openBoard('Collapsed Branch Restoration');
    const card = itemRow(page, x.id);
    await setSectionExpanded(card, false);
    await expect(card.getByTitle('Show attached children', { exact: true })).toBeVisible();
    await expect(itemRow(page, child.id)).toHaveCount(0);
    await pickUp(page, card);
    if (boardLayer) {
      await hoverTo(page, await gapBetween(column(page, 'Todo'), column(page, 'In Progress')));
      await awaitPoppedOut(page, tuning);
    }
    await expect(itemRow(page, child.id)).toHaveCount(0);
    await release(page);
    await expect(itemRow(page, child.id)).toHaveCount(0);
    await expect(itemRow(page, x.id).getByTitle('Show attached children', { exact: true })).toBeVisible();
  });
}
