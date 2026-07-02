import { test, expect } from '@playwright/test';
import { resetAndSeedDb } from './helpers/db';

test.beforeAll(() => {
  resetAndSeedDb();
});

test('loads the app with the seeded default board', async ({ page }) => {
  await page.goto('/');
  // Board selector should contain the seeded board
  await expect(page.locator('select').first()).toContainText('My First Board');
  // Board heading should be visible
  await expect(page.getByRole('heading', { name: 'My First Board' })).toBeVisible();
  // Default columns should be present
  await expect(page.getByRole('heading', { name: 'Backlog' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
});

test('creates a new board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ New board' }).click();
  // Modal should appear
  await expect(page.getByRole('heading', { name: 'New board' })).toBeVisible();
  // Fill in the name
  await page.getByPlaceholder('My project').fill('E2E Test Board');
  await page.getByRole('button', { name: 'Create board' }).click();
  // Modal closes and new board is selected
  await expect(page.getByRole('heading', { name: 'New board' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'E2E Test Board' })).toBeVisible();
  // Board selector should now contain the new board
  await expect(page.locator('header select').first()).toContainText('E2E Test Board');
});

test('adds a column to a board', async ({ page }) => {
  await page.goto('/');
  // Click the dashed "+ Add column" button
  await page.getByRole('button', { name: '+ Add column' }).click();
  // Input appears — type a name
  await page.getByPlaceholder('Column name...').fill('Sprint 1');
  await page.getByRole('button', { name: 'Add column' }).click();
  // Column header should appear
  await expect(page.getByRole('heading', { name: 'Sprint 1' })).toBeVisible();
});

test('typeless card created via API renders in UI', async ({ page, request }) => {
  // Resolve the seeded board and Backlog column IDs
  const boardsRes = await request.get('http://localhost:3002/api/boards');
  const boards = await boardsRes.json();
  const board = boards.find((b: { name: string }) => b.name === 'My First Board');

  const boardRes = await request.get(`http://localhost:3002/api/boards/${board.id}`);
  const boardDetail = await boardRes.json();
  const backlog = boardDetail.columns.find((c: { name: string }) => c.name === 'Backlog');

  // Create a typeless card — only possible via API
  await request.post('http://localhost:3002/api/work-items', {
    data: { title: 'Typeless API card', boardId: board.id, columnId: backlog.id },
  });

  await page.goto('/');
  await expect(
    page.getByRole('group', { name: 'Backlog' }).getByRole('article', { name: 'Typeless API card' })
  ).toBeVisible();
});

test('adds a card to a column', async ({ page }) => {
  await page.goto('/');
  
  const backlogColumn = page.getByRole('group', { name: 'Backlog' });
  await backlogColumn.getByRole('button', { name: '+ Add card' }).click();
  await backlogColumn.getByPlaceholder('Card title...').fill('My first E2E task');
  await backlogColumn.getByRole('button', { name: 'Add' }).click();

  await expect(backlogColumn.getByText('My first E2E task')).toBeVisible();
});
