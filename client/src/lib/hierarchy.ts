// Tree math over flat { id, parentId } collections — shared by the project
// hierarchy (sidebar drag validation, ProjectPage reparent dropdown) and the
// item hierarchy (detail-panel reparent dropdown).

export interface TreeNode {
  id: string;
  parentId: string | null;
}

// Collects every descendant of `id`, walking the parentId references.
export function getDescendantIds(id: string, nodes: readonly TreeNode[]): Set<string> {
  const result = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const n of nodes) {
      if (n.parentId === current) {
        result.add(n.id);
        queue.push(n.id);
      }
    }
  }
  return result;
}

// Walks up the parentId chain from `node`, collecting ancestors in
// root-to-immediate-parent order (excludes `node` itself). Stops without
// throwing if a parentId points to a node absent from `nodes`.
export function getAncestors<T extends TreeNode>(node: T, nodes: readonly T[]): T[] {
  const map = new Map(nodes.map(n => [n.id, n]));
  const ancestors: T[] = [];
  let current: T | undefined = node;
  while (current?.parentId) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

// Reparent dropdown options: every node except the current one and its
// descendants (either would create a cycle), preceded by a "none" entry.
//
// Default (`indent: false`) preserves the input order of `nodes` — cheap and
// enough for a same-parent-scoped list (e.g. an item's sibling candidates).
// `indent: true` instead walks the tree depth-first, grouping each node
// under its parent and prefixing deeper nodes with `·` per level — used for
// dropdowns spanning multiple tree levels (e.g. the full project tree) where
// flat input order wouldn't read as a hierarchy. A node whose `parentId`
// isn't present in `nodes` is treated as a root.
export function buildParentOptions<T extends TreeNode>(
  nodes: readonly T[],
  currentId: string,
  labelOf: (node: T) => string,
  noneLabel: string,
  indent = false,
): Array<{ value: string; label: string }> {
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
    const key = n.parentId !== null && ids.has(n.parentId) ? n.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }

  const options: Array<{ value: string; label: string }> = [{ value: '', label: noneLabel }];
  function traverse(parentId: string | null, depth: number) {
    for (const n of byParent.get(parentId) ?? []) {
      if (excluded.has(n.id)) continue;
      options.push({ value: n.id, label: '·'.repeat(depth) + (depth > 0 ? ' ' : '') + labelOf(n) });
      traverse(n.id, depth + 1);
    }
  }
  traverse(null, 0);
  return options;
}
