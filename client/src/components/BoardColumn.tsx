import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Column, Item, ItemType, Workphase } from '../types';
import KanbanCard from './KanbanCard';
import ConfirmDeleteButton from './ConfirmDeleteButton';
import { COUNT_BADGE, AttentionBadge } from './boardBadges';
import WorkphaseCardList from './WorkphaseCardList';
import { subrowContainerId } from './workflow/boardDndUtils';
import { INPUT_LG_RING } from './item-detail/pillUtils';

interface BoardColumnProps {
  column: Column;
  getWorkphaseItems: (workphaseId: string, isTerminal?: boolean) => Item[];
  getMergedColumnItems: (coveredWorkphaseIds: readonly string[], isTerminal?: boolean) => Item[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  itemTypes: ItemType[];
  isCardBeingDragged: boolean;
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
  isCardBeingDragged,
  onCreateItem,
  onCardClick,
  onEdit,
  onDelete,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<string>('');
  const [deleteError, setDeleteError] = useState('');

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

  function handleItemSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateItem(column.entryWorkphaseId, newTitle.trim(), newType || null);
    setNewTitle('');
    setIsAdding(false);
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
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5" />
            <circle cx="7.5" cy="2.5" r="1.5" />
            <circle cx="2.5" cy="7" r="1.5" />
            <circle cx="7.5" cy="7" r="1.5" />
            <circle cx="2.5" cy="11.5" r="1.5" />
            <circle cx="7.5" cy="11.5" r="1.5" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h3
            onClick={() => onEdit?.(column)}
            className={`truncate text-sm font-semibold tracking-wide text-zinc-300 ${onEdit ? 'cursor-pointer hover:text-zinc-100' : ''}`}
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

      {/* Body */}
      <div
        className={`flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-colors duration-200 ${showDropHighlight ? 'bg-zinc-700/40 ring-2 ring-blue-500/30' : 'bg-zinc-800/30'} `}
      >
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
              onCardClick={onCardClick}
            />
          ))
        ) : (
          <>
            <SortableContext items={mergedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {mergedItems.map(item => (
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
            {mergedItems.length === 0 && !(isOver && isCardBeingDragged) && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-zinc-600">Drop cards here</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add item form */}
      <div className="mt-2 px-1">
        {isAdding ? (
          <form onSubmit={handleItemSubmit} className="space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Item title..."
              className={`w-full ${INPUT_LG_RING}`}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTitle('');
                }
              }}
            />
            <div className="flex items-center gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-blue-500/50 focus:outline-none"
              >
                {itemTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              setIsAdding(true);
              setNewType(itemTypes[0]?.id ?? '');
            }}
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
    />
  );
}
