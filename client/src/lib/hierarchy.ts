// Tree math over flat { id, parentId } collections — descendants,
// ancestors, depth, subtree height, the depth-cap rule and reparent dropdown
// options — and the sibling order, shared by the project hierarchy and the
// item hierarchy.

import { flattenHierarchyOf } from './hierarchyPlacement';

export interface TreeNode {
  id: string;
  parentId: string | null;
}

// What the sibling order reads.
export interface Positioned {
  position: number | null;
  createdAt: number;
}

// The order siblings are listed in (wiki positioning §1): `position`, a
// missing one counting as 0, then `createdAt`. The tie-break keeps an exact
// match from depending on unspecified DB row order. The sidebar's tree, the
// board's lists and the project page's parent dropdown all sort with this.
export function byPositionThenCreatedAt(a: Positioned, b: Positioned): number {
  return (a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt;
}

// A single <select> option — the shape buildParentOptions (below) and any
// other dropdown-option builder returns.
export interface SelectOption {
  value: string;
  label: string;
}

// parentId -> child ids, one pass over `nodes`. Roots (null parentId) are
// skipped; a dangling parentId is indexed under its missing parent, which
// no walk below ever reaches — harmless.
function childrenByParent(nodes: readonly TreeNode[]): Map<string, string[]> {
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parentId === null) continue;
    const list = childrenOf.get(n.parentId) ?? [];
    list.push(n.id);
    childrenOf.set(n.parentId, list);
  }
  return childrenOf;
}

// The one descendant walk: one generation per array, parents before
// children. `visited` (seeded with `id`) guards against a corrupted parentId
// cycle in the data turning this into an infinite loop — once a node has
// been queued, re-finding it as someone else's "child" can't discover
// anything new, so it's skipped rather than re-queued. Level-ordered so a
// caller that needs both the id set and the height (drag classification)
// walks once, and so the guard lives in one loop instead of two.
export function getDescendantLevels(id: string, nodes: readonly TreeNode[]): string[][] {
  const childrenOf = childrenByParent(nodes);
  const levels: string[][] = [];
  const visited = new Set([id]);
  let frontier = [id];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const current of frontier) {
      for (const childId of childrenOf.get(current) ?? []) {
        if (visited.has(childId)) continue;
        visited.add(childId);
        next.push(childId);
      }
    }
    if (next.length > 0) levels.push(next);
    frontier = next;
  }
  return levels;
}

// Every descendant of `id`, as a set.
export function getDescendantIds(id: string, nodes: readonly TreeNode[]): Set<string> {
  return new Set(getDescendantLevels(id, nodes).flat());
}

// Walks up the parentId chain from `node`, collecting ancestors in
// root-to-immediate-parent order (excludes `node` itself). Stops without
// throwing if a parentId points to a node absent from `nodes`, or if a
// corrupted parentId cycle in the data would otherwise walk the same chain
// forever — re-reaching an already-visited node means the chain has
// looped, so it stops there instead.
export function getAncestors<T extends TreeNode>(node: T, nodes: readonly T[]): T[] {
  const map = new Map(nodes.map(n => [n.id, n]));
  const ancestors: T[] = [];
  const visited = new Set([node.id]);
  let current: T | undefined = node;
  while (current?.parentId && !visited.has(current.parentId)) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    visited.add(parent.id);
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

// The nearest ancestor (nearest first — walking `getAncestors`' own
// root-to-immediate-parent array backwards) satisfying `pred`, or null if
// none does.
export function findNearestAncestor<T extends TreeNode>(
  node: T,
  nodes: readonly T[],
  pred: (node: T) => boolean,
): T | null {
  const ancestors = getAncestors(node, nodes);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (pred(ancestors[i])) return ancestors[i];
  }
  return null;
}

// 1-based hierarchy depth: a root is at depth 1, as wiki hierarchy-placement §6
// counts, and as `itemTree.ts::hierarchyDepth` does. Built on
// getAncestors, so a dangling parentId reads as a root and a corrupted
// cycle terminates. An id absent from `nodes` is depth 1.
export function getDepth(id: string, nodes: readonly TreeNode[]): number {
  const self = nodes.find(n => n.id === id);
  return self ? getAncestors(self, nodes).length + 1 : 1;
}

// Levels *below* `id` — a leaf is 0. Counts every descendant, attached or
// not: for the item hierarchy a detached child still sits under its parent
// and moves with it (wiki item-attachment §8), so it counts toward the
// height. One level per BFS generation, so the height is how many
// generations the walk produced.
export function getSubtreeHeight(id: string, nodes: readonly TreeNode[]): number {
  return getDescendantLevels(id, nodes).length;
}

// The whole depth rule (wiki hierarchy-placement §6): a target at depth D is a
// legal parent iff D + 1 + draggedSubtreeHeight <= cap. Root items are at
// depth 1; a leaf has height 0 — the counting `getDepth` and `getSubtreeHeight`
// above do. Deliberately separate from `itemTree.ts::assertWithinDepthCap`: the
// same formula on each side of the process boundary, fed here by the client's
// own in-memory traversal.
export function isWithinDepthCap(targetDepth: number, subtreeHeight: number, cap: number): boolean {
  return targetDepth + 1 + subtreeHeight <= cap;
}

// Reparent dropdown options: every node except the current one and its
// descendants (either would create a cycle), preceded by a "none" entry.
//
// Default (`indent: false`) preserves the input order of `nodes` — cheap and
// enough for a same-parent-scoped list (e.g. an item's sibling candidates).
// `indent: true` instead walks the tree depth-first (`flattenHierarchyOf`),
// siblings in `byPositionThenCreatedAt` order, and prefixes deeper nodes with
// `·` per level — used for dropdowns spanning multiple tree levels (e.g. the
// full project tree) where flat input order wouldn't read as a hierarchy. A
// node whose `parentId` isn't present in `nodes` is treated as a root.
export function buildParentOptions<T extends TreeNode & Positioned>(
  nodes: readonly T[],
  currentId: string,
  labelOf: (node: T) => string,
  noneLabel: string,
  indent = false,
): SelectOption[] {
  const excluded = getDescendantIds(currentId, nodes);
  excluded.add(currentId);

  if (!indent) {
    return [
      { value: '', label: noneLabel },
      ...nodes.filter(n => !excluded.has(n.id)).map(n => ({ value: n.id, label: labelOf(n) })),
    ];
  }

  const ids = new Set(nodes.map(n => n.id));
  const byParent = new Map<string | null, T[]>();
  for (const n of nodes) {
    if (excluded.has(n.id)) continue;
    const key = n.parentId !== null && ids.has(n.parentId) ? n.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }
  for (const siblings of byParent.values()) siblings.sort(byPositionThenCreatedAt);

  return [
    { value: '', label: noneLabel },
    ...flattenHierarchyOf(null, parentId => byParent.get(parentId) ?? []).map(({ item, depth }) => ({
      value: item.id,
      label: '·'.repeat(depth) + (depth > 0 ? ' ' : '') + labelOf(item),
    })),
  ];
}
