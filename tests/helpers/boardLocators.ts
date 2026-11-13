import type { Locator, Page } from '@playwright/test';
import {
  CARD_LIST_REGION_SELECTOR,
  DRAG_OVERLAY_ATTR,
  DRAG_REGION_ATTR,
} from '../../client/src/components/workflow/dragRegions';

// The board's own card and column locators, spelled once for the specs to share.

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

// The item detail panel. It stays in the page when closed, slid out of view, so
// a spec opens an item before it reads from this.
export function itemPanel(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Item details', exact: true });
}

// The live sortable Card and Stub rows' identifying attribute. It excludes the
// carried overlay copy and a Card's static Stub rows. `scope` is the whole page, or a
// `Locator` such as the hierarchy modal, to find the row only there.
export function itemRow(scope: Page | Locator, id: string): Locator {
  return scope.locator(`[data-item-id="${id}"]`);
}

export function itemRowButton(scope: Page | Locator, id: string, title: string): Locator {
  return itemRow(scope, id).getByRole('button', { name: title, exact: true });
}

// An exact region key, or the first column/sub-row region in a column group.
// The unkeyed form excludes Cards' Descendants regions, which share the attribute.
export function dragRegion(scope: Page | Locator, key?: string): Locator {
  return key === undefined
    ? scope.locator(CARD_LIST_REGION_SELECTOR).first()
    : scope.locator(`[${DRAG_REGION_ATTR}="${key}"]`);
}

// The carried copy of the item being dragged, which exists only for the length of the drag.
export function dragOverlay(page: Page): Locator {
  return page.locator(`[${DRAG_OVERLAY_ATTR}]`);
}

// The existing cue fill element, without committing its colour or final look.
export function zoomCue(scope: Page | Locator): Locator {
  return scope.locator('[style*="animation-name: cue-fill"]');
}

// The hierarchy modal of the Card titled `cardTitle` (`HierarchyModal.tsx`).
export function hierarchyModal(page: Page, cardTitle: string): Locator {
  return page.getByRole('dialog', { name: `Hierarchy of ${cardTitle}`, exact: true });
}

// The forced-stop banner, by the attribute the app gives it (`ForcedStopCue.tsx`), whose value is the
// cause. It exists only while a stop is live.
export function stopBanner(page: Page): Locator {
  return page.locator('[data-forced-stop]');
}

// The rows drawn with the stopped-item flash (`data-stop-flash`, `dragChrome.tsx::useItemRow`).
export function flashingRows(page: Page): Locator {
  return page.locator('[data-stop-flash]');
}

// What the board shows in place of itself while a reload is read (`BoardView.tsx`).
export function loadingBoard(page: Page): Locator {
  return page.getByText('Loading board…', { exact: true });
}

// The overflow row standing in for the hidden children of the row `ownerId`
// (`StubRows.tsx::OverflowRow`). It is no item, so it has no `data-item-id`.
export function overflowRow(page: Page, ownerId: string): Locator {
  return page.locator(`[data-overflow-row="${ownerId}"]`);
}
