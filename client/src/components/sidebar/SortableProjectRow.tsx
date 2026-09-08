import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FlatItem } from './projectTreeUtils';
import { INDENT_WIDTH } from './projectTreeUtils';
import { PlusIcon, TrashIcon, DragHandleIcon } from '../icons';

const ROW_ACTION_BTN =
  'w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-700 transition-colors';
const CHEVRON_BTN_BASE =
  'flex h-4 w-4 shrink-0 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-400';

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
  item,
  selectedProjectId,
  isActive,
  isDescendantOfActive,
  showIndicator,
  indicatorDepth,
  expandedIds,
  onToggleExpand,
  onSelectProject,
  onCreateSubproject,
  onDelete,
}: RowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: item.id });

  // When this item is the active drag, don't apply the transform — we're using DragOverlay
  // for the ghost, so the original element must stay at its DOM position. If we moved it
  // with the cursor, its droppable would follow and closestCenter would always return it,
  // preventing other items from ever becoming the collision target.
  const style = isDragging
    ? {}
    : {
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
          className="pointer-events-none absolute -top-px right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: 12 + indicatorDepth * INDENT_WIDTH }}
        />
      )}

      <div
        className={`group flex items-center gap-1 rounded-lg transition-colors select-none ${rowOpacityClass()} ${rowBackgroundClass()}`}
        style={{ padding: `6px 12px 6px ${12 + item.depth * INDENT_WIDTH}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex w-3 shrink-0 cursor-grab touch-none items-center justify-center text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-400 active:cursor-grabbing"
          tabIndex={-1}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <DragHandleIcon width={8} height={12} cx1={2} cx2={6} cyTop={2} cyMid={6} cyBot={10} r={1.2} />
        </button>

        {/* Expand/collapse chevron */}
        <button
          onClick={() => onToggleExpand(item.id)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          title={isExpanded ? 'Collapse' : 'Expand'}
          className={`${CHEVRON_BTN_BASE} ${!item.hasChildren ? 'invisible' : ''}`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={isExpanded ? 'M2 3.5l3 3 3-3' : 'M3.5 2l3 3-3 3'} />
          </svg>
        </button>

        {/* Project name */}
        <button
          onClick={() => onSelectProject(item.id)}
          disabled={deleting}
          className={`min-w-0 flex-1 truncate p-0 text-left text-sm transition-colors ${nameButtonClass()}`}
        >
          {item.project.name}
        </button>

        {/* Actions */}
        {deleting ? (
          <span className="ml-1 shrink-0 text-xs text-red-500/70">Deleting…</span>
        ) : confirmDelete ? (
          <div className="ml-1 flex shrink-0 items-center gap-1">
            <span className="text-xs text-zinc-500">Delete?</span>
            <button
              onClick={handleConfirmDelete}
              className="rounded px-1 py-0.5 text-xs text-red-400 transition-colors hover:bg-zinc-700 hover:text-red-300"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-1 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            >
              No
            </button>
          </div>
        ) : (
          <div className="ml-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
            <button
              onClick={() => onCreateSubproject(item.id)}
              className={`${ROW_ACTION_BTN} hover:text-zinc-200`}
              aria-label="Add subproject"
              title="Add subproject"
            >
              <PlusIcon />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className={`${ROW_ACTION_BTN} hover:text-red-400`}
              aria-label="Delete project"
              title="Delete project"
            >
              <TrashIcon size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DragGhost({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 opacity-90 shadow-xl">
      <span className="max-w-[160px] truncate text-sm text-zinc-100">{name}</span>
    </div>
  );
}
