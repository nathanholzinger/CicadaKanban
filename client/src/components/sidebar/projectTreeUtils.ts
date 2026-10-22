// Sidebar-only project tree helpers: the render list (`flattenTree`) and the
// row indent it is drawn at (`INDENT_WIDTH`, `projectRowIndentPx`).
// Placement itself is the shared `lib/hierarchyPlacement.ts`, the same rule
// as a board Card's Descendants layer. This module is the adapter around it:
// the gap a hovered row names (`resolveGap`), the real tree's `childrenOf`
// (`fullChildrenOf`), and a resolved `{ parentId, anchor }` turned back into
// `onReorderProject`'s prevId/nextId pair, or into no write at all for a
// set-down in the project's own slot (`releaseOf`).

import type { Project } from '../../types';
import { byPositionThenCreatedAt } from '../../lib/hierarchy';
import {
  flattenHierarchyOf,
  gapIndexFor,
  ownSlotOf,
  type AnchorRelation,
  type DropSide,
  type Projection,
  type Row,
} from '../../lib/hierarchyPlacement';

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

// A row's content inset at `depth` — one spelling for the row's own padding
// and its drop indicator's start, so the line always begins where the row's
// content does.
export function projectRowIndentPx(depth: number): number {
  return ROW_BASE_INSET_PX + depth * INDENT_WIDTH;
}

// parentId -> its children, in sibling order (`byPositionThenCreatedAt`). Shared
// by `flattenTree` (the render list, collapse-aware) and `fullChildrenOf` (the
// real tree, collapse-blind).
function childrenByParent(projects: readonly Project[]): Map<string | null, Project[]> {
  const childMap = new Map<string | null, Project[]>();
  for (const p of projects) {
    const key = p.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(p);
  }
  for (const children of childMap.values()) children.sort(byPositionThenCreatedAt);
  return childMap;
}

// The render list: the shared walk, with a collapsed project's children left
// out of it. A collapsed project still reports that it has some.
export function flattenTree(projects: Project[], expandedIds: Set<string>): FlatItem[] {
  const childMap = childrenByParent(projects);
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
// `flatItems` never has at all (wiki project-tree §1).
export function fullChildrenOf(projects: readonly Project[]): (parentId: string | null) => readonly string[] {
  const childMap = childrenByParent(projects);
  return parentId => (childMap.get(parentId) ?? []).map(p => p.id);
}

// The gap is `over` row + side, one of n + 1 (`gapIndexFor`), so a project
// can land after the last row at its own depth, not only before it.
//
// `overId` inside `exclude` (the active item's own row, or a descendant of
// it, still rendered dimmed) resolves to the gap the whole dragged block
// collapses to, rather than to no projection (wiki project-tree §1). A
// subtree is always contiguous in DFS order, so every row inside it maps to
// exactly one gap — the one immediately after the nearest eligible row that
// precedes the block (equivalently, immediately before whichever eligible
// row follows it; both give the same index once the block is removed from
// `rows`). No eligible predecessor (the block sits at the very top) falls
// back to gap 0.
export function resolveGap(
  flatItems: readonly FlatItem[],
  rows: readonly Row[],
  exclude: ReadonlySet<string>,
  overId: string,
  side: DropSide,
): number {
  if (!exclude.has(overId)) return gapIndexFor(rows, overId, side);
  const overIdx = flatItems.findIndex(i => i.id === overId);
  for (let i = overIdx - 1; i >= 0; i--) {
    if (!exclude.has(flatItems[i].id)) return gapIndexFor(rows, flatItems[i].id, 'after');
  }
  return 0;
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
