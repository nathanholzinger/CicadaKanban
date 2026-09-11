import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Item, ItemType } from '../types';
import { PILL_DEPTH, depthLabel, typePillClass, typePillStyle } from './item-detail/pillUtils';
import { resolveDropSide } from './workflow/boardDndUtils';
import { useDropTargetState, type DropTargetView } from './workflow/DragClassificationContext';

// Diagnostic-grade live drop-side indicator (Epic 3.2 addendum — not the
// full polished Epic 3.5 hover cue, just enough to see what handleDragEnd
// is about to compute). Reads dnd-kit's live active/over state directly via
// useDndContext — no prop drilling through BoardColumn/BoardView — and
// calls the exact same resolveDropSide function useBoardDnd's handleDragEnd
// uses, so the line shown here is guaranteed to match what gets sent.
function useLiveDropSide(itemId: string, expectedActiveType: string): 'before' | 'after' | null {
  const { active, over } = useDndContext();
  if (!active || !over || over.id !== itemId || active.id === itemId) return null;
  if (active.data.current?.type !== expectedActiveType) return null;
  return resolveDropSide(active.rect.current.translated, over.rect);
}

// Epic 3.5 Story 2: provisional drag-target overlays (docs/wiki/board-drag-
// interaction §4). The *classification* is settled and exposed as
// `data-drop-state` for tests; the look — palette, weight, animation — is
// deliberately rough until Story 8 tunes it against real gestures. Green:
// a Free descendant of the carried item ("these are yours"). Dimmed: a real
// target this item can't use (depth-capped). Valid and Inert draw nothing.
const OVERLAY_FREE_DESCENDANT = 'ring-2 ring-emerald-500/60';
const OVERLAY_DEPTH_CAPPED = 'opacity-40';

function dropTargetClass(view: DropTargetView | null): string {
  if (!view) return '';
  if (view.isFreeDescendant) return OVERLAY_FREE_DESCENDANT;
  if (view.state === 'depth-capped') return OVERLAY_DEPTH_CAPPED;
  return '';
}

const DROP_INDICATOR_BEFORE = 'pointer-events-none absolute -top-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';
const DROP_INDICATOR_AFTER =
  'pointer-events-none absolute -bottom-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';
const CARD_BASE =
  'hover:bg-zinc-750 relative cursor-grab rounded-lg border border-zinc-700/50 bg-zinc-800 p-3 transition-colors duration-150 hover:border-zinc-600 active:cursor-grabbing';

// A card's type pill only renders when `item.type` resolves to a known
// ItemType — an orphaned/unknown type reference hides the pill rather than
// showing a raw id (unlike the item-detail sections, which fall back to the
// raw id as label text).
function resolveType(typeId: string | null, itemTypes: ItemType[]): ItemType | null {
  return typeId ? (itemTypes.find(t => t.id === typeId) ?? null) : null;
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
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'card' },
  });
  const dropSide = useLiveDropSide(item.id, 'card');
  // The DragOverlay copy is the carried item itself, never a target.
  const dropTarget = useDropTargetState(isOverlay ? '' : item.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
  const attachedChildren = expanded && childCount > 0 ? (getAttachedChildren?.(item.id) ?? []) : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="article"
      aria-label={item.title}
      data-item-id={isOverlay ? undefined : item.id}
      data-drop-state={dropTarget?.state}
      onClick={() => !isDragging && onCardClick?.(item.id)}
      className={`${CARD_BASE} ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} ${dropTargetClass(dropTarget)}`}
    >
      {/* Diagnostic-grade live drop-side indicator — see useLiveDropSide */}
      {dropSide === 'before' && <div className={DROP_INDICATOR_BEFORE} />}
      {dropSide === 'after' && <div className={DROP_INDICATOR_AFTER} />}

      {/* Depth + type pills */}
      <div className="mb-2 flex items-center gap-1">
        <span className={PILL_DEPTH}>{depthLabel(depth)}</span>
        {resolvedType && (
          <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
            {resolvedType.name}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm leading-snug font-medium text-zinc-100">{item.title}</p>

      {/* Description preview */}
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

      {/* Attached children, indented — draggable among siblings (Epic 3.2 Part
          3); dragging one *out* of its parent stays blocked until Epic 3.5 */}
      {attachedChildren.length > 0 && getAttachedChildren && (
        <div className="mt-2 space-y-1 border-l border-zinc-700/50 pl-3">
          <SortableContext items={attachedChildren.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {attachedChildren.map(child => (
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
  const dropSide = useLiveDropSide(item.id, 'attached-child');
  // Stubs are classified individually during a Card drag (wiki §4, DRAG-2.7)
  // — same attribute and overlay as a Card, so a test reads them alike.
  const dropTarget = useDropTargetState(item.id);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-item-id={item.id}
      data-drop-state={dropTarget?.state}
      className={`relative rounded ${isDragging ? 'opacity-30' : ''} ${dropTargetClass(dropTarget)}`}
    >
      {/* Diagnostic-grade live drop-side indicator — see useLiveDropSide */}
      {dropSide === 'before' && <div className={DROP_INDICATOR_BEFORE} />}
      {dropSide === 'after' && <div className={DROP_INDICATOR_AFTER} />}

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
