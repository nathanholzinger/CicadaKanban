// Draggable card. isGhostLike renders the in-list ghost (and, ordinarily,
// the DragOverlay copy too) as shortCard for the drag's duration — see
// client/src/components/workflow/CLAUDE.md. Story 6 Phase C (reopening
// Story 5 decision 6): while locked at a Card or Descendants layer, the
// DragOverlay copy is a Stub row instead (`overlayForm`/`overlayWidthPx`,
// from `placement.ts::overlayFormFor` via `useBoardDnd.ts`) — rendered by
// *this same component instance*, not a separate one `BoardView.tsx`
// swaps in: dnd-kit measures the DragOverlay's child once, on its own
// mount, and never re-attaches that measurement if a *different*
// component type takes its place (its ResizeObserver is left watching a
// node that's already been removed) — so the Stub form has to be this
// component changing its own rendered shape in place, the same way the
// shortCard/full-card switch below already always has been. The Stub
// tier's own rows (StubBody, AttachGhostRow, AttachedChildRow) live in
// StubRows.tsx, and the drag-time chrome this and they share
// (useDropTargetProps, DropSideIndicator, ZoomCue) in dragChrome.tsx
// (Story 6.1 Phase 1, C-5).

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Item, ItemType } from '../types';
import { PILL_DEPTH, depthLabel } from './item-detail/pillUtils';
import TypePill from './item-detail/TypePill';
import { itemRowData } from './workflow/dragCollision';
import { cardRegionKey, descendantsRegionKey, dragRegionProps } from './workflow/dragRegions';
import { hierarchyRows, parentOpinionOf } from './workflow/itemListOps';
import { ACTIVE_CONTEXT_OUTLINE } from './BandGuides';
import { DESCENDANTS_INDENT_PX, SHORT_CARD_HEIGHT_PX } from './cardMetrics';
import type { OverlayForm } from './workflow/placement';
import {
  useDragSession,
  useIsAttachTarget,
  useZoomCandidatePhase,
  type DescendantsProjection,
} from './workflow/DragSessionContext';
import { useDragTuning } from './workflow/DragTuningContext';
import { DropSideIndicator, INVALID_PLACEMENT_CLASS, ZoomCue, useDropTargetProps } from './dragChrome';
import { AttachGhostRow, AttachedChildRow, StubBody } from './StubRows';

const CARD_BASE =
  'hover:bg-zinc-750 relative cursor-grab rounded-lg border border-zinc-700/50 bg-zinc-800 p-3 transition-colors duration-150 hover:border-zinc-600 active:cursor-grabbing';

// Story 6 Phase C: the carried copy's own "held" look while it's a Stub —
// a shadow in place of a row's hover/press states, since this copy isn't
// interactive. No CARD_BASE (that's the shortCard/full-card box) — a Stub
// is a small pill-shaped row, not a padded card.
const OVERLAY_STUB_CLASS =
  'flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-1.5 py-1 shadow-2xl shadow-black/50 transition-[margin-left] duration-75';

// Story 6 Phase D hands-on (2026-09-24), the simple depth cue: at the
// Descendants layer the carried Stub's visible box indents to the projected
// depth, on the same geometry as a ghost row (`StubRows.tsx::AttachGhostRow`),
// so its pill lines up with its would-be siblings. Only this inner box
// moves — the overlay's own root keeps its width and position, so nothing
// dnd-kit measures changes (the same constraint Story 8's zoom-in morph
// carries). The ghost row that also shows the depth sits under this copy,
// hidden. Over the cap, the copy carries the invalid outline for the same
// reason. Provisional; Story 8 tunes it (roadmap).
function overlayStubIndent(projection: DescendantsProjection | null): {
  style: { marginLeft: number };
  invalid: boolean;
} {
  if (!projection) return { style: { marginLeft: 0 }, invalid: false };
  return { style: { marginLeft: (projection.depth + 1) * DESCENDANTS_INDENT_PX }, invalid: !projection.valid };
}

// The depth + type pills row, identical at both Card-tier renders — ShortCard
// and the full body — before this (audit epic-3-5-story-4 #10).
function CardPillsRow({ item, itemTypes }: { item: Pick<Item, 'type' | 'depth'>; itemTypes: ItemType[] }) {
  return (
    <div className="mb-2 flex items-center gap-1">
      <span className={PILL_DEPTH}>{depthLabel(item.depth ?? 0)}</span>
      <TypePill item={item} itemTypes={itemTypes} />
    </div>
  );
}

// Story 4.1 Phase 1 (decision 3) — shortCard: the Card's fixed-height
// compact mode, used for both drag copies (the DragOverlay and the in-list
// ghost row) so the board's carve-out reservation (BandGuides.tsx) has one
// exact height to reserve, not an approximation of whatever a real card's
// footer happens to add. A presentational body only — it knows nothing
// about dragging, so a later board density option can reuse it unchanged;
// drag-specific styling (the overlay's tilt/shadow, the in-list ghost's
// dimming) stays on `KanbanCard`'s own wrapper, which chooses whether to
// render this or the full body. The dependency points drag → card, never
// the reverse: nothing under `components/workflow/` defines this height or
// the list gap it's reserved alongside — both live in `cardMetrics.ts`
// (audit epic-3-5-story-4 #4), a leaf module this file and BandGuides.tsx
// each import rather than one importing the other for them.

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
  /** isOverlay + overlayForm 'stub' only — a row's width in the context Card's section (useBoardDnd.ts::overlayWidthFor). */
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    // Decision 4 (2026-09-21): every item row registers `type: 'item'`,
    // never a type that differs between a Stub's row and a popped-out Card
    // row for the same id — see `resolveBoardCollisions`'s own comment for
    // why. `role`/`parentId` are droppable-side facts only; nothing reads
    // them off the *active* row.
    data: itemRowData('card'),
  });
  const { dropSide, dataAttrs, className: dropTargetClassName } = useDropTargetProps(item.id, isOverlay, overlayForm);
  // Story 4: forced open — independent of the user's own
  // collapse choice — for as long as this Card is the live attach target,
  // so a drag actually reveals the ghost landing inside it rather than
  // requiring a click the cursor can't make mid-drag.
  const isAttachTarget = useIsAttachTarget(item.id);
  const expanded = manualExpanded || isAttachTarget;
  // Story 6, hands-on finding 3: this Card is the locked column/sub-row's
  // current zoom-in candidate, and which stage of the hold it's in.
  const zoomCandidatePhase = useZoomCandidatePhase(item.id);
  const dragTuning = useDragTuning();
  // Story 4 decision 7, extended by Story 5 (2026-09-21): this row is the
  // active drag's own ghost — previewed attaching here, not a real Stub
  // yet — iff its `origin`'s parent *wasn't* already this Card. Excludes a
  // Stub's own home section (its origin's parent already is this Card),
  // which `pop` being set for a Stub's own sibling reorder too (Step 1)
  // would otherwise misidentify the same way 4.1's F3 landmine did for a
  // Card — hiding the dragged row entirely, no `data-item-id` to find it
  // by. Renders as a plain preview instead of a second, differently-typed
  // sortable registration under its id once it *is* the ghost.
  const cardDragSession = useDragSession();
  // Story 6 Phase D: the static ghost above is Card layer's own auto-drop
  // preview only. Once the drag has zoomed *past* Card layer into this
  // Card's own Descendants section, the previewed row becomes a real
  // sortable member of the flat list instead (rendered below via the
  // ordinary `AttachedChildRow` branch) — dnd-kit's own shuffle needs it
  // registered there for `dropAnchorFor` to read its slot, the same way
  // any Stub already reordering within its own section is. `pop` is never
  // optional once a session exists (`DragSessionContext.ts`), so checking
  // `cardDragSession` itself is enough to also read `.pop`/`.origin` safely.
  const attachGhostId =
    cardDragSession &&
    cardDragSession.pop.contextKey === cardRegionKey(item.id) &&
    parentOpinionOf(cardDragSession.origin) !== item.id
      ? cardDragSession.activeItem.id
      : undefined;
  // Story 6 Phase D (decision 4): while locked at *this* Card's own
  // Descendants layer, the previewed row's indentation follows the
  // session's live projection ("the ghost row... indented to the
  // projected depth") instead of its own stored depth — the one row whose
  // eventual parent is still being chosen by the drag.
  const descendantsProjection =
    cardDragSession && cardDragSession.pop.contextKey === descendantsRegionKey(item.id)
      ? cardDragSession.projection
      : null;
  // The DragOverlay copy and this same item's own in-list row while it's
  // the one being dragged (`isDragging`, from useSortable — true wherever
  // the item's pending Placement currently sorts it, its original slot
  // included) are the drag's two visible copies, and both render as a
  // shortCard (Story 4.1 Phase 1, decision 3) — a fixed height the board's
  // carve-out reservation (BandGuides.tsx) reserves exactly, not an
  // approximation of whatever the full card's footer happens to add.
  const isGhostLike = isOverlay || isDragging;
  // Story 6 Phase C: the one place `overlayForm` matters — everywhere else
  // in this component, `isOverlay` alone still means "the shortCard drag
  // copy," exactly as before this phase.
  const overlayIsStub = isOverlay && overlayForm === 'stub';
  const overlayIndent = overlayStubIndent(overlayIsStub ? overlayProjection : null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isGhostLike && !overlayIsStub ? { height: SHORT_CARD_HEIGHT_PX } : {}),
    ...(overlayIsStub ? { width: overlayWidthPx ?? undefined } : {}),
  };

  let avatarBadgeClass = 'bg-cyan-500/20 text-cyan-300';
  if (item.assigneeType === 'agent') avatarBadgeClass = 'bg-amber-500/20 text-amber-300';

  // Computed once (not called inline in JSX below) — getAttachedChildren
  // returns a fresh array/sort every call, and calling it inline for both
  // SortableContext's `items` and the `.map()` produced unstable references
  // that fed a dnd-kit measurement loop during a real drag (matches this
  // codebase's known "inline function call in JSX" gotcha). Story 4:
  // placement-aware, so a Card being previewed as attaching here is already
  // included at its slot (itemListOps.ts). None while ghost-like: a
  // shortCard shows no children at all, not even collapsed.
  //
  // Story 6 Phase B (decision 1): the whole section, every depth, as one
  // flat DFS list — `hierarchyRows` recurses `getAttachedChildren` via
  // `lib/hierarchyPlacement.ts::flattenHierarchy`. The active drag's own
  // attach-preview ghost (`attachGhostId`) stays a leaf, matching
  // `AttachGhostRow`'s own non-recursive rendering below — real children of
  // the item being previewed here would need a recursive ghost tree this
  // story doesn't build, so the walk simply doesn't descend into it.
  const rows =
    !isGhostLike && expanded && childCount > 0 && getAttachedChildren
      ? hierarchyRows(item.id, parentId => (parentId === attachGhostId ? [] : getAttachedChildren(parentId)))
      : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="article"
      aria-label={item.title}
      {...dataAttrs}
      // Story 4: a Card is a drag region too (wiki §1, §1.1) — a zoom-in
      // target only from the column/sub-row that contains it, never on the
      // DragOverlay's own floating copy.
      {...(isOverlay ? {} : dragRegionProps(cardRegionKey(item.id)))}
      onClick={() => !isDragging && onCardClick?.(item.id)}
      // isAttachTarget doubles as "this Card is the pop machine's current
      // context" (wiki §1.1) — the Card half of the active-context outline
      // BandGuides.tsx draws for a column/sub-row.
      data-active-context={isAttachTarget ? true : undefined}
      className={
        overlayIsStub
          ? 'relative'
          : `${CARD_BASE} ${isGhostLike ? 'overflow-hidden' : ''} ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} ${dropTargetClassName} ${isAttachTarget ? ACTIVE_CONTEXT_OUTLINE : ''}`
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

          {/* The whole descendants section, every depth, one flat sortable
              list (Story 6 Phase B, decision 1) — draggable among siblings
              (Epic 3.2 Part 3, Story 5 §1). This wrapper doubles as the
              Card's Descendants region (§1.1) — where a Stub's drag starts
              and pops back out to, one layer per Card, never one per Stub.
              It only exists while there's something to render, which is
              also exactly when a Stub's drag could ever have started here
              (a childless Card's section is unreachable, §1.1). */}
          {rows.length > 0 && getAttachedChildren && (
            <div className="mt-2 space-y-1" {...dragRegionProps(descendantsRegionKey(item.id))}>
              <SortableContext items={rows.map(r => r.item.id)} strategy={verticalListSortingStrategy}>
                {rows.map(({ item: child, depth }) => {
                  const isActiveRow = child.id === cardDragSession?.activeItem.id;
                  // Story 6 Phase D (decision 4): the active drag's own row
                  // previews the projected depth, not its stored one.
                  const rowDepth = descendantsProjection && isActiveRow ? descendantsProjection.depth : depth;
                  const invalid = Boolean(descendantsProjection && isActiveRow && !descendantsProjection.valid);
                  // Story 4 decision 7: this row is the active drag's own
                  // ghost (previewed attaching here, not a real Stub yet) —
                  // rendered as a plain, non-sortable preview rather than a
                  // second registration of the same id under a different
                  // drag `role` (decision 4's risk: dnd-kit's
                  // `active.data.current` is read fresh by the collision
                  // closure on every pass, so a real Card being *also*
                  // registered here as a Stub row could make the pop
                  // machine see the wrong role mid-drag).
                  return child.id === attachGhostId ? (
                    <AttachGhostRow key={child.id} item={child} itemTypes={itemTypes} depth={rowDepth} />
                  ) : (
                    <AttachedChildRow
                      key={child.id}
                      item={child}
                      itemTypes={itemTypes}
                      depth={rowDepth}
                      onCardClick={onCardClick}
                      invalid={invalid}
                    />
                  );
                })}
              </SortableContext>
            </div>
          )}
        </>
      )}
    </div>
  );
}
