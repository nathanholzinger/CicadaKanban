import { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Project } from '../types';
import {
  flattenTree,
  getDescendantIds,
  computeProjection,
  findPrevSibling,
  findNextSibling,
} from './sidebar/projectTreeUtils';
import type { Projection } from './sidebar/projectTreeUtils';
import { SortableProjectRow, DragGhost } from './sidebar/SortableProjectRow';
import { PlusIcon, ICON_BUTTON_SM } from './icons';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProject: (id: string, parentId: string | null, prevId: string | null, nextId: string | null) => Promise<void>;
}

export default function ProjectSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onReorderProject,
}: ProjectSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(projects.map(p => p.id)));

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projected, setProjected] = useState<Projection | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const descendantIds = useRef<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const flatItems = flattenTree(projects, expandedIds);

  // Items shown in the sortable context — active item removed so siblings fill the gap
  const sortableItems = activeId ? flatItems.filter(i => i.id !== activeId) : flatItems;
  const activeItem = activeId ? (flatItems.find(i => i.id === activeId) ?? null) : null;

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    descendantIds.current = getDescendantIds(String(active.id), projects);
    setProjected(null);
    setOverIndex(null);
  }

  function handleDragMove({ delta, over }: DragMoveEvent) {
    if (!over || !activeItem) {
      setProjected(null);
      setOverIndex(null);
      return;
    }

    const overId = String(over.id);

    // Hovering over the active item itself — keep the last known projection
    if (overId === activeId) return;

    // Block dropping onto a descendant
    if (descendantIds.current.has(overId)) {
      setProjected(null);
      setOverIndex(null);
      return;
    }

    const idx = sortableItems.findIndex(i => i.id === overId);
    if (idx === -1) return;

    const proj = computeProjection(sortableItems, activeItem, idx, delta.x);
    setProjected(proj);
    setOverIndex(idx);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (!over || !activeItem || !projected || overIndex === null) {
      clearDrag();
      return;
    }

    const overId = String(over.id);
    if (descendantIds.current.has(overId)) {
      clearDrag();
      return;
    }

    // Send the sibling ids the server should insert between — never a
    // computed position (server always resolves it against true current
    // data). If the target parent is collapsed, these may legitimately be
    // null even though real children exist under it; the server always
    // re-derives the truth rather than trusting an "empty" guess.
    const prevSibling = findPrevSibling(sortableItems, overIndex, projected);
    const nextSibling = findNextSibling(sortableItems, overIndex, projected);

    // Auto-expand collapsed parent
    if (projected.parentId) {
      setExpandedIds(prev => {
        if (prev.has(projected.parentId!)) return prev;
        const next = new Set(prev);
        next.add(projected.parentId!);
        return next;
      });
    }

    onReorderProject(activeItem.id, projected.parentId, prevSibling?.id ?? null, nextSibling?.id ?? null);
    clearDrag();
  }

  function clearDrag() {
    setActiveId(null);
    setProjected(null);
    setOverIndex(null);
    descendantIds.current = new Set();
  }

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
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={clearDrag}
        >
          <SortableContext items={sortableItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="pb-4">
              {/* Reading descendantIds.current here is safe: every mutation site
                  (handleDragStart, clearDrag) always sets it alongside a real
                  setActiveId(...) state update in the same call, so the re-render
                  that follows always sees the ref's already-updated value — there's
                  no path where the ref changes without a state update triggering
                  the render that reads it. */}
              {/* eslint-disable-next-line react-hooks/refs */}
              {flatItems.map(item => {
                // When active item is removed from sortable list, its index in flatItems
                // maps to a shifted index in sortableItems. The indicator uses overIndex
                // which is already relative to sortableItems.
                const sortableIndex = sortableItems.findIndex(i => i.id === item.id);
                const showIndicator =
                  projected !== null &&
                  overIndex !== null &&
                  sortableIndex === overIndex &&
                  !descendantIds.current.has(item.id);

                return (
                  <SortableProjectRow
                    key={item.id}
                    item={item}
                    selectedProjectId={selectedProjectId}
                    isActive={item.id === activeId}
                    isDescendantOfActive={descendantIds.current.has(item.id)}
                    showIndicator={showIndicator}
                    indicatorDepth={projected?.depth ?? item.depth}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    onSelectProject={onSelectProject}
                    onCreateSubproject={onCreateProject}
                    onDelete={onDeleteProject}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>{activeItem && <DragGhost name={activeItem.project.name} />}</DragOverlay>
        </DndContext>
      )}
    </aside>
  );
}
