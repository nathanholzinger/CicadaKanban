// Sidebar-only project tree helpers: the render list (`flattenTree`), the
// row indent it is drawn at (`INDENT_WIDTH`, `projectRowIndentPx`) and where a
// name starts in it (`projectNameIndentPx`), and the parent a write opens
// (`parentPutUnder`).
// Placement itself is the shared `lib/hierarchyPlacement.ts`, the same rule
// as a board Card's Descendants layer. This module is the adapter around it:
// the gap the ghost's slot is (`resolveGap`), the real tree's `childrenOf`
// (`fullChildrenOf`), and a resolved `{ parentId, anchor }` turned back into
// `onReorderProject`'s prevId/nextId pair, or into no write at all for a
// set-down in the project's own slot (`releaseOf`).

import type { Project } from '../../types';
import { sortedChildrenByParent, type PendingMove } from '../../lib/hierarchy';
import { flattenHierarchyOf, ownSlotOf, type AnchorRelation, type Projection } from '../../lib/hierarchyPlacement';

export interface FlatItem {
  id: string;
  depth: number;
  parentId: string | null;
  project: Project;
  hasChildren: boolean;
  collapsed: boolean;
}

export const INDENT_WIDTH = 14;
// A row's own left inset at depth 0. Not the board's 12px
// (`cardMetrics.ts::DESCENDANTS_INDENT_PX`): that one is the board's step per
// level, this is a base inset, and the two are equal by coincidence.
const ROW_BASE_INSET_PX = 12;

// A row's left padding at `depth`, where its leading controls (the drag handle
// and the chevron) start: one spelling for the row's own padding.
export function projectRowIndentPx(depth: number): number {
  return ROW_BASE_INSET_PX + depth * INDENT_WIDTH;
}

// What stands ahead of a project's name in its row, each a Tailwind class and
// the width it sets, spelled twice as `cardMetrics.ts`'s pairs are, and pinned
// together by `projectTreeUtils.test.ts`: the drag handle, the chevron, and the
// row's gap between one control and the next. `SortableProjectRow.tsx` draws its
// row with the classes, and `projectNameIndentPx` adds up the numbers.
export const ROW_HANDLE_WIDTH_PX = 12;
export const ROW_HANDLE_WIDTH_CLASS = 'w-3';
export const ROW_CHEVRON_WIDTH_PX = 16;
export const ROW_CHEVRON_WIDTH_CLASS = 'w-4';
export const ROW_GAP_PX = 4;
export const ROW_GAP_CLASS = 'gap-1';

// Where a project's name starts at `depth`, from the row's left edge: its padding
// and then the handle, the chevron and the gap around each. One spelling for
// where the drop line starts, so a line for a depth begins under the name a
// project at that depth has, which is what tells it from the depth beside it.
// The handle and a leaf's chevron are hidden, not gone, so their room is there
// through a drag.
export function projectNameIndentPx(depth: number): number {
  return projectRowIndentPx(depth) + ROW_HANDLE_WIDTH_PX + ROW_GAP_PX + ROW_CHEVRON_WIDTH_PX + ROW_GAP_PX;
}

// The parent a successful write put a project under, which opens (`useCollapsedProjects.ts`): the
// written project's parent, when it is not the one the project had before the write. None when it has no
// parent, or when the write left it under the one it had, so a rename doesn't open a parent the user
// collapsed. `before` is undefined for a create.
export function parentPutUnder(before: Project | undefined, written: Project): string | null {
  return written.parentId !== null && written.parentId !== before?.parentId ? written.parentId : null;
}

// The render list: the shared walk, with a collapsed project's children left
// out of it. A collapsed project still reports that it has some. `moves` are the
// moves sent and not yet answered, whose place among their siblings the order
// reads (`lib/hierarchy.ts::sortedChildrenByParent`).
export function flattenTree(
  projects: Project[],
  expandedIds: Set<string>,
  moves: readonly PendingMove[] = [],
): FlatItem[] {
  const childMap = sortedChildrenByParent(projects, moves);
  const childrenOf = (parentId: string | null) => childMap.get(parentId) ?? [];
  const shownChildrenOf = (parentId: string | null) =>
    parentId === null || expandedIds.has(parentId) ? childrenOf(parentId) : [];
  return flattenHierarchyOf(null, shownChildrenOf).map(({ id, parentId, depth, item: project }) => {
    const hasChildren = childrenOf(id).length > 0;
    return { id, depth, parentId, project, hasChildren, collapsed: hasChildren && !expandedIds.has(id) };
  });
}

// The library's `childrenOf` over the *real* tree, ignoring collapse state
// entirely: the sidebar places against the real tree, so a project tabbed
// right of a collapsed Top lands ahead of Top's real first child, which
// `flatItems` never has at all (wiki project-tree §1). It reads the same moves the
// render list does, so a project moved to a parent's front is that parent's first child here too.
export function fullChildrenOf(
  projects: readonly Project[],
  moves: readonly PendingMove[] = [],
): (parentId: string | null) => readonly string[] {
  const childMap = sortedChildrenByParent(projects, moves);
  return parentId => (childMap.get(parentId) ?? []).map(p => p.id);
}

// The gap is the ghost's slot (wiki board-drag-interaction §2), one of n + 1
// among the rows without the dragged subtree. `drawn` is the list the sortable
// context holds now, in the order the sidebar draws it, the dragged project's own
// row included and its branch left out, and `overId` is the row dnd-kit says the copy is nearest. The
// ghost takes that row's slot, the standard sortable shuffle: from a row below
// the ghost's own slot it lands after it, from one above it lands before it,
// and from its own row it stays. Either way the gap is that row's place in
// `drawn`, because the ghost's own row is one of the rows `drawn` counts and
// `rows` doesn't: no side of the row is read, and no row has two gaps. An id
// `drawn` doesn't have names no row, and reads as below everything, the
// conservative end.
export function resolveGap(drawn: readonly { id: string }[], overId: string): number {
  const at = drawn.findIndex(r => r.id === overId);
  return at === -1 ? drawn.length - 1 : at;
}

// `onReorderProject`'s prevId/nextId pair, straight off the one relation
// `resolvePlacement` already resolved. One relation names the slot, so the
// other side stays null.
export function siblingIdsFromAnchor(anchor: AnchorRelation | null): { prevId: string | null; nextId: string | null } {
  if (!anchor) return { prevId: null, nextId: null };
  const { anchorId, side } = anchor;
  return side === 'after' ? { prevId: anchorId, nextId: null } : { prevId: null, nextId: anchorId };
}

export interface ProjectRelease {
  parentId: string | null;
  prevId: string | null;
  nextId: string | null;
}

// What a release writes: the projection's parent and the sibling to insert
// beside, or nothing (null) at the project's own gap and depth. The sidebar
// always has full context, so no project can sit unseen between its
// neighbors, and the release can't move it (wiki project-tree §1). `gap`
// is the one the projection was computed at, among the rows without the
// dragged subtree.
export function releaseOf(
  flatItems: readonly FlatItem[],
  activeId: string,
  gap: number,
  projection: Projection,
): ProjectRelease | null {
  const own = ownSlotOf(flatItems, activeId);
  if (own && gap === own.gap && projection.depth === own.depth) return null;
  const { parentId, anchor } = projection.placement;
  return { parentId, ...siblingIdsFromAnchor(anchor) };
}
