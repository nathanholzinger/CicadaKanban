import { arrayMove } from '@dnd-kit/sortable';
import { positionBetween } from '../../lib/positions';

// Pure drop-resolution and position math for the board's drag-and-drop,
// extracted from useBoardDnd so it can be unit tested — real drag gestures
// are deliberately not simulated in the E2E suite. Structural subset types
// keep the functions testable without full Column/Item fixtures.

export interface DropColumn {
  id: string;
  broken: boolean;
  displayMode: 'merged' | 'expanded';
  entryWorkphaseId: string;
  subRows: Array<{ workphase: { id: string } }>;
}

export interface PositionedItem {
  id: string;
  position: number | null;
}

// Maps every covered workphase id -> the column that covers it.
export function buildColumnForWorkphaseMap<C extends DropColumn>(columns: readonly C[]): Map<string, C> {
  const map = new Map<string, C>();
  for (const col of columns) {
    for (const row of col.subRows) map.set(row.workphase.id, col);
  }
  return map;
}

// Encodes a droppable id for an expanded column's per-workphase sub-row.
// Paired with the `subrow::` decode branch in resolveDropWorkphaseId below —
// keep them in the same file so the id format only needs to be understood once.
export function subrowContainerId(columnId: string, workphaseId: string): string {
  return `subrow::${columnId}::${workphaseId}`;
}

// Resolves a dnd-kit `over.id` to the workphase an item should be assigned
// to if dropped there, or null if it's not a valid drop target (Unsorted,
// a broken column, or an expanded column's outer wrapper — expanded mode
// requires dropping on a specific sub-row for precision).
export function resolveDropWorkphaseId(
  overId: string,
  columns: readonly DropColumn[],
  columnForWorkphase: Map<string, DropColumn>,
  findWorkphaseForItem: (itemId: string) => string | null,
): string | null {
  if (overId.startsWith('subrow::')) {
    const workphaseId = overId.split('::')[2];
    const col = columnForWorkphase.get(workphaseId);
    return col && !col.broken ? workphaseId : null;
  }

  const hoveredColumn = columns.find(c => c.id === overId);
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

// Same-workphase reorder: moves the active item next to the hovered one and
// reindexes the whole workphase 1..n. Returns null when there is nothing to do.
export function computeSameWorkphaseReorder(
  workphaseItems: readonly PositionedItem[],
  activeId: string,
  overId: string,
): Array<{ id: string; position: number }> | null {
  const oldIndex = workphaseItems.findIndex(i => i.id === activeId);
  const newIndex = workphaseItems.findIndex(i => i.id === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null;

  return arrayMove([...workphaseItems], oldIndex, newIndex).map((item, idx) => ({ id: item.id, position: idx + 1 }));
}

// Cross-workphase drop position: append when dropping on a container (or an
// empty workphase), otherwise slot next to the hovered card via the midpoint.
// `workphaseItems` must already exclude the item being dragged.
export function computeDropPosition(
  workphaseItems: readonly PositionedItem[],
  overId: string,
  isOverContainer: boolean,
): number {
  if (isOverContainer || workphaseItems.length === 0) {
    return workphaseItems.length > 0 ? Math.max(...workphaseItems.map(i => i.position ?? 0)) + 1.0 : 1.0;
  }

  const overIndex = workphaseItems.findIndex(i => i.id === overId);
  const prevItem = workphaseItems[overIndex - 1];
  const nextItem = workphaseItems[overIndex];
  return positionBetween(
    prevItem ? (prevItem.position ?? overIndex) : null,
    nextItem ? (nextItem.position ?? overIndex + 1) : null,
    () => 1.0 / 2,
  );
}
