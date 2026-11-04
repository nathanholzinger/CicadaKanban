// classifyTargets: classifies every node of a tree against the node being carried, once per
// drag start — valid / cycle-forming / depth-capped (wiki board-drag-interaction §4, and
// wiki project-tree §3 for projects) — and the tier each is drawn at. Pure, and table-generic
// as `hierarchy.ts` is: it reads only a node's `id` and `parentId`, so the board's items and
// the sidebar's projects count on one walk, as they do on the legal-parent checks beside it.
//
// Computed once at drag start and never again for the gesture — the carried node doesn't
// change mid-drag, so neither does what any target is to it. A surface hands it the tree its
// drag counts over, and says through `anchorSetsParent` what naming a node as the ghost's
// neighbor does there.

import { getDepth, getSubtree, isWithinDepthCap, type TreeNode } from './hierarchy';

export type DropTargetState = 'valid' | 'cycle-forming' | 'depth-capped';

// What a target can be to the carried node, which is how strongly a surface draws it, whatever
// the reason it can't be more:
//   - 'parent': a legal parent, so also an anchor the ghost can sit beside.
//   - 'anchor': an anchor but not a parent.
//   - 'neither': not even an anchor.
// Whether a target that is no parent is still an anchor is the surface's say
// (`classifyTargets`' `anchorSetsParent`).
export type DropTier = 'parent' | 'anchor' | 'neither';

export interface DragClassification {
  activeId: string;
  /** Per node id. An id absent from the map wasn't in the tree when the drag began. */
  states: ReadonlyMap<string, DropTargetState>;
  /**
   * Per node id, what the target can be to the carried node. The carried node has none, and an id
   * absent from `states` has none. Read off the same tree as `states`.
   */
  tiers: ReadonlyMap<string, DropTier>;
  /**
   * The carried node and its whole subtree — never a Top/Bottom candidate at any node's
   * descendants. One derivation, so a surface doesn't re-derive "activeId ∪ its descendants" by
   * filtering `states` for `'cycle-forming'`.
   */
  subtreeIds: ReadonlySet<string>;
}

// `nodes` is the tree the drag counts over. `anchorSetsParent` is whether naming a node as the
// ghost's neighbor gives the carried node that node's parent:
//   - When it doesn't (a Free Card on the board, since a reposition in a column sets no parent),
//     a node that is no legal parent is still an anchor.
//   - When it does (a Stub on the board, every row in the sidebar), the node can be named only
//     when its own parent could take the carried node. A node under a target that isn't a legal
//     parent is itself not one, and named as the ghost's neighbor it would give the carried node
//     that parent, so it is 'neither'. That holds under an 'anchor' or 'neither' target alike.
//
// A top-level node has no parent node to ask, so the top level answers: it takes the carried
// node when the node's whole subtree fits from depth 1 (`isWithinDepthCap(0, ...)`).
export function classifyTargets<T extends TreeNode>(
  activeId: string,
  nodes: readonly T[],
  cap: number,
  anchorSetsParent: (node: T) => boolean,
): DragClassification {
  const active = nodes.find(n => n.id === activeId);
  const states = new Map<string, DropTargetState>();
  const tiers = new Map<string, DropTier>();
  if (!active) return { activeId, states, tiers, subtreeIds: new Set([activeId]) };

  // Computed once per drag, not per target — one walk yields both the
  // subtree (for cycle-forming) and its height (for the depth rule).
  const { descendantIds, subtreeIds, height } = getSubtree(activeId, nodes);

  for (const node of nodes) {
    if (node.id === activeId || descendantIds.has(node.id)) {
      // Descent is through the hierarchy, attachment irrelevant, and a
      // descendant is never a "real target" for its ancestor — this wins
      // over depth-capped.
      states.set(node.id, 'cycle-forming');
      continue;
    }
    states.set(node.id, isWithinDepthCap(getDepth(node.id, nodes), height, cap) ? 'valid' : 'depth-capped');
  }

  // A tier needs only a target's own state and its parent's.
  const topLevelTakes = isWithinDepthCap(0, height, cap);
  const parentTakes = (node: T) => (node.parentId === null ? topLevelTakes : states.get(node.parentId) === 'valid');
  for (const node of nodes) {
    if (node.id === activeId) continue;
    if (states.get(node.id) === 'valid') tiers.set(node.id, 'parent');
    else if (!anchorSetsParent(node)) tiers.set(node.id, 'anchor');
    else tiers.set(node.id, parentTakes(node) ? 'anchor' : 'neither');
  }

  return { activeId, states, tiers, subtreeIds };
}
