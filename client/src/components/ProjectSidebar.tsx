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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project } from '../types';

// ─── Data structures ─────────────────────────────────────────────────────────

interface FlatItem {
  id: string;
  depth: number;
  parentId: string | null;
  project: Project;
  hasChildren: boolean;
  collapsed: boolean;
}

interface Projection {
  depth: number;
  parentId: string | null;
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function flattenTree(projects: Project[], expandedIds: Set<string>): FlatItem[] {
  const childMap = new Map<string | null, Project[]>();
  for (const p of projects) {
    const key = p.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(p);
  }

  // Sort each sibling group by position, matching the server's ORDER BY position, createdAt.
  // This is what makes optimistic position updates immediately visible.
  for (const children of childMap.values()) {
    children.sort((a, b) => {
      const posA = a.position ?? a.createdAt;
      const posB = b.position ?? b.createdAt;
      return posA !== posB ? posA - posB : a.createdAt - b.createdAt;
    });
  }

  const result: FlatItem[] = [];

  function walk(parentId: string | null, depth: number) {
    const children = childMap.get(parentId) ?? [];
    for (const p of children) {
      const kids = childMap.get(p.id) ?? [];
      const hasChildren = kids.length > 0;
      const collapsed = hasChildren && !expandedIds.has(p.id);
      result.push({ id: p.id, depth, parentId, project: p, hasChildren, collapsed });
      if (!collapsed) walk(p.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

function getDescendantIds(id: string, projects: Project[]): Set<string> {
  const result = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const p of projects) {
      if (p.parentId === current) {
        result.add(p.id);
        queue.push(p.id);
      }
    }
  }
  return result;
}

const INDENT_WIDTH = 14;

function computeProjection(
  sortableItems: FlatItem[],
  activeItem: FlatItem,
  overIndex: number,
  deltaX: number,
): Projection {
  const previousItem = sortableItems[overIndex - 1];
  const nextItem = sortableItems[overIndex];

  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const rawDepth = activeItem.depth + Math.round(deltaX / INDENT_WIDTH);
  const projectedDepth = Math.max(minDepth, Math.min(maxDepth, rawDepth));

  // Walk backward to find the parent at projectedDepth - 1
  let projectedParentId: string | null = null;
  if (projectedDepth > 0) {
    for (let i = overIndex - 1; i >= 0; i--) {
      if (sortableItems[i].depth === projectedDepth - 1) {
        projectedParentId = sortableItems[i].id;
        break;
      }
    }
  }

  return { depth: projectedDepth, parentId: projectedParentId };
}

// ─── SortableProjectRow ───────────────────────────────────────────────────────

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

function SortableProjectRow({
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
          className="absolute -top-px left-0 right-0 h-0.5 rounded-full bg-blue-500 z-10 pointer-events-none"
          style={{ marginLeft: 12 + indicatorDepth * INDENT_WIDTH }}
        />
      )}

      <div
        className={`group flex items-center gap-1 rounded-lg select-none transition-colors ${
          isActive
            ? 'opacity-40'
            : isDescendantOfActive
            ? 'opacity-40 pointer-events-none'
            : ''
        } ${
          deleting
            ? 'bg-red-950/60'
            : isSelected
            ? 'bg-zinc-700/60'
            : 'hover:bg-zinc-800/50'
        }`}
        style={{ padding: `6px 12px 6px ${12 + item.depth * INDENT_WIDTH}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 w-3 flex items-center justify-center text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={-1}
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
          title={isExpanded ? 'Collapse' : 'Expand'}
          className={`w-4 h-4 shrink-0 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors ${!item.hasChildren ? 'invisible' : ''}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={isExpanded ? 'M2 3.5l3 3 3-3' : 'M3.5 2l3 3-3 3'} />
          </svg>
        </button>

        {/* Project name */}
        <span
          onClick={() => !deleting && onSelectProject(item.id)}
          className={`flex-1 text-sm truncate min-w-0 transition-colors cursor-pointer ${
            deleting ? 'text-red-400' : isSelected ? 'text-zinc-100' : 'text-zinc-300 hover:text-zinc-100'
          }`}
        >
          {item.project.name}
        </span>

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
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
              title="Add subproject"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5.5 1.5v8M1.5 5.5h8" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
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

// ─── DragOverlay ghost ────────────────────────────────────────────────────────

function DragGhost({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 shadow-xl opacity-90">
      <span className="text-sm text-zinc-100 truncate max-w-[160px]">{name}</span>
    </div>
  );
}

// ─── ProjectSidebar ───────────────────────────────────────────────────────────

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onReorderProject: (id: string, parentId: string | null, position: number) => Promise<void>;
}

export default function ProjectSidebar({
  projects, selectedProjectId, onSelectProject, onCreateProject, onDeleteProject, onReorderProject,
}: ProjectSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(projects.map(p => p.id)));

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projected, setProjected] = useState<Projection | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const descendantIds = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const flatItems = flattenTree(projects, expandedIds);

  // Items shown in the sortable context — active item removed so siblings fill the gap
  const sortableItems = activeId ? flatItems.filter(i => i.id !== activeId) : flatItems;
  const activeItem = activeId ? flatItems.find(i => i.id === activeId) ?? null : null;

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

    // Compute new position using midpoint between neighboring siblings
    const prevSibling = findPrevSibling(sortableItems, overIndex, projected);
    const nextSibling = findNextSibling(sortableItems, overIndex, projected);

    const prevPos = prevSibling?.project.position ?? null;
    const nextPos = nextSibling?.project.position ?? null;

    let newPosition: number;
    if (prevPos !== null && nextPos !== null) {
      newPosition = (prevPos + nextPos) / 2;
    } else if (prevPos !== null) {
      newPosition = prevPos + 1.0;
    } else if (nextPos !== null) {
      newPosition = nextPos / 2;
    } else {
      newPosition = Date.now();
    }

    // Auto-expand collapsed parent
    if (projected.parentId) {
      setExpandedIds(prev => {
        if (prev.has(projected.parentId!)) return prev;
        const next = new Set(prev);
        next.add(projected.parentId!);
        return next;
      });
    }

    onReorderProject(activeItem.id, projected.parentId, newPosition);
    clearDrag();
  }

  function clearDrag() {
    setActiveId(null);
    setProjected(null);
    setOverIndex(null);
    descendantIds.current = new Set();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Projects</span>
        <button
          onClick={() => onCreateProject(undefined)}
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="New project"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5.5 1.5v8M1.5 5.5h8" />
          </svg>
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
              {flatItems.map((item) => {
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

          <DragOverlay>
            {activeItem && <DragGhost name={activeItem.project.name} />}
          </DragOverlay>
        </DndContext>
      )}
    </aside>
  );
}

// ─── Position helpers ─────────────────────────────────────────────────────────

function findPrevSibling(items: FlatItem[], overIndex: number, proj: Projection): FlatItem | null {
  for (let i = overIndex - 1; i >= 0; i--) {
    const item = items[i];
    if (item.depth === proj.depth && item.parentId === proj.parentId) return item;
    if (item.depth < proj.depth) break; // passed above the target level
  }
  return null;
}

function findNextSibling(items: FlatItem[], overIndex: number, proj: Projection): FlatItem | null {
  for (let i = overIndex; i < items.length; i++) {
    const item = items[i];
    if (item.depth === proj.depth && item.parentId === proj.parentId) return item;
    if (item.depth < proj.depth) break;
  }
  return null;
}
