import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { WorkflowWithDetails, Column, ItemType, WorkItem } from '../types';
import {
  fetchWorkflow,
  fetchItemTypes,
  createWorkItem,
  moveWorkItem,
  reorderWorkItems,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../api';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardDetailPanel from './CardDetailPanel';

interface WorkflowViewProps {
  workflowId: string;
  projectId?: string;        // project context for new cards
  filterProjectId?: string;  // when set, only show items for this project (inherited view)
  readOnly?: boolean;        // when true, hides column management controls
}

export default function WorkflowView({ workflowId, projectId, filterProjectId, readOnly }: WorkflowViewProps) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowWithDetails | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [childDefaultColumnId, setChildDefaultColumnId] = useState<string | null>(
    () => localStorage.getItem(`kanban_child_col_${workflowId}`) ?? null,
  );

  function handleChildColumnChange(columnId: string | null) {
    setChildDefaultColumnId(columnId);
    if (columnId) {
      localStorage.setItem(`kanban_child_col_${workflowId}`, columnId);
    } else {
      localStorage.removeItem(`kanban_child_col_${workflowId}`);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    fetchItemTypes().then(setItemTypes).catch(() => {});
  }, []);

  const loadWorkflow = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkflow(workflowId);
      setWorkflow(data);
      const sorted = [...data.columns].sort((a, b) => a.position - b.position);
      setColumns(sorted);
      setItems(data.items);

      const stored = localStorage.getItem(`kanban_child_col_${workflowId}`);
      if (!stored) {
        const backlog = sorted.find(c => c.name.toLowerCase() === 'backlog');
        if (backlog) setChildDefaultColumnId(backlog.id);
      }
    } catch (err) {
      console.error('Failed to load workflow:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  function getColumnItems(columnId: string): WorkItem[] {
    return items
      .filter(item => item.columnId === columnId && (!filterProjectId || item.projectId === filterProjectId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  function findColumnForItem(itemId: string): string | null {
    return items.find(i => i.id === itemId)?.columnId ?? null;
  }

  // ============================================================
  // Drag handlers
  // ============================================================

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type !== 'column') {
      setActiveItem(items.find(i => i.id === String(event.active.id)) ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'column') return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeColumnId = findColumnForItem(activeId);
    const isOverColumn = columns.some(c => c.id === overId);
    const overColumnId = isOverColumn ? overId : findColumnForItem(overId);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;

    setItems(prev =>
      prev.map(item => item.id === activeId ? { ...item, columnId: overColumnId } : item),
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type;
    const originalColumnId = activeItem?.columnId ?? null;

    setActiveItem(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Column reorder ──
    if (type === 'column') {
      if (activeId === overId) return;
      const oldIndex = columns.findIndex(c => c.id === activeId);
      const newIndex = columns.findIndex(c => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columns, oldIndex, newIndex);
      setColumns(reordered);

      try {
        await reorderColumns(reordered.map((c, i) => ({ id: c.id, position: i + 1 })));
      } catch (err) {
        console.error('Failed to reorder columns:', err);
        loadWorkflow();
      }
      return;
    }

    // ── Card move ──
    const isOverColumn = columns.some(c => c.id === overId);
    const targetColumnId = isOverColumn ? overId : findColumnForItem(overId);
    if (!targetColumnId) return;

    // ── Same-column reorder ──
    if (!isOverColumn && originalColumnId === targetColumnId) {
      const colItems = getColumnItems(targetColumnId);
      const oldIndex = colItems.findIndex(i => i.id === activeId);
      const newIndex = colItems.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(colItems, oldIndex, newIndex);
      const updatedPositions = reordered.map((item, idx) => ({ id: item.id, position: idx + 1 }));

      setItems(prev => prev.map(item => {
        const u = updatedPositions.find(p => p.id === item.id);
        return u ? { ...item, position: u.position } : item;
      }));

      try {
        await reorderWorkItems(updatedPositions);
      } catch (err) {
        console.error('Failed to reorder items:', err);
        loadWorkflow();
      }
      return;
    }

    // ── Cross-column move ──
    const columnItems = getColumnItems(targetColumnId).filter(i => i.id !== activeId);
    let newPosition: number;

    if (isOverColumn || columnItems.length === 0) {
      newPosition = columnItems.length > 0
        ? Math.max(...columnItems.map(i => i.position ?? 0)) + 1.0
        : 1.0;
    } else {
      const overIndex = columnItems.findIndex(i => i.id === overId);
      const prev = columnItems[overIndex - 1];
      const next = columnItems[overIndex];
      if (prev && next) {
        newPosition = ((prev.position ?? overIndex) + (next.position ?? overIndex + 1)) / 2;
      } else if (prev) {
        newPosition = (prev.position ?? overIndex) + 1.0;
      } else {
        newPosition = (next?.position ?? 1.0) / 2;
      }
    }

    setItems(prev =>
      prev.map(item =>
        item.id === activeId ? { ...item, columnId: targetColumnId, position: newPosition } : item,
      ),
    );

    try {
      await moveWorkItem(activeId, targetColumnId, newPosition);
    } catch (err) {
      console.error('Failed to move item:', err);
      loadWorkflow();
    }
  }

  // ============================================================
  // Column handlers
  // ============================================================

  async function handleCreateColumn() {
    if (!workflow || !newColumnName.trim()) return;
    try {
      const col = await createColumn({ workflowId: workflow.id, name: newColumnName.trim() });
      setColumns(prev => [...prev, col]);
      setNewColumnName('');
      setAddingColumn(false);
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  }

  async function handleRenameColumn(id: string, name: string) {
    try {
      const updated = await updateColumn(id, { name });
      setColumns(prev => prev.map(c => c.id === id ? { ...c, name: updated.name } : c));
    } catch (err) {
      console.error('Failed to rename column:', err);
    }
  }

  async function handleDeleteColumn(id: string) {
    await deleteColumn(id);
    setColumns(prev => prev.filter(c => c.id !== id));
  }

  // ============================================================
  // Card handlers
  // ============================================================

  async function handleCreateCard(columnId: string, title: string, type: string | null) {
    try {
      const newItem = await createWorkItem({ type: type ?? undefined, title, projectId, columnId });
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  }

  function handleCardUpdated(updated: WorkItem) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function handleCardDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleChildCreated(item: WorkItem) {
    setItems(prev => [...prev, item]);
  }

  const childCounts: Record<string, number> = {};
  for (const item of items) {
    if (item.parentId) {
      childCounts[item.parentId] = (childCounts[item.parentId] ?? 0) + 1;
    }
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading workflow…</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Workflow not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">New child cards go to:</span>
          <select
            value={childDefaultColumnId ?? ''}
            onChange={e => handleChildColumnChange(e.target.value || null)}
            className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Same column as parent</option>
            {columns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                items={getColumnItems(col.id)}
                childCounts={childCounts}
                itemTypes={itemTypes}
                isCardBeingDragged={activeItem !== null}
                onCreateCard={handleCreateCard}
                onCardClick={setSelectedItemId}
                onRename={readOnly ? undefined : handleRenameColumn}
                onDelete={readOnly ? undefined : handleDeleteColumn}
              />
            ))}

            {/* Add column — hidden in read-only (inherited) mode */}
            {!readOnly && (
              <div className="shrink-0 w-72">
                {addingColumn ? (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 space-y-2">
                    <input
                      autoFocus
                      value={newColumnName}
                      onChange={e => setNewColumnName(e.target.value)}
                      placeholder="Column name..."
                      className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateColumn();
                        if (e.key === 'Escape') { setAddingColumn(false); setNewColumnName(''); }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateColumn}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                      >
                        Add column
                      </button>
                      <button
                        onClick={() => { setAddingColumn(false); setNewColumnName(''); }}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-xl transition-colors"
                  >
                    + Add column
                  </button>
                )}
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? <KanbanCard item={activeItem} itemTypes={itemTypes} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <CardDetailPanel
        itemId={selectedItemId}
        childDefaultColumnId={childDefaultColumnId}
        itemTypes={itemTypes}
        onClose={() => setSelectedItemId(null)}
        onUpdate={handleCardUpdated}
        onDelete={handleCardDeleted}
        onNavigate={setSelectedItemId}
        onChildCreated={handleChildCreated}
      />
    </div>
  );
}
