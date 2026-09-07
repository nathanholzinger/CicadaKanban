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
import { moveItem } from '../../api/items';
import { buildColumnForWorkphaseMap, resolveDropTarget, resolveDropSide, applyItemMove } from './boardDndUtils';

// Drag-and-drop resolution + handlers for the board's DndContext: dropping on
// Unsorted, a broken column, a merged column, or a specific expanded sub-row
// all resolve to different target workphases (or no-ops).
//
// Epic 3.2: item repositioning always resolves server-side against true
// current data (see positionResolver.ts) — this hook sends `{anchorId,
// side}` (or a plain `{workphaseId}`/`{scopeWorkphaseIds}` append) instead
// of a client-computed position. The tradeoff: there's no cheap, always-
// correct client-side position to show optimistically anymore, so the list
// can briefly show its pre-drop order until the server's response lands,
// rather than the old fully-optimistic update. A documented, deliberate
// simplification — not a correctness gap (see the Epic 3.2 plan's Part 2
// "client-side role" note for the fuller optimistic-preview option this
// leaves on the table for later).
export function useBoardDnd(
  board: BoardWithDetails | null,
  setBoard: React.Dispatch<React.SetStateAction<BoardWithDetails | null>>,
  items: Item[],
  setItems: React.Dispatch<React.SetStateAction<Item[]>>,
  findWorkphaseForItem: (itemId: string) => string | null,
  handleReorderColumns: (orders: { id: string; position: number }[]) => Promise<void>,
  loadBoard: () => Promise<void>,
) {
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Maps every covered workphase id -> the column that covers it, for
  // resolving drop targets and hover-derived lookups.
  const columnForWorkphase = useMemo(() => buildColumnForWorkphaseMap<Column>(board?.columns ?? []), [board]);

  // activeItem is captured once in handleDragStart and stays stable for the
  // whole gesture — using its workphaseId (rather than a live
  // findWorkphaseForItem(activeId) lookup) is what keeps handleDragOver's
  // optimistic re-bucket from confusing handleDragEnd's later resolution
  // (see resolveDropTarget's doc comment).
  function resolveDrop(activeId: string, overId: string) {
    const activeWorkphaseId = activeItem?.id === activeId ? activeItem.workphaseId : findWorkphaseForItem(activeId);
    return resolveDropTarget(activeId, activeWorkphaseId, overId, board?.columns ?? [], columnForWorkphase, findWorkphaseForItem);
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type !== 'column') {
      setActiveItem(items.find(i => i.id === String(event.active.id)) ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    // Attached-sibling drags (Epic 3.2 Part 3) are handled entirely in
    // handleDragEnd below — they never change workphaseId, so there's
    // nothing to live-preview here, and running the board-level resolution
    // logic on them would be wrong (it doesn't know about parent-scoped
    // reordering).
    if (!over || active.data.current?.type === 'column' || active.data.current?.type === 'attached-child') return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const resolution = resolveDrop(activeId, overId);
    // Only a genuine cross-column move gets a live re-bucket preview — a
    // same-visual-group reorder's visual feedback comes from dnd-kit's own
    // SortableContext animation, not a workphase re-bucket.
    if (!resolution || resolution.kind !== 'move') return;

    setItems(prev => prev.map(item => (item.id === activeId ? { ...item, workphaseId: resolution.targetWorkphaseId } : item)));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type;

    setActiveItem(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    // Resolved once, shared by every branch below that anchors against
    // overId — which half of the hovered card the dragged card's current
    // position falls in.
    const side = resolveDropSide(active.rect.current.translated, over.rect);

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

    // ── Attached-sibling reorder (Epic 3.2 Part 3) ──
    // Position-only, scoped to the parent's other attached children — the
    // server derives that scope from the anchor's own (parentId, isAttached)
    // state, so no extra scope info needs to be sent. Never touches
    // workphaseId; dragging a child *out* of its parent stays blocked until
    // Epic 3.5 owns that gesture.
    if (type === 'attached-child') {
      if (activeId === overId) return;
      try {
        const updated = await moveItem(activeId, { anchorId: overId, side });
        setItems(prev => prev.map(item => (item.id === activeId ? updated : item)));
      } catch (err) {
        console.error('Failed to reorder attached child:', err);
        loadBoard();
      }
      return;
    }

    // ── Item reorder / move ──
    const resolution = resolveDrop(activeId, overId);
    if (!resolution) return; // dropped on Unsorted, a broken column, or nowhere resolvable

    await applyItemMove(moveItem, activeId, resolution, side, setItems, loadBoard);
  }

  return { sensors, activeItem, handleDragStart, handleDragOver, handleDragEnd };
}
