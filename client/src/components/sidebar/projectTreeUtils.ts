// Sidebar-only project tree helpers (flattening, drop validation) —
// placement itself is Epic 3.5 Story 6's shared `lib/hierarchyPlacement.ts`
// (docs/wiki/board-drag-interaction §7), the same rule as a board Card's
// Descendants layer. This module is the adapter: turning the sidebar's own
// `FlatItem[]` render list into the library's `Row[]`, and its resolved
// `{ parentId, anchor }` back into `onReorderProject`'s prevId/nextId pair.

import type { Project } from '../../types';
import {
  flattenHierarchy,
  gapIndexFor,
  depthRangeFor,
  resolvePlacement,
  type Row,
  type Anchor,
  type ResolvedPlacement,
} from '../../lib/hierarchyPlacement';

export interface FlatItem {
  id: string;
  depth: number;
  parentId: string | null;
  project: Project;
  hasChildren: boolean;
  collapsed: boolean;
}

export interface Projection {
  depth: number;
  placement: ResolvedPlacement;
}

export const INDENT_WIDTH = 14;

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

export function flattenTree(projects: Project[], expandedIds: Set<string>): FlatItem[] {
  const childMap = childrenByParent(projects);
  const result: FlatItem[] = [];

  function walk(parentId: string | null, depth: number) {
    const children = childMap.get(parentId) ?? [];
    for (const p of children) {
      const kids = childMap.get(p.id) ?? [];
      const hasChildren = kids.length > 0;
      const collapsed = hasChildren && !expandedIds.has(p.id);
      result.push({ id: p.id, depth, parentId, project: p, hasChildren, collapsed });
      if (!collapsed) walk(p.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
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
// blocking instead of subtree removal"). The sidebar's root is virtual
// (`rootId: null`): a real top-level project already carries `parentId:
// null`, so `flattenHierarchy`'s own depth-0 rows read that back for free.
export function eligibleRows(flatItems: readonly FlatItem[], exclude: ReadonlySet<string>): Row[] {
  const byParent = new Map<string | null, string[]>();
  for (const item of flatItems) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item.id);
    byParent.set(item.parentId, list);
  }
  return flattenHierarchy(null, parentId => byParent.get(parentId) ?? [], exclude);
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
// than resolving a fresh one for that sample (the same case
// `lib/hierarchyPlacement.ts`'s board callers hit and handle the same way).
export function resolveGap(
  flatItems: readonly FlatItem[],
  rows: readonly Row[],
  exclude: ReadonlySet<string>,
  overId: string,
  side: 'before' | 'after',
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
// 6's collapsed-Top fix needs the real tree, not the rendered rows.
export function computeProjection(
  rows: readonly Row[],
  gap: number,
  seedDepth: number,
  deltaX: number,
  childrenOf: (parentId: string | null) => readonly string[],
  exclude: ReadonlySet<string>,
): Projection {
  const { lo, hi } = depthRangeFor(rows, gap);
  const raw = seedDepth + Math.round(deltaX / INDENT_WIDTH);
  const depth = Math.max(lo, Math.min(hi, raw));
  return { depth, placement: resolvePlacement(rows, gap, depth, null, childrenOf, exclude) };
}

// `onReorderProject`'s prevId/nextId pair, straight off the one relation
// `resolvePlacement` already resolved — replaces the old `findPrevSibling`/
// `findNextSibling` scans (each anchor was always exactly one relation, so
// the second lookup only ever confirmed "null," never found anything a
// depth/parentId scan wouldn't already have named directly).
export function siblingIdsFromAnchor(anchor: Anchor | null): { prevId: string | null; nextId: string | null } {
  if (!anchor) return { prevId: null, nextId: null };
  return anchor.side === 'after' ? { prevId: anchor.id, nextId: null } : { prevId: null, nextId: anchor.id };
}
