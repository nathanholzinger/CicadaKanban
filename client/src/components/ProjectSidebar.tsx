// Project tree with dnd-kit drag reorder (server-resolved via prevId/nextId;
// the drag itself is `sidebar/useProjectDragReorder.ts`).

import { useState } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Project } from '../types';
import { flattenTree } from './sidebar/projectTreeUtils';
import { useProjectDragReorder, type ReorderProject } from './sidebar/useProjectDragReorder';
import { SortableProjectRow, DragGhost } from './sidebar/SortableProjectRow';
import { PlusIcon, ICON_BUTTON_SM } from './icons';

interface ProjectSidebarProps {
  projects: Project[];
  /** The project depth cap the drag offers tab states against; null until it's known. */
  projectDepthCap: number | null;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProject: ReorderProject;
}

export default function ProjectSidebar({
  projects,
  projectDepthCap,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onReorderProject,
}: ProjectSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(projects.map(p => p.id)));
  const flatItems = flattenTree(projects, expandedIds);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // A project dropped into a collapsed parent opens it.
  function expand(id: string) {
    setExpandedIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  }

  const drag = useProjectDragReorder(projects, flatItems, onReorderProject, expand, projectDepthCap);

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-zinc-800">
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
            <div className="pb-4">
              {flatItems.map(item => (
                <SortableProjectRow
                  key={item.id}
                  item={item}
                  selectedProjectId={selectedProjectId}
                  isActive={item.id === drag.activeItem?.id}
                  isDescendantOfActive={drag.descendantIds.has(item.id)}
                  indicatorSide={drag.dropLine?.anchorId === item.id ? drag.dropLine.side : null}
                  indicatorDepth={drag.projectedDepth ?? item.depth}
                  indicatorInvalid={drag.dropInvalid}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onSelectProject={onSelectProject}
                  onCreateSubproject={onCreateProject}
                  onDelete={onDeleteProject}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>{drag.activeItem && <DragGhost name={drag.activeItem.project.name} />}</DragOverlay>
        </DndContext>
      )}
    </aside>
  );
}
