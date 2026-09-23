import type { Locator, Page } from '@playwright/test';

// The board's own card/column locators — spelled independently at least
// four times across the drag/repositioning specs, byte-identical each time
// (audit epic-3-5-story-4 #6).

// `scope` is a `Locator` (rather than always the whole `page`) so a caller
// can disambiguate a Card that also matches on a floating DragOverlay copy
// mid-drag (both carry `role=article aria-label={title}`) by scoping to a
// specific column's group instead — audit epic-3-5-story-5 #13: this used
// to be re-rolled inline as `column(page, name).getByRole('article', ...)`
// at every call site that needed it.
export function article(scope: Page | Locator, title: string): Locator {
  return scope.getByRole('article', { name: title, exact: true });
}

export function column(page: Page, name: string): Locator {
  return page.getByRole('group', { name, exact: true });
}

// Every Card/Stub row's own identifying attribute (`KanbanCard.tsx`,
// `workflow/CLAUDE.md`'s documented E2E surface) — spelled independently as
// `stubRow`/`target` in at least two specs (audit epic-3-5-story-5 #13).
export function itemRow(page: Page, id: string): Locator {
  return page.locator(`[data-item-id="${id}"]`);
}
