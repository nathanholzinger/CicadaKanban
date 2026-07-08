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
import type { WorkflowWithDetails, WorkPhase, Item, ItemType } from '../types';
import {
  fetchWorkflow,
  fetchItemTypes,
  createItem,
  moveItem,
  reorderItems,
  createWorkPhase,
  updateWorkPhase,
  deleteWorkPhase,
  reorderWorkPhases,
} from '../api';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import ItemDetailPanel from './ItemDetailPanel';

interface WorkflowViewProps {
  workflowId: string;
  projectId?: string;        // project context for new items
  filterProjectId?: string;  // when set, only show items for this project (inherited view)
  readOnly?: boolean;        // when true, hides workphase management controls
}

export default function WorkflowView({ workflowId, projectId, filterProjectId, readOnly }: WorkflowViewProps) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowWithDetails | null>(null);
  const [workphases, setWorkphases] = useState<WorkPhase[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addingWorkphase, setAddingWorkphase] = useState(false);
  const [newWorkphaseName, setNewWorkphaseName] = useState('');
  const [childDefaultWorkphaseId, setChildDefaultWorkphaseId] = useState<string | null>(
    () => localStorage.getItem(`kanban_child_col_${workflowId}`) ?? null,
  );

  function handleChildWorkphaseChange(workphaseId: string | null) {
    setChildDefaultWorkphaseId(workphaseId);
    if (workphaseId) {
      localStorage.setItem(`kanban_child_col_${workflowId}`, workphaseId);
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
      const sorted = [...data.workphases].sort((a, b) => a.position - b.position);
      setWorkphases(sorted);
      setItems(data.items);

      const stored = localStorage.getItem(`kanban_child_col_${workflowId}`);
      if (!stored) {
        const backlog = sorted.find(w => w.name.toLowerCase() === 'backlog');
        if (backlog) setChildDefaultWorkphaseId(backlog.id);
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

  function getWorkphaseItems(workphaseId: string): Item[] {
    return items
      .filter(item => item.workphaseId === workphaseId && (!filterProjectId || item.projectId === filterProjectId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  function findWorkphaseForItem(itemId: string): string | null {
    return items.find(i => i.id === itemId)?.workphaseId ?? null;
  }

  // ============================================================
  // Drag handlers
  // ============================================================

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type !== 'workphase') {
      setActiveItem(items.find(i => i.id === String(event.active.id)) ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'workphase') return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeWorkphaseId = findWorkphaseForItem(activeId);
    const isOverWorkphase = workphases.some(w => w.id === overId);
    const overWorkphaseId = isOverWorkphase ? overId : findWorkphaseForItem(overId);

    if (!activeWorkphaseId || !overWorkphaseId || activeWorkphaseId === overWorkphaseId) return;

    setItems(prev =>
      prev.map(item => item.id === activeId ? { ...item, workphaseId: overWorkphaseId } : item),
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type;
    const originalWorkphaseId = activeItem?.workphaseId ?? null;

    setActiveItem(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Workphase reorder ──
    if (type === 'workphase') {
      if (activeId === overId) return;
      const oldIndex = workphases.findIndex(w => w.id === activeId);
      const newIndex = workphases.findIndex(w => w.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(workphases, oldIndex, newIndex);
      setWorkphases(reordered);

      try {
        await reorderWorkPhases(reordered.map((w, i) => ({ id: w.id, position: i + 1 })));
      } catch (err) {
        console.error('Failed to reorder workphases:', err);
        loadWorkflow();
      }
      return;
    }

    // ── Item move ──
    const isOverWorkphase = workphases.some(w => w.id === overId);
    const targetWorkphaseId = isOverWorkphase ? overId : findWorkphaseForItem(overId);
    if (!targetWorkphaseId) return;

    // ── Same-workphase reorder ──
    if (!isOverWorkphase && originalWorkphaseId === targetWorkphaseId) {
      const workphaseItems = getWorkphaseItems(targetWorkphaseId);
      const oldIndex = workphaseItems.findIndex(i => i.id === activeId);
      const newIndex = workphaseItems.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(workphaseItems, oldIndex, newIndex);
      const updatedPositions = reordered.map((item, idx) => ({ id: item.id, position: idx + 1 }));

      setItems(prev => prev.map(item => {
        const u = updatedPositions.find(p => p.id === item.id);
        return u ? { ...item, position: u.position } : item;
      }));

      try {
        await reorderItems(updatedPositions);
      } catch (err) {
        console.error('Failed to reorder items:', err);
        loadWorkflow();
      }
      return;
    }

    // ── Cross-workphase move ──
    const workphaseItems = getWorkphaseItems(targetWorkphaseId).filter(i => i.id !== activeId);
    let newPosition: number;

    if (isOverWorkphase || workphaseItems.length === 0) {
      newPosition = workphaseItems.length > 0
        ? Math.max(...workphaseItems.map(i => i.position ?? 0)) + 1.0
        : 1.0;
    } else {
      const overIndex = workphaseItems.findIndex(i => i.id === overId);
      const prev = workphaseItems[overIndex - 1];
      const next = workphaseItems[overIndex];
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
        item.id === activeId ? { ...item, workphaseId: targetWorkphaseId, position: newPosition } : item,
      ),
    );

    try {
      await moveItem(activeId, targetWorkphaseId, newPosition);
    } catch (err) {
      console.error('Failed to move item:', err);
      loadWorkflow();
    }
  }

  // ============================================================
  // Workphase handlers
  // ============================================================

  async function handleCreateWorkphase() {
    if (!workflow || !newWorkphaseName.trim()) return;
    try {
      const workphase = await createWorkPhase({ workflowId: workflow.id, name: newWorkphaseName.trim() });
      setWorkphases(prev => [...prev, workphase]);
      setNewWorkphaseName('');
      setAddingWorkphase(false);
    } catch (err) {
      console.error('Failed to create workphase:', err);
    }
  }

  async function handleRenameWorkphase(id: string, name: string) {
    try {
      const updated = await updateWorkPhase(id, { name });
      setWorkphases(prev => prev.map(w => w.id === id ? { ...w, name: updated.name } : w));
    } catch (err) {
      console.error('Failed to rename workphase:', err);
    }
  }

  async function handleDeleteWorkphase(id: string) {
    await deleteWorkPhase(id);
    setWorkphases(prev => prev.filter(w => w.id !== id));
  }

  // ============================================================
  // Item handlers
  // ============================================================

  async function handleCreateItem(workphaseId: string, title: string, type: string | null) {
    try {
      const newItem = await createItem({ type: type ?? undefined, title, projectId, workphaseId });
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  }

  function handleItemUpdated(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleChildCreated(item: Item) {
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4 shrink-0">
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">New child items go to:</span>
          <select
            value={childDefaultWorkphaseId ?? ''}
            onChange={e => handleChildWorkphaseChange(e.target.value || null)}
            className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Same workphase as parent</option>
            {workphases.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
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
        <SortableContext items={workphases.map(w => w.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto flex-1 min-h-0 pb-4 items-stretch">
            {workphases.map(workphase => (
              <KanbanColumn
                key={workphase.id}
                column={workphase}
                items={getWorkphaseItems(workphase.id)}
                childCounts={childCounts}
                itemTypes={itemTypes}
                isCardBeingDragged={activeItem !== null}
                onCreateItem={handleCreateItem}
                onCardClick={setSelectedItemId}
                onRename={readOnly ? undefined : handleRenameWorkphase}
                onDelete={readOnly ? undefined : handleDeleteWorkphase}
              />
            ))}

            {/* Add workphase — hidden in read-only (inherited) mode */}
            {!readOnly && (
              <div className="shrink-0 w-72 self-start">
                {addingWorkphase ? (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 space-y-2">
                    <input
                      autoFocus
                      value={newWorkphaseName}
                      onChange={e => setNewWorkphaseName(e.target.value)}
                      placeholder="Workphase name..."
                      className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateWorkphase();
                        if (e.key === 'Escape') { setAddingWorkphase(false); setNewWorkphaseName(''); }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateWorkphase}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                      >
                        Add workphase
                      </button>
                      <button
                        onClick={() => { setAddingWorkphase(false); setNewWorkphaseName(''); }}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingWorkphase(true)}
                    className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-xl transition-colors"
                  >
                    + Add workphase
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

      <ItemDetailPanel
        itemId={selectedItemId}
        childDefaultWorkphaseId={childDefaultWorkphaseId}
        itemTypes={itemTypes}
        onClose={() => setSelectedItemId(null)}
        onUpdate={handleItemUpdated}
        onDelete={handleItemDeleted}
        onNavigate={setSelectedItemId}
        onChildCreated={handleChildCreated}
      />
    </div>
  );
}
