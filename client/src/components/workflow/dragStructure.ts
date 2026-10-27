// The drag's regions, read off the live DOM, in two halves: `resolveDragStructure`
// (structural, once per drag and again after a layer change) and `measureRegions`
// (live rects, per sample). The only code that reads the DOM for them; the region
// types and keys are `dragRegions.ts`'s.
//
// A Descendants region may carry a bounds element (the hierarchy modal's dialog), whose box is
// its `boundsRect`: the modal's list is the region, and the header above it is still the modal.
//
// Unsorted, a broken column, an expanded column's outer wrapper, a column's
// header/footer, the gaps between columns and between sub-rows, and the space below
// the last sub-row register no region (wiki board-drag-interaction §1): they are
// nowhere, so no drag enters them and a release there writes nothing. A sub-row (or
// a Card) is additionally clipped to its column's visible scroll box: one scrolled
// fully out of view registers no region at all until it scrolls back in.

import {
  DRAG_BOUNDS_ATTR,
  DRAG_CARD_COUNT_ATTR,
  DRAG_PARENT_REGION_ATTR,
  DRAG_REGION_ATTR,
  isCardList,
  parseRegionKey,
  subrowContainerId,
  type CardListRegion,
  type CardRegion,
  type DescendantsRegion,
  type DragRegion,
  type ParsedRegionKey,
  type Rect,
} from './dragRegions';

// Column-shape data: `resolveDragStructure`'s own input shape.
export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string; isTerminal?: number | boolean } }>;
}

// Everything about a region except its *live* geometry
// and card count: which element it is, its kind and parent chain, its
// scrolling ancestor (if any), and — column/sub-row only — the workphase
// facts derived from the column definitions. None of this changes for the
// life of a single drag except across a layer change, when a ghost
// migrating lists can remount the DOM underneath a cached element
// reference, or a Card forced open mounts its section — the reason
// `resolveDragStructure` below runs again after one, and whenever
// `hasDetachedElements`/`hasNewRegionElements` find a change that landed
// later, not only at drag start.
//
// A structure entry is exactly its region minus the live facts, plus the
// DOM handles those are read from (kept under one `dom` key so the facts
// can be split off with a single rest) — `measureRegions` builds a region
// by spreading the entry and adding geometry, never by re-listing each kind's
// fields. A kind added later gets its region for free once it has a resolver.
interface DomHandles {
  element: HTMLElement;
  scrollAncestor: HTMLElement | null;
  /** A Descendants region's bounds element (`DRAG_BOUNDS_ATTR`), if it has one. */
  bounds: HTMLElement | null;
}
type LiveFacts = 'rect' | 'contentRect' | 'boundsRect';
type CardListStructure = { dom: DomHandles } & Omit<CardListRegion, LiveFacts | 'cardCount'>;
type CardStructure = { dom: DomHandles } & Omit<CardRegion, LiveFacts>;
type DescendantsStructure = { dom: DomHandles } & Omit<DescendantsRegion, LiveFacts>;
export type DragStructure = readonly (CardListStructure | CardStructure | DescendantsStructure)[];

// Resolves every `[data-drag-region]` element under `root` into its
// structural facts, joined with the column definitions for the workphase
// ones. Called once per drag (`handleDragStart`) and again after each
// layer change — never per pointer sample; `measureRegions` below is the
// per-sample half.
//
// `isValidCard` decides per Card whether *this* drag can target it at all;
// false skips its `card:` and `descendants:` elements the same way an
// unresolvable column key already does (`cardScopedStructure`). Omitted,
// only the origin's own Card and section resolve, so a test fixture that
// passes neither sees only the card lists.
//
// `originCardId`: the Stub drag's own containing Card, if this drag started
// as one — undefined for a Free Card drag. Its `card:` and `descendants:`
// regions resolve regardless of `isValidCard`: a Stub's drag must be able to
// pop back out to its own Card even when that Card wouldn't be a valid
// *target* for it.
export function resolveDragStructure(
  root: ParentNode,
  columns: readonly DropColumn[],
  isValidCard?: (cardId: string) => boolean,
  originCardId?: string,
): DragStructure {
  const byId = new Map(columns.map(c => [c.id, c]));
  const structure: (CardListStructure | CardStructure | DescendantsStructure)[] = [];
  for (const el of regionElements(root)) {
    const key = el.getAttribute(DRAG_REGION_ATTR);
    const parsed = key ? parseRegionKey(key) : null;
    if (!key || !parsed) continue;
    const scrollAncestor = findVerticalScrollAncestor(el, root);
    const dom = {
      element: el,
      scrollAncestor,
      bounds: parsed.kind === 'descendants' ? boundsElementOf(root, key) : null,
    };
    const record =
      parsed.kind === 'card' || parsed.kind === 'descendants'
        ? cardScopedStructure(
            parsed.kind,
            parsed.id,
            key,
            dom,
            findParentRegionKey(el, root),
            isValidCard,
            originCardId,
          )
        : cardListStructure(parsed, key, dom, byId);
    if (record) structure.push(record);
  }
  return structure;
}

// The live half: a region's rect, content rect, and (column/sub-row only)
// card count — the three facts that can change on every pointer sample
// (the ghost's insertion can change a body's height mid-drag, or move
// which list carries the count at all), read fresh against the
// structure's cached element references. `scope` is the pop machine's
// current `contextKey` — only the region matching it and that region's
// own children (`parentRegionKey === scope`) are worth reading at all,
// since nothing else is reachable from where the drag currently is (Board
// never reads a Card region; a locked column never reads another
// column's). At Board (`scope: null`) that's every column/sub-row,
// none of which ever carry a non-null `parentRegionKey`. A region whose
// element sits inside a vertically scrolling ancestor (a sub-row, inside
// its column's `overflow-y-auto` body — a Card is one too) is clipped to
// that ancestor's own visible box — scrolled fully out of view, it yields
// no region at all.
export function measureRegions(structure: DragStructure, scope: string | null): DragRegion[] {
  const regions: DragRegion[] = [];
  for (const s of structure) {
    if (s.key !== scope && s.parentRegionKey !== scope) continue;
    const { dom, ...facts } = s;
    const contentRect = paintedRect(dom.element);
    // Also the merged-column `boundsRect` source below: this expects a
    // merged column's scroll ancestor, already resolved for clipping, to be
    // the column's own outer body.
    const scrollAncestorRect = dom.scrollAncestor ? paintedRect(dom.scrollAncestor) : null;
    const rect = scrollAncestorRect ? clipToVisible(contentRect, scrollAncestorRect) : contentRect;
    if (!rect) continue;
    if (!isCardList(facts)) {
      const boundsRect = dom.bounds ? paintedRect(dom.bounds) : undefined;
      regions.push({ ...facts, rect, contentRect, ...(boundsRect ? { boundsRect } : {}) });
      continue;
    }
    // A card list's two live facts beyond geometry: its rendered card count
    // and (merged columns only) its outer bound.
    const boundsRect = facts.kind === 'column' ? (scrollAncestorRect ?? contentRect) : undefined;
    regions.push({ ...facts, rect, contentRect, cardCount: cardCountOf(dom.element), boundsRect });
  }
  return regions;
}

// Every element registered as a drag region under `root` — the one query
// `resolveDragStructure` reads and `hasNewRegionElements` compares against.
export function regionElements(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)];
}

// Whether React has remounted any element `structure` cached since it was
// resolved. A detached element measures as an empty box, so `measureRegions`
// would drop its region without a sound; the caller re-resolves instead.
export function hasDetachedElements(structure: DragStructure): boolean {
  return structure.some(
    s =>
      !s.dom.element.isConnected || s.dom.scrollAncestor?.isConnected === false || s.dom.bounds?.isConnected === false,
  );
}

// The element a Descendants region's bounds are read from: the one marked for its key.
function boundsElementOf(root: ParentNode, regionKey: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[${DRAG_BOUNDS_ATTR}="${regionKey}"]`);
}

// The other half of the same staleness check: whether a region element has
// mounted since the structure was resolved. `seen` is every region element
// present at that resolve (`regionElements`), including the ones that
// resolved to nothing (an invalid Card), so those don't read as new on every
// sample. A zoom-in re-resolves *before* React renders the layer it entered,
// so an element that mounts because of that zoom-in lands after it: a
// collapsed Card, forced open, mounts its Descendants section only then.
export function hasNewRegionElements(root: ParentNode, seen: ReadonlySet<Element>): boolean {
  return regionElements(root).some(el => !seen.has(el));
}

// Reads a DOMRect's fields into a plain object — a real DOMRect's fields
// are accessor properties on its prototype, not its own enumerable ones,
// so `{ ...domRect }` silently drops every one of them — a sub-row region
// would resolve with `left`/`right`/`width` missing, and no point could
// ever match it. Every `Rect` downstream of this (clipped, or read by
// `paintedRect`) is a plain object, so nothing else in this module has to
// remember the hazard.
function toRect(domRect: DOMRect): Rect {
  const { top, left, right, bottom, width, height } = domRect;
  return { top, left, right, bottom, width, height };
}

// Clips `rect` vertically to `bounds` (a scrolling ancestor's own visible
// box) — null when nothing of it remains visible. Horizontal is left
// alone: the board scrolls whole columns sideways, never a fraction of one.
export function clipToVisible(rect: Rect, bounds: Rect): Rect | null {
  const top = Math.max(rect.top, bounds.top);
  const bottom = Math.min(rect.bottom, bounds.bottom);
  if (bottom <= top) return null;
  return { top, bottom, left: rect.left, right: rect.right, width: rect.width, height: bottom - top };
}

// The element's painted box, for every region kind. A Card region's rect is read by
// `popSession.ts::containmentRect` (the locked-context "still inside" test) and
// `dragOverlayGeometry.ts::clampToCurrentContext` (the overlay clamp); both want where
// the Card is drawn right now. The sortable shuffle's transform on a Card already reads
// `none` by the frame its region becomes the locked context, so the painted box and the
// layout box agree whenever either reads it. No zoom-in candidate is chosen by a rect
// test (that's `dragCollision.ts::dropAnchorFor`'s named relation), so nothing needs the
// transform backed out.
function paintedRect(el: HTMLElement): Rect {
  return toRect(el.getBoundingClientRect());
}

// A Card region's or a Descendants region's structural identity — the two
// differ only in kind and the name of the Card id's field.
// No `isValidCard`, an id it says is invalid for this drag, or no
// resolvable parent region resolves to nothing at all: an invalid target
// (Cycle-forming, Depth-capped) is never a zoom-in candidate, with no
// separate check (wiki board-drag-interaction §3.2). The one exception is
// the Stub drag's own containing Card (`originCardId`): its Card and its
// section always resolve, since a Stub starts there and must be able to
// pop back out to its own Card even when that Card isn't a valid *target*
// for it.
function cardScopedStructure(
  kind: 'card' | 'descendants',
  cardId: string,
  key: string,
  dom: DomHandles,
  parentRegionKey: string | null,
  isValidCard: ((cardId: string) => boolean) | undefined,
  originCardId: string | undefined,
): CardStructure | DescendantsStructure | null {
  if (!parentRegionKey) return null;
  if (cardId !== originCardId && !isValidCard?.(cardId)) return null;
  return kind === 'card'
    ? { dom, key, kind, attachToCardId: cardId, parentRegionKey }
    : { dom, key, kind, cardId, parentRegionKey };
}

// The card count a column/sub-row's own element carries
// (DRAG_CARD_COUNT_ATTR, set by the React side) — 0 when absent rather than
// NaN, so an element without the attribute (a test fixture) degrades to
// "empty region" instead of poisoning every downstream arithmetic comparison.
function cardCountOf(el: HTMLElement): number {
  const raw = el.getAttribute(DRAG_CARD_COUNT_ATTR);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

// The region that contains this element — for a Card, its column/sub-row;
// for a Descendants section, its Card — walking up the DOM to the nearest
// ancestor that also carries `[data-drag-region]`. An element that names its
// parent (`DRAG_PARENT_REGION_ATTR`: the hierarchy modal, drawn apart from its
// Card) is not walked for. Safe as a simple walk
// (never has to consider a *second* card in between): only a top-level,
// still-Free Card registers a region at all (an already-attached Stub's row
// carries no `[data-drag-region]`), so nothing nests a card region inside
// another one. No parent found (a Card rendered outside any registered
// region, which shouldn't happen) means no region at all — same as an id
// `isValidCard` rejects.
function findParentRegionKey(el: HTMLElement, root: ParentNode): string | null {
  const named = el.getAttribute(DRAG_PARENT_REGION_ATTR);
  if (named) return named;
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const key = node.getAttribute(DRAG_REGION_ATTR);
    if (key) return key;
  }
  return null;
}

// The nearest ancestor that scrolls vertically, bounded to `root` — never
// reaching past it to the document's own scrolling element, whatever a real
// browser's default there happens to compute to. Every column/sub-row
// region sits inside its column body's own `overflow-y-auto`, so this
// always finds that one.
function findVerticalScrollAncestor(el: HTMLElement, root: ParentNode): HTMLElement | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

// A card list's structural identity, from its parsed key — the two kinds
// share everything but the workphase facts, which is exactly what each
// literal below is left spelling.
function cardListStructure(
  parsed: ParsedRegionKey,
  key: string,
  dom: DomHandles,
  columns: Map<string, DropColumn>,
): CardListStructure | null {
  const columnId = parsed.id;
  const column = columns.get(columnId);
  if (!column || column.broken) return null;
  const covered = column.subRows.map(r => r.workphase.id);
  const base = { dom, key, columnId, parentRegionKey: null } as const;
  if (parsed.kind === 'column' && column.displayMode === 'merged') {
    return {
      ...base,
      kind: 'column',
      containerId: column.id,
      coveredWorkphaseIds: covered,
      targetWorkphaseId: column.entryWorkphaseId,
      isTerminal: Boolean(column.subRows[0]?.workphase.isTerminal),
    };
  }
  if (parsed.kind === 'subrow' && covered.includes(parsed.workphaseId)) {
    const { workphaseId } = parsed;
    const row = column.subRows.find(r => r.workphase.id === workphaseId);
    return {
      ...base,
      kind: 'subrow',
      containerId: subrowContainerId(columnId, workphaseId),
      coveredWorkphaseIds: [workphaseId],
      targetWorkphaseId: workphaseId,
      isTerminal: Boolean(row?.workphase.isTerminal),
    };
  }
  return null;
}
