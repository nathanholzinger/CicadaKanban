import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FlatItem } from './projectTreeUtils';
import { INDENT_WIDTH } from './projectTreeUtils';

const ROW_ACTION_BTN = 'w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-700 transition-colors';

interface RowProps {
  item: FlatItem;
  selectedProjectId: string | null;
  isActive: boolean;
  isDescendantOfActive: boolean;
  showIndicator: boolean;
  indicatorDepth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectProject: (id: string) => void;
  onCreateSubproject: (parentId: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function SortableProjectRow({
  item, selectedProjectId, isActive, isDescendantOfActive,
  showIndicator, indicatorDepth,
  expandedIds, onToggleExpand, onSelectProject, onCreateSubproject, onDelete,
}: RowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: item.id });

  // When this item is the active drag, don't apply the transform — we're using DragOverlay
  // for the ghost, so the original element must stay at its DOM position. If we moved it
  // with the cursor, its droppable would follow and closestCenter would always return it,
  // preventing other items from ever becoming the collision target.
  const style = isDragging ? {} : {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedProjectId === item.id;

  function nameButtonClass(): string {
    if (deleting) return 'cursor-default text-red-400';
    if (isSelected) return 'cursor-pointer text-zinc-100';
    return 'cursor-pointer text-zinc-300 hover:text-zinc-100';
  }

  function rowOpacityClass(): string {
    if (isActive) return 'opacity-40';
    if (isDescendantOfActive) return 'opacity-40 pointer-events-none';
    return '';
  }

  function rowBackgroundClass(): string {
    if (deleting) return 'bg-red-950/60';
    if (isSelected) return 'bg-zinc-700/60';
    return 'hover:bg-zinc-800/50';
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drop indicator line */}
      {showIndicator && (
        <div
          className="absolute -top-px left-0 right-0 z-10 h-0.5 rounded-full bg-blue-500 pointer-events-none"
          style={{ marginLeft: 12 + indicatorDepth * INDENT_WIDTH }}
        />
      )}

      <div
        className={`group flex items-center gap-1 rounded-lg select-none transition-colors ${rowOpacityClass()} ${rowBackgroundClass()}`}
        style={{ padding: `6px 12px 6px ${12 + item.depth * INDENT_WIDTH}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 w-3 flex items-center justify-center text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={-1}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
            <circle cx="2" cy="6" r="1.2" /><circle cx="6" cy="6" r="1.2" />
            <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
          </svg>
        </button>

        {/* Expand/collapse chevron */}
        <button
          onClick={() => onToggleExpand(item.id)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          title={isExpanded ? 'Collapse' : 'Expand'}
          className={`w-4 h-4 shrink-0 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors ${!item.hasChildren ? 'invisible' : ''}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={isExpanded ? 'M2 3.5l3 3 3-3' : 'M3.5 2l3 3-3 3'} />
          </svg>
        </button>

        {/* Project name */}
        <button
          onClick={() => onSelectProject(item.id)}
          disabled={deleting}
          className={`flex-1 min-w-0 truncate p-0 text-left text-sm transition-colors ${nameButtonClass()}`}
        >
          {item.project.name}
        </button>

        {/* Actions */}
        {deleting ? (
          <span className="text-xs text-red-500/70 shrink-0 ml-1">Deleting…</span>
        ) : confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <span className="text-xs text-zinc-500">Delete?</span>
            <button
              onClick={handleConfirmDelete}
              className="text-xs text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-zinc-700 transition-colors"
            >Yes</button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-700 transition-colors"
            >No</button>
          </div>
        ) : (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
            <button
              onClick={() => onCreateSubproject(item.id)}
              className={`${ROW_ACTION_BTN} hover:text-zinc-200`}
              aria-label="Add subproject"
              title="Add subproject"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5.5 1.5v8M1.5 5.5h8" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className={`${ROW_ACTION_BTN} hover:text-red-400`}
              aria-label="Delete project"
              title="Delete project"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 2.5h8M3.5 2.5V1.5h4v1M4.5 4.5v3M6.5 4.5v3M2.5 2.5l.6 6h5l.6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DragGhost({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 shadow-xl opacity-90">
      <span className="text-sm text-zinc-100 truncate max-w-[160px]">{name}</span>
    </div>
  );
}
