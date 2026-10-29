// The drag's region vocabulary: the boxes a drag can be in — a merged column's body,
// one sub-row of an expanded column, or a Card's Descendants layer — their
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
// column/sub-row, and the containing column/sub-row for a Card's Descendants
// layer. Popping out lands there, and Board's hit test reaches only a region whose
// parent is Board (`childRegionAt`).
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

export type RegionKind = 'column' | 'subrow' | 'descendants';

interface RegionCommon {
  /** `column:<id>` / `subrow:<columnId>:<workphaseId>` / `descendants:<id>` — also the DOM attribute value. */
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
  /**
   * The box the locked-context "is the cursor still inside" test and the pop-out distance
   * measure against, when that is more than `rect` (`popSession.ts::containmentRect`). A merged
   * column's is its own outer body, never clipped to visible scroll, so a short column's empty
   * space below its last card reads as still inside instead of nowhere. The hierarchy modal's
   * Descendants region is its list, and its bounds the whole dialog: the header above the list
   * is not a region of its own, but a cursor over it is still in the modal. Undefined for a
   * sub-row (its own `rect` already is its full bound) and a Card's own box.
   */
  boundsRect?: Rect;
}

// A card-list region — a merged column's list or an expanded column's
// sub-row: a flat list of Free items (Cards), the context for Free items.
// Named for the property every consumer actually tests rather than for the
// column it happens to resemble: Free items are the ones with a workphase
// and a workflow-scoped position, which is why this kind alone has bands, a
// target workphase, and an anchor+side within-action. A Descendants region
// holds Stubs (attached — none of that applies): a Stub *list*, not a card
// list. Board is a card list's parent layer unconditionally:
// `parentRegionKey` is always null, never a branch elsewhere has to ask.
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
}

// A Card's Descendants region: the Card's whole box on the board, or the hierarchy
// modal's list while the modal holds the layer. One per Card, never one per Stub, and
// every Card has one, a childless Card included. Reachable only as a zoom-in target
// from the column/sub-row that contains the Card (`parentRegionKey`), never a
// Board-layer target in its own right. It is where a Stub's drag starts and where manual
// gap + depth placement happens. Carries no workphase/card-count fields: the
// within-action reads `parentId` off the resolved placement instead of this
// region's own identity.
export interface DescendantsRegion extends RegionCommon {
  kind: 'descendants';
  /** The Card whose descendants layer this is — same id as the key's own suffix. */
  cardId: string;
  /** The column/sub-row that contains this Card — where its own pop-out lands (never Board directly). */
  parentRegionKey: string;
}

export type DragRegion = CardListRegion | DescendantsRegion;

// Whether a Descendants region is the hierarchy modal's list, drawn apart from its Card, rather
// than the Card's own box: only the modal's carries a bounds element (`boundsRect`).
export function isModalList(region: DragRegion): boolean {
  return region.kind === 'descendants' && region.boundsRect !== undefined;
}

// The one question every "which kind is this" site asks: is this a card
// list — a flat list of Free items with bands, a workphase to write, and an
// anchor+side reposition — or not? Named by the property, so a site that
// needs a *different* property (a sortable container for `over`, say —
// which a Descendants region also has) has to say so rather than ride a
// `kind !== 'descendants'` that silently includes every kind added later. Typed by
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

// A Card's root element, with the Card's id: set on every Card the board draws (never on
// the DragOverlay's copy), whether or not the Card's root is the region. Where the
// hierarchy modal's list finds its Card, the modal being drawn apart from it.
export const DRAG_CARD_ATTR = 'data-drag-card';
// Set beside DRAG_REGION_ATTR on a region element that isn't nested in its Card: the
// Card's id. A Card's root is its own region, so the walk up the DOM finds the column
// it sits in, and the hierarchy modal is drawn apart from its Card, so it names it
// (`dragStructure.ts` finds that Card by DRAG_CARD_ATTR and walks up from there).
export const DRAG_PARENT_CARD_ATTR = 'data-drag-parent-card';
// Set on the element whose box is a Descendants region's `boundsRect`, with that region's key as
// its value: the hierarchy modal's dialog, which holds the list that is the region.
export const DRAG_BOUNDS_ATTR = 'data-drag-bounds';

// The one spelling of "register this element as a drag region." It leaves
// out DRAG_CARD_COUNT_ATTR, which only a card list's element carries, set
// alongside this. `parentCardId` only for an element outside its Card's own
// (`DRAG_PARENT_CARD_ATTR`).
export function dragRegionProps(key: string, parentCardId?: string): Record<string, string> {
  return parentCardId === undefined
    ? { [DRAG_REGION_ATTR]: key }
    : { [DRAG_REGION_ATTR]: key, [DRAG_PARENT_CARD_ATTR]: parentCardId };
}

export function columnRegionKey(columnId: string): string {
  return `column:${columnId}`;
}

export function subrowRegionKey(columnId: string, workphaseId: string): string {
  return `subrow:${columnId}:${workphaseId}`;
}

// A Card's Descendants region key — the layer a Stub's drag starts in.
export function descendantsRegionKey(cardId: string): string {
  return `descendants:${cardId}`;
}

// The one reader of the formats the builders above write — never parse a
// key by hand with `startsWith`/`slice`/`split`. `id` is
// the column's, or (a Descendants key) the layer's own Card's;
// a sub-row key also names its workphase. Null for anything that isn't a
// region key.
export type ParsedRegionKey =
  { kind: 'column' | 'descendants'; id: string } | { kind: 'subrow'; id: string; workphaseId: string };

export function parseRegionKey(key: string): ParsedRegionKey | null {
  const [kind, id, workphaseId, ...rest] = key.split(':');
  if (!id || rest.length > 0) return null;
  if (kind === 'subrow') return workphaseId ? { kind, id, workphaseId } : null;
  if (workphaseId !== undefined) return null;
  return kind === 'column' || kind === 'descendants' ? { kind, id } : null;
}

// The Card whose Descendants layer `key` names, or null for any other key
// (or none): the "is this context a section, and whose" question the drag layer asks
// wherever it branches on it, such as `dragCollision.ts::travelingRowsFor` and
// `descendantsProjection.ts::advanceProjection`.
export function descendantsCardIdOf(key: string | null): string | null {
  const parsed = key === null ? null : parseRegionKey(key);
  return parsed?.kind === 'descendants' ? parsed.id : null;
}

// Every card-list (column/sub-row) region element, and nothing nested in
// one — a Card's Descendants region sits inside a column too. Positive, so a
// region kind added later isn't swept in, the way an "anything but
// `descendants:`" selector would sweep in the Cards.
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

// Which of `parentKey`'s own children contains the point. Called with a null
// `parentKey` only: Board's own column/sub-row regions (every one of them has
// `parentRegionKey: null`), at the Board layer and at a Free Card's pickup
// (`useBoardDnd.ts::beginDragAt`). Reachable only from *this* parent — never a
// Card's Descendants layer, which only a locked column/sub-row's *named
// relation* zooms into (`popSession.ts::namedCardCandidate`), not a hit test
// here — because nothing but a true child ever carries a matching
// `parentRegionKey`. Null over a column's header/footer, the gaps between
// columns or sub-rows, the space below the last sub-row, or a region currently
// scrolled out of view.
export function childRegionAt(
  regions: readonly DragRegion[],
  point: Point,
  parentKey: string | null,
): DragRegion | null {
  return regions.find(r => r.parentRegionKey === parentKey && containsPoint(r.rect, point)) ?? null;
}
