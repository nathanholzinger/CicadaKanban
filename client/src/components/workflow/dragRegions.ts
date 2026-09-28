// Drag regions (Board/Column/sub-row/Card/Descendants) — resolveDragStructure
// (structural, once per drag) + measureRegions (live rects, per sample). The
// pixel drop-band math (§5) is dragBands.ts (Story 6.1 Phase 1, C-4).

// Epic 3.5 Story 3 — the *regions* a Card drag can be in (docs/wiki/board-
// drag-interaction §1, §5): a merged column's body, or one sub-row of an
// expanded column. Each is a context a drag can start in or pop into, and
// the surface the drop bands are measured against. Unsorted, a broken
// column, and an expanded column's outer wrapper register no region — they
// are nowhere, so no drag enters them and a release there writes nothing.
// Pure geometry over rects the board measures from the DOM.
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
// <cardId>`, one layer inside its Card (§1.1). Story 5 resolved only the
// drag's own `originCardId` (decisions 2/3), since it's where a Stub's drag
// starts and wasn't yet a zoom-in target any drag could reach. Story 6
// Phase D opens that: every Valid Card's own section resolves too, gated
// the same way a `card:` region already is. `parentRegionKey` points at
// the Card's own region, so popping out lands there (§8) the same way any
// nested region's does.

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

export type RegionKind = 'column' | 'subrow' | 'card' | 'descendants';

interface RegionCommon {
  /** `column:<id>` / `subrow:<columnId>:<workphaseId>` / `card:<id>` / `descendants:<id>` — also the DOM attribute value. */
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
// per Stub), where a Stub's drag starts and where manual placement lives
// (Story 6, wiki §7). Story 5 registered only the origin's own section
// (decision 3); Story 6 Phase D widens that to every Valid Card with a
// section at all (`resolveDragStructure`'s own `isValidCard` gate, the same
// one a `card:` region already uses) — an invalid target (cycle-forming,
// depth-capped) still resolves nothing, so it's never a zoom-in candidate
// either, no separate check needed (§3.2). Carries no workphase/card-count
// fields, same reasoning as `CardRegion`: the within-action (manual gap +
// depth placement) reads `parentId` off the resolved placement instead of
// this region's own identity.
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
// silently includes every kind added later. Typed by `kind` alone, so a
// structure entry that has no live rects yet (`measureRegions`) can ask it
// too (Story 6.1, C-9).
export function isCardList<T extends Pick<DragRegion, 'kind'>>(
  region: T,
): region is Extract<T, { kind: CardListRegion['kind'] }> {
  return region.kind === 'column' || region.kind === 'subrow';
}

export const DRAG_REGION_ATTR = 'data-drag-region';
// Story 3's carve-out addendum (2026-09-16): set alongside DRAG_REGION_ATTR on the same element, from
// the same `items`/`mergedItems` array the column/sub-row actually renders
// — the one place that count is already known, rather than re-deriving it
// by walking the DOM for card-shaped children.
export const DRAG_CARD_COUNT_ATTR = 'data-drag-card-count';

// The one spelling of "register this element as a drag region," replacing
// three independent `{[DRAG_REGION_ATTR]: key}` literals (Story 6.1 Phase
// 1, C-10 — audit epic-3-5-story-5 #25's registration idiom, ×3: KanbanCard.tsx's
// Card and Descendants regions, BandGuides.tsx's column/sub-row one).
// BandGuides.tsx still spreads DRAG_CARD_COUNT_ATTR alongside this — that
// attribute has only ever had the one site.
export function dragRegionProps(key: string): Record<string, string> {
  return { [DRAG_REGION_ATTR]: key };
}

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

// The one reader of the formats the builders above write — never parse a
// key by hand with `startsWith`/`slice`/`split`. `id` is
// the column's, the Card's, or (a Descendants key) the section's own Card's;
// a sub-row key also names its workphase. Null for anything that isn't a
// region key.
export type ParsedRegionKey =
  { kind: 'column' | 'card' | 'descendants'; id: string } | { kind: 'subrow'; id: string; workphaseId: string };

export function parseRegionKey(key: string): ParsedRegionKey | null {
  const [kind, id, workphaseId, ...rest] = key.split(':');
  if (!id || rest.length > 0) return null;
  if (kind === 'subrow') return workphaseId ? { kind, id, workphaseId } : null;
  if (workphaseId !== undefined) return null;
  return kind === 'column' || kind === 'card' || kind === 'descendants' ? { kind, id } : null;
}

// The Card whose Descendants section `key` names, or null for any other key
// (or none): the "is this context a section, and whose" question the hook
// and the collision code both ask.
export function descendantsCardIdOf(key: string | null): string | null {
  const parsed = key === null ? null : parseRegionKey(key);
  return parsed?.kind === 'descendants' ? parsed.id : null;
}

// Every card-list (column/sub-row) region element, and nothing nested in
// one — a Card and its Descendants section register regions inside a
// column too. Positive, so a region kind added later isn't swept in the way
// the old "anything but `card:`" selector swept in Story 5's sections.
export const CARD_LIST_REGION_SELECTOR = `[${DRAG_REGION_ATTR}^="column:"], [${DRAG_REGION_ATTR}^="subrow:"]`;

// Column-shape data: DropColumn is resolveDragStructure's own input shape,
// and subrowContainerId is the id an expanded column's sub-row resolves its
// region's own `containerId` against (cardListStructure, below) — both
// region-structural, so they live beside the region-key builders.
export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string; isTerminal?: number | boolean } }>;
}

// Encodes a droppable id for an expanded column's per-workphase sub-row —
// the same id cardListStructure (below) sets as that region's own
// `containerId`, so the two only have to agree once.
export function subrowContainerId(columnId: string, workphaseId: string): string {
  return `subrow::${columnId}::${workphaseId}`;
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
// a valid *target* for it), and (Story 6 Phase D) its `descendants:`
// element resolves the same way — plus, now, any *other* Card's own
// section too, gated on `isValidCard` like a `card:` region already is.
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
    const dom = { element: el, scrollAncestor };
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
    const contentRect = layoutRect(dom.element);
    // Also the merged-column `boundsRect` source below (F6) — the same
    // scroll-ancestor element already resolved for clipping is exactly
    // `BoardColumn.tsx`'s own outer body, the one whose height the region
    // used to equal before the Story 3 follow-up narrowed it to content.
    const scrollAncestorRect = dom.scrollAncestor ? layoutRect(dom.scrollAncestor) : null;
    const rect = scrollAncestorRect ? clipToVisible(contentRect, scrollAncestorRect) : contentRect;
    if (!rect) continue;
    if (!isCardList(facts)) {
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

// Every element registered as a drag region under `root` — the one query
// `resolveDragStructure` reads and `hasNewRegionElements` compares against.
export function regionElements(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[${DRAG_REGION_ATTR}]`)];
}

// Whether React has remounted any element `structure` cached since it was
// resolved. A detached element measures as an empty box, so `measureRegions`
// would drop its region without a sound; the caller re-resolves instead.
export function hasDetachedElements(structure: DragStructure): boolean {
  return structure.some(s => !s.dom.element.isConnected || s.dom.scrollAncestor?.isConnected === false);
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
// so `{ ...domRect }` silently drops every one of them (see clipToVisible's
// history below). Every `Rect` downstream of this (clipped, or
// layout-corrected by `layoutRect`) is a plain object, so nothing else in
// this module has to remember the hazard (audit
// epic-3-5-story-3-reconciled #2).
function toRect(domRect: DOMRect): Rect {
  const { top, left, right, bottom, width, height } = domRect;
  return { top, left, right, bottom, width, height };
}

// Clips `rect` vertically to `bounds` (a scrolling ancestor's own visible
// box) — null when nothing of it remains visible. Horizontal is left
// alone: the board scrolls whole columns sideways, never a fraction of one.
// The hazard `toRect` (above) guards at the boundary: this was the
// function that caught it, back when it read `el.getBoundingClientRect()`
// directly and spread it — every sub-row region resolved with
// `left`/`right`/`width` missing, so no point could ever match it.
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
function layoutRect(el: HTMLElement): Rect {
  return toRect(el.getBoundingClientRect());
}

// A Card region's (Story 4) or a Descendants region's (Story 5) structural
// identity — the two differ only in kind and the name of the Card id's
// field.
// No `isValidCard` (a caller that hasn't wired Story 4 up), an id it says is
// invalid for this drag, or no resolvable parent region resolves to nothing
// at all: an invalid target (cycle-forming, depth-capped) is never a zoom-in
// candidate (§3.2), with no separate check. The one exception is the Stub
// drag's own containing Card (`originCardId`, Story 5 decisions 2/3): its
// Card and its section always resolve, since a Stub starts there and must
// be able to pop back out to its own Card even when that Card isn't a valid
// *target* for it. Story 6 Phase D opened every other Valid Card's section.
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
// region (Story 3's carve-out addendum, 2026-09-16) sits inside its column body's own
// `overflow-y-auto`, so this always finds that one.
function findVerticalScrollAncestor(el: HTMLElement, root: ParentNode): HTMLElement | null {
  for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

// A card list's structural identity, from its parsed key — the two kinds
// share everything but the workphase facts, which is exactly what each
// literal below is left spelling (audit epic-3-5-story-4 #8).
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

// Whether `point` lies inside `rect`, inclusive of the edges — the one
// containment test, shared by `childRegionAt` below and `dragCollision.ts`'s
// in-context collision filter (audit epic-3-5-story-3-reconciled #2).
export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// Which of `parentKey`'s own children contains the point — Board's own
// column/sub-row regions when `parentKey` is null (every one of them has
// `parentRegionKey: null`), or a locked Card's own Descendants section when
// `parentKey` is its key (Story 6 Phase D). Reachable only from *this*
// parent — never a foreign column's Card, never two layers in one hop (wiki
// §1.1 rule 2) — because nothing but a true child ever carries a matching
// `parentRegionKey`. Never called with a column/sub-row key any more: a
// locked column/sub-row's own zoom-in candidate is the *named relation*
// instead (Story 6, hands-on finding 3 — `popSession.ts::namedCardCandidate`,
// reading `dropAnchorFor`'s own answer), not a hit test here. Null over a
// column's header/footer, the gaps between columns or sub-rows, the space
// below the last sub-row, a region currently scrolled out of view, or (at
// Board layer) always a Card: a Card is never a Board-layer target in its
// own right (re-plan, 2026-09-16).
//
// A `descendants` region is a candidate here too, as of Story 6 Phase D
// (Story 5 decision 3 had excluded it: `resolveDragStructure` only ever
// resolved the origin's own section, so a locked Card would otherwise have
// found its own section satisfying `parentRegionKey === parentKey` while
// genuinely hovered, with no within-action yet built for it). Now that a
// Card's descendants section is a real zoom-in target (§7), this is exactly
// how a locked Card's own within-action finds it — no separate lookup
// needed, the same function every other layer's zoom-in already used.
export function childRegionAt(
  regions: readonly DragRegion[],
  point: Point,
  parentKey: string | null,
): DragRegion | null {
  return regions.find(r => r.parentRegionKey === parentKey && containsPoint(r.rect, point)) ?? null;
}
