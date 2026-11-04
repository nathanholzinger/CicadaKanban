// classifyDragTargets: classifies every item on the board against the carried item,
// once per drag start — valid / cycle-forming / depth-capped
// (wiki board-drag-interaction §4). Pure: no dnd-kit runtime, so it's
// unit-testable against plain Item[] fixtures.
//
// Computed once at drag start and never again for the gesture — the item
// being carried doesn't change mid-drag, so neither does what any target is
// to it. Over the tree the writes still in flight leave, not the stored one
// (see `classifyDragTargets`). The region gate reads it to decide what's poppable
// (`isValidParent`), and it drives the `data-drop-state` and `data-drop-tier`
// attributes and how strongly each row is drawn.
//
// A Stub is classified on exactly the same terms as a Card, below. Full
// classification is what makes the zoom-in reparent and the Board-layer
// detach need no classification code of their own: every Card and Stub is
// already valid/cycle-forming/depth-capped for a Stub drag exactly as it
// would be for a Free Card's.

import type { Item } from '../../types';
import { getDepth, getSubtree, isWithinDepthCap } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';

export type DropTargetState = 'valid' | 'cycle-forming' | 'depth-capped';

// What a target can be to the carried item, which is how strongly the board draws it
// (`dragChrome.tsx`), whatever the reason it can't be more:
//   - 'parent': a legal parent, so also an anchor the ghost can sit beside.
//   - 'anchor': an anchor but not a parent.
//   - 'neither': not even an anchor.
// A Free Card is never 'neither', since a Card in a column can be named for a reposition
// whatever its state and that sets no parent. A Stub row can be named only when its own parent
// could take the carried item, so it is 'neither' under any target that isn't a legal parent.
export type DropTier = 'parent' | 'anchor' | 'neither';

export interface DragClassification {
  activeId: string;
  /** Per item id. An id absent from the map wasn't on the board when the drag began. */
  states: ReadonlyMap<string, DropTargetState>;
  /**
   * Per item id, what the target can be to the carried item. The carried item has none, and an id
   * absent from `states` has none. Read off the same tree as `states`, so a pending attach or
   * detach puts a row under its new parent's tier.
   */
  tiers: ReadonlyMap<string, DropTier>;
  /**
   * The dragged item and its whole subtree — never a Top/Bottom candidate
   * at any Card's Descendants layer. One derivation, also read by the
   * projection's exclusion and `dragCollision.ts::travelingRowsFor`, so
   * neither re-derives "activeId ∪ its descendants" by filtering `states`
   * for `'cycle-forming'`.
   */
  subtreeIds: ReadonlySet<string>;
}

// Whether `id` is a legal parent for the carried item, off the drag-start
// snapshot — the one answer both the region gate (does a Card's Descendants
// region, its root box or the hierarchy modal's list, resolve at all) and the
// Descendants layer's over-cap cue read, so the two can't disagree about the
// same parent. Cycle-forming ids are never valid either, though the projection
// never resolves to one: the dragged subtree is out of its rows. For data
// already past the cap this also refuses the parent the item already has,
// which the API accepts since the cap gates only a write that reparents
// (wiki hierarchy-placement §6).
export function isValidParent(classification: Pick<DragClassification, 'states'>, id: string): boolean {
  return classification.states.get(id) === 'valid';
}

// `items` is the tree the drag counts over: handed the parent each item will
// have once the writes in flight land (`itemListOps.ts::withPendingParents`),
// since a pending attach shifts the depth of everything under it, and one that
// puts an item in the dragged subtree makes it a cycle. `isStubOf` is whether an
// item is drawn as a Stub, which the tiers read: a Free Card is never 'neither', and a
// Stub takes its parent's say. It defaults to the stored attachment, for a tree with
// nothing pending.
export function classifyDragTargets(
  activeId: string,
  items: readonly Item[],
  cap: number,
  isStubOf: (item: Item) => boolean = isStub,
): DragClassification {
  const active = items.find(i => i.id === activeId);
  const states = new Map<string, DropTargetState>();
  const tiers = new Map<string, DropTier>();
  if (!active) return { activeId, states, tiers, subtreeIds: new Set([activeId]) };

  // Computed once per drag, not per target — one walk yields both the
  // subtree (for cycle-forming) and its height (for the depth rule).
  const { descendantIds, subtreeIds, height } = getSubtree(activeId, items);

  for (const item of items) {
    if (item.id === activeId || descendantIds.has(item.id)) {
      // Descent is through the hierarchy, attachment irrelevant, and a
      // descendant is never a "real target" for its ancestor — this wins
      // over depth-capped.
      states.set(item.id, 'cycle-forming');
      continue;
    }
    // A Stub is classified on exactly the same terms as a Card — full
    // classification, no separate "siblings only" branch.
    states.set(item.id, isWithinDepthCap(getDepth(item.id, items), height, cap) ? 'valid' : 'depth-capped');
  }

  // A tier needs only a target's own state and its parent's. A Stub under a target that isn't a
  // legal parent is itself not one, and named as the ghost's neighbor it would give the carried
  // item that parent, so every Stub under an 'anchor' or 'neither' target is 'neither' too.
  for (const item of items) {
    if (item.id === activeId) continue;
    if (states.get(item.id) === 'valid') tiers.set(item.id, 'parent');
    else if (!isStubOf(item)) tiers.set(item.id, 'anchor');
    else tiers.set(item.id, states.get(item.parentId ?? '') === 'valid' ? 'anchor' : 'neither');
  }

  return { activeId, states, tiers, subtreeIds };
}
