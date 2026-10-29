// Draggable card. isGhostLike renders the in-list ghost (and, ordinarily,
// the DragOverlay copy too) as shortCard for the drag's duration. While
// locked at a Card's Descendants layer, the DragOverlay copy is a Stub row
// instead (`overlayForm`/`overlayWidthPx`, from
// `placement.ts::overlayFormFor`, `dragOverlayGeometry.ts::overlayWidthFor`
// via `useBoardDnd.ts`) — rendered by *this
// same component instance*, not a separate one `BoardView.tsx` swaps in:
// dnd-kit measures the DragOverlay's child once, on its own mount, and
// never re-attaches that measurement if a *different* component type takes
// its place (its ResizeObserver is left watching a node that's already
// been removed) — so the Stub form has to be this component changing its
// own rendered shape in place, the same way the shortCard/full-card switch
// below does. The Stub tier's own rows (StubBody, AttachedChildRow) live in
// StubRows.tsx, and the drag-time chrome this and they share (useItemRow,
// DropSideIndicator, ZoomCue) in dragChrome.tsx. The Card's root element is
// its Descendants region (`dragRegions.ts`): every Card is one, a childless
// Card included.

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { Item, ItemType } from '../types';
import { PILL_DEPTH, depthLabel } from './item-detail/pillUtils';
import TypePill from './item-detail/TypePill';
import { DRAG_CARD_ATTR, descendantsRegionKey, dragRegionProps } from './workflow/dragRegions';
import { hierarchyRows, sectionEntries } from './workflow/itemListOps';
import { useHierarchyModal } from './workflow/HierarchyModalContext';
import { SHORT_CARD_HEIGHT_PX, STUB_ROW_BOX_CLASS, descendantsIndentPx } from './cardMetrics';
import type { OverlayForm } from './workflow/placement';
import {
  useDragSession,
  useIsLockedAtCard,
  useZoomCandidatePhase,
  type DescendantsProjection,
} from './workflow/DragSessionContext';
import { useDragTuning } from './workflow/DragTuningContext';
import { ACTIVE_CONTEXT_OUTLINE, DropSideIndicator, INVALID_PLACEMENT_CLASS, ZoomCue, useItemRow } from './dragChrome';
import { SectionRows, StubBody } from './StubRows';

const CARD_BASE =
  'hover:bg-zinc-750 relative cursor-grab rounded-lg border border-zinc-700/50 bg-zinc-800 p-3 transition-colors duration-150 hover:border-zinc-600 active:cursor-grabbing';

// The carried copy's own "held" look while it's a Stub —
// a shadow in place of a row's hover/press states, since this copy isn't
// interactive. No CARD_BASE (that's the shortCard/full-card box) — a Stub
// is a small pill-shaped row, not a padded card, on the Stub rows' own box.
const OVERLAY_STUB_CLASS = `${STUB_ROW_BOX_CLASS} border border-zinc-600 bg-zinc-800 shadow-2xl shadow-black/50 transition-[margin-left] duration-75`;

// The depth cue: at the Descendants layer the carried Stub's visible box
// indents to the projected depth, through the same `descendantsIndentPx`
// as a section row (`StubRows.tsx::AttachedChildRow`), so its pill lines up
// with its would-be siblings. Only this inner box moves — the overlay's own
// root keeps its width and position, so nothing dnd-kit measures changes.
// The ghost row that also shows the depth sits under this copy, hidden.
// Over the cap, the copy carries the invalid outline for the same reason.
// A placeholder look, not yet tuned.
function overlayStubIndent(projection: DescendantsProjection | null): {
  style: { marginLeft: number };
  invalid: boolean;
} {
  if (!projection) return { style: { marginLeft: 0 }, invalid: false };
  return { style: { marginLeft: descendantsIndentPx(projection.depth) }, invalid: !projection.valid };
}

// The depth + type pills row, shared by both Card-tier renders — ShortCard
// and the full body.
function CardPillsRow({ item, itemTypes }: { item: Pick<Item, 'type' | 'depth'>; itemTypes: ItemType[] }) {
  return (
    <div className="mb-2 flex items-center gap-1">
      <span className={PILL_DEPTH}>{depthLabel(item.depth ?? 0)}</span>
      <TypePill item={item} itemTypes={itemTypes} />
    </div>
  );
}

// shortCard: the Card's fixed-height compact mode, used for both drag
// copies (the DragOverlay and the in-list ghost row) so the board's
// carve-out reservation (BandGuides.tsx) has one exact height to reserve,
// not an approximation of whatever a real card's footer happens to add
// (wiki board-drag-interaction §5a). A presentational body only — it knows
// nothing about dragging, so it can be reused outside a drag; drag-specific
// styling (the overlay's tilt/shadow, the in-list ghost's dimming) stays on
// `KanbanCard`'s own wrapper, which chooses whether to render this or the
// full body. The dependency points drag → card, never the reverse: nothing
// under `components/workflow/` defines this height or the list gap it's
// reserved alongside — both live in `cardMetrics.ts`, a leaf module this
// file and BandGuides.tsx each import rather than one importing the other
// for them.

function ShortCard({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  return (
    <>
      <CardPillsRow item={item} itemTypes={itemTypes} />
      <p className="truncate text-sm leading-snug font-medium text-zinc-100">{item.title}</p>
      {/* Always one line, even with no description — reserves the same
          space either way, which is the whole point of a fixed height. */}
      <p className="mt-1.5 line-clamp-1 text-xs leading-relaxed text-zinc-400">{item.description}</p>
    </>
  );
}

interface KanbanCardProps {
  item: Item;
  itemTypes?: ItemType[];
  childCount?: number;
  getAttachedChildren?: (parentId: string) => Item[];
  defaultExpanded?: boolean;
  isOverlay?: boolean;
  /** isOverlay only — which drag copy to draw (placement.ts::overlayFormFor). Ignored (shortCard) when isOverlay is false. */
  overlayForm?: OverlayForm;
  /** isOverlay + overlayForm 'stub' only — a row's width in the context Card's section (dragOverlayGeometry.ts::overlayWidthFor). */
  overlayWidthPx?: number | null;
  /** isOverlay + overlayForm 'stub' only — the Descendants layer's live projection (null elsewhere), which indents the carried Stub to the depth it would land at. */
  overlayProjection?: DescendantsProjection | null;
  onCardClick?: (id: string) => void;
}

export default function KanbanCard({
  item,
  itemTypes = [],
  childCount = 0,
  getAttachedChildren,
  defaultExpanded = true,
  isOverlay = false,
  overlayForm = 'short-card',
  overlayWidthPx = null,
  overlayProjection = null,
  onCardClick,
}: KanbanCardProps) {
  const [manualExpanded, setExpanded] = useState(defaultExpanded);
  const { setNodeRef, attributes, listeners, isDragging, dropSide, sortableStyle, dataAttrs, chromeClassName } =
    useItemRow(item.id, 'card', { isOverlay, overlayForm });
  // Whether the drag is locked at this Card's Descendants layer.
  const lockedHere = useIsLockedAtCard(item.id);
  // Forced open — independent of the user's own collapse choice — for as
  // long as the drag is locked at this Card's layer, so a drag actually
  // reveals the ghost landing inside it rather than requiring a click the
  // cursor can't make mid-drag (wiki board-drag-interaction §1.1).
  const expanded = manualExpanded || lockedHere;
  // Whether this Card is the locked column/sub-row's current zoom-in
  // candidate, and which stage of the hold it's in.
  const zoomCandidatePhase = useZoomCandidatePhase(item.id);
  const dragTuning = useDragTuning();
  const cardDragSession = useDragSession();
  // While the hierarchy modal holds this Card's rows, the section only shows them: it draws
  // static and is no region, so the modal's list is the one element for the section's key.
  const hierarchyModal = useHierarchyModal();
  const modalOpen = hierarchyModal.openCardId === item.id;
  // While locked at *this* Card's own Descendants layer, the previewed
  // row's indentation follows the session's live projection instead of its
  // own stored depth — the one row whose eventual parent is still being
  // chosen by the drag. The previewed row is a real sortable member of the
  // flat list (rendered below via the ordinary `AttachedChildRow` branch):
  // dnd-kit's own shuffle needs it registered there for `dropAnchorFor` to
  // read its slot, the same way any Stub already reordering within its own
  // section is.
  const descendantsProjection = cardDragSession && lockedHere ? cardDragSession.projection : null;
  // The DragOverlay copy and this same item's own in-list row while it's
  // the one being dragged (`isDragging`, from useSortable — true wherever
  // the item's pending Placement currently sorts it, its original slot
  // included) are the drag's two visible copies, and both render as a
  // shortCard — a fixed height the board's carve-out reservation
  // (BandGuides.tsx) reserves exactly, not an approximation of whatever the
  // full card's footer happens to add.
  const isGhostLike = isOverlay || isDragging;
  // Where `overlayForm` changes what this component draws (`useItemRow` only
  // reports it as `data-drag-overlay-form`) — everywhere else in this
  // component, `isOverlay` alone means "the shortCard drag copy."
  const overlayIsStub = isOverlay && overlayForm === 'stub';
  const overlayIndent = overlayStubIndent(overlayIsStub ? overlayProjection : null);

  const style = {
    ...sortableStyle,
    // The zoom into this Card clears the column's shuffle in the render that mounts its section's
    // rows, and dnd-kit measures a row once, as it mounts. A Card still sliding back to rest then
    // leaves every row's measured rect off by what is left of the slide, for the rest of the drag:
    // the collision, `over.rect` and the sortable shuffle of the rows all read from it. So the
    // Card that holds the drag doesn't slide.
    ...(lockedHere ? { transition: 'none' } : {}),
    ...(isGhostLike && !overlayIsStub ? { height: SHORT_CARD_HEIGHT_PX } : {}),
    ...(overlayIsStub ? { width: overlayWidthPx ?? undefined } : {}),
  };

  let avatarBadgeClass = 'bg-cyan-500/20 text-cyan-300';
  if (item.assigneeType === 'agent') avatarBadgeClass = 'bg-amber-500/20 text-amber-300';

  // Computed once (not called inline in JSX below) — getAttachedChildren
  // returns a fresh array/sort every call, and calling it inline for both
  // SortableContext's `items` and the `.map()` produced unstable references
  // that fed a dnd-kit measurement loop during a real drag (matches this
  // codebase's known "inline function call in JSX" gotcha). Placement-aware,
  // so a Card being previewed as attaching here is already included at its
  // slot (itemListOps.ts). None while ghost-like: a shortCard shows no
  // children at all, not even collapsed.
  //
  // The whole section, every depth, as one flat DFS list (what the board places
  // against; `entries` below is the part of it drawn) —
  // `itemListOps.ts::hierarchyRows` walks `getAttachedChildren`, which is
  // placement-aware: a childless Card the drag has zoomed into already has the
  // carried item's ghost as its one child, its one spot.
  const rows =
    !isGhostLike && expanded && childCount > 0 && getAttachedChildren
      ? hierarchyRows(item.id, getAttachedChildren)
      : [];
  // What the section draws: `rows` cut at the last shown level, with an overflow row for the
  // children it hides. The board still places against all of `rows`.
  const entries = sectionEntries(rows, dragTuning.sectionLevels, cardDragSession?.activeItem.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="article"
      aria-label={item.title}
      {...dataAttrs}
      // A Card is its Descendants layer's drag region too — a zoom-in target
      // only from the column/sub-row that contains it, never on the
      // DragOverlay's own floating copy. While the hierarchy modal holds its
      // rows the modal's list is the region, so the key leaves this element and
      // the Card keeps only its id (`DRAG_CARD_ATTR`), which the list finds its
      // column by.
      {...(isOverlay
        ? {}
        : { [DRAG_CARD_ATTR]: item.id, ...(modalOpen ? {} : dragRegionProps(descendantsRegionKey(item.id))) })}
      onClick={() => !isDragging && onCardClick?.(item.id)}
      // lockedHere doubles as "this Card is the pop machine's current
      // context" — the Card half of the active-context outline
      // BandGuides.tsx draws for a column/sub-row.
      data-active-context={lockedHere ? true : undefined}
      className={
        overlayIsStub
          ? 'relative'
          : `${CARD_BASE} ${isGhostLike ? 'overflow-hidden' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} ${chromeClassName} ${lockedHere ? ACTIVE_CONTEXT_OUTLINE : ''}`
      }
    >
      {/* Live drop-side indicator — see dragChrome.tsx::useLiveDropSide */}
      <DropSideIndicator side={dropSide} />
      {zoomCandidatePhase === 'cue' && <ZoomCue cueMs={dragTuning.cardPopInDelayMs} />}

      {overlayIsStub ? (
        <div
          className={`${OVERLAY_STUB_CLASS} ${overlayIndent.invalid ? INVALID_PLACEMENT_CLASS : ''}`}
          style={overlayIndent.style}
        >
          <StubBody item={item} itemTypes={itemTypes} />
        </div>
      ) : isGhostLike ? (
        <ShortCard item={item} itemTypes={itemTypes} />
      ) : (
        <>
          <CardPillsRow item={item} itemTypes={itemTypes} />

          <p className="text-sm leading-snug font-medium text-zinc-100">{item.title}</p>

          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">{item.description}</p>
          )}

          {/* Footer */}
          {(item.assigneeType || childCount > 0) && (
            <div className="mt-2 flex items-center gap-2">
              {childCount > 0 && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setExpanded(v => !v);
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-[11px] text-zinc-500 hover:text-zinc-300"
                  title={expanded ? 'Hide attached children' : 'Show attached children'}
                >
                  {childCount} child{childCount === 1 ? '' : 'ren'} {expanded ? '▾' : '▸'}
                </button>
              )}
              {item.assigneeType && (
                <div className="flex items-center gap-1">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${avatarBadgeClass}`}
                  >
                    {item.assigneeType === 'agent' ? 'A' : 'H'}
                  </span>
                  <span className="text-[11px] text-zinc-500">{item.assigneeType === 'agent' ? 'Agent' : 'Human'}</span>
                </div>
              )}
            </div>
          )}

          {/* The descendants section, one flat sortable list down to its last
              shown level, with an overflow row for what that hides — Stubs
              draggable among siblings. It only exists while there's
              something to render; the Card's root is the Descendants region,
              not this wrapper. Its SortableContext is its own, never shared
              with CardList.tsx's: that one holds a card list's Free Cards,
              this one the section's rows, and each list's shuffle stays
              within its own rows. */}
          {rows.length > 0 && getAttachedChildren && (
            <div className="mt-2 space-y-1">
              {modalOpen ? (
                <SectionRows isStatic entries={entries} cardId={item.id} itemTypes={itemTypes} projection={null} />
              ) : (
                <SortableContext items={entries.map(e => e.row.id)} strategy={verticalListSortingStrategy}>
                  <SectionRows
                    entries={entries}
                    cardId={item.id}
                    itemTypes={itemTypes}
                    projection={descendantsProjection}
                    activeId={cardDragSession?.activeItem.id}
                    onCardClick={onCardClick}
                    onOpenOverflow={() => hierarchyModal.open(item.id)}
                  />
                </SortableContext>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
