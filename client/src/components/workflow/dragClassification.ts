// classifyDragTargets: classifies every item on the board against the carried item,
// once per drag start — valid / cycle-forming / depth-capped
// (wiki board-drag-interaction §4). Pure: no dnd-kit runtime, so it's
// unit-testable against plain Item[] fixtures.
//
// The board's adapter over `lib/dragTargets.ts::classifyTargets`, which does the walk (the
// project sidebar counts on it too). What this file adds is the board's two inputs: the tree
// the writes still in flight leave, not the stored one (see `classifyDragTargets`), and which
// items are drawn as a Stub.
//
// Computed once at drag start and never again for the gesture — the item
// being carried doesn't change mid-drag, so neither does what any target is
// to it. The region gate reads it to decide what's poppable
// (`isValidParent`), and it drives the `data-drop-state` and `data-drop-tier`
// attributes and how strongly each row is drawn.
//
// A Stub is classified on exactly the same terms as a Card. Full
// classification is what makes the zoom-in reparent and the Board-layer
// detach need no classification code of their own: every Card and Stub is
// already valid/cycle-forming/depth-capped for a Stub drag exactly as it
// would be for a Free Card's.

import type { Item } from '../../types';
import { classifyTargets, type DragClassification } from '../../lib/dragTargets';
import { isStub } from '../../lib/isStub';

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
// item is drawn as a Stub, which the tiers read: naming a Stub gives the carried item its
// parent, so it takes its parent's say, and a Free Card is never 'neither', since a Card in a
// column can be named for a reposition whatever its state and that sets no parent. It defaults
// to the stored attachment, for a tree with nothing pending.
export function classifyDragTargets(
  activeId: string,
  items: readonly Item[],
  cap: number,
  isStubOf: (item: Item) => boolean = isStub,
): DragClassification {
  return classifyTargets(activeId, items, cap, isStubOf);
}
