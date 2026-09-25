// Sidebar-only project tree helpers (flattening, drop validation) —
// placement itself is Epic 3.5 Story 6's shared `lib/hierarchyPlacement.ts`
// (docs/wiki/board-drag-interaction §7), the same rule as a board Card's
// Descendants layer. This module is the adapter: turning the sidebar's own
// `FlatItem[]` render list into the library's `Row[]`, and its resolved
// `{ parentId, anchor }` back into `onReorderProject`'s prevId/nextId pair.

import type { Project } from '../../types';
import {
  flattenHierarchyOf,
  gapIndexFor,
  toRows,
  type AnchorRelation,
  type DropSide,
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
// A row's own left inset at depth 0. Unrelated to the board's 12px Stub
// indent (`cardMetrics.ts`): the two are equal by coincidence (both `px-3`).
const ROW_BASE_INSET_PX = 12;

// A row's content inset at `depth` — one spelling for the row's own padding
// and its drop indicator's start, so the line always begins where the row's
// content does.
export function projectRowIndentPx(depth: number): number {
  return ROW_BASE_INSET_PX + depth * INDENT_WIDTH;
}

// parentId -> its children, sorted the way the server orders siblings
// (position, then createdAt) — shared by `flattenTree` (the render list,
// collapse-aware) and `fullChildrenOf` (the real tree, collapse-blind:
// Story 6 sidebar difference 6 needs a Top's *real* first child even while
// that child's row never made it into `flatItems`).
function childrenByParent(projects: readonly Project[]): Map<string | null, Project[]> {
  const childMap = new Map<string | null, Project[]>();
  for (const p of projects) {
    const key = p.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(p);
  }
  for (const children of childMap.values()) {
    children.sort((a, b) => {
      const posA = a.position ?? a.createdAt;
      const posB = b.position ?? b.createdAt;
      return posA !== posB ? posA - posB : a.createdAt - b.createdAt;
    });
  }
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
// entirely — what `resolvePlacement` needs to find a collapsed Top's real
// first child (difference 6), since `eligibleRows`'s own map (built from
// `flatItems`) never has it at all.
export function fullChildrenOf(projects: readonly Project[]): (parentId: string | null) => readonly string[] {
  const childMap = childrenByParent(projects);
  return parentId => (childMap.get(parentId) ?? []).map(p => p.id);
}

// Descendant collection is generic tree math — shared with the item
// hierarchy via lib/hierarchy; re-exported here to keep this module the
// sidebar's single import surface.
export { getDescendantIds } from '../../lib/hierarchy';

// The rows `hierarchyPlacement.ts` reasons about — every *rendered* row
// (collapsed subtrees already left `flatItems`, same as before Story 6),
// minus `exclude` (Story 6 decision 5: the active project and its whole
// subtree, never a Top/Bottom candidate — fixes difference 2, "descendant-
// blocking instead of subtree removal"). `flatItems` is already the walk's
// own output, so this only drops the dragged subtree.
export function eligibleRows(flatItems: readonly FlatItem[], exclude: ReadonlySet<string>): Row[] {
  return toRows(flatItems, exclude);
}

// Decision 2: the gap is `over` row + side (n + 1 gaps — fixes difference
// 1, "n gaps, not n + 1": today's model can only place *before* the last
// item at its own depth, never after it).
//
// `overId` inside `exclude` (a descendant of the active item, still
// rendered dimmed) is decision 5's other half: rather than nulling the
// projection, resolve to the gap the whole dragged block collapses to. A
// subtree is always contiguous in DFS order, so every row inside it maps to
// exactly one gap — the one immediately after the nearest eligible row that
// precedes the block (equivalently, immediately before whichever eligible
// row follows it; both give the same index once the block is removed from
// `rows`). No eligible predecessor (the block sits at the very top) falls
// back to gap 0.
//
// `overId === ` the active item's own id is deliberately **not** handled
// here — dnd-kit can report the active row itself as `over` while the
// pointer rests on it; the caller keeps the last known projection rather
// than resolving a fresh one for that sample. The board no longer hits this
// case the same way (Option A, 2026-09-24): its own `dropAnchorFor` names a
// neighbor by the lean even over the dragged row's own slot, since the
// sidebar stays on `over` + `resolveDropSide` with no ghost shuffle by
// design (decision 2's amendment) — ceding a fresh answer here only when
// dnd-kit's own collision genuinely can't tell above from below.
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

// Decision 3, kept sidebar-identical: depth = the active item's own starting
// depth plus horizontal delta, clamped to the gap's own range (never a
// separate min/max computed from the immediate neighbors — `depthRangeFor`
// is the one range now, shared with the board). `childrenOf` is
// `fullChildrenOf(projects)`, never `eligibleRows`'s own map — difference
// 6's collapsed-Top fix needs the real tree, not the rendered rows. The
// depth step itself (`lib/hierarchyPlacement.ts::computeProjection`) is
// generalized and shared with the board's own live projection (Story 6.1
// Phase 2, L2-1) — this module supplies `INDENT_WIDTH` and the sidebar's
// virtual `null` root, the two things that used to make this its own copy.

// `onReorderProject`'s prevId/nextId pair, straight off the one relation
// `resolvePlacement` already resolved — replaces the old `findPrevSibling`/
// `findNextSibling` scans (each anchor was always exactly one relation, so
// the second lookup only ever confirmed "null," never found anything a
// depth/parentId scan wouldn't already have named directly).
export function siblingIdsFromAnchor(anchor: AnchorRelation | null): { prevId: string | null; nextId: string | null } {
  if (!anchor) return { prevId: null, nextId: null };
  const { anchorId, side } = anchor;
  return side === 'after' ? { prevId: anchorId, nextId: null } : { prevId: null, nextId: anchorId };
}
