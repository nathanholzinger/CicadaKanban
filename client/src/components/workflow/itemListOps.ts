// Item list selectors + ordinal placements: the ghost is a Placement, not a position.
// completeItemWrite folds a write's `reindexed` disclosure into every list. (wiki §5a/§10)

import type { Item } from '../../types';
import type { ItemWriteResponse } from '../../api/items';
import { getDescendantIds } from '../../lib/hierarchy';
import { isStub } from '../../lib/isStub';

// Pure operations over the board's Item[] state — no React. Split out of
// useItemManagement.ts (audit epic-3-5-story-2 #15) so the hook only closes
// over state and the reducers here stay unit-testable.
//
// Two layers live here:
//   - the list *selectors* (which items a column/sub-row/Stub list renders,
//     in what order), and
//   - the *ordinal placement* layer of Epic 3.5 Story 3 (docs/wiki/board-
//     drag-interaction §10, item-positioning §2 "Client-side role"): a
//     dragged or just-dropped item is shown at a slot in a list without any
//     position value being invented for it. `position` is never touched
//     client-side; the number is the server's to produce.

// ── Ordinal placement ──────────────────────────────────────────────────────

export type PlacementSlot =
  // Where the position sort already puts it (the column's "middle band").
  | 'existing'
  | 'first'
  | 'last'
  // Adjacent to a specific item in the rendered list — the same relation the
  // move request carries, so the picture before and after the response is
  // the same one (item-positioning §2, TC-2.28).
  | { anchorId: string; side: 'before' | 'after' };

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
// append slot instead of the position-sort's null-coerced top ordering
// (wiki–code reconciliation #29, the mirror of #14). One definition, shared
// by `placementFor`'s non-terminal in-context/middle-band case and
// `pendingPlacementFor`'s bare-workphase-change case — they used to answer
// this with two independently-typed copies of the same rule (audit
// epic-3-5-story-3-reconciled #3).
export function workphaseOnlySlot(position: number | null): 'existing' | 'last' {
  return position === null ? 'last' : 'existing';
}

export type Placements = ReadonlyMap<string, Placement>;

const NO_PLACEMENTS: Placements = new Map();

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
// placement is never intentionally cleared to null.
function renderedParentId(item: Item, placements: Placements): string | null {
  const placement = placements.get(item.id);
  return placement && 'parentId' in placement ? (placement.parentId ?? null) : item.parentId;
}

// Whether the item renders as a Stub — nested inside a parent Card — under
// its current placement. A placement carrying a `parentId` opinion always
// decides this for preview purposes (a non-null value previews attaching;
// Story 5's detach previews null, i.e. Free); with no opinion, the item's
// own data does, via isStub.
function renderedIsStub(item: Item, placements: Placements): boolean {
  const placement = placements.get(item.id);
  if (placement && 'parentId' in placement) return placement.parentId != null;
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

// Shared by getWorkphaseItemsFrom/getMergedColumnItemsFrom below (audit
// Finding #25) — the two differ only in what counts as "belongs to this
// column," supplied via `matchesWorkphase`.
//
// Stubs render nested inside their parent's Card (see getAttachedChildrenFrom)
// instead of as top-level board cards. `isTerminal` (Epic 3.2 Part 6): a
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

// ── Write reconciliation (item-positioning §5a) ────────────────────────────

// Epic 3.5 Story 2 — fold an item-write response into the list. Order is
// the rule: apply every `reindexed` pair the list holds first (an unknown id
// means "not in this view," never missing data), then upsert the written
// row — it is authoritative for itself and is also in the pairs, so applying
// it first and a stale pair over it would be the silent-wrong order §5a
// warns about. `reindexed` is stripped so it never lands in an Item.
export function applyItemWriteResponse(items: readonly Item[], response: ItemWriteResponse): Item[] {
  if (!response.reindexed) return upsertItem(items, response);
  const { reindexed, ...written } = response;
  const positionById = new Map(reindexed.map(r => [r.id, r.position]));
  const renumbered = items.map(item => {
    const position = positionById.get(item.id);
    return position === undefined || item.position === position ? item : { ...item, position };
  });
  return upsertItem(renumbered, written);
}

function upsertItem(items: readonly Item[], written: Item): Item[] {
  const exists = items.some(i => i.id === written.id);
  return exists ? items.map(i => (i.id === written.id ? written : i)) : [...items, written];
}

// The board-wide rendered order of Free, positioned items — what the ordinal
// preview makes a claim about. Positions compare workflow-wide (item-
// positioning §2), so the claim "X sits right after A" holds across the
// whole loaded set, not just one column. Unpositioned items (done, or no
// workphase) make no ordering claim and are left out — and, once a Card
// previews attaching (Story 4 planning), so does it: its position is about
// to stop being comparable to anything, exactly like a done item's, and the
// tripwire (findInversion) must not judge it against a scale it's leaving.
export function freeItemOrder(items: readonly Item[], placements: Placements): string[] {
  const sorted = items.filter(i => !renderedIsStub(i, placements) && i.position !== null).sort(byPositionThenCreatedAt);
  return applyPlacements(sorted, placements).map(i => i.id);
}

export interface Inversion {
  itemId: string;
  expected: string[];
  actual: string[];
}

// The §5a/§10 tripwire: after a correctly reconciled response the position
// sort should reproduce exactly the order the preview drew. Compares the two
// sequences over the ids they share (an item that left the positioned set —
// moved to done — makes no claim either way).
export function findInversion(
  before: readonly string[],
  after: readonly string[],
): Pick<Inversion, 'expected' | 'actual'> | null {
  const common = new Set(before.filter(id => after.includes(id)));
  const expected = before.filter(id => common.has(id));
  const actual = after.filter(id => common.has(id));
  return expected.every((id, i) => id === actual[i]) ? null : { expected, actual };
}

export interface ItemListState {
  items: Item[];
  placements: Placements;
  /** Every inversion the tripwire has caught this session (DRAG-6.4); surfaced by the dev/test panel. */
  inversions: readonly Inversion[];
}

export const EMPTY_ITEM_LIST_STATE: ItemListState = { items: [], placements: NO_PLACEMENTS, inversions: [] };

export function withPlacement(state: ItemListState, itemId: string, placement: Placement | null): ItemListState {
  const placements = new Map(state.placements);
  if (placement) placements.set(itemId, placement);
  else placements.delete(itemId);
  return { ...state, placements };
}

// A write's response, in §5a's order: apply the reindex collection, assign
// the written item, clear its pending placement, then check for an
// inversion — the check runs on a list where the item is an ordinary
// positioned row (DRAG-6.3). Re-sorting is implicit: render order is
// derived from `position` every render, so applying the rows *is* the
// re-sort (TC-5a.3 — nothing is rebuilt when nothing changed). The tripwire
// only fires for a write the board previewed; a Sheet edit that reassigns a
// position made no ordinal claim.
//
// `recorded` is the exact placement object `writes.begin` stashed when this
// write started (undefined for a write that was never placement-tracked —
// a Sheet PUT, an inline create, a child create). Clearing the placement
// and running the tripwire only happens when the item's *current*
// placement is still that same object, by reference — not mere presence —
// so a placement written after this write began (a re-drag's live ghost, a
// different write's own marker) is left untouched: this write isn't the
// one that owns it. Without this, a response landing mid-re-drag would
// clear the live ghost and log a false inversion, and an unrelated write
// (a Sheet PUT) would clear a pending marker it never recorded (audit
// epic-3-5-story-3-reconciled #1).
export function completeItemWrite(
  state: ItemListState,
  response: ItemWriteResponse,
  recorded?: Placement | null,
): ItemListState {
  const items = applyItemWriteResponse(state.items, response);
  if (recorded === undefined || state.placements.get(response.id) !== recorded) return { ...state, items };

  const before = freeItemOrder(state.items, state.placements);
  const next = withPlacement({ ...state, items }, response.id, null);
  const inversion = findInversion(before, freeItemOrder(next.items, next.placements));
  if (!inversion) return next;
  return { ...next, inversions: [...state.inversions, { itemId: response.id, ...inversion }] };
}
