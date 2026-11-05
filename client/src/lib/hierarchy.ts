// Tree math over flat { id, parentId } collections — a subtree and its height,
// ancestors, depth, the depth-cap rule, the sorted children index, a move laid
// over the tree before its answer lands (the parent in `withMoveApplied`, the
// place among its siblings in `sortedChildrenByParent`), and reparent dropdown
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

// parentId -> child ids, one pass over `nodes`, for the walk below. Roots (null
// parentId) are skipped; a dangling parentId is indexed under its missing
// parent, which no walk ever reaches — harmless. Unsorted: a caller that needs
// sibling order wants `sortedChildrenByParent`.
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

// A move that was sent and not yet answered, as its request carries it: the parent, and the
// sibling to insert beside (`prevId` after it, `nextId` before it), never a position.
export interface PendingMove {
  id: string;
  parentId: string | null;
  prevId: string | null;
  nextId: string | null;
}

// parentId -> its children in sibling order (`byPositionThenCreatedAt`), the
// roots under `null`. A node whose `parentId` no node in `nodes` has is a root
// too, so the sidebar's tree and the project page's parent dropdown, which both
// walk this, agree on data with a dangling parent.
//
// `moves` are sent and not yet answered. Each, in the order sent, takes its node out of the
// children it sits in and puts it back in its new parent's, by its slot: after `prevId`, before
// `nextId`, or last when it names neither or the one it names isn't a child there. A parent no node
// has counts as the top level, as above. This is the rule the board's `applyPlacements` places an
// item by, and it never reads or writes a `position`. `nodes` already carry the move's parent
// (`withMoveApplied`), which the readers of `parentId` need; the order is what only this index
// holds. A move for a node that isn't in `nodes` (deleted since) is skipped.
export function sortedChildrenByParent<T extends TreeNode & Positioned>(
  nodes: readonly T[],
  moves: readonly PendingMove[] = [],
): Map<string | null, T[]> {
  const ids = new Set(nodes.map(n => n.id));
  const keyOf = (parentId: string | null) => (parentId !== null && ids.has(parentId) ? parentId : null);
  const childrenOf = new Map<string | null, T[]>();
  for (const n of nodes) {
    const key = keyOf(n.parentId);
    const list = childrenOf.get(key) ?? [];
    list.push(n);
    childrenOf.set(key, list);
  }
  for (const list of childrenOf.values()) list.sort(byPositionThenCreatedAt);

  for (const move of moves) {
    const moved = nodes.find(n => n.id === move.id);
    if (!moved) continue;
    for (const [key, list] of childrenOf) {
      const at = list.indexOf(moved);
      if (at === -1) continue;
      list.splice(at, 1);
      if (list.length === 0) childrenOf.delete(key);
    }
    const siblings = childrenOf.get(keyOf(move.parentId)) ?? [];
    const anchorAt = siblings.findIndex(n => n.id === (move.prevId ?? move.nextId));
    siblings.splice(anchorAt === -1 ? siblings.length : move.prevId ? anchorAt + 1 : anchorAt, 0, moved);
    childrenOf.set(keyOf(move.parentId), siblings);
  }
  return childrenOf;
}

// `nodes` as they will be once `move` lands, as far as a node knows: the moved one under
// `move.parentId`. That is all it changes, and no `position` with it: what reads a node's parent
// (`getSubtree`, `getAncestors`, the drag's classification) sees the move, and the place among its
// siblings is `sortedChildrenByParent`'s, given the same move. A surface that draws a move before its
// answer lands lays both over, once, so its rows, its children and what the next drag reads are one
// tree. Several moves are laid over in the order they were sent. A node that isn't in `nodes`
// (deleted since) is skipped.
export function withMoveApplied<T extends TreeNode>(nodes: readonly T[], move: PendingMove): T[] {
  return nodes.map(n => (n.id === move.id ? { ...n, parentId: move.parentId } : n));
}

export interface Subtree {
  /** Every node below `id`, not `id` itself. */
  descendantIds: ReadonlySet<string>;
  /** `id` and `descendantIds`. */
  subtreeIds: ReadonlySet<string>;
  /** The levels below `id`; a leaf is 0. */
  height: number;
}

// The subtree under `id`, from one walk, so a caller that needs the ids and
// the height (drag classification, the sidebar's drag) walks once and the
// corrupted-cycle guard lives in one loop.
//
// Every descendant counts, attached or not: for the item hierarchy a detached
// child still sits under its parent and moves with it (wiki item-attachment
// §8), so it counts toward the height. One level per BFS generation, parents
// before children. `subtreeIds` (seeded with `id`) guards against a corrupted
// parentId cycle in the data turning this into an infinite loop — once a node
// has been queued, re-finding it as someone else's "child" can't discover
// anything new, so it's skipped rather than re-queued.
export function getSubtree(id: string, nodes: readonly TreeNode[]): Subtree {
  const childrenOf = childrenByParent(nodes);
  const descendantIds = new Set<string>();
  const subtreeIds = new Set([id]);
  let height = 0;
  let frontier = [id];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const current of frontier) {
      for (const childId of childrenOf.get(current) ?? []) {
        if (subtreeIds.has(childId)) continue;
        subtreeIds.add(childId);
        descendantIds.add(childId);
        next.push(childId);
      }
    }
    if (next.length > 0) height++;
    frontier = next;
  }
  return { descendantIds, subtreeIds, height };
}

// Every descendant of `id`, as a set.
export function getDescendantIds(id: string, nodes: readonly TreeNode[]): ReadonlySet<string> {
  return getSubtree(id, nodes).descendantIds;
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

// The whole depth rule (wiki hierarchy-placement §6): a target at depth D is a
// legal parent iff D + 1 + draggedSubtreeHeight <= cap. Root items are at
// depth 1; a leaf has height 0 — the counting `getDepth` and `getSubtree`'s
// `height` do. Deliberately separate from `itemTree.ts::assertWithinDepthCap`:
// the same formula on each side of the process boundary, fed here by the
// client's own in-memory traversal.
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
  const { subtreeIds: excluded } = getSubtree(currentId, nodes);
  const candidates = nodes.filter(n => !excluded.has(n.id));

  if (!indent) {
    return [{ value: '', label: noneLabel }, ...candidates.map(n => ({ value: n.id, label: labelOf(n) }))];
  }

  const byParent = sortedChildrenByParent(candidates);

  return [
    { value: '', label: noneLabel },
    ...flattenHierarchyOf(null, parentId => byParent.get(parentId) ?? []).map(({ item, depth }) => ({
      value: item.id,
      label: '·'.repeat(depth) + (depth > 0 ? ' ' : '') + labelOf(item),
    })),
  ];
}
