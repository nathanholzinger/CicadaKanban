// A Card's descendants section as the board reads it, in two forms:
//   - flat hierarchy rows (`hierarchyRows`, `descendantsChildrenOf`), the input the shared placement
//     library reads, one walk for the section's render, the hierarchy modal and the drop math;
//   - the rows it draws, cut at the last shown level with an overflow row under the last level
//     (`sectionEntries`), without the branch a carried item takes with it
//     (`lib/hierarchyPlacement.ts::carriedBranchOf`).
// Pure. The children it walks come from the caller: ordinarily `itemListOps.ts::getAttachedChildrenFrom`
// through the board's placement-aware accessor.

import type { Item } from '../../types';
import { flattenHierarchyOf, type HierarchyNode } from '../../lib/hierarchyPlacement';

// A row of a Card's descendants section. `parentId` is the walk's own parent
// — the Card or Stub the row renders under — which for a placement-previewed
// row can differ from the stored `item.parentId`.
export type HierarchyRow = HierarchyNode<Item>;

// A Card's whole descendants section as one flat, depth-first list, for
// `KanbanCard.tsx`'s single `SortableContext`, the hierarchy modal's
// (`HierarchyModal.tsx`) and the Descendants layer's projection
// (`descendantsProjection.ts`, which drops the dragged subtree with
// `toRows`) — one walk, so the three can't disagree. `childrenOf` is the
// caller's view of a parent's children: ordinarily `getAttachedChildren`,
// placement-aware, so an item previewing into the section already appears
// at its slot.
export function hierarchyRows(cardId: string, childrenOf: (parentId: string) => readonly Item[]): HierarchyRow[] {
  return flattenHierarchyOf(cardId, sectionChildrenOf(childrenOf));
}

// The same accessor in the ids-only shape `resolvePlacement` looks a Top's
// first child up with. The board never collapses a row in this section, so
// one accessor serves both the rows and that lookup — unlike the sidebar,
// whose collapse toggle needs the real tree separately (`fullChildrenOf`).
export function descendantsChildrenOf(
  getAttachedChildren: (parentId: string) => readonly Item[],
): (parentId: string | null) => readonly string[] {
  const childrenOf = sectionChildrenOf(getAttachedChildren);
  return parentId => childrenOf(parentId).map(item => item.id);
}

// The board's accessor in the library's shape. A section's root is always a
// real Card, so the library's null root has no children here.
function sectionChildrenOf(
  childrenOf: (parentId: string) => readonly Item[],
): (parentId: string | null) => readonly Item[] {
  return parentId => (parentId === null ? [] : childrenOf(parentId));
}

// How many levels of a Card's section are drawn: the tuning value, held to a whole number of at
// least 1. The one reading of it, for the render (`sectionEntries`) and the drop math
// (`descendantsProjection.ts`), so the two can't disagree about which levels exist.
export function shownLevels(sectionLevels: number): number {
  return Math.max(1, Math.floor(sectionLevels));
}

// The level count of a section drawn whole, with no overflow row: the hierarchy modal's.
export const EVERY_LEVEL = Infinity;

const OVERFLOW_ROW_ID_PREFIX = 'overflow:';

// The id an overflow row registers under in the section's `SortableContext`, beside the items'.
export function overflowRowId(ownerId: string): string {
  return `${OVERFLOW_ROW_ID_PREFIX}${ownerId}`;
}

// The row an overflow row stands under, or null when `rowId` isn't an overflow row's.
export function overflowOwnerOf(rowId: string): string | null {
  return rowId.startsWith(OVERFLOW_ROW_ID_PREFIX) ? rowId.slice(OVERFLOW_ROW_ID_PREFIX.length) : null;
}

// The row that stands in for the hidden children of the row at the section's last shown level.
export interface OverflowRowData {
  /** `overflowRowId(ownerId)`. */
  id: string;
  /** The last-level row whose children it stands for. */
  ownerId: string;
  /** One level under its owner: the level of the children it stands for. */
  depth: number;
  /** The owner's attached children, the one being dragged left out. */
  count: number;
}

export type SectionEntry = { kind: 'item'; row: HierarchyRow } | { kind: 'overflow'; row: OverflowRowData };

// What a Card's section draws, in order: its rows down to the last shown level, with an
// overflow row under each last-level row that has attached children
// (wiki board-drag-interaction §9, wiki item-attachment §12). `rows` is the whole section
// (`hierarchyRows`); the board places against all of it, and only the drawing is cut.
// The dragged item is left out of an overflow row's count, since the ghost shows it. A row
// whose children are all Free has none, as `rows` holds attached children only.
// `branchIds` (`lib/hierarchyPlacement.ts::carriedBranchOf`) are rows the carried item takes with
// it: none is drawn, and none is counted, so the overflow row of a carried row, or of the carried
// item whose children all travel, goes with them. The rows that stay keep their places and counts
// (wiki hierarchy-placement §8).
export function sectionEntries(
  rows: readonly HierarchyRow[],
  sectionLevels: number,
  activeId?: string,
  branchIds?: ReadonlySet<string>,
): SectionEntry[] {
  const shown = shownLevels(sectionLevels);
  const childIdsOf = new Map<string, string[]>();
  for (const { id, parentId } of rows) {
    if (parentId !== null) childIdsOf.set(parentId, [...(childIdsOf.get(parentId) ?? []), id]);
  }
  const entries: SectionEntry[] = [];
  for (const row of rows) {
    if (row.depth >= shown || branchIds?.has(row.id)) continue;
    entries.push({ kind: 'item', row });
    if (row.depth !== shown - 1) continue;
    const count = (childIdsOf.get(row.id) ?? []).filter(id => id !== activeId && !branchIds?.has(id)).length;
    if (count > 0) {
      entries.push({ kind: 'overflow', row: { id: overflowRowId(row.id), ownerId: row.id, depth: shown, count } });
    }
  }
  return entries;
}
