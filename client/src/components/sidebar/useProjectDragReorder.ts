// The project sidebar's drag reorder — the same placement rule as a board
// Card's Descendants layer (`lib/hierarchyPlacement.ts`,
// wiki hierarchy-placement §1): the rows a gap is computed against, the live
// projection, the drop line drawn at the gap (wiki project-tree §1), and on
// release the reorder, sent as the sibling to insert beside (prevId/nextId),
// never a computed position. A set-down in the project's own slot sends
// nothing (`projectTreeUtils.ts::releaseOf`).

import { useMemo, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Project } from '../../types';
import { getSubtree, isWithinDepthCap, type Subtree } from '../../lib/hierarchy';
import { computeProjection, toRows, type AnchorRelation, type Projection } from '../../lib/hierarchyPlacement';
import { resolveDropSide } from '../workflow/dragCollision';
import { fullChildrenOf, releaseOf, resolveGap, INDENT_WIDTH, type FlatItem } from './projectTreeUtils';

const NO_IDS: ReadonlySet<string> = new Set();
const NO_SUBTREE: Subtree = { descendantIds: NO_IDS, subtreeIds: NO_IDS, height: 0 };

export type ReorderProject = (
  id: string,
  parentId: string | null,
  prevId: string | null,
  nextId: string | null,
) => Promise<void>;

// `flatItems` is the rendered tree; `expand` opens a collapsed parent a
// project was just dropped into. `depthCap` is the project cap, null until it's
// known: a tab state that would put the dragged subtree past it is still
// offered, marked invalid, and a release in it writes nothing
// (wiki hierarchy-placement §6).
export function useProjectDragReorder(
  projects: Project[],
  flatItems: readonly FlatItem[],
  onReorderProject: ReorderProject,
  expand: (id: string) => void,
  depthCap: number | null = null,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projected, setProjected] = useState<Projection | null>(null);
  const [gap, setGap] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeItem = activeId ? (flatItems.find(i => i.id === activeId) ?? null) : null;
  // The dragged project's subtree, walked once: its descendants stay drawn,
  // dimmed, and its height is what the cap reads.
  const {
    descendantIds,
    subtreeIds: exclude,
    height: subtreeHeight,
  } = useMemo(() => (activeId ? getSubtree(activeId, projects) : NO_SUBTREE), [activeId, projects]);
  // The project and its whole subtree are never a Top/Bottom candidate:
  // `rows`, what a gap is computed against, is every rendered row (a collapsed
  // subtree already left `flatItems`) without them.
  const rows = toRows(flatItems, exclude);
  // A Top's first-child lookup must see the *real* tree, not the render
  // list (which a collapsed project already left out).
  const childrenOf = fullChildrenOf(projects);
  // Where the drop line draws: "before" the row the gap sits above, or —
  // the gap past the last row — "after" the last row. None when there is no
  // gap (nothing is `over`) or no eligible row is left to draw it against.
  const dropLine: AnchorRelation | null =
    gap === null || rows.length === 0
      ? null
      : gap < rows.length
        ? { anchorId: rows[gap].id, side: 'before' }
        : { anchorId: rows[rows.length - 1].id, side: 'after' };

  // The projection's depth (the top level is 0) is the dropped project's parent's
  // depth in the cap's count (a root is 1), so it is the cap's `targetDepth` as it stands.
  const overCap =
    depthCap !== null && projected !== null && !isWithinDepthCap(projected.depth, subtreeHeight, depthCap);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setProjected(null);
    setGap(null);
  }

  function handleDragMove({ delta, over, active }: DragMoveEvent) {
    if (!over || !activeItem) {
      setProjected(null);
      setGap(null);
      return;
    }

    // dnd-kit reports the active row itself as `over` while the pointer rests
    // on it. `exclude` holds it, so `resolveGap` reads it as a row of the
    // dragged block: the project's own gap (wiki project-tree §1).
    const side = resolveDropSide(active.rect.current.translated, over.rect);
    const g = resolveGap(flatItems, rows, exclude, String(over.id), side);
    const proj = computeProjection(rows, g, activeItem.depth, delta.x, INDENT_WIDTH, null, childrenOf, exclude);
    setProjected(proj);
    setGap(g);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (!over || !activeItem || !projected || gap === null || overCap) {
      clearDrag();
      return;
    }

    // prevId/nextId come off the projection's one anchor (`siblingIdsFromAnchor`, via `releaseOf`).
    const release = releaseOf(flatItems, activeItem.id, gap, projected);
    if (release) {
      // A project dropped into a collapsed parent opens it (wiki project-tree §2).
      if (release.parentId) expand(release.parentId);
      onReorderProject(activeItem.id, release.parentId, release.prevId, release.nextId);
    }
    clearDrag();
  }

  function clearDrag() {
    setActiveId(null);
    setProjected(null);
    setGap(null);
  }

  return {
    sensors,
    activeItem,
    rowIds: rows.map(r => r.id),
    descendantIds,
    dropLine,
    /** The drop line's tab state would put the dragged subtree past the project cap. */
    dropInvalid: overCap,
    /** The depth the drop line indents to — the projection's while one is live. */
    projectedDepth: projected?.depth ?? null,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel: clearDrag,
  };
}
