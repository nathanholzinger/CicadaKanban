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
import { reorderItems, moveItem } from '../../api/items';
import {
  buildColumnForWorkphaseMap,
  resolveDropWorkphaseId as resolveDropTarget,
  computeSameWorkphaseReorder,
  computeDropPosition,
} from './boardDndUtils';

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Maps every covered workphase id -> the column that covers it, for
  // resolving drop targets and hover-derived lookups.
  const columnForWorkphase = useMemo(() => buildColumnForWorkphaseMap<Column>(board?.columns ?? []), [board]);

  function resolveDropWorkphaseId(overId: string): string | null {
    return resolveDropTarget(overId, board?.columns ?? [], columnForWorkphase, findWorkphaseForItem);
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

    setItems(prev => prev.map(item => (item.id === activeId ? { ...item, workphaseId: targetWorkphaseId } : item)));
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
      setBoard(prev => (prev ? { ...prev, columns: reordered } : prev));
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
      const updatedPositions = computeSameWorkphaseReorder(getWorkphaseItems(targetWorkphaseId), activeId, overId);
      if (!updatedPositions) return;

      setItems(prev =>
        prev.map(item => {
          const u = updatedPositions.find(p => p.id === item.id);
          return u ? { ...item, position: u.position } : item;
        }),
      );
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
    const newPosition = computeDropPosition(workphaseItems, overId, isOverContainer);

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
