// The drag's region vocabulary: the boxes a drag can be in — a merged column's body,
// one sub-row of an expanded column, a Card, or a Card's Descendants section — their
// kinds and parent chain, the one spelling of each region's DOM key and attributes
// (the key builders, `parseRegionKey`, `dragRegionProps`, `CARD_LIST_REGION_SELECTOR`),
// and hit-testing by containment (`containsPoint`, `childRegionAt`). Pure: it reads no
// DOM. `dragStructure.ts` resolves these regions from the live board. The drop-band
// math is `dragBands.ts`'s.
//
// A region is a bounded box, hit-tested by simple containment, nothing outside it
// (wiki board-drag-interaction §1).
//
// Each region names its parent layer in `parentRegionKey`: null for a
// column/sub-row, the containing column/sub-row for a Card, and the Card for
// its Descendants section. Popping out lands there, and a zoom-in reaches
// only a region whose parent is the current context (`childRegionAt`).
// `DragRegion` is a discriminated union on `kind`: each kind carries only
// what its kind reads, and every function downstream reads `region.kind`,
// never a key prefix.

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
   * The region element's own bounds, before `dragStructure.ts::clipToVisible`
   * clips them to a scrolling ancestor's visible box. `rect` (above) stays the clipped one,
   * for hit-testing: a band scrolled fully out of view must be neither
   * drawn nor reachable. `contentRect` is what band boundaries are measured
   * against instead, so a band's position is a fact about the region's real
   * content, never about how much of it happens to be scrolled into view.
   */
  contentRect: Rect;
}

// A card-list region — a merged column's list or an expanded column's
// sub-row: a flat list of Free items (Cards), the context for Free items.
// Named for the property every consumer actually tests rather than for the
// column it happens to resemble: Free items are the ones with a workphase
// and a workflow-scoped position, which is why this kind alone has bands, a
// target workphase, and an anchor+side within-action. A Card region holds
// Stubs (attached — none of that applies), and a Descendants region is a
// Stub *list*, still not a card list. Board is a card list's parent layer
// unconditionally: `parentRegionKey` is always null, never a branch
// elsewhere has to ask.
export interface CardListRegion extends RegionCommon {
  kind: 'column' | 'subrow';
  /** The dnd-kit droppable id a drop in this region resolves against. */
  containerId: string;
  columnId: string;
  coveredWorkphaseIds: string[];
  /**
   * The workphase a non-member takes on entry — the merged column's entry
   * workphase, or the sub-row's exact one (wiki board-drag-interaction §5).
   */
  targetWorkphaseId: string;
  /** A done region: no positioned inserts, every band is a workphase-only move. */
  isTerminal: boolean;
  /**
   * The number of *other* cards in this column/sub-row: its rendered rows
   * without the carried item's own row, which is what the reservation needs
   * (`dragBands.ts::reservationFor`). Read straight off the DOM
   * (`data-drag-card-count`, set by the React side from the same `items`
   * array it renders) rather than inferred from `contentRect`'s height, since
   * the region's own cards aren't fixed-height (only the ghost row is —
   * `cardMetrics.ts`), so a count inferred from total height would be
   * unreliable.
   */
  cardCount: number;
  parentRegionKey: null;
  /**
   * Merged columns only — the column's own outer body element (its
   * scrolling body), never clipped to visible scroll the way `rect` is.
   * `rect`/`contentRect` stay content-sized, feeding `bandBoundaries`/
   * `bandFor`/the carve-out render; `boundsRect` is read by
   * `popSession.ts::containmentRect`, for the locked-context "is the cursor
   * still inside" test and the pop-out distance, so a short merged column's
   * own empty space below the last card reads as still-inside instead of
   * nowhere. Undefined for a sub-row (its own `rect` already is its full
   * bound — nothing to add).
   */
  boundsRect?: Rect;
}

// A Card region — reachable only as a zoom-in target from the column/sub-row
// that contains it (`parentRegionKey`), never a Board-layer target in its
// own right. Carries only what a Card's within-action reads: no workphase
// fields, no card count, since the auto-drop reads neither.
export interface CardRegion extends RegionCommon {
  kind: 'card';
  /** The Card a drop here attaches into — the same id as the key's own suffix. */
  attachToCardId: string;
  /** The column/sub-row that contains this Card — where its own pop-out lands (never Board directly). */
  parentRegionKey: string;
}

// A Card's Descendants region: the section of its attached descendants down
// to its last shown level — one per Card, never one per Stub — where a Stub's drag
// starts and where manual gap + depth placement happens. Carries no
// workphase/card-count fields, same reasoning as `CardRegion`: the
// within-action reads `parentId` off the resolved placement instead of this
// region's own identity.
export interface DescendantsRegion extends RegionCommon {
  kind: 'descendants';
  /** The Card whose descendants section this is — same id as the key's own suffix. */
  cardId: string;
  /** Always that Card's own `card:<id>` region — one layer up. */
  parentRegionKey: string;
}

export type DragRegion = CardListRegion | CardRegion | DescendantsRegion;

// The one question every "which kind is this" site asks: is this a card
// list — a flat list of Free items with bands, a workphase to write, and an
// anchor+side reposition — or not? Named by the property, so a site that
// needs a *different* property (a sortable container for `over`, say —
// which a Descendants region also has) has to say so rather than ride a
// `kind !== 'card'` that silently includes every kind added later. Typed by
// `kind` alone, so a structure entry that has no live rects yet
// (`dragStructure.ts::measureRegions`) can ask it too.
export function isCardList<T extends Pick<DragRegion, 'kind'>>(
  region: T,
): region is Extract<T, { kind: CardListRegion['kind'] }> {
  return region.kind === 'column' || region.kind === 'subrow';
}

export const DRAG_REGION_ATTR = 'data-drag-region';
// Set alongside DRAG_REGION_ATTR on the same element, from the same
// `items`/`mergedItems` array the column/sub-row actually renders — the one
// place the rendered rows are already known, rather than re-deriving a count by
// walking the DOM for card-shaped children. The value is the count of *other*
// cards (`CardListRegion.cardCount`).
export const DRAG_CARD_COUNT_ATTR = 'data-drag-card-count';
// The DragOverlay's carried copy, on a Card and on the sidebar's project ghost
// alike. The E2E helper's "drag finished" wait counts it down to 0, since the
// copy outlives the drag by dnd-kit's drop animation: spelled here once, so a
// rename on one surface can't leave the wait passing at once.
export const DRAG_OVERLAY_ATTR = 'data-drag-overlay';

// Set beside DRAG_REGION_ATTR on a region element that isn't nested in its
// parent region's element: the parent's key. A Descendants section sits inside
// its Card, so the walk up the DOM finds the parent, and the hierarchy modal
// is drawn apart from its Card, so it names it.
export const DRAG_PARENT_REGION_ATTR = 'data-drag-parent-region';

// The one spelling of "register this element as a drag region." It leaves
// out DRAG_CARD_COUNT_ATTR, which only a card list's element carries, set
// alongside this. `parentKey` only for an element outside its parent
// region's own (`DRAG_PARENT_REGION_ATTR`).
export function dragRegionProps(key: string, parentKey?: string): Record<string, string> {
  return parentKey === undefined
    ? { [DRAG_REGION_ATTR]: key }
    : { [DRAG_REGION_ATTR]: key, [DRAG_PARENT_REGION_ATTR]: parentKey };
}

export function columnRegionKey(columnId: string): string {
  return `column:${columnId}`;
}

export function subrowRegionKey(columnId: string, workphaseId: string): string {
  return `subrow:${columnId}:${workphaseId}`;
}

// A Card's own key. Kept alongside the column/sub-row key builders above so
// every region-key format has one owner.
export function cardRegionKey(itemId: string): string {
  return `card:${itemId}`;
}

// A Card's Descendants region key — the section a Stub's drag starts in.
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
// (or none): the "is this context a section, and whose" question that
// `dragCollision.ts::travelingRowsFor` and
// `descendantsProjection.ts::advanceProjection` both ask.
export function descendantsCardIdOf(key: string | null): string | null {
  const parsed = key === null ? null : parseRegionKey(key);
  return parsed?.kind === 'descendants' ? parsed.id : null;
}

// Every card-list (column/sub-row) region element, and nothing nested in
// one — a Card and its Descendants section register regions inside a
// column too. Positive, so a region kind added later isn't swept in, the
// way an "anything but `card:`" selector sweeps in Descendants sections.
export const CARD_LIST_REGION_SELECTOR = `[${DRAG_REGION_ATTR}^="column:"], [${DRAG_REGION_ATTR}^="subrow:"]`;

// Encodes a droppable id for an expanded column's per-workphase sub-row. Also
// the `containerId` `dragStructure.ts::resolveDragStructure` gives that
// sub-row's region, and what `BoardColumn.tsx::ExpandedSubRow` registers its
// droppable under, so the sites only have to agree once.
export function subrowContainerId(columnId: string, workphaseId: string): string {
  return `subrow::${columnId}::${workphaseId}`;
}

// Whether `point` lies inside `rect`, inclusive of the edges — the one
// containment test, used by `childRegionAt` below. Also read by
// `popSession.ts` and `dragCollision.ts`.
export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// Which of `parentKey`'s own children contains the point — Board's own
// column/sub-row regions when `parentKey` is null (every one of them has
// `parentRegionKey: null`), or a locked Card's own Descendants section when
// `parentKey` is its key. Reachable only from *this* parent — never a
// foreign column's Card, never two layers in one hop
// (wiki board-drag-interaction §1.1, rule 2) — because nothing but a true
// child ever carries a matching `parentRegionKey`. Never called with a
// column/sub-row key: a locked column/sub-row's own zoom-in candidate is the
// *named relation* instead (`popSession.ts::namedCardCandidate`), not a hit
// test here. Null over a column's header/footer, the gaps between columns or
// sub-rows, the space below the last sub-row, a region currently scrolled
// out of view, or (at Board layer) always a Card: a Card is never a
// Board-layer target in its own right.
export function childRegionAt(
  regions: readonly DragRegion[],
  point: Point,
  parentKey: string | null,
): DragRegion | null {
  return regions.find(r => r.parentRegionKey === parentKey && containsPoint(r.rect, point)) ?? null;
}
