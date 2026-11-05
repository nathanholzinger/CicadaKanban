// Project tree with dnd-kit drag reorder (server-resolved via prevId/nextId;
// the drag itself is `sidebar/useProjectDragReorder.ts`), and a handle on its
// right edge that sets its width (`sidebar/useSidebarResize.ts`). Which projects
// are collapsed is `App.tsx`'s (`sidebar/useCollapsedProjects.ts`): a write there can open one.
// A move sent and not yet answered is drawn already: its parent is in the `projects` it is given, and
// its place among the siblings is in `pendingMoves` (`App.tsx`).

import { DndContext, DragOverlay, closestCenter, type Modifier } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Project } from '../types';
import type { PendingMove } from '../lib/hierarchy';
import { flattenTree } from './sidebar/projectTreeUtils';
import { useProjectDragReorder, type ReorderProject } from './sidebar/useProjectDragReorder';
import { useSidebarResize } from './sidebar/useSidebarResize';
import { SortableProjectRow, DragGhost } from './sidebar/SortableProjectRow';
import { PlusIcon, ICON_BUTTON_SM } from './icons';

// The carried copy is held to the list's width: its x stays where it was picked up, and it follows the
// pointer up and down. On the overlay alone, so the drag's own `delta.x`, which the depth reads, is the
// pointer's travel, and the box dnd-kit hits against moves with the pointer.
const HOLD_COPY_X: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const COPY_MODIFIERS = [HOLD_COPY_X];

interface ProjectSidebarProps {
  /** The tree to draw, with the parent of every move still out laid over (`lib/hierarchy.ts::withMoveApplied`). */
  projects: Project[];
  /** The moves sent and not yet answered, oldest first, whose place among the siblings the order reads. */
  pendingMoves: readonly PendingMove[];
  /** The project depth cap the drag offers tab states against; null until it's known. */
  projectDepthCap: number | null;
  selectedProjectId: string | null;
  /** The projects the user collapsed; every other project is open, a new one included. */
  collapsedIds: ReadonlySet<string>;
  onToggleCollapse: (id: string) => void;
  /** Opens a collapsed project a drop put a project under. */
  onExpandProject: (id: string) => void;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProject: ReorderProject;
}

export default function ProjectSidebar({
  projects,
  pendingMoves,
  projectDepthCap,
  selectedProjectId,
  collapsedIds,
  onToggleCollapse,
  onExpandProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onReorderProject,
}: ProjectSidebarProps) {
  const expandedIds = new Set(projects.map(p => p.id).filter(id => !collapsedIds.has(id)));
  const flatItems = flattenTree(projects, expandedIds, pendingMoves);

  const drag = useProjectDragReorder(
    projects,
    flatItems,
    onReorderProject,
    onExpandProject,
    projectDepthCap,
    pendingMoves,
  );
  const resize = useSidebarResize();

  // The list scrolls in a box inside the aside, so the handle on the aside's edge
  // stays put while the list scrolls.
  return (
    <aside className="relative flex shrink-0 flex-col border-r border-zinc-800" style={{ width: resize.width }}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Projects</span>
          <button
            onClick={() => onCreateProject(undefined)}
            className={ICON_BUTTON_SM}
            aria-label="New project"
            title="New project"
          >
            <PlusIcon />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="px-4 py-3 text-xs text-zinc-600">No projects yet.</p>
        ) : (
          <DndContext
            sensors={drag.sensors}
            collisionDetection={closestCenter}
            onDragStart={drag.handleDragStart}
            onDragMove={drag.handleDragMove}
            onDragEnd={drag.handleDragEnd}
            onDragCancel={drag.handleDragCancel}
          >
            <SortableContext items={drag.rowIds} strategy={verticalListSortingStrategy}>
              <div className="pb-4" style={drag.tierVars}>
                {drag.drawnItems.map(item => (
                  <SortableProjectRow
                    key={item.id}
                    item={item}
                    selectedProjectId={selectedProjectId}
                    ghost={item.id === drag.activeItem?.id ? drag.ghost : null}
                    tier={drag.tiers.get(item.id) ?? null}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleCollapse}
                    onSelectProject={onSelectProject}
                    onCreateSubproject={onCreateProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            </SortableContext>

            {/* The default drop animation: a move is drawn at the release, so the project's row is at its new
                place when the copy glides to it, and an end that writes nothing glides the copy back to the
                project's own slot, where the ghost returns. */}
            <DragOverlay modifiers={COPY_MODIFIERS}>
              {drag.activeItem && drag.ghost && (
                <DragGhost
                  name={drag.activeItem.project.name}
                  depth={drag.ghost.depth}
                  invalid={drag.ghost.invalid}
                  branch={drag.branch}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        {...resize.handleProps}
        className={`absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none select-none ${resize.resizing ? 'bg-zinc-600' : 'hover:bg-zinc-700'}`}
      />
    </aside>
  );
}
