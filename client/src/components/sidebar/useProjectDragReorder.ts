// The project sidebar's drag reorder — the same placement rule as a board
// Card's Descendants layer (`lib/hierarchyPlacement.ts`, wiki hierarchy-placement §1), and the
// same ghost: the dragged project's own row moves to the gap and the rows slide aside (dnd-kit's
// sortable shuffle, wiki board-drag-interaction §2). The gap is the ghost's slot, read from list
// order (`projectTreeUtils.ts::resolveGap`), never a row's half. The hook gives the ghost's state
// (`ghost`): its depth and the drop line that rides its top edge (wiki project-tree §1). On release
// it sends the reorder as the sibling to insert beside (prevId/nextId), never a computed position,
// and a set-down in the project's own slot sends nothing (`projectTreeUtils.ts::releaseOf`). Every
// row is drawn by what it can be to the carried project, on the board's rule
// (`lib/dragTargets.ts`), at the sidebar's own strengths. The carried project takes its descendants
// with it, its branch (`lib/hierarchyPlacement.ts::carriedBranchOf`, as a board item does): the hook
// says which rows are drawn without them (`drawnItems`), and the counts the carried copy says. Every
// event that names a row, a move, the announcement of a new row and the release, places the ghost by one
// function (`placementAt`), so a release saves the gap and depth the last of them drew.

import { useState, type CSSProperties } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from '@dnd-kit/core';
import type { Project } from '../../types';
import { classifyTargets, type DropTier } from '../../lib/dragTargets';
import { getSubtree, isWithinDepthCap, type PendingMove, type Subtree } from '../../lib/hierarchy';
import {
  carriedBranchOf,
  computeProjection,
  toRows,
  type CarriedBranch,
  type Projection,
} from '../../lib/hierarchyPlacement';
import { tierVars } from '../dragChrome';
import { loadDragTuning } from '../workflow/dragTuning';
import { fullChildrenOf, releaseOf, resolveGap, INDENT_WIDTH, type FlatItem } from './projectTreeUtils';

const NO_IDS: ReadonlySet<string> = new Set();
const NO_SUBTREE: Subtree = { descendantIds: NO_IDS, subtreeIds: NO_IDS, height: 0 };
const NO_TIERS: ReadonlyMap<string, DropTier> = new Map();

// What a drag draws and counts by, fixed when the project is picked up: the board's classification
// walk over the tree as it stood then, the carried project's subtree and branch from that same tree, and the
// sidebar's three strengths as the dev/test panel left them in storage (the panel lives on the
// board, so a change takes effect on the next drag). A response landing mid-drag changes none of it.
interface Drawn {
  tiers: ReadonlyMap<string, DropTier>;
  /** The board's tier properties (`dragChrome.tsx::tierVars`), set from the sidebar's values. */
  vars: CSSProperties;
  /**
   * The carried project's subtree: its ids, which are never a Top/Bottom candidate, and its
   * height, which the cap reads.
   */
  subtree: Subtree;
  /**
   * What the pickup takes with it: every descendant in the real tree, collapsed ones included,
   * which no row draws until the drag ends, and the counts its copy says. Null for a project with
   * no children, and nothing is carried. A response landing mid-drag changes neither: a descendant
   * it moves out stays hidden, and a project it moves under the carried one is not in the branch.
   */
  branch: CarriedBranch | null;
}

// What the dragged project's own row, the ghost, is drawn as.
export interface GhostState {
  /** The depth it is drawn at: the projection's while one is live, its own before the first. */
  depth: number;
  /** The drop line rides its top edge. None before the first move, and when no row is left to place against. */
  line: boolean;
  /** The line's tab state would put the dragged subtree past the project cap. */
  invalid: boolean;
}

// Every row is placed among siblings, so naming one as the line's anchor gives the carried
// project that row's parent. Before the cap is known nothing is past it: the carried project's
// descendants are 'neither' and every other row a legal parent.
function drawnAtPickup(
  activeId: string,
  projects: readonly Project[],
  moves: readonly PendingMove[],
  depthCap: number | null,
): Drawn {
  const { tiers } = classifyTargets(activeId, projects, depthCap ?? Infinity, () => true);
  const tuning = loadDragTuning();
  return {
    tiers,
    vars: tierVars({
      anchor: tuning.projectAnchorOpacity,
      neither: tuning.projectNeitherOpacity,
      ghost: tuning.projectDraggedOpacity,
    }),
    subtree: getSubtree(activeId, projects),
    branch: carriedBranchOf(activeId, fullChildrenOf(projects, moves)),
  };
}

export type ReorderProject = (
  id: string,
  parentId: string | null,
  prevId: string | null,
  nextId: string | null,
) => Promise<void>;

// `flatItems` is the rendered tree; `expand` opens a collapsed parent a
// project was just dropped into (`useCollapsedProjects.ts`, the one way a project opens). `depthCap` is the project cap, null until it's
// known: a tab state that would put the dragged subtree past it is still
// offered, marked invalid, and a release in it writes nothing
// (wiki hierarchy-placement §6). `moves` are the moves sent and not yet answered: `projects` already
// carry their parents, and the order of their projects among siblings is what `moves` adds, read by the
// first-child lookup and the branch walk as it is by `flatItems`.
export function useProjectDragReorder(
  projects: Project[],
  flatItems: readonly FlatItem[],
  onReorderProject: ReorderProject,
  expand: (id: string) => void,
  depthCap: number | null = null,
  moves: readonly PendingMove[] = [],
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  const [projected, setProjected] = useState<Projection | null>(null);
  const [gap, setGap] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeItem = activeId ? (flatItems.find(i => i.id === activeId) ?? null) : null;
  // The dragged project's subtree: none of it is a place to drop, and its height is what the cap reads.
  const { subtreeIds: exclude, height: subtreeHeight } = drawn?.subtree ?? NO_SUBTREE;
  const branch = drawn?.branch ?? null;
  // The rows the sidebar draws: every rendered row but the carried project's branch, from the
  // pickup to the drag's end. The project's own row is among them, and it is the ghost. Three lists
  // place against it: the gap is a row's place in these drawn rows (`resolveGap`), where the rows
  // after a branch sit as many places nearer the top as it has rows; the projection reads `rows`, below;
  // and the release's own-slot lookup reads `flatItems`, where the project's own index is the same, the
  // branch coming right after it.
  const drawnItems = branch ? flatItems.filter(i => !branch.ids.has(i.id)) : flatItems;
  // The project and its whole subtree are never a Top/Bottom candidate:
  // `rows`, what a gap is computed against, is every rendered row (a collapsed
  // subtree already left `flatItems`) without them, so one fewer than `drawnItems`.
  const rows = toRows(flatItems, exclude);
  // A Top's first-child lookup must see the *real* tree, not the render
  // list (which a collapsed project already left out).
  const childrenOf = fullChildrenOf(projects, moves);

  // The projection's depth (the top level is 0) is the dropped project's parent's
  // depth in the cap's count (a root is 1), so it is the cap's `targetDepth` as it stands.
  const isOverCap = (projection: Projection) =>
    depthCap !== null && !isWithinDepthCap(projection.depth, subtreeHeight, depthCap);
  const overCap = projected !== null && isOverCap(projected);

  // The line is drawn once there is a gap (something is `over`) and a row to place against, which
  // is none only when the dragged subtree holds every project.
  const ghost: GhostState | null = activeItem
    ? { depth: projected?.depth ?? activeItem.depth, line: gap !== null && rows.length > 0, invalid: overCap }
    : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDrawn(drawnAtPickup(String(active.id), projects, moves, depthCap));
    setProjected(null);
    setGap(null);
  }

  // The gap the ghost's slot is, and the projection there, for the row dnd-kit says the copy is nearest
  // (`over`) and how far it has travelled sideways since the pickup (`deltaX`). Null with nothing over.
  // dnd-kit reports the active row itself as `over` while the copy rests on its own slot, and
  // `resolveGap` reads that as the project's own gap (wiki project-tree §1).
  function placementAt(over: Over | null, deltaX: number): { gap: number; projection: Projection } | null {
    if (!over || !activeItem) return null;
    const gap = resolveGap(drawnItems, String(over.id));
    return {
      gap,
      projection: computeProjection(rows, gap, activeItem.depth, deltaX, INDENT_WIDTH, null, childrenOf, exclude),
    };
  }

  function drawPlacement({ delta, over }: DragMoveEvent | DragOverEvent) {
    const placed = placementAt(over, delta.x);
    setProjected(placed?.projection ?? null);
    setGap(placed?.gap ?? null);
  }

  // A move event carries the `over` of the render before it: the move that crosses into a new row still
  // names the old one. `onDragOver` announces the new one, with the pointer still or not, and the
  // sortable draws the ghost by it, so both place the ghost.
  function handleDragMove(event: DragMoveEvent) {
    drawPlacement(event);
  }

  function handleDragOver(event: DragOverEvent) {
    drawPlacement(event);
  }

  // The release places the ghost from its own event, not from what the last render held, so it saves
  // the gap and depth the ghost shows now.
  function handleDragEnd({ delta, over }: DragEndEvent) {
    const placed = placementAt(over, delta.x);
    if (!placed || !activeItem || isOverCap(placed.projection)) {
      clearDrag();
      return;
    }

    // prevId/nextId come off the projection's one anchor (`siblingIdsFromAnchor`, via `releaseOf`).
    const release = releaseOf(flatItems, activeItem.id, placed.gap, placed.projection);
    if (release) {
      // A project dropped into a collapsed parent opens it (wiki project-tree §2).
      if (release.parentId) expand(release.parentId);
      onReorderProject(activeItem.id, release.parentId, release.prevId, release.nextId);
    }
    clearDrag();
  }

  function clearDrag() {
    setActiveId(null);
    setDrawn(null);
    setProjected(null);
    setGap(null);
  }

  return {
    sensors,
    activeItem,
    /** The sortable context's items: the rows drawn, in order, the dragged project's own among them. */
    rowIds: drawnItems.map(r => r.id),
    /** The rows to draw: `flatItems` without the carried project's branch. */
    drawnItems,
    /** What the carried project takes with it, for its copy's second line; null when it has no descendants. */
    branch,
    /** What each row can be to the carried project, by id, for the whole drag (the carried row has none). */
    tiers: drawn?.tiers ?? NO_TIERS,
    /** The custom properties the tier classes read, on whatever holds the rows. Undefined outside a drag. */
    tierVars: drawn?.vars,
    /** How the dragged project's row is drawn; null outside a drag. */
    ghost,
    /** The ghost's gap, among the rows without the dragged subtree; null before the first move. */
    gap,
    /** The live projection's depth, which the ghost, its line and the copy are drawn at; null before the first move. */
    projectedDepth: projected?.depth ?? null,
    /** The line's tab state would put the dragged subtree past the project cap. */
    dropInvalid: overCap,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: clearDrag,
  };
}
