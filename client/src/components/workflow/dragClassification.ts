import type { Item } from '../../types';
import { getDepth, getDescendantLevels } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';

// Epic 3.5 Story 2 — what every item on the board *is* to the item being
// carried (docs/wiki/board-drag-interaction §4). Pure, like boardDndUtils:
// no dnd-kit runtime, so it's unit-testable against plain Item[] fixtures.
//
// Computed once at drag start and never again for the gesture — the item
// being carried doesn't change mid-drag, so neither does what any target is
// to it (DRAG-2.4). Stories 3/4/6 consult this map to decide what's
// poppable and what a drop means; in this story it only drives the
// `data-drop-state` attribute and the provisional overlays.

export type DropTargetState = 'valid' | 'cycle-forming' | 'depth-capped' | 'inert';

export interface DragClassification {
  activeId: string;
  /** Per item id. An id absent from the map wasn't on the board when the drag began. */
  states: ReadonlyMap<string, DropTargetState>;
  /**
   * Cycle-forming descendants that render as their own Cards — "these are
   * yours," the green relationship overlay (wiki §4). Attached descendants
   * are cycle-forming too but render inside the carried Card, so they need
   * no separate cue.
   */
  freeDescendantIds: ReadonlySet<string>;
}

// The whole depth rule (wiki item-attachment §8): a target at depth D is a
// legal parent iff D + 1 + draggedSubtreeHeight <= cap. Root items are at
// depth 1; a leaf has height 0. Same formula as the server's
// assertWithinDepthCap, fed by the client's own in-memory traversal.
export function isWithinDepthCap(targetDepth: number, subtreeHeight: number, cap: number): boolean {
  return targetDepth + 1 + subtreeHeight <= cap;
}

export function classifyDragTargets(activeId: string, items: readonly Item[], cap: number): DragClassification {
  const active = items.find(i => i.id === activeId);
  const states = new Map<string, DropTargetState>();
  const freeDescendantIds = new Set<string>();
  if (!active) return { activeId, states, freeDescendantIds };

  // Computed once per drag, not per target — one walk yields both the
  // subtree (for cycle-forming) and its height (for the depth rule).
  const levels = getDescendantLevels(activeId, items);
  const descendantIds = new Set(levels.flat());
  const height = levels.length;

  // A Stub drag is confined to its parent's Stub list until Story 5 opens
  // the detach direction: siblings are reposition targets, everything else
  // is Inert for now (planning decision 2).
  const stubDrag = isStub(active);

  for (const item of items) {
    if (item.id === activeId || descendantIds.has(item.id)) {
      // Descent is through the hierarchy, attachment irrelevant (DRAG-2.2),
      // and a descendant is never a "real target" for its ancestor — this
      // wins over depth-capped.
      states.set(item.id, 'cycle-forming');
      if (item.id !== activeId && !isStub(item)) freeDescendantIds.add(item.id);
      continue;
    }
    if (stubDrag) {
      const isSibling = isStub(item) && item.parentId === active.parentId;
      states.set(item.id, isSibling ? 'valid' : 'inert');
      continue;
    }
    // Stubs are classified on their own merits, same as Cards (DRAG-2.7).
    states.set(item.id, isWithinDepthCap(getDepth(item.id, items), height, cap) ? 'valid' : 'depth-capped');
  }

  return { activeId, states, freeDescendantIds };
}
