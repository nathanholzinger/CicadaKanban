// Row-data typing, collision detection, and anchor naming for the board drag
// gesture: itemRowData/columnData and their readers (isItemData/isColumnData/
// isCardRow/isStubRow), resolveBoardCollisions, and dropAnchorFor/
// namedAnchorFor (the anchor + lean). The request-shape half
// (toRequest/isIdentity/sendItemMove) is dragRequest.ts.

import { closestCorners, type Active, type CollisionDetection, type Over } from '@dnd-kit/core';
import { arrayMove, hasSortableData } from '@dnd-kit/sortable';
import type { AnchorRelation, DropSide } from '../../lib/hierarchyPlacement';
import { containsPoint, descendantsCardIdOf, type Rect } from './dragRegions';
import type { DragClassification } from './dragClassification';
import type { PopSession } from './popSession';
import { SHORT_CARD_HEIGHT_PX, STUB_ROW_HEIGHT_PX } from '../cardMetrics';

// Every item row's dnd-kit registration, typed so its invariant — every
// item row registers `type: 'item'`, never a type that differs between a
// Stub's row and a popped-out Card row for the same id — holds by
// construction, not by convention alone: an untyped literal lets
// `role: 'stubs'` compile without complaint. `itemRowData`/`columnData` are
// the one write path; `isItemData`/`isColumnData`/`isCardRow`/`isStubRow`
// the one read path, so no caller re-types the literal.
export type ItemRowRole = 'card' | 'stub';
export type ItemRowData = { type: 'item'; role: ItemRowRole; parentId?: string | null };
export type DragRowData = ItemRowData | { type: 'column' };

export function itemRowData(role: ItemRowRole, parentId?: string | null): DragRowData {
  return parentId !== undefined ? { type: 'item', role, parentId } : { type: 'item', role };
}

export function columnData(): DragRowData {
  return { type: 'column' };
}

// Which kind of drag a dnd-kit `data` belongs to: an item row (Card or
// Stub alike) or a column.
export function isItemData(data: Record<string, unknown> | undefined): data is ItemRowData {
  return data?.type === 'item';
}

export function isColumnData(data: Record<string, unknown> | undefined): data is { type: 'column' } {
  return data?.type === 'column';
}

export function isCardRow(data: Record<string, unknown> | undefined): data is ItemRowData & { role: 'card' } {
  return isItemData(data) && data.role === 'card';
}

export function isStubRow(data: Record<string, unknown> | undefined): data is ItemRowData & { role: 'stub' } {
  return isItemData(data) && data.role === 'stub';
}

// Pure drop-resolution for the board's drag-and-drop, kept out of
// useBoardDnd so it can be unit tested. Structural subset types keep the
// functions testable without full Column/Item fixtures.

// What the collision closure needs to know about the live pop session — a
// read-only view the hook keeps in a ref.
export interface CollisionSession {
  /** Board layer, hovering a column/sub-row: that region's droppable container. Never set for a Card hover: a mere hover never drives `over`. */
  hoverContainerId: string | null;
  /** The context region — in-context candidates are its container and the cards inside it. Null when the drag began outside any region (Unsorted), or while genuinely popped out (Board layer). */
  context: { containerId: string; rect: Rect } | null;
  /**
   * Locked at a Descendants context, that region's own measured rect —
   * candidates are every Stub row (any depth) whose center falls inside it,
   * the same rect-containment test the column branch below uses for its own
   * in-context candidates. The section renders as one flat list, so "is this
   * row inside the section" is the whole scope: any row of the section, at
   * any depth, can be the ghost's neighbor. Null at every other context.
   */
  descendantsSectionRect: Rect | null;
}

// `over` is what drives dnd-kit's sortable shifting and the side indicator,
// so it has to agree with the pop machine — a mere hover never drives it
// (wiki board-drag-interaction §1.1, rule 1) — which is why this is a
// factory over the live session rather than a constant:
//
//   - Card or Stub drag, locked (a column/sub-row, a Card, or a Descendants
//     section): closestCorners over the context's container and the cards
//     (or, at a Descendants context, the section's rows) whose rect lies
//     inside it — the in-context reorder. A Card context's within-action is
//     the auto-drop, which reads no `over`, but restricting candidates here
//     still keeps dnd-kit from shifting a sibling against a hover the locked
//     layer ignores.
//   - Card or Stub drag, Board layer (popped out), hovering a region:
//     `over` is that region's container and never a card in it, so the
//     target column's sortable doesn't shift against a hover the band
//     alone resolves; the ghost's index comes from the placement instead.
//   - Card or Stub drag with no context and no hover (picked up in
//     Unsorted, nothing hovered yet): nothing.
//
// Every item row registers `data: {type: 'item', role: 'card' | 'stub',
// parentId?}`, never a type that differs between a Stub's own row and a
// popped-out Card row for the *same* id — the one hazard this collision
// closure exists to sidestep is `active.data.current` lagging a mid-drag
// remount (a Stub's row unmounting from its Descendants section, a Card row
// mounting in its place), so nothing below reads
// `activeData.role`/`activeData.parentId` for a policy decision; every
// "which kind of drag, which scope" question is answered from the pop
// session's own state (`liveSession`), never dnd-kit's. Only `activeData.type`
// (`'item'` vs `'column'`, which never changes for either row) gates
// whether the machine applies at all. `data?.role === 'stub'` on a
// *droppable* row is safe to read here — that row isn't the one being
// dragged, so it isn't the one at risk of a stale reference.
export function resolveBoardCollisions(
  args: Parameters<CollisionDetection>[0],
  liveSession: CollisionSession | null,
): ReturnType<CollisionDetection> {
  const session = isItemData(args.active.data.current) ? liveSession : null;

  if (session?.hoverContainerId) {
    const container = args.droppableContainers.find(c => c.id === session.hoverContainerId);
    return container ? [{ id: container.id, data: { droppableContainer: container, value: 0 } }] : [];
  }

  if (session?.descendantsSectionRect) {
    const sectionRect = session.descendantsSectionRect;
    // The dragged Stub's own row is a candidate too, as at a column.
    // Excluded, `over` would never be its own slot, so the gap would jump to
    // a neighbor's even when holding still, and a tab right would make the
    // item the *next* row's child instead of the previous one's.
    //
    // `sectionRect` is painted space (`dragRegions.ts::layoutRect`), while
    // dnd-kit measures `droppableRects` without transforms. Mixing them is
    // safe: the two differ only while the Card carries a sortable transform,
    // which at the default clocks can't overlap a Descendants lock.
    const droppableContainers = args.droppableContainers.filter(container => {
      if (!isStubRow(container.data.current)) return false;
      const rect = args.droppableRects.get(container.id);
      return rect !== undefined && rectCenterInside(rect, sectionRect);
    });
    return closestCorners({ ...args, droppableContainers });
  }

  const droppableContainers = args.droppableContainers.filter(container => {
    const data = container.data.current;
    if (isStubRow(data)) return false; // never a valid target for a Card-layer or Board drop
    // In a locked column/sub-row the dragged card's own row *is* a
    // candidate, as in stock dnd-kit sortable: over its own slot, `over` is
    // itself and nothing shuffles (the lean still names a neighbor,
    // `dropAnchorFor`). Excluded, the ghost would jump to a neighbor's slot,
    // even at pickup. A column drag still never collides with itself.
    if (!session) return container.id !== args.active.id; // column drag, or no machine in play
    if (!session.context) return false;
    if (container.id === session.context.containerId) return true;
    const rect = args.droppableRects.get(container.id);
    return isCardRow(data) && rect !== undefined && rectCenterInside(rect, session.context.rect);
  });
  return closestCorners({ ...args, droppableContainers });
}

function rectCenterInside(rect: Rect, bounds: Rect): boolean {
  return containsPoint(bounds, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
}

// Narrowed structural subset of dnd-kit's ClientRect — only what
// resolveDropSide needs, so callers can pass either a real ClientRect or a
// plain fixture without importing dnd-kit's type.
export interface VerticalRect {
  top: number;
  height: number;
}

// `over.rect` and `active.rect.current.translated` are measured via two
// independent tracking paths (a droppable's periodic getBoundingClientRect
// snapshot vs. initial rect + accumulated pointer delta) — expected to
// agree closely but not always bit-identically, especially under a real
// mouse-driven drag. A 1px tie band keeps an exact/near-exact center drop
// resolving to 'before' (matching today's default, and what dropping
// squarely onto a card is expected to do) without blurring a genuine
// top-quarter/bottom-quarter drop, which sits ~10-12px further out.
const SIDE_TIE_EPSILON_PX = 1;

// Which side of the hovered card a drop resolves to — 'before' if the
// dragged card's current center sits at or above the hovered card's
// center (within the tie epsilon), 'after' otherwise. Pure geometry, no
// dnd-kit types required directly. Missing rects (dnd-kit's
// `active.rect.current.translated` can be null before the first measured
// frame) fail safe to 'before' rather than throwing.
export function resolveDropSide(
  activeRect: VerticalRect | null | undefined,
  overRect: VerticalRect | null | undefined,
): DropSide {
  if (!activeRect || !overRect) return 'before';

  const activeCenterY = activeRect.top + activeRect.height / 2;
  const overCenterY = overRect.top + overRect.height / 2;

  return activeCenterY <= overCenterY + SIDE_TIE_EPSILON_PX ? 'before' : 'after';
}

// The card or Stub a drop anchors to, and which side of it — the one answer
// the live blue line (`dragChrome.tsx`), the release, and the Descendants
// layer's own gap all read, through `namedAnchorFor`, so they can't
// disagree (wiki board-drag-interaction §2 and §7.1).
//
// Over an item row — a Card in a column/sub-row's own list, or a Stub in a
// Card's flat Descendants section — dnd-kit's sortable shuffle decides the
// ghost's slot, stock dnd-kit semantics (the drop lands where the gap is),
// and the dragged copy only picks which neighbor names it: above the
// ghost's middle, "after" the row
// above it; below, "before" the row below it. Both name the same slot, so
// the ghost, the line and the save always agree; the lean only chooses the
// neighbor. At the top or bottom of the list there's one neighbor; alone in
// the list, none (null).
//
// The ghost's own height is the hovered row's own kind — `SHORT_CARD_HEIGHT_PX`
// over a Card row, `STUB_ROW_HEIGHT_PX` over a Stub row — never a value the
// caller has to know to pass in: which list this is (a column's Cards or a
// Descendants section's Stubs) already decides which ghost is sliding
// through it, and `over`'s own row kind already carries that fact.
//
// The ghost's middle follows dnd-kit's vertical strategy: over its own
// slot when `over` is itself, top-aligned to `over` when it moved up,
// bottom-aligned when it moved down. The order is read from `over`'s own
// sortable data — the same `items` dnd-kit draws the shuffle from — never
// the active row's (it can lag a mid-drag remount).
//
// A card/Stub row not in `over`'s own sortable list, or one with no
// sortable data at all, is still `over` itself, on `resolveDropSide`'s
// which-half-of-`over` side — `over` naming anything else (no row) is its
// own case below.
//
// `travels`: rows that move with the dragged item, never a neighbor to
// name — see `travelingRowsFor`. The search steps past them to the next
// row that stays.
//
// `over` naming anything but a card/Stub row — the bare column/sub-row
// container itself, at rest or between shuffles — is no anchor at all:
// there's no row there to draw the blue line on or anchor a release beside,
// so a caller reads `null` as "no row named". A real row with no sortable
// data yet is still named via `resolveDropSide`'s which-half fallback.
export function dropAnchorFor(
  active: Pick<Active, 'id' | 'rect'>,
  over: Over,
  travels?: (id: string) => boolean,
): AnchorRelation | null {
  const translated = active.rect.current.translated;
  const overData = over.data.current;
  if (!isItemData(overData)) return null;
  const onOver = (): AnchorRelation => ({ anchorId: String(over.id), side: resolveDropSide(translated, over.rect) });
  if (!hasSortableData(over)) return onOver();
  const ghostHeightPx = isStubRow(overData) ? STUB_ROW_HEIGHT_PX : SHORT_CARD_HEIGHT_PX;
  const { items, index: overIndex } = over.data.current.sortable;
  const activeIndex = items.indexOf(active.id);
  if (activeIndex === -1) return onOver();

  const { top, height } = over.rect;
  const ghostCenterY =
    activeIndex < overIndex
      ? top + height - ghostHeightPx / 2
      : activeIndex > overIndex
        ? top + ghostHeightPx / 2
        : top + height / 2;
  const order = arrayMove(items, activeIndex, overIndex);
  const neighbor = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < order.length; i += step) if (!travels?.(String(order[i]))) return order[i];
    return undefined;
  };
  const above = neighbor(overIndex - 1, -1);
  const below = neighbor(overIndex + 1, 1);
  const leansUp = translated ? translated.top + translated.height / 2 < ghostCenterY : true;
  if (above !== undefined && (leansUp || below === undefined)) return { anchorId: String(above), side: 'after' };
  if (below !== undefined) return { anchorId: String(below), side: 'before' };
  return null;
}

// The rows `dropAnchorFor` steps past, or none. Only at a Descendants
// layer: a dragged Stub's own descendants stay rendered in the flat section
// below it, but they travel with it, so they're never Top or Bottom
// (wiki board-drag-interaction §7.2) — they're out of the projection's rows
// too (`classification.subtreeIds`). Named, the gap would jump to the
// section's end. Never at a column: there a Free descendant of the dragged
// Card is a real anchor. One predicate for the blue line and the gap
// (through `namedAnchorFor`), so they can't disagree.
//
// Deliberately separate from `projectTreeUtils.ts::resolveGap`: the sidebar
// draws no ghost, so it maps an `over` inside the dragged block to the gap
// the block collapses to; the board names the ghost's neighbor in dnd-kit's
// shuffled order, stepping past traveling rows. Same outcome — a traveling
// row is never Top or Bottom — from different inputs.
export function travelingRowsFor(session: AnchorSession | null): ((id: string) => boolean) | undefined {
  if (!session || !descendantsCardIdOf(session.pop.contextKey)) return undefined;
  const { subtreeIds } = session.classification;
  return id => subtreeIds.has(id);
}

// The slice of a drag session the anchor reads.
export type AnchorSession = {
  pop: Pick<PopSession, 'contextKey'>;
  classification: Pick<DragClassification, 'subtreeIds'>;
};

// The row a drop names right now, in the one call shape its readers share —
// the blue line (`dragChrome.tsx`), the pop machine's zoom-in candidate and
// the Descendants gap (`useBoardDnd.ts::handleDragMove`), and the release —
// so they all step past the same traveling rows. No `over`, no anchor.
export function namedAnchorFor(
  active: Pick<Active, 'id' | 'rect'>,
  over: Over | null,
  session: AnchorSession | null,
): AnchorRelation | null {
  return over ? dropAnchorFor(active, over, travelingRowsFor(session)) : null;
}
