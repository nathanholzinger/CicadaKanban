// The hierarchy modal: a Card's whole hierarchy, its attached descendants at every level with
// no overflow row. While it's open it is the Card's Descendants layer for a drag, drawn whole:
// its list carries the Descendants region key, so the cursor and the carried copy are read
// against its rows, and the Card's own section draws static under the backdrop
// (`KanbanCard.tsx`, `StubRows.tsx::SectionRows`). A drag in it is placed by gap and depth as in
// the section; leaving its box pops out of the layer and closes it (`useBoardDnd.ts`).
//
// Opened by a click it is centered. Opened by a hold during a drag it is placed under the cursor
// (`workflow/modalPlacement.ts`): once mounted it measures itself, moves so that the spot the
// ghost held is under the cursor, scrolls its list to bring it there, and reports the gap and
// depth the cursor reads against its rows, for the drag to carry on from.

import { useLayoutEffect, useRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import ModalShell from './ModalShell';
import { SectionRows } from './StubRows';
import { useCardContextLayer, useDragSession, type DragSession } from './workflow/DragSessionContext';
import {
  DRAG_BOUNDS_ATTR,
  cardRegionKey,
  descendantsRegionKey,
  dragRegionProps,
  type Point,
} from './workflow/dragRegions';
import { hierarchyRows, sectionEntries, type SectionEntry } from './workflow/itemListOps';
import {
  cursorXInList,
  depthAtCursor,
  gapAtSlot,
  nearestRowIndex,
  placeModal,
  slotForGap,
  type ModalReading,
} from './workflow/modalPlacement';
import { useLatest } from './workflow/useLatest';

interface HierarchyModalProps {
  card: Item;
  itemTypes: ItemType[];
  getAttachedChildren: (parentId: string) => readonly Item[];
  /** Where the cursor was when a hold opened it during a drag; null for a click, which centers it. */
  anchor: Point | null;
  /** Called once, when a modal opened by a hold is placed, with what the cursor reads against it. */
  onPlaced: (reading: ModalReading) => void;
  onClose: () => void;
}

// A modal not yet placed sits at the window's corner, where it can be measured.
const UNPLACED = { left: 0, top: 0 };

// Moves `dialog` so the ghost's spot is under `cursor`, scrolls `list` to match, and reads the
// gap and depth the cursor is at afterward. Layout space throughout (`offsetTop`, not a painted
// rect): the sortable shuffle's transforms on the rows move what's drawn, not where they are.
function placeAtCursor(
  dialog: HTMLElement,
  list: HTMLElement,
  cursor: Point,
  session: DragSession,
  entries: readonly SectionEntry[],
): ModalReading | null {
  const projection = session.projection;
  if (!projection) return null;
  const items = entries.map(e => e.row.id);
  const activeId = session.activeItem.id;
  const travels = (id: string) => id !== activeId && session.classification.subtreeIds.has(id);
  const rowEl = (id: string) => list.querySelector<HTMLElement>(`[data-item-id="${id}"]`);

  // The row to rest the cursor on for the ghost to be in the gap it held in the section, and the
  // depth's column in the row.
  const slot = slotForGap(items, activeId, projection.gap, travels) ?? items.indexOf(activeId);
  const spotRow = rowEl(items[slot]);
  if (!spotRow) return null;
  const dialogBox = dialog.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const placement = placeModal({
    cursor,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dialog: { width: dialogBox.width, height: dialogBox.height },
    spotX: listBox.left - dialogBox.left + cursorXInList(projection.depth),
    spotY: dialog.clientTop + spotRow.offsetTop + spotRow.offsetHeight / 2,
    maxScroll: Math.max(0, list.scrollHeight - list.clientHeight),
  });
  dialog.style.left = `${placement.left}px`;
  dialog.style.top = `${placement.top}px`;
  list.scrollTop = placement.scrollTop;

  // Read afresh from where the cursor is now: the row it is over, among those in view, takes the
  // ghost's slot, and its x is the depth.
  const placedBox = dialog.getBoundingClientRect();
  const placedList = list.getBoundingClientRect();
  const inView = items
    .map((id, index) => {
      const el = rowEl(id);
      if (!el) return null;
      const top = placedBox.top + dialog.clientTop + el.offsetTop - list.scrollTop;
      return { index, top, bottom: top + el.offsetHeight };
    })
    .filter(
      (span): span is { index: number; top: number; bottom: number } =>
        span !== null && span.bottom > placedList.top && span.top < placedList.bottom,
    );
  const nearest = nearestRowIndex(inView, cursor.y);
  if (nearest === null) return null;
  const gap = gapAtSlot(items, activeId, inView[nearest].index, travels);
  return gap === null ? null : { gap, depth: depthAtCursor(cursor.x, placedList.left) };
}

export default function HierarchyModal({
  card,
  itemTypes,
  getAttachedChildren,
  anchor,
  onPlaced,
  onClose,
}: HierarchyModalProps) {
  const session = useDragSession();
  const contextLayer = useCardContextLayer(card.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Computed once per render: `getAttachedChildren` returns a fresh array every call, and the
  // list and its `SortableContext` must read one.
  const entries = sectionEntries(hierarchyRows(card.id, getAttachedChildren), Infinity);

  // The placement reads the render that opened the modal, and the open's own anchor decides when it
  // runs: once per open, before the first paint.
  const latest = useLatest({ session, entries, onPlaced });
  useLayoutEffect(() => {
    const { current: dialog } = dialogRef;
    const { current: list } = listRef;
    if (!anchor || !dialog || !list || !latest.current.session) return;
    const reading = placeAtCursor(dialog, list, anchor, latest.current.session, latest.current.entries);
    if (reading) latest.current.onPlaced(reading);
  }, [anchor, latest]);

  return (
    <ModalShell
      // Escape, the X and a click outside close it only with no drag running: Escape during a
      // drag cancels the drag and leaves the modal open.
      onClose={() => {
        if (!session) onClose();
      }}
      ariaLabel={`Hierarchy of ${card.title}`}
      title={card.title}
      subtitle="Hierarchy"
      maxWidth="max-w-xl"
      maxHeight="max-h-[80vh]"
      showCloseButton
      position={anchor ? UNPLACED : undefined}
      dialogRef={dialogRef}
      // The list is the layer's region, and the whole dialog its bounds: a cursor over the header
      // is still in the modal.
      dialogProps={{ [DRAG_BOUNDS_ATTR]: descendantsRegionKey(card.id) }}
    >
      <div
        ref={listRef}
        {...dragRegionProps(descendantsRegionKey(card.id), cardRegionKey(card.id))}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto py-3"
      >
        <SortableContext items={entries.map(e => e.row.id)} strategy={verticalListSortingStrategy}>
          <SectionRows
            entries={entries}
            cardId={card.id}
            itemTypes={itemTypes}
            projection={session && contextLayer === 'descendants' ? session.projection : null}
            activeId={session?.activeItem.id}
          />
        </SortableContext>
      </div>
    </ModalShell>
  );
}
