import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import KanbanCard, { CARD_LIST_GAP_CLASS } from './KanbanCard';
import { DragCarveFrame } from './BandGuides';
import { useDragSession } from './workflow/DragSessionContext';

const DEFAULT_LABEL_CLASS = 'text-[11px] font-medium text-zinc-500 truncate';

interface WorkphaseCardListProps {
  /** Header text — a workphase name, or a synthetic label like "Unknown status". */
  label: string;
  /** Overrides the default zinc label style (e.g. UnsortedBucket's amber "Unknown status"). */
  labelClassName?: string;
  /** Tooltip on the label. */
  labelTitle?: string;
  items: Item[];
  itemTypes: ItemType[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  onCardClick: (id: string) => void;
  /** Set when this list is a drop target (ExpandedSubRow) — adds the
   *  padded/rounded droppable-surface styling below. Omit for a
   *  drag-source-only list (e.g. Unsorted). */
  droppable?: boolean;
  /** Droppable node ref, from the caller's own `useDroppable`. Ignored unless `droppable` is set. */
  containerRef?: (element: HTMLElement | null) => void;
  /** Whether a dragged card is currently over this container. Ignored unless `droppable` is set. */
  isOver?: boolean;
  /** Whether a card is being dragged anywhere on the board — gates the isOver highlight. */
  isCardBeingDragged?: boolean;
  /** Epic 3.5: passed to DragCarveFrame, which registers the card-list (never the label above it) as a drag region — an expanded column's sub-row. */
  regionKey?: string;
  /** A done sub-row: every band collapses to one (dragRegions.ts::bandFor). Ignored unless `regionKey` is set. */
  isTerminal?: boolean;
}

// A workphase sub-header (name + count) plus its card list — the shape
// BoardColumn's ExpandedSubRow and UnsortedBucket's workphase groups both
// independently re-implemented with an identical KanbanCard prop set (audit
// finding #21). Single-sources that wiring so it can't drift as KanbanCard's
// props evolve.
export default function WorkphaseCardList({
  label,
  labelClassName = DEFAULT_LABEL_CLASS,
  labelTitle,
  items,
  itemTypes,
  childCounts,
  getAttachedChildren,
  defaultExpanded,
  onCardClick,
  droppable = false,
  containerRef,
  isOver,
  isCardBeingDragged,
  regionKey,
  isTerminal = false,
}: WorkphaseCardListProps) {
  const showDropHighlight = droppable && isOver && isCardBeingDragged;
  const dropHighlightClass = showDropHighlight ? 'bg-zinc-700/40 ring-2 ring-blue-500/30' : 'bg-zinc-800/20';
  // Story 4.1 Phase 1: whether the active drag's own item is currently
  // rendered as one of *this* list's own cards — by list membership, not
  // by whether this list is the live hover target right now
  // (DragCarveFrame's own `hasActiveItemRow` doc comment has the case that
  // distinguishes them).
  const activeItemId = useDragSession()?.activeItem.id;
  const hasActiveItemRow = items.some(i => i.id === activeItemId);
  // The two card lists (this one, and BoardColumn's merged list) share
  // exactly one gap constant — the carve-out reservation math (Story 4.1
  // Phase 1) depends on both lists actually using the same value, not just
  // two classes that happen to render the same.
  let containerClass = `flex flex-col ${CARD_LIST_GAP_CLASS}`;
  if (droppable) {
    containerClass = `flex flex-col ${CARD_LIST_GAP_CLASS} p-1.5 rounded-lg min-h-[52px] transition-colors duration-200 ${dropHighlightClass}`;
  }

  const list = (
    <div ref={containerRef} className={containerClass}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <KanbanCard
            key={item.id}
            item={item}
            itemTypes={itemTypes}
            childCount={childCounts[item.id] ?? 0}
            getAttachedChildren={getAttachedChildren}
            defaultExpanded={defaultExpanded}
            onCardClick={onCardClick}
          />
        ))}
      </SortableContext>
    </div>
  );

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 px-1">
        <span className={labelClassName} title={labelTitle}>
          {label}
        </span>
        <span className="text-[10px] text-zinc-600">{items.length}</span>
      </div>
      {regionKey ? (
        <DragCarveFrame
          regionKey={regionKey}
          cardCount={items.length}
          hasActiveItemRow={hasActiveItemRow}
          isTerminal={isTerminal}
          targetLabel={label}
        >
          {list}
        </DragCarveFrame>
      ) : (
        list
      )}
    </div>
  );
}
