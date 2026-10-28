// The hierarchy modal (wiki board-drag-interaction §9): a Card's whole hierarchy, its attached
// descendants at every level with no overflow row. While it's open it is the Card's Descendants
// layer for a drag, drawn whole:
// its list carries the Descendants region key, so the cursor and the carried copy are read
// against its rows, and the Card's own section draws static under the backdrop
// (`KanbanCard.tsx`, `StubRows.tsx::SectionRows`). A drag in it is placed by gap and depth as in
// the section; leaving its box pops out of the layer and closes it (`useBoardDnd.ts`).
//
// Opened by a click it is centered. Opened by a hold during a drag it is placed under the cursor
// (`workflow/modalPlacement.ts`): once mounted it measures itself, moves so that the spot the
// ghost held is under the cursor, scrolls its list to bring it there, and reports the gap and
// depth the cursor reads against its rows, for the drag to carry on from. Whether the cursor
// places it is decided as it mounts: one that mounts with no drag running, remounted by a board
// reload or opened by a hold the drag ended before it committed, is centered as a click opens it.

import { useLayoutEffect, useRef, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import ModalShell from './ModalShell';
import { SectionRows } from './StubRows';
import { useCardContextLayer, useDragSession, type DragSession } from './workflow/DragSessionContext';
import { travelingRowsFor } from './workflow/dragCollision';
import {
  DRAG_BOUNDS_ATTR,
  cardRegionKey,
  descendantsRegionKey,
  dragRegionProps,
  type Point,
} from './workflow/dragRegions';
import { EVERY_LEVEL, hierarchyRows, sectionEntries, type SectionEntry } from './workflow/itemListOps';
import {
  centerModal,
  cursorXInList,
  depthAtCursor,
  gapAtSlot,
  nearestRowIndex,
  placeModal,
  slotForGap,
  type ModalPlacement,
  type ModalReading,
} from './workflow/modalPlacement';
import { useLatest } from './workflow/useLatest';

interface HierarchyModalProps {
  card: Item;
  itemTypes: ItemType[];
  getAttachedChildren: (parentId: string) => readonly Item[];
  /** Where the cursor was when a hold opened it during a drag; null for a click, which centers it. Read as it mounts. */
  anchor: Point | null;
  /** Called once, when a modal opened by a hold is placed, with what the cursor reads against it. */
  onPlaced: (reading: ModalReading) => void;
  onClose: () => void;
}

// A modal not yet placed sits at the window's corner, where it can be measured.
const UNPLACED = { left: 0, top: 0 };

function applyPlacement(dialog: HTMLElement, list: HTMLElement, placement: ModalPlacement) {
  dialog.style.left = `${placement.left}px`;
  dialog.style.top = `${placement.top}px`;
  list.scrollTop = placement.scrollTop;
}

// Moves `dialog` so the ghost's spot is under `cursor`, scrolls `list` to match, and reads the
// gap and depth the cursor is at afterward. Layout space throughout (`offsetTop`, not a painted
// rect): the sortable shuffle's transforms on the rows move what's drawn, not where they are.
//
// With no row to rest the cursor on (no projection, or the ghost has no row in the list) the
// dialog is centered instead, as a click opens it, with a warning, and nothing is read: the drag
// keeps the gap and depth it had.
function placeAtCursor(
  dialog: HTMLElement,
  list: HTMLElement,
  cursor: Point,
  session: DragSession,
  entries: readonly SectionEntry[],
): ModalReading | null {
  const { projection } = session;
  const items = entries.map(e => e.row.id);
  const activeId = session.activeItem.id;
  const travels = travelingRowsFor(session) ?? (() => false);
  const rowEl = (id: string) => list.querySelector<HTMLElement>(`[data-item-id="${id}"]`);

  // The row to rest the cursor on for the ghost to be in the gap it held in the section, and the
  // depth's column in the row.
  const slot = projection ? (slotForGap(items, activeId, projection.gap, travels) ?? items.indexOf(activeId)) : -1;
  const spotRow = slot === -1 ? null : rowEl(items[slot]);
  const dialogBox = dialog.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const size = { width: dialogBox.width, height: dialogBox.height };
  if (!projection || !spotRow) {
    console.warn('HierarchyModal: no row to rest the cursor on for the ghost’s gap; centering the modal.');
    applyPlacement(dialog, list, centerModal(viewport, size));
    return null;
  }
  applyPlacement(
    dialog,
    list,
    placeModal({
      cursor,
      viewport,
      dialog: size,
      spotX: listBox.left - dialogBox.left + cursorXInList(projection.depth),
      spotY: dialog.clientTop + spotRow.offsetTop + spotRow.offsetHeight / 2,
      maxScroll: Math.max(0, list.scrollHeight - list.clientHeight),
    }),
  );

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
  const entries = sectionEntries(hierarchyRows(card.id, getAttachedChildren), EVERY_LEVEL);

  // Where the cursor places the modal, decided once, as it mounts: only a modal that mounts during
  // a drag with an anchor has a cursor to sit under. A parent that keeps the anchor in its state
  // across a remount, or a drag that ends before the open commits, mounts it with no drag, and it
  // is centered. A modal for another Card is another mount (the caller keys it by Card).
  const [placeAt] = useState<Point | null>(() => (session ? anchor : null));

  // The placement runs once, before the first paint, on the render that mounted the modal.
  const latest = useLatest({ session, entries, onPlaced });
  useLayoutEffect(() => {
    const { current: dialog } = dialogRef;
    const { current: list } = listRef;
    const mounted = latest.current;
    if (!placeAt || !dialog || !list || !mounted.session) return;
    const reading = placeAtCursor(dialog, list, placeAt, mounted.session, mounted.entries);
    if (reading) mounted.onPlaced(reading);
  }, [placeAt, latest]);

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
      position={placeAt ? UNPLACED : undefined}
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
