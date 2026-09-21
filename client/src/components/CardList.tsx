// The one card list — a merged column's list, an expanded column's sub-row, an
// Unsorted group: the flex/gap container, the SortableContext, the KanbanCard
// wiring, the droppable-surface chrome, and the DragCarveFrame wrap when the
// list is a drag region.

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import KanbanCard, { CARD_LIST_GAP_CLASS } from './KanbanCard';
import { DragCarveFrame } from './BandGuides';

// The droppable surface's "a card is over me" highlight — a sub-row's own
// list applies it to itself (below); a merged column applies it to its body
// (BoardColumn.tsx), one level up, since its list isn't the droppable.
export const DROP_HIGHLIGHT_CLASS = 'bg-zinc-700/40 ring-2 ring-blue-500/30';

/** What makes this list a drag region (wiki board-drag-interaction §1) — a card list is one iff it's a merged column's list or an expanded column's sub-row; Unsorted's lists are drag-source only. */
export interface CardListRegionProps {
  /** `columnRegionKey` / `subrowRegionKey` from dragRegions.ts. */
  key: string;
  /** A done region: every band collapses to one (dragRegions.ts::bandFor). */
  isTerminal: boolean;
  /** The name a single collapsed band names itself after — "Move to {targetLabel}". */
  targetLabel: string;
}

interface CardListProps {
  items: Item[];
  itemTypes: ItemType[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  onCardClick: (id: string) => void;
  /** Set when this list is itself the dnd-kit droppable (an expanded column's sub-row) — adds the padded/rounded droppable-surface styling. Omit for a list whose droppable is an ancestor (a merged column's body) or that is drag-source only (Unsorted). */
  droppable?: boolean;
  /** Droppable node ref, from the caller's own `useDroppable`. Ignored unless `droppable` is set. */
  containerRef?: (element: HTMLElement | null) => void;
  /** Whether a dragged card is currently over this container. Ignored unless `droppable` is set. */
  isOver?: boolean;
  /** Whether a card is being dragged anywhere on the board — gates the isOver highlight. */
  isCardBeingDragged?: boolean;
  /** Registers the list (never a label above it) as a drag region via DragCarveFrame. Omit for an Inert list. */
  region?: CardListRegionProps;
}

// The three lists that used to each spell this wiring — BoardColumn's merged
// list, WorkphaseCardList (sub-rows and Unsorted groups), and before that
// UnsortedBucket's own (audit #21) — now spell it once (audit
// epic-3-5-story-4 #7). Two invariants the reservation math (Story 4.1
// Phase 1) leans on live here and nowhere else: every card list uses the
// one `CARD_LIST_GAP_CLASS`, and the list element is a plain flex column
// that DragCarveFrame's own `relative` wrap sits directly around.
export default function CardList({
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
  region,
}: CardListProps) {
  const showDropHighlight = droppable && isOver && isCardBeingDragged;
  let containerClass = `flex flex-col ${CARD_LIST_GAP_CLASS}`;
  if (droppable) {
    const surface = showDropHighlight ? DROP_HIGHLIGHT_CLASS : 'bg-zinc-800/20';
    containerClass = `${containerClass} p-1.5 rounded-lg min-h-[52px] transition-colors duration-200 ${surface}`;
  }

  // Built once — used either bare or wrapped below, and building it twice
  // would double-register the same sortable ids.
  const list = (
    <div ref={droppable ? containerRef : undefined} className={containerClass}>
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

  if (!region) return list;
  return (
    <DragCarveFrame
      regionKey={region.key}
      items={items}
      isTerminal={region.isTerminal}
      targetLabel={region.targetLabel}
    >
      {list}
    </DragCarveFrame>
  );
}
