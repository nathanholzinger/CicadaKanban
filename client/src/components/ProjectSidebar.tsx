// Project tree with dnd-kit drag reorder (server-resolved via prevId/nextId).

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
  eligibleRows,
  fullChildrenOf,
  resolveGap,
  computeProjection,
  siblingIdsFromAnchor,
} from './sidebar/projectTreeUtils';
import type { Projection } from './sidebar/projectTreeUtils';
import { resolveDropSide } from './workflow/dragCollision';
import { SortableProjectRow, DragGhost } from './sidebar/SortableProjectRow';
import { PlusIcon, ICON_BUTTON_SM } from './icons';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProject: (
    id: string,
    parentId: string | null,
    prevId: string | null,
    nextId: string | null,
  ) => Promise<void>;
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
  const [gap, setGap] = useState<number | null>(null);
  const descendantIds = useRef<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const flatItems = flattenTree(projects, expandedIds);
  const activeItem = activeId ? (flatItems.find(i => i.id === activeId) ?? null) : null;

  // Epic 3.5 Story 6, decision 5: the active project and its whole subtree
  // are never a Top/Bottom candidate — `rows` is what a gap is computed
  // against; `flatItems` above is still the full render list (descendants
  // stay drawn, dimmed). Reading the ref here during render is safe for the
  // same reason as the identical read further down (see that comment):
  // every mutation site sets it alongside a real `setActiveId(...)` update
  // in the same call, so the render this triggers always sees the ref's
  // already-current value.
  // eslint-disable-next-line react-hooks/refs
  const exclude = activeId ? new Set([activeId, ...descendantIds.current]) : new Set<string>();
  const rows = eligibleRows(flatItems, exclude);
  // Difference 6: a Top's first-child lookup must see the *real* tree, not
  // `flatItems`' own render list (which a collapsed project already left
  // out) — `resolvePlacement` takes this alongside `rows`.
  const childrenOf = fullChildrenOf(projects);
  // Where the drop indicator renders: a "before" line on the row the gap
  // sits above, or (the gap past the last row — decision 2's new n+1th gap)
  // an "after" line below the last eligible row instead. No anchor at all
  // only when the hierarchy has no eligible rows left to draw one against.
  const indicatorAnchor =
    gap === null || rows.length === 0
      ? null
      : gap < rows.length
        ? { id: rows[gap].id, side: 'before' as const }
        : { id: rows[rows.length - 1].id, side: 'after' as const };

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
    setGap(null);
  }

  function handleDragMove({ delta, over, active }: DragMoveEvent) {
    if (!over || !activeItem) {
      setProjected(null);
      setGap(null);
      return;
    }

    const overId = String(over.id);

    // dnd-kit can report the active row itself as `over` while the pointer
    // rests on it — keep the last known projection rather than resolve a
    // fresh (and meaningless) one for that sample.
    if (overId === activeId) return;

    const side = resolveDropSide(active.rect.current.translated, over.rect);
    const g = resolveGap(flatItems, rows, exclude, overId, side);
    const proj = computeProjection(rows, g, activeItem.depth, delta.x, childrenOf, exclude);
    setProjected(proj);
    setGap(g);
  }

  function handleDragEnd({ over }: DragEndEvent) {
    if (!over || !activeItem || !projected) {
      clearDrag();
      return;
    }

    // Send the sibling id the server should insert beside — never a
    // computed position (server always resolves it against true current
    // data). `resolvePlacement`'s one relation maps straight to prevId/
    // nextId; the other is always null, and the server re-derives it.
    const { prevId, nextId } = siblingIdsFromAnchor(projected.placement.anchor);
    const parentId = projected.placement.parentId;

    // Auto-expand collapsed parent
    if (parentId) {
      setExpandedIds(prev => {
        if (prev.has(parentId)) return prev;
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }

    onReorderProject(activeItem.id, parentId, prevId, nextId);
    clearDrag();
  }

  function clearDrag() {
    setActiveId(null);
    setProjected(null);
    setGap(null);
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
          <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="pb-4">
              {/* Reading descendantIds.current here is safe: every mutation site
                  (handleDragStart, clearDrag) always sets it alongside a real
                  setActiveId(...) state update in the same call, so the re-render
                  that follows always sees the ref's already-updated value — there's
                  no path where the ref changes without a state update triggering
                  the render that reads it. */}
              {/* eslint-disable-next-line react-hooks/refs */}
              {flatItems.map(item => {
                const indicatorSide = indicatorAnchor?.id === item.id ? indicatorAnchor.side : null;

                return (
                  <SortableProjectRow
                    key={item.id}
                    item={item}
                    selectedProjectId={selectedProjectId}
                    isActive={item.id === activeId}
                    isDescendantOfActive={descendantIds.current.has(item.id)}
                    indicatorSide={indicatorSide}
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
