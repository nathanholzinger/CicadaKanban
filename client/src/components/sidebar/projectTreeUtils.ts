// Sidebar-only project tree helpers (flattening, drop validation).

import type { Project } from '../../types';

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
  parentId: string | null;
}

export const INDENT_WIDTH = 14;

export function flattenTree(projects: Project[], expandedIds: Set<string>): FlatItem[] {
  const childMap = new Map<string | null, Project[]>();
  for (const p of projects) {
    const key = p.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(p);
  }

  // Sort each sibling group by position, matching the server's ORDER BY position, createdAt.
  // This is what makes optimistic position updates immediately visible.
  for (const children of childMap.values()) {
    children.sort((a, b) => {
      const posA = a.position ?? a.createdAt;
      const posB = b.position ?? b.createdAt;
      return posA !== posB ? posA - posB : a.createdAt - b.createdAt;
    });
  }

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

// Descendant collection is generic tree math — shared with the item
// hierarchy via lib/hierarchy; re-exported here to keep this module the
// sidebar's single import surface.
export { getDescendantIds } from '../../lib/hierarchy';

export function computeProjection(
  sortableItems: FlatItem[],
  activeItem: FlatItem,
  overIndex: number,
  deltaX: number,
): Projection {
  const previousItem = sortableItems[overIndex - 1];
  const nextItem = sortableItems[overIndex];

  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const rawDepth = activeItem.depth + Math.round(deltaX / INDENT_WIDTH);
  const projectedDepth = Math.max(minDepth, Math.min(maxDepth, rawDepth));

  // Walk backward to find the parent at projectedDepth - 1
  let projectedParentId: string | null = null;
  if (projectedDepth > 0) {
    for (let i = overIndex - 1; i >= 0; i--) {
      if (sortableItems[i].depth === projectedDepth - 1) {
        projectedParentId = sortableItems[i].id;
        break;
      }
    }
  }

  return { depth: projectedDepth, parentId: projectedParentId };
}

export function findPrevSibling(items: FlatItem[], overIndex: number, proj: Projection): FlatItem | null {
  for (let i = overIndex - 1; i >= 0; i--) {
    const item = items[i];
    if (item.depth === proj.depth && item.parentId === proj.parentId) return item;
    if (item.depth < proj.depth) break; // passed above the target level
  }
  return null;
}

export function findNextSibling(items: FlatItem[], overIndex: number, proj: Projection): FlatItem | null {
  for (let i = overIndex; i < items.length; i++) {
    const item = items[i];
    if (item.depth === proj.depth && item.parentId === proj.parentId) return item;
    if (item.depth < proj.depth) break;
  }
  return null;
}
