import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { center, pickUp, release } from '../helpers/dragGesture';
import { API } from '../helpers/api';
import { aim } from '../helpers/projectTreeDrag';
import { fetchProjectDepthCap, seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { projectRowIndentPx } from '../../client/src/components/sidebar/projectTreeUtils';
import {
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
} from '../../client/src/components/sidebar/sidebarWidth';

test.beforeEach(async ({ page }) => {
  await resetAndSeedDb();
  await page.goto('/');
});

// Drags the sidebar's handle `dx` px to the right (left when negative) and lets go.
async function dragHandleBy(page: Page, sidebar: ProjectSidebarPage, dx: number) {
  const grab = await center(sidebar.resizeHandle);
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + dx, grab.y, { steps: 10 });
  await page.mouse.up();
}

const widthPx = (px: number) => `${px}px`;

test('the sidebar starts at its default width', async ({ projectSidebar }) => {
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX));
});

test('dragging the handle on the right edge sets the sidebar’s width', async ({ page, projectSidebar }) => {
  await dragHandleBy(page, projectSidebar, 100);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 100));

  await dragHandleBy(page, projectSidebar, -60);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 40));
});

test('the sidebar stops at its widest and narrowest', async ({ page, projectSidebar }) => {
  await dragHandleBy(page, projectSidebar, 1000);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_MAX_WIDTH_PX));

  await dragHandleBy(page, projectSidebar, -1000);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_MIN_WIDTH_PX));

  // At its narrowest the handle is still there to drag back out.
  await dragHandleBy(page, projectSidebar, 80);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_MIN_WIDTH_PX + 80));
});

test('the width a user dragged the sidebar to is kept across a reload', async ({ page, projectSidebar }) => {
  await dragHandleBy(page, projectSidebar, 120);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 120));

  await page.reload();
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 120));
});

test('a project still drags to a new place in a resized sidebar', async ({ page, request, projectSidebar }) => {
  await seedProjects(request, [
    ['A', null],
    ['B', null],
    ['X', null],
  ]);
  await page.reload();
  await dragHandleBy(page, projectSidebar, 100);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 100));

  const from = await pickUp(page, projectSidebar.dragHandle('X'));
  await aim(page, from, projectSidebar.row('A'), 'before', 0);
  await release(page);

  await expect(projectSidebar.projectNames('A', 'B', 'X')).toHaveText(['X', 'A', 'B']);
});

test('TREE-3.11: a deep project’s name, cut short by a narrow sidebar, shows more as the sidebar is dragged wider', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  // A chain down to the cap: the last project's name is short enough to show in full in the
  // widest sidebar, and too long for the room that is left after its indent in the default one.
  const chain = Array.from({ length: cap - 1 }, (_, level) => `Level ${level + 1}`);
  const deepest = 'Deep project';
  const ids = await seedProjects(request, [
    ...chain.map((name, level) => [name, level === 0 ? null : chain[level - 1]] as const),
    [deepest, chain[chain.length - 1]],
  ]);
  await page.reload();
  const name = projectSidebar.projectName(deepest);
  const drawn = () => name.evaluate(el => ({ shown: el.clientWidth, needed: el.scrollWidth }));

  // At the default width the row is listed, under its parent, with its name cut short.
  await expect(projectSidebar.row(deepest)).toHaveCSS('padding-left', `${projectRowIndentPx(cap - 1)}px`);
  const narrow = await drawn();
  expect(narrow.shown).toBeLessThan(narrow.needed);

  // Dragged wider, more of it is drawn, and in the widest sidebar all of it. At every width the row
  // is found by its full name.
  await dragHandleBy(page, projectSidebar, 100);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_DEFAULT_WIDTH_PX + 100));
  const wider = await drawn();
  expect(wider.shown).toBeGreaterThan(narrow.shown);
  await expect(name).toHaveCount(1);
  await dragHandleBy(page, projectSidebar, 1000);
  await expect(projectSidebar.locator).toHaveCSS('width', widthPx(SIDEBAR_MAX_WIDTH_PX));
  const widest = await drawn();
  expect(widest.shown).toBeGreaterThan(wider.shown);
  expect(widest.shown).toBeGreaterThanOrEqual(widest.needed);
  await expect(name).toHaveCount(1);

  // The cap is the same at any width: a project under the deepest one is refused.
  const tooDeep = await request.post(`${API}/projects`, { data: { name: 'Too deep', parentId: ids[deepest] } });
  expect(tooDeep.status()).toBe(400);
});
