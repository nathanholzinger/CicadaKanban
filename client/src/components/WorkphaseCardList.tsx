import type { Item, ItemType } from '../types';
import CardList from './CardList';

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
  /** Set when this list is a drop target (ExpandedSubRow) — see CardList's own prop. Omit for a drag-source-only list (e.g. Unsorted). */
  droppable?: boolean;
  /** Droppable node ref, from the caller's own `useDroppable`. Ignored unless `droppable` is set. */
  containerRef?: (element: HTMLElement | null) => void;
  /** Whether a dragged card is currently over this container. Ignored unless `droppable` is set. */
  isOver?: boolean;
  /** Whether a card is being dragged anywhere on the board — gates the isOver highlight. */
  isCardBeingDragged?: boolean;
  /** Registers the card list (never the label above it) as a drag region — an expanded column's sub-row. */
  regionKey?: string;
  /** A done sub-row: every band collapses to one (dragBands.ts::bandFor). Ignored unless `regionKey` is set. */
  isTerminal?: boolean;
}

// A workphase sub-header (name + count) over a CardList — the shape
// BoardColumn's ExpandedSubRow and UnsortedBucket's workphase groups share.
// The list itself is CardList's; this is only the header and the region
// props' translation.
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
  const region = regionKey ? { key: regionKey, isTerminal, targetLabel: label } : undefined;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 px-1">
        <span className={labelClassName} title={labelTitle}>
          {label}
        </span>
        <span className="text-[10px] text-zinc-600">{items.length}</span>
      </div>
      <CardList
        items={items}
        itemTypes={itemTypes}
        childCounts={childCounts}
        getAttachedChildren={getAttachedChildren}
        defaultExpanded={defaultExpanded}
        onCardClick={onCardClick}
        droppable={droppable}
        containerRef={containerRef}
        isOver={isOver}
        isCardBeingDragged={isCardBeingDragged}
        region={region}
      />
    </div>
  );
}
