// Draggable card. isGhostLike renders the in-list ghost (and, ordinarily,
// the DragOverlay copy too) as shortCard for the drag's duration — see
// client/src/components/workflow/CLAUDE.md. Story 6 Phase C (reopening
// Story 5 decision 6): while locked at a Card or Descendants layer, the
// DragOverlay copy is a Stub row instead (`overlayForm`/`overlayWidthPx`,
// from `popSession.ts::overlayFormFor` via `useBoardDnd.ts`) — rendered by
// *this same component instance*, not a separate one `BoardView.tsx`
// swaps in: dnd-kit measures the DragOverlay's child once, on its own
// mount, and never re-attaches that measurement if a *different*
// component type takes its place (its ResizeObserver is left watching a
// node that's already been removed) — so the Stub form has to be this
// component changing its own rendered shape in place, the same way the
// shortCard/full-card switch below already always has been.

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Item, ItemType } from '../types';
import { PILL_DEPTH, depthLabel, typePillClass, typePillStyle } from './item-detail/pillUtils';
import TypePill from './item-detail/TypePill';
import { itemRowData, resolveDropSide, type ItemRowRole } from './workflow/boardDndUtils';
import { DRAG_REGION_ATTR, cardRegionKey, descendantsRegionKey } from './workflow/dragRegions';
import { hierarchyRows, parentOpinionOf } from './workflow/itemListOps';
import { ACTIVE_CONTEXT_OUTLINE } from './BandGuides';
import { SHORT_CARD_HEIGHT_PX } from './cardMetrics';
import type { OverlayForm } from './workflow/popSession';
import {
  useDragSession,
  useDropTargetState,
  useIsAttachTarget,
  useIsPending,
  type DropTargetView,
} from './workflow/DragSessionContext';

// Diagnostic-grade live drop-side indicator (Epic 3.2 addendum — not the
// full polished Epic 3.5 hover cue, just enough to see what handleDragEnd
// is about to compute). Reads dnd-kit's live active/over state directly via
// useDndContext — no prop drilling through BoardColumn/BoardView — and
// calls the exact same resolveDropSide function useBoardDnd's handleDragEnd
// uses, so the line shown here is guaranteed to match what gets sent.
// Diagnostic-only, so reading `active.data.current?.role` here is fine even
// though it's never load-bearing for a real collision/write decision
// (decision 4) — a stale read during a mid-drag remount briefly mis-draws
// this line at worst, never anything written.
function useLiveDropSide(itemId: string, expectedActiveRoles: readonly ItemRowRole[]): 'before' | 'after' | null {
  const { active, over } = useDndContext();
  if (!active || !over || over.id !== itemId || active.id === itemId) return null;
  if (active.data.current?.type !== 'item') return null;
  if (!expectedActiveRoles.includes(active.data.current?.role)) return null;
  return resolveDropSide(active.rect.current.translated, over.rect);
}

// Epic 3.5 Story 2: provisional drag-target overlays (docs/wiki/board-drag-
// interaction §4). The *classification* is settled and exposed as
// `data-drop-state` for tests; the look — palette, weight, animation — is
// deliberately rough until Story 8 tunes it against real gestures. Green:
// a Free descendant of the carried item ("these are yours"). Dimmed: a real
// target this item can't use (depth-capped). Valid and Inert draw nothing.
// The color and the dim level are CSS custom properties BoardView sets from
// the dev/test panel (Story 3).
const OVERLAY_FREE_DESCENDANT = 'ring-2 ring-(--drag-overlay-free)';
const OVERLAY_DEPTH_CAPPED = 'opacity-(--drag-overlay-capped-opacity)';
// Epic 3.5 Story 3: a write is in flight for this item — it's drawn at the
// slot it was dropped in, and its position is the server's to confirm
// (wiki §10). Test surface: `data-pending`.
const PENDING = 'animate-pulse';

function dropTargetClass(view: DropTargetView | null): string {
  if (!view) return '';
  if (view.isFreeDescendant) return OVERLAY_FREE_DESCENDANT;
  if (view.state === 'depth-capped') return OVERLAY_DEPTH_CAPPED;
  return '';
}

const DROP_INDICATOR_BEFORE = 'pointer-events-none absolute -top-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';
const DROP_INDICATOR_AFTER =
  'pointer-events-none absolute -bottom-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';

// The drag-time chrome a Card and a Stub share (audit epic-3-5-story-2
// #13): the live side indicator, the drag-target attributes/overlay, the
// pending marker. The DragOverlay copy is the carried item itself — never a
// target, never pending — so it gets none of it.
function useDropTargetProps(
  itemId: string,
  activeRoles: readonly ItemRowRole[],
  isOverlay = false,
  overlayForm: OverlayForm = 'short-card',
) {
  const dropSide = useLiveDropSide(itemId, activeRoles);
  const dropTarget = useDropTargetState(isOverlay ? '' : itemId);
  const pending = useIsPending(isOverlay ? '' : itemId);
  return {
    dropSide,
    dataAttrs: {
      'data-item-id': isOverlay ? undefined : itemId,
      // The carried copy, for the E2E helper's "drag finished" wait — it
      // outlives the drag by dnd-kit's drop animation.
      'data-drag-overlay': isOverlay ? 'true' : undefined,
      // Story 6 Phase C, for Story 10's E2E — which form this same carried
      // copy is drawing as right now (popSession.ts::overlayFormFor).
      'data-drag-overlay-form': isOverlay ? overlayForm : undefined,
      'data-drop-state': dropTarget?.state,
      'data-pending': pending ? 'true' : undefined,
    },
    className: `${dropTargetClass(dropTarget)} ${pending ? PENDING : ''}`,
  };
}

function DropSideIndicator({ side }: { side: 'before' | 'after' | null }) {
  if (side === 'before') return <div className={DROP_INDICATOR_BEFORE} />;
  if (side === 'after') return <div className={DROP_INDICATOR_AFTER} />;
  return null;
}
const CARD_BASE =
  'hover:bg-zinc-750 relative cursor-grab rounded-lg border border-zinc-700/50 bg-zinc-800 p-3 transition-colors duration-150 hover:border-zinc-600 active:cursor-grabbing';

// Story 6 Phase C: the carried copy's own "held" look while it's a Stub —
// a shadow in place of a row's hover/press states, since this copy isn't
// interactive. No CARD_BASE (that's the shortCard/full-card box) — a Stub
// is a small pill-shaped row, not a padded card.
const OVERLAY_STUB_CLASS =
  'flex items-center gap-1.5 rounded border border-zinc-600 bg-zinc-800 px-1.5 py-1 shadow-2xl shadow-black/50';

// Epic 3.5 Story 6 Phase B (decision 1) — the flat descendants section
// replaced the nested `border-l pl-3` divs (one indent per DOM level) with
// one number applied per row: depth 0 (a Card's direct Stub) still lands
// 12px in, matching the single `pl-3` its own wrapper used to carry alone;
// each level deeper adds another 12px, matching what an extra nested
// wrapper used to add. The border-l guide lines are the one visible loss
// (decision 1's own note) — a flat row has nothing to hang one from without
// drawing its own, left for the Phase B hands-on to ask for if it's missed.
const DESCENDANTS_INDENT_PX = 12;

// A card's type pill only renders when `item.type` resolves to a known
// ItemType — an orphaned/unknown type reference hides the pill rather than
// showing a raw id (unlike the item-detail sections, which fall back to the
// raw id as label text). Still used directly by the Stub-tier rows below
// (AttachGhostRow, AttachedChildRow) — TypePill (item-detail/TypePill.tsx)
// only replaces the Card-tier's own two copies (audit epic-3-5-story-4 #10).
function resolveType(typeId: string | null, itemTypes: ItemType[]): ItemType | null {
  return typeId ? (itemTypes.find(t => t.id === typeId) ?? null) : null;
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
  /** isOverlay only — which drag copy to draw (popSession.ts::overlayFormFor). Ignored (shortCard) when isOverlay is false. */
  overlayForm?: OverlayForm;
  /** isOverlay + overlayForm 'stub' only — a row's width in the context Card's section (useBoardDnd.ts::overlayWidthFor). */
  overlayWidthPx?: number | null;
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
  const {
    dropSide,
    dataAttrs,
    className: dropTargetClassName,
  } = useDropTargetProps(item.id, ['card'], isOverlay, overlayForm);
  // Story 4: forced open — independent of the user's own
  // collapse choice — for as long as this Card is the live attach target,
  // so a drag actually reveals the ghost landing inside it rather than
  // requiring a click the cursor can't make mid-drag.
  const isAttachTarget = useIsAttachTarget(item.id);
  const expanded = manualExpanded || isAttachTarget;
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
  const attachGhostId =
    cardDragSession?.pop && parentOpinionOf(cardDragSession.origin) !== item.id
      ? cardDragSession.activeItem.id
      : undefined;
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
      {...(isOverlay ? {} : { [DRAG_REGION_ATTR]: cardRegionKey(item.id) })}
      onClick={() => !isDragging && onCardClick?.(item.id)}
      // isAttachTarget doubles as "this Card is the pop machine's current
      // context" (wiki §1.1) — the Card half of the active-context outline
      // BandGuides.tsx draws for a column/sub-row.
      data-active-context={isAttachTarget ? true : undefined}
      className={
        overlayIsStub
          ? OVERLAY_STUB_CLASS
          : `${CARD_BASE} ${isGhostLike ? 'overflow-hidden' : ''} ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} ${dropTargetClassName} ${isAttachTarget ? ACTIVE_CONTEXT_OUTLINE : ''}`
      }
    >
      {/* Diagnostic-grade live drop-side indicator — see useLiveDropSide */}
      <DropSideIndicator side={dropSide} />

      {overlayIsStub ? (
        <StubBody item={item} itemTypes={itemTypes} />
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
            <div className="mt-2 space-y-1" {...{ [DRAG_REGION_ATTR]: descendantsRegionKey(item.id) }}>
              <SortableContext items={rows.map(r => r.item.id)} strategy={verticalListSortingStrategy}>
                {rows.map(({ item: child, depth }) =>
                  // Story 4 decision 7: this row is the active drag's own
                  // ghost (previewed attaching here, not a real Stub yet) —
                  // rendered as a plain, non-sortable preview rather than a
                  // second registration of the same id under a different
                  // drag `role` (decision 4's risk: dnd-kit's
                  // `active.data.current` is read fresh by the collision
                  // closure on every pass, so a real Card being *also*
                  // registered here as a Stub row could make the pop
                  // machine see the wrong role mid-drag).
                  child.id === attachGhostId ? (
                    <AttachGhostRow key={child.id} item={child} itemTypes={itemTypes} depth={depth} />
                  ) : (
                    <AttachedChildRow
                      key={child.id}
                      item={child}
                      itemTypes={itemTypes}
                      depth={depth}
                      onCardClick={onCardClick}
                    />
                  ),
                )}
              </SortableContext>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Story 6 Phase C: the type pill + one-line title every Stub-tier render
// shares — AttachGhostRow and AttachedChildRow below, and this same
// component's own overlay-Stub branch above (`overlayIsStub`). Extracted
// so the three can't drift apart from each other; each still owns its own
// outer box (dashed ghost, sortable row, carried shadow), since that's
// the one thing that's genuinely different between them.
function StubBody({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  const resolvedType = resolveType(item.type, itemTypes);
  return (
    <>
      {resolvedType && (
        <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
          {resolvedType.name}
        </span>
      )}
      <span className="truncate text-xs text-zinc-300">{item.title}</span>
    </>
  );
}

// Story 4, `depth` added Story 6 Phase B: a purely visual stand-in for the
// active drag's own item once it's previewed attaching here — same slot,
// same small pill treatment as a real AttachedChildRow, but no
// `useSortable`/`useDroppable` registration of its own (see the call
// site's comment for why that matters — decision 4's uniform `role` field
// narrowed the original hazard but never removed the deeper one: dnd-kit
// doesn't support two simultaneous sortable registrations for one id, and
// this row's real registration is still wherever it's actually being
// dragged from). Rendering `AttachedChildRow` itself for this row was the
// more obvious choice; this is the one deliberate departure from "reuse
// the existing sibling-reorder row" and exists only to sidestep that risk.
function AttachGhostRow({ item, itemTypes, depth }: { item: Item; itemTypes: ItemType[]; depth: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded border border-dashed border-blue-500/50 bg-blue-500/10 px-1.5 py-1"
      style={{ marginLeft: (depth + 1) * DESCENDANTS_INDENT_PX }}
    >
      <StubBody item={item} itemTypes={itemTypes} />
    </div>
  );
}

interface AttachedChildRowProps {
  item: Item;
  itemTypes: ItemType[];
  depth: number;
  onCardClick?: (id: string) => void;
}

// Story 6 Phase B: one row in the flat section, indented by `depth` — no
// longer recursive (its own grandchildren used to nest here via a second
// `SortableContext`; the parent's single flat list now carries every depth,
// `KanbanCard.tsx`'s own `rows` already having walked the whole subtree).
function AttachedChildRow({ item, itemTypes, depth, onCardClick }: AttachedChildRowProps) {
  // Epic 3.2 Part 3, extended by Story 5: draggable among siblings under
  // the same parent (the within-action until Story 6 Phase D's real
  // gap+depth rule) — one shared `SortableContext` spanning the whole
  // section now (decision 1), reached through the same pop machine as a
  // Card (Step 1), not a separate board-level path. Decision 4: `type`
  // stays `'item'`, the same as a Card row, so this id's registration
  // never *looks* like a different drag type to dnd-kit once it pops out
  // and remounts as one. `parentId` is this row's own real parent — no
  // longer what scopes collisions (Phase B widened that to the whole
  // section's rect, `resolveBoardCollisions`' `descendantsSectionRect`);
  // kept for the same diagnostic/future-facing reasons every row's data
  // carries it.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: itemRowData('stub', item.parentId),
  });
  // Stubs are classified individually during a Card drag (wiki §4, DRAG-2.8)
  // — same attributes and overlay as a Card, so a test reads them alike.
  // Both active roles: a sibling Stub reorder, or a foreign Card popped
  // into this row's own parent, anchoring beside it.
  const { dropSide, dataAttrs, className: dropTargetClassName } = useDropTargetProps(item.id, ['card', 'stub']);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: (depth + 1) * DESCENDANTS_INDENT_PX,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dataAttrs}
      className={`relative rounded ${isDragging ? 'opacity-30' : ''} ${dropTargetClassName}`}
    >
      {/* Diagnostic-grade live drop-side indicator — see useLiveDropSide */}
      <DropSideIndicator side={dropSide} />

      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={e => {
          e.stopPropagation();
          if (!isDragging) onCardClick?.(item.id);
        }}
        className="flex w-full cursor-grab items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-zinc-700/40 active:cursor-grabbing"
      >
        <StubBody item={item} itemTypes={itemTypes} />
      </button>
    </div>
  );
}
