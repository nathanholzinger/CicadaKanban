// One row in the project tree sidebar — dnd-kit sortable — and `DragGhost`, the
// copy of it the drag overlay carries. The dragged project's own row is the ghost: it
// slides to the gap with the strategy's transform, is drawn at the depth it would land at, and
// carries the drop line on its top edge.

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DropTier } from '../../lib/dragTargets';
import type { CarriedBranch } from '../../lib/hierarchyPlacement';
import type { FlatItem } from './projectTreeUtils';
import {
  ROW_CHEVRON_WIDTH_CLASS,
  ROW_GAP_CLASS,
  ROW_HANDLE_WIDTH_CLASS,
  projectNameIndentPx,
  projectRowIndentPx,
} from './projectTreeUtils';
import type { GhostState } from './useProjectDragReorder';
import {
  CarriedBranchLine,
  DROP_INDICATOR_LINE,
  DROP_LINE_SHAPE,
  GHOST_ROW,
  INVALID_PLACEMENT_CLASS,
  tierClass,
} from '../dragChrome';
import { DRAG_OVERLAY_ATTR } from '../workflow/dragRegions';
import { PlusIcon, TrashIcon, DragHandleIcon } from '../icons';

const ROW_ACTION_BTN =
  'w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-700 transition-colors';
const CHEVRON_BTN_BASE = `flex h-4 ${ROW_CHEVRON_WIDTH_CLASS} shrink-0 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-400`;
// The drop line while its tab state would put the dragged project's subtree past
// the project cap (wiki hierarchy-placement §6): the board's line in red. A
// placeholder look.
const INVALID_DROP_INDICATOR_LINE = `${DROP_LINE_SHAPE} bg-red-500/70`;

interface RowProps {
  item: FlatItem;
  selectedProjectId: string | null;
  /** Set on the dragged project's own row, the ghost: the depth it is drawn at and whether it carries the drop line. Null on every other row. */
  ghost: GhostState | null;
  /** What this row can be to the dragged project, which is how strongly it is drawn; none while nothing is dragged, and none for the dragged row. */
  tier: DropTier | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectProject: (id: string) => void;
  onCreateSubproject: (parentId: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function SortableProjectRow({
  item,
  selectedProjectId,
  ghost,
  tier,
  expandedIds,
  onToggleExpand,
  onSelectProject,
  onCreateSubproject,
  onDelete,
}: RowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { setNodeRef, transform, transition, attributes, listeners } = useSortable({ id: item.id });

  // Every row takes the strategy's transform, the dragged project's own among them: the strategy
  // moves it a whole slot at a time, to the gap, and the rows between slide a row's height aside.
  // It doesn't follow the cursor (the DragOverlay copy does), and dnd-kit measures a row without
  // its transform, so the box it hits the cursor against stays where the row was at pickup and
  // the gap can't flip back and forth under a still cursor.
  const style = {
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

  // The row's content is drawn by its tier (the board's classes, at the sidebar's own strengths),
  // the dragged project's row at the ghost's. The drop line sits outside this box, so it keeps its
  // own strength. The dragged project's descendants are not rows while it is carried
  // (`useProjectDragReorder.ts::drawnItems`), so none is drawn here to take a drop.
  function rowOpacityClass(): string {
    return ghost ? GHOST_ROW : tierClass(tier);
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
    <div
      ref={setNodeRef}
      style={style}
      // `data-drag-ghost` is a test surface: this row is the ghost, and the depth it is drawn at. It
      // sits above the rows it slides past, so its line is never covered by the row above.
      data-drag-ghost={ghost?.depth}
      className={ghost ? 'relative z-10' : 'relative'}
    >
      {/* Drop indicator line, along the ghost's top edge, between it and the row above. `data-drop-line` is a
          test surface: the depth it is drawn at, and `data-drop-invalid` that its tab state is past the
          project cap. */}
      {ghost?.line && (
        <div
          data-drop-line={ghost.depth}
          data-drop-invalid={ghost.invalid ? 'true' : undefined}
          className={`${ghost.invalid ? INVALID_DROP_INDICATOR_LINE : DROP_INDICATOR_LINE} -top-px`}
          style={{ marginLeft: projectNameIndentPx(ghost.depth) }}
        />
      )}

      <div
        data-drop-tier={tier ?? undefined}
        className={`group flex items-center ${ROW_GAP_CLASS} rounded-lg transition-colors select-none ${rowOpacityClass()} ${rowBackgroundClass()}`}
        style={{ padding: `6px 12px 6px ${projectRowIndentPx(ghost?.depth ?? item.depth)}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className={`flex ${ROW_HANDLE_WIDTH_CLASS} shrink-0 cursor-grab touch-none items-center justify-center text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-400 active:cursor-grabbing`}
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

// The carried copy, laid out as the project's row at `depth`: the row's padding and the room of
// its leading controls (`projectTreeUtils.ts`), so its name sits where the ghost's does and where
// the line starts. The overlay holds it to the list's width, so before any projection it draws
// exactly over the project's row. Its edge is a ring, which takes no room, so the name is not
// pushed in by it. `invalid`: its tab state would put the dragged subtree past the project cap,
// outlined as the board's copy is (`dragChrome.tsx::INVALID_PLACEMENT_CLASS`). Its
// `DRAG_OVERLAY_ATTR` is the E2E helper's "drag finished" wait: the copy outlives the drag by
// dnd-kit's drop animation. Its branch, if it has one, is said on a second line hung under the
// box, out of the flow, so what dnd-kit measures of the copy stays this one box
// (`dragChrome.tsx::CarriedBranchLine`).
export function DragGhost({
  name,
  depth,
  invalid = false,
  branch = null,
}: {
  name: string;
  depth: number;
  invalid?: boolean;
  branch?: Pick<CarriedBranch, 'children' | 'descendants'> | null;
}) {
  return (
    <div
      {...{ [DRAG_OVERLAY_ATTR]: 'true' }}
      className={`relative flex items-center ${ROW_GAP_CLASS} rounded-lg bg-zinc-700 py-1.5 pr-3 opacity-90 shadow-xl ring-1 ring-zinc-600 ${invalid ? INVALID_PLACEMENT_CLASS : ''}`}
      style={{ paddingLeft: projectRowIndentPx(depth) }}
    >
      <span className={`${ROW_HANDLE_WIDTH_CLASS} shrink-0`} />
      <span className={`${ROW_CHEVRON_WIDTH_CLASS} shrink-0`} />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-100">{name}</span>
      {branch && <CarriedBranchLine branch={branch} />}
    </div>
  );
}
