// The one card list — a merged column's list, an expanded column's sub-row, an
// Unsorted group: the flex/gap container, the SortableContext (and whether its
// rows slide, below), the KanbanCard wiring, the droppable-surface chrome, and
// the DragCarveFrame wrap when the list is a drag region.

import { SortableContext, verticalListSortingStrategy, type SortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import KanbanCard from './KanbanCard';
import { DragCarveFrame } from './BandGuides';
import { CARD_LIST_GAP_CLASS } from './cardMetrics';

// The droppable surface's "a card is over me" highlight — a sub-row's own
// list applies it to itself (below); a merged column applies it to its body
// (BoardColumn.tsx), one level up, since its list isn't the droppable.
export const DROP_HIGHLIGHT_CLASS = 'bg-zinc-700/40 ring-2 ring-blue-500/30';

/** What makes this list a drag region (wiki board-drag-interaction §1) — a card list is one iff it's a merged column's list or an expanded column's sub-row; Unsorted's lists are drag-source only. */
export interface CardListRegionProps {
  /** `columnRegionKey` / `subrowRegionKey` from dragRegions.ts. */
  key: string;
  /** A done region: every band collapses to one (dragBands.ts::bandFor). */
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
  /** Registers the list (never a label above it) as a drag region via DragCarveFrame. Omit for a list that is no region, such as Unsorted's. */
  region?: CardListRegionProps;
}

// A done list's rows never slide during a drag: its Free items carry no
// position and are ordered by completion, so there is no slot for the drag to
// choose and no gap for dnd-kit's shuffle to open. With no transform on any row,
// the carried item's ghost stays where a release will land it, as the placement
// already says (wiki board-drag-interaction §2, rule 6; `placement.ts::placementFor`
// reads no `over` in a terminal region).
const NO_SHUFFLE: SortingStrategy = () => null;

// Every card list's wiring, spelled once — BoardColumn's merged list and
// WorkphaseCardList's (sub-rows and Unsorted groups) render through it. Two
// invariants the reservation math leans on live here and nowhere else:
// every card list uses the one `CARD_LIST_GAP_CLASS`, and the list element
// is a plain flex column that DragCarveFrame's own `relative` wrap sits
// directly around.
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
  const droppableSurfaceClass = droppable
    ? `p-1.5 rounded-lg min-h-[52px] transition-colors duration-200 ${showDropHighlight ? DROP_HIGHLIGHT_CLASS : 'bg-zinc-800/20'}`
    : '';

  // A droppable list that's also a drag region (an expanded column's
  // sub-row) puts its padded/rounded surface chrome — and the droppable
  // node ref itself — on DragCarveFrame's own wrap instead of this div, so
  // the empty-zone label DragCarveFrame substitutes for `children` carries
  // the identical padding rather than a bare, unpadded box (otherwise the
  // two states would differ by the padding alone — a real layout jump on an
  // otherwise height-stable empty sub-row). A droppable list with no region
  // (a broken column's sub-row) has no such substitution to
  // matter for, so it keeps its own.
  const chromeOnFrame = droppable && region !== undefined;
  const containerClass = `flex flex-col ${CARD_LIST_GAP_CLASS} ${chromeOnFrame ? '' : droppableSurfaceClass}`;

  // Built once — used either bare or wrapped below, and building it twice
  // would double-register the same sortable ids.
  const list = (
    <div ref={chromeOnFrame ? undefined : droppable ? containerRef : undefined} className={containerClass}>
      <SortableContext
        items={items.map(i => i.id)}
        strategy={region?.isTerminal ? NO_SHUFFLE : verticalListSortingStrategy}
      >
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
      droppable={chromeOnFrame ? { containerRef: containerRef!, className: droppableSurfaceClass } : undefined}
    >
      {list}
    </DragCarveFrame>
  );
}
