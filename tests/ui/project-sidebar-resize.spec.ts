import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { center, pickUp, release } from '../helpers/dragGesture';
import { aim } from '../helpers/projectTreeDrag';
import { seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
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
