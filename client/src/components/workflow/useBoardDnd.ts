import { useMemo, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithDetails, Item, Column } from '../../types';
import { reorderItems, moveItem } from '../../api';

// Drag-and-drop resolution + handlers for the board's DndContext: dropping on
// Unsorted, a broken column, a merged column, or a specific expanded sub-row
// all resolve to different target workphases (or no-ops).
export function useBoardDnd(
  board: BoardWithDetails | null,
  setBoard: React.Dispatch<React.SetStateAction<BoardWithDetails | null>>,
  items: Item[],
  setItems: React.Dispatch<React.SetStateAction<Item[]>>,
  getWorkphaseItems: (workphaseId: string) => Item[],
  findWorkphaseForItem: (itemId: string) => string | null,
  handleReorderColumns: (orders: { id: string; position: number }[]) => Promise<void>,
  loadBoard: () => Promise<void>,
) {
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Maps every covered workphase id -> the column that covers it, for
  // resolving drop targets and hover-derived lookups.
  const columnForWorkphase = useMemo(() => {
    const map = new Map<string, Column>();
    if (!board) return map;
    for (const col of board.columns) {
      for (const row of col.subRows) map.set(row.workphase.id, col);
    }
    return map;
  }, [board]);

  // Resolves a dnd-kit `over.id` to the workphase an item should be assigned
  // to if dropped there, or null if it's not a valid drop target (Unsorted,
  // a broken column, or an expanded column's outer wrapper — expanded mode
  // requires dropping on a specific sub-row for precision).
  function resolveDropWorkphaseId(overId: string): string | null {
    if (overId.startsWith('subrow::')) {
      const workphaseId = overId.split('::')[2];
      const col = columnForWorkphase.get(workphaseId);
      return col && !col.broken ? workphaseId : null;
    }

    const hoveredColumn = board?.columns.find(c => c.id === overId);
    if (hoveredColumn) {
      if (hoveredColumn.broken) return null;
      return hoveredColumn.displayMode === 'merged' ? hoveredColumn.entryWorkphaseId : null;
    }

    const hoverWorkphaseId = findWorkphaseForItem(overId);
    if (!hoverWorkphaseId) return null;
    const col = columnForWorkphase.get(hoverWorkphaseId);
    if (!col || col.broken) return null;
    return col.displayMode === 'expanded' ? hoverWorkphaseId : col.entryWorkphaseId;
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type !== 'column') {
      setActiveItem(items.find(i => i.id === String(event.active.id)) ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'column') return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeWorkphaseId = findWorkphaseForItem(activeId);
    const targetWorkphaseId = resolveDropWorkphaseId(overId);

    if (!activeWorkphaseId || !targetWorkphaseId || activeWorkphaseId === targetWorkphaseId) return;

    setItems(prev =>
      prev.map(item => item.id === activeId ? { ...item, workphaseId: targetWorkphaseId } : item),
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

    // ── Column reorder ──
    if (type === 'column') {
      if (activeId === overId || !board) return;
      const cols = board.columns;
      const oldIndex = cols.findIndex(c => c.id === activeId);
      const newIndex = cols.findIndex(c => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(cols, oldIndex, newIndex);
      setBoard(prev => prev ? { ...prev, columns: reordered } : prev);
      try {
        await handleReorderColumns(reordered.map((c, i) => ({ id: c.id, position: i + 1 })));
      } catch (err) {
        console.error('Failed to reorder columns:', err);
        loadBoard();
      }
      return;
    }

    // ── Item reorder / move ──
    const isOverContainer = overId.startsWith('subrow::') || (board?.columns.some(c => c.id === overId) ?? false);
    const targetWorkphaseId = resolveDropWorkphaseId(overId);
    if (!targetWorkphaseId) return; // dropped on Unsorted, a broken column, or nowhere resolvable

    // Same-workphase reorder
    if (!isOverContainer && originalWorkphaseId === targetWorkphaseId) {
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
        loadBoard();
      }
      return;
    }

    // Cross-workphase move
    const workphaseItems = getWorkphaseItems(targetWorkphaseId).filter(i => i.id !== activeId);
    let newPosition: number;

    if (isOverContainer || workphaseItems.length === 0) {
      newPosition = workphaseItems.length > 0
        ? Math.max(...workphaseItems.map(i => i.position ?? 0)) + 1.0
        : 1.0;
    } else {
      const overIndex = workphaseItems.findIndex(i => i.id === overId);
      const prevItem = workphaseItems[overIndex - 1];
      const nextItem = workphaseItems[overIndex];
      if (prevItem && nextItem) {
        newPosition = ((prevItem.position ?? overIndex) + (nextItem.position ?? overIndex + 1)) / 2;
      } else if (prevItem) {
        newPosition = (prevItem.position ?? overIndex) + 1.0;
      } else {
        newPosition = (nextItem?.position ?? 1.0) / 2;
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
      loadBoard();
    }
  }

  return { sensors, activeItem, handleDragStart, handleDragOver, handleDragEnd };
}
