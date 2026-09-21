// Drag regions (Board/Column/sub-row/Card) and their pixel drop bands —
// resolveDragStructure (structural, once per drag) + measureRegions (live rects, per sample).

// Epic 3.5 Story 3 — the *regions* a Card drag can be in (docs/wiki/board-
// drag-interaction §1, §5): a merged column's body, or one sub-row of an
// expanded column. Each is a context a drag can start in or pop into, and
// the surface the drop bands are measured against. Unsorted, a broken
// column, and an expanded column's outer wrapper register no region — they
// are Inert (§4). Pure geometry over rects the board measures from the DOM.
//
// Story 4: a Card is also a region — `card:<id>`, reachable as a zoom-in
// target only from the column/sub-row that contains it (`parentRegionKey`)
// and only while genuinely locked into that parent context — never hit-
// tested unconditionally, and never a Board-layer target in its own right
// (re-plan 2026-09-16; see `childRegionAt` below). `DragRegion` is a
// discriminated union on `kind` (Story 4.1 Phase 0) — a Card region carries
// only what its kind reads (`attachToCardId`, its own payload, never a type
// test), a column/sub-row keeps the rest; every function downstream that
// used to branch on a key prefix or `attachToCardId !== undefined` reads
// `region.kind` instead.
//
// A region is a bounded box (§1, wiki–code reconciliation #20) — hit-tested
// by simple containment, nothing outside it. A column's header/footer, the
// gaps between columns and between sub-rows, and the space below the last
// sub-row are nowhere, the same as the gap between two columns. A sub-row
// (or a Card) is additionally clipped to its column's visible scroll box
// below: one scrolled fully out of view registers no region at all until it
// scrolls back in.
//
// Story 5: a Card's Descendants section is also a region — `descendants:
// <cardId>`, one layer inside its Card (§1.1) — but resolves only for the
// drag's own `originCardId` (decisions 2/3): it's where a Stub's drag
// starts, not yet a zoom-in target any drag can reach (Story 6 opens that).
// `parentRegionKey` points at the Card's own region, so popping out lands
// there (§8) the same way any nested region's does.

export interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type Band = 'top' | 'middle' | 'bottom';

export type RegionKind = 'column' | 'subrow' | 'card' | 'descendants';

interface RegionCommon {
  /** `column:<id>` / `subrow:<columnId>:<workphaseId>` / `card:<id>` — also the DOM attribute value. */
  key: string;
  rect: Rect;
  /**
   * The region element's own bounds, before `clipToVisible` clips them to a
   * scrolling ancestor's visible box. `rect` (above) stays the clipped one,
   * for hit-testing: a band scrolled fully out of view must be neither
   * drawn nor reachable. `contentRect` is what band boundaries are measured
   * against instead, so a band's position is a fact about the region's real
   * content, never about how much of it happens to be scrolled into view.
   */
  contentRect: Rect;
}

// A card-list region — a merged column's list or an expanded column's
// sub-row: a flat list of Free items (Cards), the context for Free items
// (§1). Named for the property every consumer actually tests rather than
// for the column it happens to resemble (audit epic-3-5-story-4 #8): Free
// items are the ones with a workphase and a workflow-scoped position, which
// is why this kind alone has bands, a target workphase, and an anchor+side
// within-action. A Card region holds Stubs (attached — none of that
// applies), and Story 6's Descendants region is a Stub *list*, still not a
// card list. Board is a card list's parent layer unconditionally:
// `parentRegionKey` is always null, never a branch elsewhere has to ask.
export interface CardListRegion extends RegionCommon {
  kind: 'column' | 'subrow';
  /** The dnd-kit droppable id a drop in this region resolves against. */
  containerId: string;
  columnId: string;
  coveredWorkphaseIds: string[];
  /** The workphase a non-member takes on entry — the merged column's entry workphase, or the sub-row's exact one. */
  targetWorkphaseId: string;
  /** A done region: no positioned inserts, every band is a workphase-only move (§5). */
  isTerminal: boolean;
  /**
   * The number of real cards currently rendered in this column/sub-row.
   * Read straight off the DOM (`data-drag-card-count`, set by the React
   * side from the same `items` array it renders) rather than inferred from
   * `contentRect`'s height, since the region's *other* cards aren't
   * fixed-height (only the ghost row is — `cardMetrics.ts`), so a count
   * inferred from total height would still be unreliable. Drives
   * `bandFor`'s single-band collapse (0) and one-card exception (1) — see
   * its own comment.
   */
  cardCount: number;
  parentRegionKey: null;
  /**
   * Merged columns only (Story 4.1 Phase 4, F6) — the column's own outer
   * body element (`BoardColumn.tsx`'s `overflow-y-auto` wrapper), never
   * clipped to visible scroll the way `rect` is. `rect`/`contentRect` stay
   * exact-reservation and content-sized (Phase 1), feeding `bandBoundaries`/
   * `bandFor`/the carve-out render unchanged; `boundsRect` exists only for
   * `popSession.ts`'s locked-context "is the cursor still inside" test and
   * its pop-out distance measure, so a short merged column's own empty
   * space below the last card reads as still-inside instead of nowhere.
   * Undefined for a sub-row (its own `rect` already is its full bound —
   * nothing to add) and always undefined on a `CardRegion`.
   */
  boundsRect?: Rect;
}

// Story 4: a Card region — reachable only as a zoom-in target from the
// column/sub-row that contains it (`parentRegionKey`), never a Board-layer
// target in its own right. Carries only what a Card's within-action reads:
// no workphase fields, no card count — those questions never reach a Card
// region (`placementFor`'s Card branch returns before anything would).
export interface CardRegion extends RegionCommon {
  kind: 'card';
  /** The Card a drop here attaches into — the same id as the key's own suffix. */
  attachToCardId: string;
  /** The column/sub-row that contains this Card — where its own pop-out lands (never Board directly). */
  parentRegionKey: string;
}

// Story 5 — a Card's Descendants region: the section of its attached
// children (every depth beneath it, decision 1 — one per Card, never one
// per Stub), where a Stub's drag starts and where a manual placement will
// eventually live (Story 6, wiki §7). Registered only for the origin's own
// section this story (decision 3) — `resolveDragStructure`'s `originCardId`
// gate below — so it's never a stray zoom-in candidate for an unrelated
// drag. Carries no workphase/card-count fields, same reasoning as
// `CardRegion`: this story's within-action (sibling reorder) never consults
// them, reading `parentId` off the session's own `origin` instead (a Stub's
// siblings, not this region's own identity).
export interface DescendantsRegion extends RegionCommon {
  kind: 'descendants';
  /** The Card whose descendants section this is — same id as the key's own suffix. */
  cardId: string;
  /** Always that Card's own `card:<id>` region — one layer up (§1.1). */
  parentRegionKey: string;
}

export type DragRegion = CardListRegion | CardRegion | DescendantsRegion;

// The one question every "which kind is this" site asks (audit
// epic-3-5-story-4 #8): is this a card list — a flat list of Free items with
// bands, a workphase to write, and an anchor+side reposition — or not?
// Named by the property, so a site that needs a *different* property (a
// sortable container for `over`, say — which Story 6's Descendants region
// will also have) has to say so rather than ride a `kind !== 'card'` that
// silently includes every kind added later.
export function isCardList(region: DragRegion): region is CardListRegion {
  return region.kind === 'column' || region.kind === 'subrow';
}

export const DRAG_REGION_ATTR = 'data-drag-region';
// Story 8 re-plan: set alongside DRAG_REGION_ATTR on the same element, from
// the same `items`/`mergedItems` array the column/sub-row actually renders
// — the one place that count is already known, rather than re-deriving it
// by walking the DOM for card-shaped children.
export const DRAG_CARD_COUNT_ATTR = 'data-drag-card-count';

export function columnRegionKey(columnId: string): string {
  return `column:${columnId}`;
}

export function subrowRegionKey(columnId: string, workphaseId: string): string {
  return `subrow:${columnId}:${workphaseId}`;
}

// Story 4: a Card's own key. Kept alongside the column/sub-row key
// builders above so every region-key format has one owner.
export function cardRegionKey(itemId: string): string {
  return `card:${itemId}`;
}

// Story 5: a Card's Descendants region key — the section a Stub's drag
// starts in (§1, §1.1).
export function descendantsRegionKey(cardId: string): string {
  return `descendants:${cardId}`;
}

// Column-shape data, moved here from boardDndUtils.ts (audit
// epic-3-5-story-4 #4): DropColumn is resolveDragStructure's own input
// shape, and subrowContainerId is the id an expanded column's sub-row
// resolves its region's own `containerId` against
// (cardListStructureFromKey, below) — both region-structural, so they
// belong beside the region-key builders rather than behind an import
// cycle (this file used to import subrowContainerId from boardDndUtils.ts,
// which imported containsPoint/Rect back from here).
export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string; isTerminal?: number | boolean } }>;
}

// Maps every covered workphase id -> the column that covers it.
export function buildColumnForWorkphaseMap<C extends DropColumn>(columns: readonly C[]): Map<string, C> {
  const map = new Map<string, C>();
  for (const col of columns) {
    for (const row of col.subRows) map.set(row.workphase.id, col);
  }
  return map;
}

// Encodes a droppable id for an expanded column's per-workphase sub-row —
// the same id cardListStructureFromKey (below) sets as that region's own
// `containerId`, so the two only have to agree once.
export function subrowContainerId(columnId: string, workphaseId: string): string {
  return `subrow::${columnId}::${workphaseId}`;
}

// Story 4.1 Phase 2 — everything about a region except its *live* geometry
// and card count: which element it is, its kind and parent chain, its
// scrolling ancestor (if any), and — column/sub-row only — the workphase
// facts derived from the column definitions. None of this changes for the
// life of a single drag except across a layer change, when a ghost
// migrating lists can remount the DOM underneath a cached element
// reference — the reason `resolveDragStructure` below runs again right
// after one, not only at drag start (F5's "recomputed per sample" cost was
// this and the geometry below, conflated into one function; this is the
// half that a drag's own duration can share across every sample instead).
//
// A structure entry is exactly its region minus the live facts, plus the
// DOM handles those are read from (kept under one `dom` key so the facts
// can be split off with a single rest) — `measureRegions` builds a region
// by spreading the entry and adding geometry, never by re-listing each
// kind's fields (audit epic-3-5-story-4 #8). A kind added later (Story
// 5/6's `descendants`) gets its region for free once it has a resolver.
interface DomHandles {
  element: HTMLElement;
  scrollAncestor: HTMLElement | null;
}
type LiveFacts = 'rect' | 'contentRect';
type CardListStructure = { dom: DomHandles } & Omit<CardListRegion, LiveFacts | 'cardCount' | 'boundsRect'>;
type CardStructure = { dom: DomHandles } & Omit<CardRegion, LiveFacts>;
type DescendantsStructure = { dom: DomHandles } & Omit<DescendantsRegion, LiveFacts>;
export type DragStructure = readonly (CardListStructure | CardStructure | DescendantsStructure)[];

// Resolves every `[data-drag-region]` element under `root` into its
// structural facts, joined with the column definitions for the workphase
// ones. Called once per drag (`handleDragStart`) and again after each
// layer change — never per pointer sample, unlike the old, single
// `measureDragRegions` this and `measureRegions` below replace (Story 4.1
// Phase 2).
//
// `isValidCard` is Story 4: omitted, no `card:` element resolves at all (so
// a caller that hasn't wired Card regions up yet — or a test fixture —
// sees exactly Story 3's set). Passed, it decides per Card whether *this*
// drag can target it at all; false skips the element the same way an
// unresolvable column key already does — a Card region carries no
// workphase of its own to resolve (§3.2 "invalid targets are never
// poppable" falls out of this for free).
//
// `originCardId` is Story 5, decision 2/3: the Stub drag's own containing
// Card, if this drag started as one — undefined for a Free Card drag. Its
// `card:` region resolves regardless of `isValidCard` (a Stub's drag must
// be able to pop back out to its own Card even when that Card wouldn't be
// a valid *target* for it), and its `descendants:` element is the *only*
// one that resolves at all this story — every other Card's section is not
// yet a zoom-in candidate (Story 6 opens that).
export function resolveDragStructure(
  root: ParentNode,
  columns: readonly DropColumn[],
  isValidCard?: (cardId: string) => boolean,
  originCardId?: string,
): DragStructure {
  const byId = new Map(columns.map(c => [c.id, c]));
  const structure: (CardListStructure | CardStructure | DescendantsStructure)[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)) {
    const key = el.getAttribute(DRAG_REGION_ATTR);
    if (!key) continue;
    const scrollAncestor = findVerticalScrollAncestor(el, root);
    const parentRegionKey =
      key.startsWith('card:') || key.startsWith('descendants:') ? findParentRegionKey(el, root) : null;
    const record = key.startsWith('card:')
      ? cardStructureFromKey(key, el, scrollAncestor, isValidCard, parentRegionKey, originCardId)
      : key.startsWith('descendants:')
        ? descendantsStructureFromKey(key, el, scrollAncestor, parentRegionKey, originCardId)
        : cardListStructureFromKey(key, el, scrollAncestor, byId);
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
// column's — F5). At Board (`scope: null`) that's every column/sub-row,
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
    const contentRect = layoutRect(dom.element, facts.kind === 'card');
    // Also the merged-column `boundsRect` source below (F6) — the same
    // scroll-ancestor element already resolved for clipping is exactly
    // `BoardColumn.tsx`'s own outer body, the one whose height the region
    // used to equal before the Story 3 follow-up narrowed it to content.
    const scrollAncestorRect = dom.scrollAncestor ? layoutRect(dom.scrollAncestor, false) : null;
    const rect = scrollAncestorRect ? clipToVisible(contentRect, scrollAncestorRect) : contentRect;
    if (!rect) continue;
    if (facts.kind === 'card' || facts.kind === 'descendants') {
      regions.push({ ...facts, rect, contentRect });
      continue;
    }
    // A card list's two live facts beyond geometry: its rendered card count
    // and (merged columns only) its outer bound.
    const boundsRect = facts.kind === 'column' ? (scrollAncestorRect ?? contentRect) : undefined;
    regions.push({ ...facts, rect, contentRect, cardCount: cardCountOf(dom.element), boundsRect });
  }
  return regions;
}

// Reads a DOMRect's fields into a plain object — a real DOMRect's fields
// are accessor properties on its prototype, not its own enumerable ones,
// so `{ ...domRect }` silently drops every one of them (see clipToVisible's
// history below). Every `Rect` downstream of this (clipped, or
// layout-corrected by `layoutRect`) is a plain object, so nothing else in
// this module has to remember the hazard (audit
// epic-3-5-story-3-reconciled #2).
function toRect(domRect: DOMRect): Rect {
  const { top, left, right, bottom, width, height } = domRect;
  return { top, left, right, bottom, width, height };
}

// The element's box, in the same coordinate space dnd-kit's own collision
// math uses throughout a drag — not necessarily the *painted* box
// `getBoundingClientRect` reports. A sortable item dnd-kit is currently
// shifting to make room for a neighbor carries a live CSS transform, which
// `getBoundingClientRect` faithfully includes; dnd-kit's own sortable
// strategy does *not* re-measure while animating one (the same mismatch
// `tests/helpers/dragGesture.ts::boxOf` corrects for), so a Card region
// measured naively would disagree with dnd-kit's own idea of where that
// Card collides. Columns and sub-rows never carry this transform (only list
// *items* do), so `isCard` gates the correction rather than applying it
// uniformly (Story 4.1 Phase 0 — `currentTranslate`'s own
// `getComputedStyle` call is skipped entirely for a kind that can never
// need it, not just a no-op once run).
function layoutRect(el: HTMLElement, isCard: boolean): Rect {
  const rect = toRect(el.getBoundingClientRect());
  if (!isCard) return rect;
  const { dx, dy } = currentTranslate(el);
  if (dx === 0 && dy === 0) return rect;
  return { top: rect.top - dy, bottom: rect.bottom - dy, left: rect.left - dx, right: rect.right - dx, ...size(rect) };
}

function size(rect: Rect): Pick<Rect, 'width' | 'height'> {
  return { width: rect.width, height: rect.height };
}

// The translation dnd-kit's sortable strategy has currently applied to
// `el`, read back out of the computed style (`CSS.Transform.toString`'s
// `translate3d` resolves to a matrix/matrix3d) rather than trusted from a
// prop.
function currentTranslate(el: HTMLElement): { dx: number; dy: number } {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === 'none') return { dx: 0, dy: 0 };
  const match = /matrix(3d)?\(([^)]+)\)/.exec(transform);
  if (!match) return { dx: 0, dy: 0 };
  const values = match[2].split(',').map(Number);
  return match[1] ? { dx: values[12], dy: values[13] } : { dx: values[4], dy: values[5] };
}

// Story 4: a Card region's structural identity — enough for
// `childRegionAt`'s lookup and `placementFor`'s attach branch, keyed off
// `attachToCardId` alone; nothing else about a Card region is
// special-cased separately. No `isValidCard` (a caller that hasn't wired
// Story 4 up), an id it says is invalid for this drag, or no resolvable
// parent region resolves to nothing at all — *unless* this is the Stub
// drag's own containing Card (`originCardId`, Story 5 decision 2): that one
// always resolves, since a Stub must be able to pop back out to its own
// Card even when that Card isn't a valid *target* for it.
function cardStructureFromKey(
  key: string,
  el: HTMLElement,
  scrollAncestor: HTMLElement | null,
  isValidCard: ((cardId: string) => boolean) | undefined,
  parentRegionKey: string | null,
  originCardId: string | undefined,
): CardStructure | null {
  if (!parentRegionKey) return null;
  const cardId = key.slice('card:'.length);
  const isOrigin = cardId === originCardId;
  if (!isOrigin && !(isValidCard && isValidCard(cardId))) return null;
  return { dom: { element: el, scrollAncestor }, key, kind: 'card', attachToCardId: cardId, parentRegionKey };
}

// Story 5, decisions 2/3 — a Descendants region's structural identity:
// resolves *only* for the drag's own `originCardId`, regardless of
// `isValidCard` (same reasoning as the Card bypass above — this section is
// where the drag started, not a target being offered). Every other Card's
// section resolves to nothing at all this story, which is what keeps
// `childRegionAt` from a Card context returning one as a zoom-in candidate
// (Story 6 opens that; see `childRegionAt`'s own guard below for the other
// half of decision 3).
function descendantsStructureFromKey(
  key: string,
  el: HTMLElement,
  scrollAncestor: HTMLElement | null,
  parentRegionKey: string | null,
  originCardId: string | undefined,
): DescendantsStructure | null {
  if (!parentRegionKey) return null;
  const cardId = key.slice('descendants:'.length);
  if (cardId !== originCardId) return null;
  return { dom: { element: el, scrollAncestor }, key, kind: 'descendants', cardId, parentRegionKey };
}

// The real card count a column/sub-row's own element carries
// (DRAG_CARD_COUNT_ATTR, set by the React side from the same list it
// renders) — 0 when absent rather than NaN, so an element that predates
// this attribute (a stale test fixture) degrades to "empty region" instead
// of poisoning every downstream arithmetic comparison.
function cardCountOf(el: HTMLElement): number {
  const raw = el.getAttribute(DRAG_CARD_COUNT_ATTR);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

// The column/sub-row region that contains this Card element — walking up
// the DOM to the nearest ancestor that also carries `[data-drag-region]`.
// Safe as a simple walk (never has to consider a *second* card in between):
// only a top-level, still-Free Card registers a region at all (an already-
// attached Stub's row carries no `[data-drag-region]`), so nothing nests a
// card region inside another one. No parent found (a Card rendered outside
// any registered region, which shouldn't happen) means no region at all —
// same as an id `isValidCard` rejects.
function findParentRegionKey(el: HTMLElement, root: ParentNode): string | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const key = node.getAttribute(DRAG_REGION_ATTR);
    if (key) return key;
  }
  return null;
}

// The nearest ancestor that scrolls vertically, bounded to `root` — never
// reaching past it to the document's own scrolling element, whatever a real
// browser's default there happens to compute to. Every column/sub-row
// region (Story 8 re-plan) sits inside its column body's own
// `overflow-y-auto`, so this always finds that one.
function findVerticalScrollAncestor(el: HTMLElement, root: ParentNode): HTMLElement | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

// Clips `rect` vertically to `bounds` (a scrolling ancestor's own visible
// box) — null when nothing of it remains visible. Horizontal is left
// alone: the board scrolls whole columns sideways, never a fraction of one.
// The hazard `toRect` above now guards at the boundary: this was the
// function that caught it, back when it read `el.getBoundingClientRect()`
// directly and spread it — every sub-row region resolved with
// `left`/`right`/`width` missing, so no point could ever match it.
export function clipToVisible(rect: Rect, bounds: Rect): Rect | null {
  const top = Math.max(rect.top, bounds.top);
  const bottom = Math.min(rect.bottom, bounds.bottom);
  if (bottom <= top) return null;
  return { top, bottom, left: rect.left, right: rect.right, width: rect.width, height: bottom - top };
}

// A card list's structural identity, from its key — the two kinds share
// everything but the workphase facts, which is exactly what each literal
// below is left spelling (audit epic-3-5-story-4 #8).
function cardListStructureFromKey(
  key: string,
  el: HTMLElement,
  scrollAncestor: HTMLElement | null,
  columns: Map<string, DropColumn>,
): CardListStructure | null {
  const [kind, columnId, workphaseId] = key.split(':');
  const column = columns.get(columnId);
  if (!column || column.broken) return null;
  const covered = column.subRows.map(r => r.workphase.id);
  const base = { dom: { element: el, scrollAncestor }, key, columnId, parentRegionKey: null } as const;
  if (kind === 'column' && column.displayMode === 'merged') {
    return {
      ...base,
      kind: 'column',
      containerId: column.id,
      coveredWorkphaseIds: covered,
      targetWorkphaseId: column.entryWorkphaseId,
      isTerminal: Boolean(column.subRows[0]?.workphase.isTerminal),
    };
  }
  if (kind === 'subrow' && workphaseId && covered.includes(workphaseId)) {
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

// Whether `point` lies inside `rect`, inclusive of the edges — the one
// containment test, shared by `childRegionAt` below and `boardDndUtils.ts`'s
// in-context collision filter (audit epic-3-5-story-3-reconciled #2).
export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// Which of `parentKey`'s own children contains the point — Board's own
// column/sub-row regions when `parentKey` is null (every one of them has
// `parentRegionKey: null`), or a locked column/sub-row's own Cards when
// `parentKey` is its key (replaces the old `nonCardRegionAt`/`cardRegionAt`
// pair — Story 4.1 Phase 0). Reachable only from *this* parent — never a
// foreign column's Card, never two layers in one hop (wiki §1.1 rule 2) —
// because nothing but a true child ever carries a matching
// `parentRegionKey`. Null over a column's header/footer, the gaps between
// columns or sub-rows, the space below the last sub-row, a region currently
// scrolled out of view, or (at Board layer) always a Card: a Card is never
// a Board-layer target in its own right (re-plan, 2026-09-16) — the layer
// rule is one context change at a time, and no column/sub-row ever carries
// a non-null `parentRegionKey` for this to match against.
//
// A `descendants` region never comes back either, even from its own Card's
// context (Story 5 decision 3, 2026-09-21): `resolveDragStructure` only
// ever resolves one — the origin's own section — so this exclusion only
// bites for that single case, where the Card is also the section's own
// root and its section would otherwise satisfy `parentRegionKey ===
// parentKey` while genuinely hovered. Zooming a locked Card *into* its
// descendants section is Story 6's; until then a Card's within-action is
// only ever the auto-drop (§6), never a further zoom-in.
export function childRegionAt(
  regions: readonly DragRegion[],
  point: Point,
  parentKey: string | null,
): DragRegion | null {
  return (
    regions.find(r => r.kind !== 'descendants' && r.parentRegionKey === parentKey && containsPoint(r.rect, point)) ??
    null
  );
}

function verticalDistance(y: number, rect: Rect): number {
  if (y < rect.top) return rect.top - y;
  if (y > rect.bottom) return y - rect.bottom;
  return 0;
}

// The two numbers the reservation math is built from — a fixed fact about
// the shortCard component (`cardMetrics.ts::SHORT_CARD_HEIGHT_PX`) and the
// card lists' own gap (`cardMetrics.ts::CARD_LIST_GAP_PX`), never a tuning
// bag: Story 4.1 Phase 1 made both fixed, so there's nothing left here to
// find by feel. Passed in rather than imported so this pure module still
// depends on nothing under `components/` — the caller (`popSession.ts`,
// itself handed the values by `useBoardDnd.ts`) is what points drag → card.
export interface ShortCardMetrics {
  heightPx: number;
  gapPx: number;
}
export type BandRegion = Pick<CardListRegion, 'contentRect' | 'isTerminal' | 'cardCount'>;

// What §5's reservation looks like for a card list, everything short of
// actual pixels-on-a-rect: the shape (which of the three cases below), the
// label box's own height, and where a divider sits (positional only — the
// same number `bandBoundaries` turns into an absolute boundary). Used to be
// spelled independently here and in `BandGuides.tsx::DragCarveFrame`,
// agreeing only by comment (audit epic-3-5-story-4 #9) — this is the one
// place the formula lives now; both read `.shape`/`.zoneHeight`/`.edge`
// rather than recomputing any of it.
export interface Reservation {
  /**
   * 'positional': real cards, positions apply — two zones, a real divider.
   * 'terminal': a done region with cards — one bottom-only zone, sized for
   * the ghost that always previews last there. 'empty' / 'none': nothing
   * else here — one zone spanning the whole region, only the label
   * distinguishing a still-positional empty region from a done one with
   * nothing in it yet (both render identically today).
   */
  shape: 'positional' | 'empty' | 'terminal' | 'none';
  /** The label box's own height. */
  zoneHeight: number;
  /** Where the divider sits (and the band boundary resolves against) — positional only; 0 otherwise (nothing to divide). */
  edge: number;
}

// Story 4.1 Phase 1 (Product Owner special rule, 2026-09-16) — a genuinely
// empty region carves the full card height (`heightPx`), nothing to shift
// out of the way; a region with exactly one card halves both edges instead
// of the normal full height, so the card stays a real, unlabeled middle
// band rather than being bisected into top/bottom with nothing left
// between; a done region with cards reserves one bottom-only zone of
// `heightPx + gapPx`, exactly where its ghost (which always previews last
// there) lands.
export function reservationFor(
  region: Pick<CardListRegion, 'isTerminal' | 'cardCount'>,
  metrics: ShortCardMetrics,
): Reservation {
  const { heightPx, gapPx } = metrics;
  if (region.cardCount === 0) return { shape: region.isTerminal ? 'none' : 'empty', zoneHeight: heightPx, edge: 0 };
  if (region.isTerminal) return { shape: 'terminal', zoneHeight: heightPx + gapPx, edge: 0 };
  const edge = region.cardCount === 1 ? (heightPx + gapPx) / 2 : heightPx;
  return { shape: 'positional', zoneHeight: (heightPx + gapPx) / 2, edge };
}

// Story 4.1 Phase 1 — where the two band boundaries sit, in viewport
// pixels, measured from `contentRect` (never the visible-clipped `rect`: a
// boundary scrolled out of view stays exactly where its content put it,
// reachable only by scrolling to it — wiki §5). Null collapses to a single
// band spanning the whole region: a done region (positions never apply,
// wiki §5 closing note) or a genuinely empty one (nothing to be
// before/after) — `reservationFor`'s non-'positional' shapes.
export function bandBoundaries(region: BandRegion, metrics: ShortCardMetrics): { top: number; bottom: number } | null {
  const reservation = reservationFor(region, metrics);
  if (reservation.shape !== 'positional') return null;
  return { top: region.contentRect.top + reservation.edge, bottom: region.contentRect.bottom - reservation.edge };
}

// The vertical band a point falls in (§5): above `top` is the top band,
// below `bottom` is the bottom band, the middle otherwise (or the whole
// region, collapsed). A point outside the rect clamps to the nearer edge's
// band, same as before — the boundaries are absolute pixels now, not
// fractions, so no clamping arithmetic is needed to get that for free.
export function bandFor(y: number, region: BandRegion, metrics: ShortCardMetrics): Band {
  const boundaries = bandBoundaries(region, metrics);
  if (!boundaries) return 'middle';
  if (y < boundaries.top) return 'top';
  if (y > boundaries.bottom) return 'bottom';
  return 'middle';
}

// How far a point sits outside a rect (0 inside) — the optional distance
// term of the pop threshold (§3.1).
export function distanceOutside(point: Point, rect: Rect): number {
  const dx = point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0;
  const dy = verticalDistance(point.y, rect);
  return Math.hypot(dx, dy);
}
