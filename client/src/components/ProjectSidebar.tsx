// Project tree with dnd-kit drag reorder (server-resolved via prevId/nextId;
// the drag itself is `sidebar/useProjectDragReorder.ts`), and a handle on its
// right edge that sets its width (`sidebar/useSidebarResize.ts`). Which projects
// are collapsed is `App.tsx`'s (`sidebar/useCollapsedProjects.ts`): a write there can open one.

import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Project } from '../types';
import { flattenTree } from './sidebar/projectTreeUtils';
import { useProjectDragReorder, type ReorderProject } from './sidebar/useProjectDragReorder';
import { useSidebarResize } from './sidebar/useSidebarResize';
import { SortableProjectRow, DragGhost } from './sidebar/SortableProjectRow';
import { PlusIcon, ICON_BUTTON_SM } from './icons';

interface ProjectSidebarProps {
  projects: Project[];
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
  const flatItems = flattenTree(projects, expandedIds);

  const drag = useProjectDragReorder(projects, flatItems, onReorderProject, onExpandProject, projectDepthCap);
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
                    isActive={item.id === drag.activeItem?.id}
                    tier={drag.tiers.get(item.id) ?? null}
                    indicatorSide={drag.dropLine?.anchorId === item.id ? drag.dropLine.side : null}
                    indicatorDepth={drag.projectedDepth ?? item.depth}
                    indicatorInvalid={drag.dropInvalid}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleCollapse}
                    onSelectProject={onSelectProject}
                    onCreateSubproject={onCreateProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            </SortableContext>

            {/* No drop animation: a move is drawn when its response lands, so the project's row is where it was
                picked up, and a copy gliding to it would read as the drop landing there. The line is the cue. */}
            <DragOverlay dropAnimation={null}>
              {drag.activeItem && <DragGhost name={drag.activeItem.project.name} branch={drag.branch} />}
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
