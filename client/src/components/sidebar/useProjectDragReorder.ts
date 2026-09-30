// The project sidebar's drag reorder — the same placement rule as a board
// Card's Descendants layer (`lib/hierarchyPlacement.ts`): the rows a gap is
// computed against, the live projection, the drop line drawn at the gap
// (wiki board-drag-interaction §7.1), and on release the reorder, sent as
// the sibling to insert beside (prevId/nextId), never a computed position.

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
import { computeProjection, type AnchorRelation, type Projection } from '../../lib/hierarchyPlacement';
import { resolveDropSide } from '../workflow/dragCollision';
import {
  eligibleRows,
  fullChildrenOf,
  getDescendantIds,
  resolveGap,
  siblingIdsFromAnchor,
  INDENT_WIDTH,
  type FlatItem,
} from './projectTreeUtils';

const NO_IDS: ReadonlySet<string> = new Set();

export type ReorderProject = (
  id: string,
  parentId: string | null,
  prevId: string | null,
  nextId: string | null,
) => Promise<void>;

// `flatItems` is the rendered tree; `expand` opens a collapsed parent a
// project was just dropped into.
export function useProjectDragReorder(
  projects: Project[],
  flatItems: readonly FlatItem[],
  onReorderProject: ReorderProject,
  expand: (id: string) => void,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projected, setProjected] = useState<Projection | null>(null);
  const [gap, setGap] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeItem = activeId ? (flatItems.find(i => i.id === activeId) ?? null) : null;
  // The dragged project's descendants stay drawn, dimmed, but the project
  // and its whole subtree are never a Top/Bottom candidate — `rows` is what
  // a gap is computed against.
  const descendantIds = useMemo(() => (activeId ? getDescendantIds(activeId, projects) : NO_IDS), [activeId, projects]);
  const exclude = useMemo(() => (activeId ? new Set([activeId, ...descendantIds]) : NO_IDS), [activeId, descendantIds]);
  const rows = eligibleRows(flatItems, exclude);
  // A Top's first-child lookup must see the *real* tree, not the render
  // list (which a collapsed project already left out).
  const childrenOf = fullChildrenOf(projects);
  // Where the drop line draws: "before" the row the gap sits above, or —
  // the gap past the last row — "after" the last row. None only when no
  // eligible row is left to draw it against.
  const dropLine: AnchorRelation | null =
    gap === null || rows.length === 0
      ? null
      : gap < rows.length
        ? { anchorId: rows[gap].id, side: 'before' }
        : { anchorId: rows[rows.length - 1].id, side: 'after' };

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

    const overId = String(over.id);

    // dnd-kit can report the active row itself as `over` while the pointer
    // rests on it — keep the last known projection rather than resolve a
    // fresh (and meaningless) one for that sample.
    if (overId === activeId) return;

    const side = resolveDropSide(active.rect.current.translated, over.rect);
    const g = resolveGap(flatItems, rows, exclude, overId, side);
    const proj = computeProjection(rows, g, activeItem.depth, delta.x, INDENT_WIDTH, null, childrenOf, exclude);
    setProjected(proj);
    setGap(g);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (!over || !activeItem || !projected) {
      clearDrag();
      return;
    }

    // Send the sibling id the server should insert beside — never a
    // computed position (server always resolves it against true current
    // data). `resolvePlacement`'s one relation maps straight to prevId/
    // nextId; the other is always null, and the server re-derives it.
    const { prevId, nextId } = siblingIdsFromAnchor(projected.placement.anchor);
    const parentId = projected.placement.parentId;
    if (parentId) expand(parentId);

    onReorderProject(activeItem.id, parentId, prevId, nextId);
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
    /** The depth the drop line indents to — the projection's while one is live. */
    projectedDepth: projected?.depth ?? null,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel: clearDrag,
  };
}
