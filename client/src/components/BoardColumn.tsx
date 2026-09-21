// Droppable column — merged (one swimlane) or per-workphase expanded sub-rows.

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Column, Item, ItemType, Workphase } from '../types';
import CardList, { DROP_HIGHLIGHT_CLASS } from './CardList';
import ConfirmDeleteButton from './ConfirmDeleteButton';
import { COUNT_BADGE, AttentionBadge } from './boardBadges';
import WorkphaseCardList from './WorkphaseCardList';
import { subrowContainerId } from './workflow/boardDndUtils';
import { columnRegionKey, subrowRegionKey } from './workflow/dragRegions';
import { useDragSession, useIsCardBeingDragged } from './workflow/DragSessionContext';
import InlineItemForm from './InlineItemForm';
import { DragHandleIcon } from './icons';

const COLUMN_TITLE_BASE = 'truncate text-sm font-semibold tracking-wide text-zinc-300';
const COLUMN_BODY_BASE = 'flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-colors duration-200';

interface BoardColumnProps {
  column: Column;
  getWorkphaseItems: (workphaseId: string, isTerminal?: boolean) => Item[];
  getMergedColumnItems: (coveredWorkphaseIds: readonly string[], isTerminal?: boolean) => Item[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  itemTypes: ItemType[];
  onCreateItem: (workphaseId: string, title: string, type: string | null) => void;
  onCardClick: (id: string) => void;
  onEdit?: (column: Column) => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function BoardColumn({
  column,
  getWorkphaseItems,
  getMergedColumnItems,
  childCounts,
  getAttachedChildren,
  defaultExpanded,
  itemTypes,
  onCreateItem,
  onCardClick,
  onEdit,
  onDelete,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const isCardBeingDragged = useIsCardBeingDragged();
  const session = useDragSession();

  const { setNodeRef, transform, transition, isDragging, isOver, attributes, listeners } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  // A column can't span both terminal and non-terminal workphases (Epic 3.2
  // Part 6's column-range validation) — isTerminal is uniform across the
  // whole covered set, so any sub-row's flag is representative.
  const columnIsTerminal = Boolean(column.subRows[0]?.workphase.isTerminal);
  const totalItems = column.subRows.reduce((n, r) => n + getWorkphaseItems(r.workphase.id, columnIsTerminal).length, 0);
  // Epic 3.2 Part 4: union-sorted across the covered set, not a
  // concatenation of independently-sorted per-workphase lists — this is
  // what makes cross-workphase interleaving visible and draggable.
  const mergedItems = getMergedColumnItems(
    column.subRows.map(r => r.workphase.id),
    columnIsTerminal,
  );
  // A merged (not broken) column highlights as a drop target only while a card
  // is actively being dragged over it — expanded columns highlight per sub-row instead.
  const showDropHighlight = !column.broken && column.displayMode === 'merged' && isOver && isCardBeingDragged;
  // A merged column's list is one drag region (wiki board-drag-interaction
  // §1). The list's own flex/gap is CardList's, self-contained rather than
  // relying on COLUMN_BODY_BASE's gap-2 — DragCarveFrame's wrap div sits
  // between them and isn't itself a flex container, since its carve-out
  // math depends on a plain `relative` box with no extra spacing.
  const mergedRegion =
    column.displayMode === 'merged' && !column.broken
      ? { key: columnRegionKey(column.id), isTerminal: columnIsTerminal, targetLabel: column.displayName }
      : undefined;

  function handleItemSubmit(title: string, type: string | null): boolean {
    onCreateItem(column.entryWorkphaseId, title, type);
    return true;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="group"
      aria-label={column.displayName}
      className={`flex w-72 shrink-0 flex-col ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center gap-1.5 px-1">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
          tabIndex={-1}
          title="Drag to reorder"
        >
          <DragHandleIcon />
        </button>

        <div className="min-w-0 flex-1">
          <h3
            onClick={() => onEdit?.(column)}
            className={`${COLUMN_TITLE_BASE} ${onEdit ? 'cursor-pointer hover:text-zinc-100' : ''}`}
            title={onEdit ? 'Click to edit column' : undefined}
          >
            {column.displayName}
          </h3>
        </div>

        <span className={COUNT_BADGE}>{totalItems}</span>

        {column.broken && (
          <AttentionBadge title="This column's range no longer resolves cleanly after a workphase reorder — move items out, then fix its range.">
            broken
          </AttentionBadge>
        )}

        {onDelete && (
          <ConfirmDeleteButton
            onDelete={() => onDelete(column.id)}
            title="Delete column"
            errorFallback="Failed to delete column."
            onError={setDeleteError}
            triggerClassName="shrink-0 p-0.5 rounded"
          />
        )}
      </div>

      {deleteError && <p className="mb-2 px-1 text-[11px] text-red-400">{deleteError}</p>}

      {/* Body — a merged column's card list is one drag region (wiki
          board-drag-interaction §1); an expanded column's sub-rows each
          register their own below, and its wrapper is Inert. A broken
          column registers none. The region sits *inside* the scrolling
          body (Story 8 re-plan) rather than being a non-scrolling wrapper
          around it, so it's found as a real scroll ancestor the same way a
          sub-row's already is, and sizes to its own content rather than
          the column's available height — a short column no longer strands
          its bottom band far below the last card. */}
      <div className="relative flex min-h-[120px] flex-1 flex-col">
        <div className={`${COLUMN_BODY_BASE} ${showDropHighlight ? DROP_HIGHLIGHT_CLASS : 'bg-zinc-800/30'}`}>
          {column.displayMode === 'expanded' ? (
            column.subRows.map(row => (
              <ExpandedSubRow
                key={row.workphase.id}
                columnId={column.id}
                workphase={row.workphase}
                items={getWorkphaseItems(row.workphase.id, Boolean(row.workphase.isTerminal))}
                itemTypes={itemTypes}
                childCounts={childCounts}
                getAttachedChildren={getAttachedChildren}
                defaultExpanded={defaultExpanded}
                isCardBeingDragged={isCardBeingDragged && !column.broken}
                regionKey={column.broken ? undefined : subrowRegionKey(column.id, row.workphase.id)}
                onCardClick={onCardClick}
              />
            ))
          ) : (
            <>
              <CardList
                items={mergedItems}
                itemTypes={itemTypes}
                childCounts={childCounts}
                getAttachedChildren={getAttachedChildren}
                defaultExpanded={defaultExpanded}
                onCardClick={onCardClick}
                region={mergedRegion}
              />
              {/* Story 8's own "Move to {name}" carve (above) takes over
                  this same message during a Card drag; a Stub drag never
                  reaches the pop machine at all (DragSessionContext.ts), so
                  this is still what it — and no drag at all — falls back to. */}
              {mergedItems.length === 0 && !(isOver && isCardBeingDragged) && !session?.pop && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-xs text-zinc-600">Drop cards here</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add item form */}
      <div className="mt-2 px-1">
        {isAdding ? (
          <InlineItemForm
            itemTypes={itemTypes}
            initialType={itemTypes[0]?.id ?? ''}
            includeNoTypeOption={false}
            placeholder="Item title..."
            onSubmit={handleItemSubmit}
            onDone={() => setIsAdding(false)}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full rounded-lg py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800/50 hover:text-zinc-300"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  );
}

interface ExpandedSubRowProps {
  columnId: string;
  workphase: Workphase;
  items: Item[];
  itemTypes: ItemType[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  isCardBeingDragged: boolean;
  regionKey?: string;
  onCardClick: (id: string) => void;
}

function ExpandedSubRow({
  columnId,
  workphase,
  items,
  itemTypes,
  childCounts,
  getAttachedChildren,
  defaultExpanded,
  isCardBeingDragged,
  regionKey,
  onCardClick,
}: ExpandedSubRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: subrowContainerId(columnId, workphase.id) });

  return (
    <WorkphaseCardList
      label={workphase.name}
      items={items}
      itemTypes={itemTypes}
      childCounts={childCounts}
      getAttachedChildren={getAttachedChildren}
      defaultExpanded={defaultExpanded}
      onCardClick={onCardClick}
      droppable
      containerRef={setNodeRef}
      isOver={isOver}
      isCardBeingDragged={isCardBeingDragged}
      regionKey={regionKey}
      isTerminal={Boolean(workphase.isTerminal)}
    />
  );
}
