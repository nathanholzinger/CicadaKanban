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

// Reparent dropdown options: every node except the current one and its
// descendants (either would create a cycle), preceded by a "none" entry.
// Preserves the input order of `nodes`.
export function buildParentOptions<T extends TreeNode>(
  nodes: readonly T[],
  currentId: string,
  labelOf: (node: T) => string,
  noneLabel: string,
): Array<{ value: string; label: string }> {
  const excluded = getDescendantIds(currentId, nodes);
  excluded.add(currentId);
  return [
    { value: '', label: noneLabel },
    ...nodes.filter(n => !excluded.has(n.id)).map(n => ({ value: n.id, label: labelOf(n) })),
  ];
}
