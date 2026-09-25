// classifyDragTargets: classifies every item on the board against the carried item,
// once per drag start — valid / cycle-forming / depth-capped / inert.

import type { Item } from '../../types';
import { getDepth, getDescendantLevels } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';

// Epic 3.5 Story 2 — what every item on the board *is* to the item being
// carried (docs/wiki/board-drag-interaction §4). Pure, like dragCollision.ts/
// dragRequest.ts: no dnd-kit runtime, so it's unit-testable against plain
// Item[] fixtures.
//
// Computed once at drag start and never again for the gesture — the item
// being carried doesn't change mid-drag, so neither does what any target is
// to it (DRAG-2.4). Stories 3/4/6 consult this map to decide what's
// poppable and what a drop means; in this story it only drives the
// `data-drop-state` attribute and the provisional overlays.
//
// Story 5 (2026-09-21): a Stub is classified on exactly the same terms as a
// Card, below — the interim "everything outside its own parent's Stub list
// is Inert" rule retires (DRAG-2.8 — the Stub-*drag* half; DRAG-2.7 is the
// separate "Stubs as targets" rule and is unaffected). Full classification
// is what makes the
// zoom-in reparent (TC-4) and Board-layer detach (TC-1–3) need no
// classification code of their own: every Card and Stub is already valid/
// cycle-forming/depth-capped for a Stub drag exactly as it would be for a
// Free Card's.

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
  /**
   * Story 6 Phase D, §7.2: the dragged item and its whole subtree — never
   * a Top/Bottom candidate at any Card's Descendants layer. One
   * derivation (Story 6.1 Phase 2, L1-7a): `useBoardDnd.ts`'s own
   * `excludeIdsRef` and `dragCollision.ts::travelingRowsFor` used to each
   * re-derive this same set by filtering `states` for `'cycle-forming'` —
   * two independent spellings of "activeId ∪ its descendants," which this
   * function already computes internally (`descendantIds`) and now
   * exposes directly instead of discarding.
   */
  subtreeIds: ReadonlySet<string>;
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
  if (!active) return { activeId, states, freeDescendantIds, subtreeIds: new Set([activeId]) };

  // Computed once per drag, not per target — one walk yields both the
  // subtree (for cycle-forming) and its height (for the depth rule).
  const levels = getDescendantLevels(activeId, items);
  const descendantIds = new Set(levels.flat());
  const height = levels.length;
  const subtreeIds = new Set([activeId, ...descendantIds]);

  for (const item of items) {
    if (item.id === activeId || descendantIds.has(item.id)) {
      // Descent is through the hierarchy, attachment irrelevant (DRAG-2.2),
      // and a descendant is never a "real target" for its ancestor — this
      // wins over depth-capped.
      states.set(item.id, 'cycle-forming');
      if (item.id !== activeId && !isStub(item)) freeDescendantIds.add(item.id);
      continue;
    }
    // A Stub is classified on exactly the same terms as a Card (DRAG-2.8,
    // Story 5) — full classification, no separate "siblings only" branch.
    states.set(item.id, isWithinDepthCap(getDepth(item.id, items), height, cap) ? 'valid' : 'depth-capped');
  }

  return { activeId, states, freeDescendantIds, subtreeIds };
}
