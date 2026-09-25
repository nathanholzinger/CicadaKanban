// Pure operations over the board's Item[] state — no React, so the hook only
// closes over state and these stay unit-testable:
//   - the *ordinal placement* layer (docs/wiki/board-drag-interaction §10,
//     item-positioning §2 "Client-side role"): a dragged or just-dropped item
//     is shown at a slot in a list without any position value being invented
//     for it. `position` is never touched client-side; the number is the
//     server's to produce;
//   - the list *selectors*: which items a column, sub-row or Stub list
//     renders, in what order;
//   - a Card's descendants section as flat hierarchy rows (`hierarchyRows`,
//     `descendantsChildrenOf`), the input the shared placement library reads.
// A write's response is folded into these lists by `itemWriteReconciliation.ts`.

import type { Item } from '../../types';
import { getDescendantIds } from '../../lib/hierarchy';
import { flattenHierarchyOf, type AnchorRelation, type HierarchyNode } from '../../lib/hierarchyPlacement';
import { isStub } from '../../lib/isStub';

// ── Ordinal placement ──────────────────────────────────────────────────────

export type PlacementSlot =
  // Where the position sort already puts it (the column's "middle band").
  | 'existing'
  | 'first'
  | 'last'
  // Adjacent to a specific item in the rendered list — the same relation the
  // move request carries, so the picture before and after the response is
  // the same one (item-positioning §2, TC-2.28).
  | AnchorRelation;

export interface Placement {
  /**
   * Which board list the item is shown in, overriding its own workphaseId
   * for membership only. Omitted for a Stub (its list is its parent's) or
   * when the list doesn't change.
   */
  workphaseId?: string;
  /**
   * Story 4: previewed as a Stub of this Card, overriding the
   * item's own attachment for rendering purposes only — exactly as
   * `workphaseId` overrides column membership above, and never touching
   * real data. Explicit `null` previews detaching to Free (Story 5);
   * omitted means "no opinion, use the item's own data" (`isStub`/its real
   * `parentId`).
   */
  parentId?: string | null;
  slot: PlacementSlot;
}

// Whether a workphase-only claim (no anchor — a bare "put me in this list")
// keeps the item where the position sort already has it, or takes the
// append fallback instead: the server does the same thing for the same
// reason (item-positioning §2 addendum, §7.5) — a position to keep sorts as
// 'existing'; none (a reopened done item, a first assignment) takes the
// append slot instead of the position-sort's null-coerced top ordering.
export function workphaseOnlySlot(position: number | null): 'existing' | 'last' {
  return position === null ? 'last' : 'existing';
}

// Whether a Placement carries an opinion about parentage at all —
// `'parentId' in placement`, not truthiness: an explicit null previews
// detaching to Free, distinct from "no opinion, use the item's own data"
// (the key omitted entirely). Every Story 5 origin/placement comparison
// re-typed this same presence test independently (audit epic-3-5-story-5
// #7) — this is the one spelling, as a type guard so a caller can go on to
// read `.parentId` without re-testing.
export function hasParentOpinion(p: Placement): p is Placement & { parentId: string | null } {
  return 'parentId' in p;
}

// The convenience read for a caller that only wants the value: null for
// "no opinion" and "explicit null" alike, which is exactly how every
// `origin` comparison in the drag machine already treated the two — an
// `origin` never carries an explicit null (a Stub's real parentId is never
// null), so nothing here collapses a distinction origin comparisons ever
// needed. Not for a `placement`, where the omitted-vs-null distinction is
// still load-bearing (`hasParentOpinion` alone is the right test there).
export function parentOpinionOf(p: Placement): string | null {
  return hasParentOpinion(p) ? (p.parentId ?? null) : null;
}

export type Placements = ReadonlyMap<string, Placement>;

export const NO_PLACEMENTS: Placements = new Map();

// The workphase an item is *rendered* under — its placement's, if it has
// one, else its own. Membership only; the item's data is untouched.
export function renderedWorkphaseId(item: Item, placements: Placements): string | null {
  return placements.get(item.id)?.workphaseId ?? item.workphaseId;
}

// The parent an item is *rendered* under (Story 4 planning) — its
// placement's, if the placement carries an opinion, else its own. A
// placement's `parentId` can be an explicit `null` (would become Free), so
// this checks the key's presence rather than truthiness — the same
// distinction `renderedWorkphaseId` doesn't need, since a workphase
// placement is never intentionally cleared to null. Exported, with
// `renderedIsStub` below, for a drag's own start (`useBoardDnd.ts`, audit
// epic-3-5-story-6 #3): a drag starts from the item as it's drawn.
export function renderedParentId(item: Item, placements: Placements): string | null {
  const placement = placements.get(item.id);
  return placement && hasParentOpinion(placement) ? (placement.parentId ?? null) : item.parentId;
}

// Whether the item renders as a Stub — nested inside a parent Card — under
// its current placement. A placement carrying a `parentId` opinion always
// decides this for preview purposes (a non-null value previews attaching;
// Story 5's detach previews null, i.e. Free); with no opinion, the item's
// own data does, via isStub.
export function renderedIsStub(item: Item, placements: Placements): boolean {
  const placement = placements.get(item.id);
  if (placement && hasParentOpinion(placement)) return placement.parentId != null;
  return isStub(item);
}

// Layers placements over an already-sorted list: every item with a
// non-'existing' slot is pulled out and re-inserted at its slot, in the
// order the placements were recorded — so an item anchored against another
// pending item (TC-2.29) is inserted after its anchor has been. An anchor
// that isn't in this list (filtered out of the view) falls back to where the
// sort already had the item.
export function applyPlacements(sorted: readonly Item[], placements: Placements): Item[] {
  const placed = new Map<string, Item>();
  for (const item of sorted) {
    const slot = placements.get(item.id)?.slot;
    if (slot && slot !== 'existing') placed.set(item.id, item);
  }
  if (placed.size === 0) return [...sorted];

  const sortedIndex = new Map(sorted.map((item, i) => [item.id, i]));
  const list = sorted.filter(item => !placed.has(item.id));
  for (const [id, placement] of placements) {
    const item = placed.get(id);
    if (!item) continue;
    list.splice(slotIndex(list, item, placement.slot, sortedIndex), 0, item);
  }
  return list;
}

function slotIndex(list: Item[], item: Item, slot: PlacementSlot, sortedIndex: Map<string, number>): number {
  if (slot === 'first') return 0;
  if (slot === 'last') return list.length;
  if (slot !== 'existing') {
    const anchorAt = list.findIndex(i => i.id === slot.anchorId);
    if (anchorAt !== -1) return slot.side === 'after' ? anchorAt + 1 : anchorAt;
  }
  // Fallback: the index the sort gave it, expressed against the current list.
  const own = sortedIndex.get(item.id) ?? Number.MAX_SAFE_INTEGER;
  return list.filter(i => (sortedIndex.get(i.id) ?? -1) < own).length;
}

// ── Selectors ──────────────────────────────────────────────────────────────

// Deterministic tie-break for an exact position match — prevents order from
// depending on unspecified DB row order (Epic 3.2 Part 5, TC-5a.5).
export function byPositionThenCreatedAt(a: Item, b: Item): number {
  return (a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt;
}

// A done list's order (Epic 3.2 Part 6). An item with no completedAt in a
// done list is one being previewed into it — the server stamps `now` on the
// write (itemHierarchy.ts, active/done split) — so it sorts as the newest
// completion: the slot the response will put it in (board-drag-interaction
// §10). Same createdAt tie-break as byPositionThenCreatedAt.
function byCompletedAtThenCreatedAt(a: Item, b: Item): number {
  const at = (item: Item) => item.completedAt ?? Number.MAX_SAFE_INTEGER;
  return at(a) - at(b) || a.createdAt - b.createdAt;
}

// Shared by getWorkphaseItemsFrom/getMergedColumnItemsFrom below — the two differ
// only in what counts as "belongs to this column," supplied via `matchesWorkphase`.
//
// Stubs render nested inside their parent's Card (see getAttachedChildrenFrom)
// instead of as top-level board cards. `isTerminal`: a
// done workphase's items have no stored position — ordered by completedAt
// instead. Kept as an explicit param since it picks the sort key for the
// whole batch, including when the batch is empty.
function selectBoardItems(
  items: readonly Item[],
  matchesWorkphase: (workphaseId: string | null) => boolean,
  filterProjectId: string | undefined,
  isTerminal: boolean | undefined,
  placements: Placements,
): Item[] {
  const filtered = items.filter(
    item =>
      matchesWorkphase(renderedWorkphaseId(item, placements)) &&
      (!filterProjectId || item.projectId === filterProjectId) &&
      !renderedIsStub(item, placements),
  );
  const sorted = filtered.sort(isTerminal ? byCompletedAtThenCreatedAt : byPositionThenCreatedAt);
  return applyPlacements(sorted, placements);
}

// A single workphase's items — membership is an exact workphaseId match.
export function getWorkphaseItemsFrom(
  items: readonly Item[],
  workphaseId: string,
  filterProjectId?: string,
  isTerminal?: boolean,
  placements: Placements = NO_PLACEMENTS,
): Item[] {
  return selectBoardItems(items, id => id === workphaseId, filterProjectId, isTerminal, placements);
}

// Epic 3.2 Part 4: a merged column's item list is a union-sort across its
// covered workphases, not a concatenation of independently-sorted
// per-workphase lists — this is what makes genuine cross-workphase
// interleaving possible. `isTerminal` is uniform across the covered set (a
// column can't span both terminal and non-terminal workphases).
export function getMergedColumnItemsFrom(
  items: readonly Item[],
  coveredWorkphaseIds: readonly string[],
  filterProjectId?: string,
  isTerminal?: boolean,
  placements: Placements = NO_PLACEMENTS,
): Item[] {
  const coveredSet = new Set(coveredWorkphaseIds);
  return selectBoardItems(items, id => id !== null && coveredSet.has(id), filterProjectId, isTerminal, placements);
}

// Story 4: a Card whose own placement previews it attaching
// *into* this parent is pulled into the filtered set by that placement
// (`renderedParentId`/`renderedIsStub`, the same pattern `selectBoardItems`
// already uses for a cross-column workphase preview), then positioned by
// `applyPlacements` at its slot — its own stale `position` (from wherever it
// used to be, a scope this parent's positions aren't even comparable
// against) never matters, since a non-'existing' slot is always pulled out
// and reinserted regardless of where the initial sort put it.
export function getAttachedChildrenFrom(
  items: readonly Item[],
  parentId: string,
  placements: Placements = NO_PLACEMENTS,
): Item[] {
  const sorted = items
    .filter(item => renderedParentId(item, placements) === parentId && renderedIsStub(item, placements))
    .sort(byPositionThenCreatedAt);
  return applyPlacements(sorted, placements);
}

// A row of a Card's descendants section. `parentId` is the walk's own parent
// — the Card or Stub the row renders under — which for a placement-previewed
// row can differ from the stored `item.parentId`.
export type HierarchyRow = HierarchyNode<Item>;

// A Card's whole descendants section as one flat, depth-first list, for
// `KanbanCard.tsx`'s single `SortableContext` and the Descendants layer's
// projection (`descendantsProjection.ts`, which drops the dragged subtree
// with `toRows`) — one walk, so the two can't disagree. `childrenOf` is the
// caller's view of a parent's children: ordinarily `getAttachedChildren`,
// placement-aware, so an item previewing into the section already appears
// at its slot.
export function hierarchyRows(cardId: string, childrenOf: (parentId: string) => readonly Item[]): HierarchyRow[] {
  return flattenHierarchyOf(cardId, sectionChildrenOf(childrenOf));
}

// The same accessor in the ids-only shape `resolvePlacement` looks a Top's
// first child up with. The board never collapses a row in this section, so
// one accessor serves both the rows and that lookup — unlike the sidebar,
// whose collapse toggle needs the real tree separately (`fullChildrenOf`).
export function descendantsChildrenOf(
  getAttachedChildren: (parentId: string) => readonly Item[],
): (parentId: string | null) => readonly string[] {
  const childrenOf = sectionChildrenOf(getAttachedChildren);
  return parentId => childrenOf(parentId).map(item => item.id);
}

// The board's accessor in the library's shape. A section's root is always a
// real Card, so the library's null root has no children here.
function sectionChildrenOf(
  childrenOf: (parentId: string) => readonly Item[],
): (parentId: string | null) => readonly Item[] {
  return parentId => (parentId === null ? [] : childrenOf(parentId));
}

// The server deletes an item's whole subtree, not just the one id (audit
// Finding #15) — dropping only `id` from client state left its descendants
// stale, rendering as live top-level cards until a reload.
export function removeItemAndDescendants(items: readonly Item[], id: string): Item[] {
  const descendants = getDescendantIds(id, items);
  return items.filter(i => i.id !== id && !descendants.has(i.id));
}

// Counts attached children only — the ones the card's expand toggle reveals
// nested underneath it. Detached children render as ordinary top-level
// cards and aren't counted here. Placement-aware (Story 4 planning) so a
// Card previewing an attach shows a non-zero count — and expands to reveal
// the ghost — the moment something targets it, not only once the write
// lands.
export function computeChildCounts(
  items: readonly Item[],
  placements: Placements = NO_PLACEMENTS,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const parentId = renderedParentId(item, placements);
    if (parentId && renderedIsStub(item, placements)) {
      counts[parentId] = (counts[parentId] ?? 0) + 1;
    }
  }
  return counts;
}
