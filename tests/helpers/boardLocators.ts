import type { Locator, Page } from '@playwright/test';

// The board's own card/column locators — spelled independently at least
// four times across the drag/repositioning specs, byte-identical each time
// (audit epic-3-5-story-4 #6).

export function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true });
}

export function column(page: Page, name: string): Locator {
  return page.getByRole('group', { name, exact: true });
}
