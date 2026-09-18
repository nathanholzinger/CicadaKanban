import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Item, ItemType } from '../types';
import { PILL_DEPTH, depthLabel, typePillClass, typePillStyle } from './item-detail/pillUtils';
import { resolveDropSide } from './workflow/boardDndUtils';
import { DRAG_REGION_ATTR, cardRegionKey } from './workflow/dragRegions';
import { ACTIVE_CONTEXT_OUTLINE } from './BandGuides';
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
function useLiveDropSide(itemId: string, expectedActiveTypes: readonly string[]): 'before' | 'after' | null {
  const { active, over } = useDndContext();
  if (!active || !over || over.id !== itemId || active.id === itemId) return null;
  if (!expectedActiveTypes.includes(active.data.current?.type)) return null;
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
function useDropTargetProps(itemId: string, activeTypes: readonly ('card' | 'attached-child')[], isOverlay = false) {
  const dropSide = useLiveDropSide(itemId, activeTypes);
  const dropTarget = useDropTargetState(isOverlay ? '' : itemId);
  const pending = useIsPending(isOverlay ? '' : itemId);
  return {
    dropSide,
    dataAttrs: {
      'data-item-id': isOverlay ? undefined : itemId,
      // The carried copy, for the E2E helper's "drag finished" wait — it
      // outlives the drag by dnd-kit's drop animation.
      'data-drag-overlay': isOverlay ? 'true' : undefined,
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

// A card's type pill only renders when `item.type` resolves to a known
// ItemType — an orphaned/unknown type reference hides the pill rather than
// showing a raw id (unlike the item-detail sections, which fall back to the
// raw id as label text).
function resolveType(typeId: string | null, itemTypes: ItemType[]): ItemType | null {
  return typeId ? (itemTypes.find(t => t.id === typeId) ?? null) : null;
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
// the list gap it's reserved alongside — they import both from here.
export const SHORT_CARD_HEIGHT_PX = 96;
// The card lists' own gap (`BoardColumn`'s merged list, `WorkphaseCardList`)
// — standardized on one constant so the reservation math (net height never
// changes, wiki §5) has one gap value to add in, not two.
export const CARD_LIST_GAP_PX = 8;
export const CARD_LIST_GAP_CLASS = 'gap-2';

function ShortCard({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  const resolvedType = resolveType(item.type, itemTypes);
  const depth = item.depth ?? 0;
  return (
    <>
      <div className="mb-2 flex items-center gap-1">
        <span className={PILL_DEPTH}>{depthLabel(depth)}</span>
        {resolvedType && (
          <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
            {resolvedType.name}
          </span>
        )}
      </div>
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
  onCardClick?: (id: string) => void;
}

export default function KanbanCard({
  item,
  itemTypes = [],
  childCount = 0,
  getAttachedChildren,
  defaultExpanded = true,
  isOverlay = false,
  onCardClick,
}: KanbanCardProps) {
  const [manualExpanded, setExpanded] = useState(defaultExpanded);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'card' },
  });
  const { dropSide, dataAttrs, className: dropTargetClassName } = useDropTargetProps(item.id, ['card'], isOverlay);
  // Story 4: forced open — independent of the user's own
  // collapse choice — for as long as this Card is the live attach target,
  // so a drag actually reveals the ghost landing inside it rather than
  // requiring a click the cursor can't make mid-drag.
  const isAttachTarget = useIsAttachTarget(item.id);
  const expanded = manualExpanded || isAttachTarget;
  // The live *Card* drag this row's ghost belongs to, if any — `pop` is set
  // only for a Card-type drag (handleDragStart), never for an ordinary Stub
  // sibling-reorder, so this can't misidentify a Stub that's simply being
  // dragged among its own real siblings as "the attach ghost" (that bug hid
  // the dragged Stub's own row entirely — no `data-item-id` to find it by).
  // Renders as a plain preview instead of a second, differently-typed
  // sortable registration under its id once it *is* the ghost (Story 4
  // planning, decision 3).
  const cardDragSession = useDragSession();
  const attachGhostId = cardDragSession?.pop ? cardDragSession.activeItem.id : undefined;
  // The DragOverlay copy and this same item's own in-list row while it's
  // the one being dragged (`isDragging`, from useSortable — true wherever
  // the item's pending Placement currently sorts it, its original slot
  // included) are the drag's two visible copies, and both render as a
  // shortCard (Story 4.1 Phase 1, decision 3) — a fixed height the board's
  // carve-out reservation (BandGuides.tsx) reserves exactly, not an
  // approximation of whatever the full card's footer happens to add.
  const isGhostLike = isOverlay || isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isGhostLike ? { height: SHORT_CARD_HEIGHT_PX } : {}),
  };

  const depth = item.depth ?? 0;
  const resolvedType = resolveType(item.type, itemTypes);

  let avatarBadgeClass = 'bg-cyan-500/20 text-cyan-300';
  if (item.assigneeType === 'agent') avatarBadgeClass = 'bg-amber-500/20 text-amber-300';

  // Computed once (not called inline in JSX below) — getAttachedChildren
  // returns a fresh array/sort every call, and calling it twice inline for
  // both SortableContext's `items` and the `.map()` produced unstable
  // references that fed a dnd-kit measurement loop during a real drag
  // (matches this codebase's known "inline function call in JSX" gotcha).
  // Story 4: placement-aware, so a Card being previewed as attaching here
  // is already included at its slot (itemListOps.ts). None while
  // ghost-like: a shortCard shows no children at all, not even collapsed.
  const attachedChildren = !isGhostLike && expanded && childCount > 0 ? (getAttachedChildren?.(item.id) ?? []) : [];

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
      className={`${CARD_BASE} ${isGhostLike ? 'overflow-hidden' : ''} ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} ${dropTargetClassName} ${isAttachTarget ? ACTIVE_CONTEXT_OUTLINE : ''}`}
    >
      {/* Diagnostic-grade live drop-side indicator — see useLiveDropSide */}
      <DropSideIndicator side={dropSide} />

      {isGhostLike ? (
        <ShortCard item={item} itemTypes={itemTypes} />
      ) : (
        <>
          {/* Depth + type pills */}
          <div className="mb-2 flex items-center gap-1">
            <span className={PILL_DEPTH}>{depthLabel(depth)}</span>
            {resolvedType && (
              <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
                {resolvedType.name}
              </span>
            )}
          </div>

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

          {/* Attached children, indented — draggable among siblings (Epic
              3.2 Part 3); dragging one *out* of its parent stays blocked
              until Epic 3.5 */}
          {attachedChildren.length > 0 && getAttachedChildren && (
            <div className="mt-2 space-y-1 border-l border-zinc-700/50 pl-3">
              <SortableContext items={attachedChildren.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {attachedChildren.map(child =>
                  // Story 4: this row is the active Card drag's own
                  // ghost (previewed attaching here, not a real Stub yet) —
                  // rendered as a plain, non-sortable preview rather than a
                  // second registration of the same id under a different drag
                  // `type` (decision 3's risk: dnd-kit's `active.data.current`
                  // is read fresh by the collision closure on every pass, so a
                  // real Card being *also* registered here as `attached-child`
                  // could make the pop machine see the wrong type mid-drag).
                  child.id === attachGhostId ? (
                    <AttachGhostRow key={child.id} item={child} itemTypes={itemTypes} />
                  ) : (
                    <AttachedChildRow
                      key={child.id}
                      item={child}
                      itemTypes={itemTypes}
                      getAttachedChildren={getAttachedChildren}
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

// Story 4: a purely visual stand-in for the active drag's own
// item once it's previewed attaching here — same slot, same small pill
// treatment as a real AttachedChildRow, but no `useSortable`/`useDroppable`
// registration of its own (see the call site's comment for why that
// matters). Rendering `AttachedChildRow` itself for this row was the more
// obvious choice; this is the one deliberate departure from "reuse the
// existing sibling-reorder row" and exists only to sidestep that risk.
function AttachGhostRow({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  const resolvedType = resolveType(item.type, itemTypes);
  return (
    <div className="flex items-center gap-1.5 rounded border border-dashed border-blue-500/50 bg-blue-500/10 px-1.5 py-1">
      {resolvedType && (
        <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
          {resolvedType.name}
        </span>
      )}
      <span className="truncate text-xs text-zinc-300">{item.title}</span>
    </div>
  );
}

interface AttachedChildRowProps {
  item: Item;
  itemTypes: ItemType[];
  getAttachedChildren: (parentId: string) => Item[];
  onCardClick?: (id: string) => void;
}

function AttachedChildRow({ item, itemTypes, getAttachedChildren, onCardClick }: AttachedChildRowProps) {
  const resolvedType = resolveType(item.type, itemTypes);
  const grandchildren = getAttachedChildren(item.id);
  // Epic 3.2 Part 3: draggable among siblings under the same parent — a
  // self-contained SortableContext (see the parent's wrapper above and the
  // recursive one below), not the board-level card DnD. `data.type:
  // 'attached-child'` is what routes the drag to useBoardDnd's dedicated
  // sibling-reorder branch instead of the board's card-move logic.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    // parentId lets boardCollisionDetection scope collisions to true
    // siblings (same parent) — without it, an attached child could collide
    // with an unrelated card's attached child if their rects happen to be
    // near each other.
    data: { type: 'attached-child', parentId: item.parentId },
  });
  // Stubs are classified individually during a Card drag (wiki §4, DRAG-2.7)
  // — same attributes and overlay as a Card, so a test reads them alike.
  // Both active types: a sibling Stub reorder, or (Story 4 planning) a
  // foreign Card popped into this row's own parent, anchoring beside it.
  const {
    dropSide,
    dataAttrs,
    className: dropTargetClassName,
  } = useDropTargetProps(item.id, ['card', 'attached-child']);
  const style = { transform: CSS.Transform.toString(transform), transition };

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
        {resolvedType && (
          <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
            {resolvedType.name}
          </span>
        )}
        <span className="truncate text-xs text-zinc-300">{item.title}</span>
      </button>
      {grandchildren.length > 0 && (
        <div className="space-y-1 border-l border-zinc-700/50 pl-3">
          <SortableContext items={grandchildren.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {grandchildren.map(child => (
              <AttachedChildRow
                key={child.id}
                item={child}
                itemTypes={itemTypes}
                getAttachedChildren={getAttachedChildren}
                onCardClick={onCardClick}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
