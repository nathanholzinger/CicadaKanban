import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState } from 'react';
import type { WorkPhase, Item, ItemType } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  column: WorkPhase;
  items: Item[];
  childCounts: Record<string, number>;
  itemTypes: ItemType[];
  isCardBeingDragged: boolean;
  onCreateItem: (workphaseId: string, title: string, type: string | null) => void;
  onCardClick: (id: string) => void;
  onRename?: (id: string, name: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function KanbanColumn({
  column, items, childCounts, itemTypes, isCardBeingDragged,
  onCreateItem, onCardClick, onRename, onDelete,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    attributes,
    listeners,
  } = useSortable({ id: column.id, data: { type: 'workphase' } });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const sortedItems = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  function handleItemSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateItem(column.id, newTitle.trim(), newType || null);
    setNewTitle('');
    setIsAdding(false);
  }

  async function handleRenameBlur() {
    const trimmed = renameDraft.trim();
    setIsRenaming(false);
    if (!trimmed || trimmed === column.name || !onRename) return;
    await onRename(column.id, trimmed);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleteError('');
    try {
      await onDelete(column.id);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete workphase.');
      setConfirmDelete(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="group"
      aria-label={column.name}
      className={`flex flex-col w-72 shrink-0 ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none p-0.5 rounded"
          tabIndex={-1}
          title="Drag to reorder"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
            <circle cx="2.5" cy="7" r="1.5" /><circle cx="7.5" cy="7" r="1.5" />
            <circle cx="2.5" cy="11.5" r="1.5" /><circle cx="7.5" cy="11.5" r="1.5" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              autoFocus
              value={renameDraft}
              onChange={e => setRenameDraft(e.target.value)}
              onBlur={handleRenameBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') renameInputRef.current?.blur();
                if (e.key === 'Escape') { setIsRenaming(false); }
              }}
              className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-blue-500/60"
            />
          ) : (
            <h3
              onClick={() => { if (!onRename) return; setRenameDraft(column.name); setIsRenaming(true); setConfirmDelete(false); }}
              className={`text-sm font-semibold text-zinc-300 tracking-wide truncate ${onRename ? 'cursor-text hover:text-zinc-100' : ''}`}
              title={onRename ? 'Click to rename' : undefined}
            >
              {column.name}
            </h3>
          )}
        </div>

        <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full shrink-0">
          {items.length}
        </span>

        {column.isTerminal === 1 && (
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
            done
          </span>
        )}

        {/* Delete — hidden when onDelete not provided (read-only mode) */}
        {onDelete && confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-500/10"
            >
              Delete
            </button>
            <button
              onClick={() => { setConfirmDelete(false); setDeleteError(''); }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        ) : onDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors p-0.5 rounded"
            title="Delete workphase"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        ) : null}
      </div>

      {deleteError && (
        <p className="text-[11px] text-red-400 px-1 mb-2">{deleteError}</p>
      )}

      {/* Card drop zone */}
      <div className={`
        flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[120px] overflow-y-auto
        transition-colors duration-200
        ${isOver && isCardBeingDragged ? 'bg-zinc-700/40 ring-2 ring-blue-500/30' : 'bg-zinc-800/30'}
      `}>
        <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {sortedItems.map(item => (
            <KanbanCard key={item.id} item={item} itemTypes={itemTypes} childCount={childCounts[item.id] ?? 0} onCardClick={onCardClick} />
          ))}
        </SortableContext>

        {sortedItems.length === 0 && !(isOver && isCardBeingDragged) && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-zinc-600">Drop cards here</p>
          </div>
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
              className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              onKeyDown={e => { if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); } }}
            />
            <div className="flex items-center gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/50"
              >
                {itemTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="submit" className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setNewTitle(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => { setIsAdding(true); setNewType(itemTypes[0]?.id ?? ''); }}
            className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  );
}
