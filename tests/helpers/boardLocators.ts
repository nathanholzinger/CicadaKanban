import type { Locator, Page } from '@playwright/test';

// The board's own card/column locators, one spelling for every drag and
// repositioning spec.

// `scope` is a `Locator` (rather than always the whole `page`) so a caller
// can disambiguate a Card that also matches on a floating DragOverlay copy
// mid-drag (both carry `role=article aria-label={title}`) by scoping to a
// specific column's group instead.
export function article(scope: Page | Locator, title: string): Locator {
  return scope.getByRole('article', { name: title, exact: true });
}

export function column(page: Page, name: string): Locator {
  return page.getByRole('group', { name, exact: true });
}

// The titles of the Cards in `scope`, in the order they render.
export async function titlesIn(scope: Locator): Promise<string[]> {
  return scope.getByRole('article').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''));
}

// Every Card/Stub row's own identifying attribute, set on every row but the
// carried overlay copy by `dragChrome.tsx::useItemRow`.
export function itemRow(page: Page, id: string): Locator {
  return page.locator(`[data-item-id="${id}"]`);
}
