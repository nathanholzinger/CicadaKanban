// classifyDragTargets: classifies every item on the board against the carried item,
// once per drag start — valid / cycle-forming / depth-capped
// (wiki board-drag-interaction §4). Pure: no dnd-kit runtime, so it's
// unit-testable against plain Item[] fixtures.
//
// Computed once at drag start and never again for the gesture — the item
// being carried doesn't change mid-drag, so neither does what any target is
// to it. The region gate reads it to decide what's poppable
// (`isValidParent`), and it drives the `data-drop-state` attribute and the
// overlays.
//
// A Stub is classified on exactly the same terms as a Card, below. Full
// classification is what makes the zoom-in reparent and the Board-layer
// detach need no classification code of their own: every Card and Stub is
// already valid/cycle-forming/depth-capped for a Stub drag exactly as it
// would be for a Free Card's.

import type { Item } from '../../types';
import { getDepth, getDescendantLevels } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';

export type DropTargetState = 'valid' | 'cycle-forming' | 'depth-capped';

export interface DragClassification {
  activeId: string;
  /** Per item id. An id absent from the map wasn't on the board when the drag began. */
  states: ReadonlyMap<string, DropTargetState>;
  /**
   * Cycle-forming descendants that render as their own Cards — "these are
   * yours," the green relationship overlay. Attached descendants
   * are cycle-forming too but render inside the carried Card, so they need
   * no separate cue.
   */
  freeDescendantIds: ReadonlySet<string>;
  /**
   * The dragged item and its whole subtree — never a Top/Bottom candidate
   * at any Card's Descendants layer. One derivation, also read by the
   * projection's exclusion and `dragCollision.ts::travelingRowsFor`, so
   * neither re-derives "activeId ∪ its descendants" by filtering `states`
   * for `'cycle-forming'`.
   */
  subtreeIds: ReadonlySet<string>;
}

// The whole depth rule (wiki hierarchy-placement §6): a target at depth D is a
// legal parent iff D + 1 + draggedSubtreeHeight <= cap. Root items are at
// depth 1; a leaf has height 0. Deliberately separate from
// `itemTree.ts::assertWithinDepthCap`: the same formula on each side of the
// process boundary, fed here by the client's own in-memory traversal.
export function isWithinDepthCap(targetDepth: number, subtreeHeight: number, cap: number): boolean {
  return targetDepth + 1 + subtreeHeight <= cap;
}

// Whether `id` is a legal parent for the carried item, off the drag-start
// snapshot — the one answer both the region gate (does a Card, or
// its Descendants section, resolve as a region at all) and the Descendants
// layer's over-cap cue read, so the two can't disagree about the same
// parent. Cycle-forming ids are never valid either, though the projection
// never resolves to one: the dragged subtree is out of its rows. For data
// already past the cap this also refuses the parent the item already has,
// which the API accepts since the cap gates only a write that reparents
// (wiki hierarchy-placement §6).
export function isValidParent(classification: Pick<DragClassification, 'states'>, id: string): boolean {
  return classification.states.get(id) === 'valid';
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
      // Descent is through the hierarchy, attachment irrelevant, and a
      // descendant is never a "real target" for its ancestor — this wins
      // over depth-capped.
      states.set(item.id, 'cycle-forming');
      if (item.id !== activeId && !isStub(item)) freeDescendantIds.add(item.id);
      continue;
    }
    // A Stub is classified on exactly the same terms as a Card — full
    // classification, no separate "siblings only" branch.
    states.set(item.id, isWithinDepthCap(getDepth(item.id, items), height, cap) ? 'valid' : 'depth-capped');
  }

  return { activeId, states, freeDescendantIds, subtreeIds };
}
