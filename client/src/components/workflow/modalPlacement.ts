// Where the hierarchy modal opens during a drag, and what the cursor reads there
// (wiki board-drag-interaction §7.3). Pure geometry over numbers the modal measures:
// the component owns the DOM and hands these in.
//
// The modal is placed so that the spot the ghost held beside the overflow row, its owner's first
// or last child, sits under the cursor, with the list scrolled to bring it there when the list is
// longer than the modal. It is kept inside the window; when that shifts it, the spot is no longer
// under the cursor, and the cursor reads a gap and a depth of its own against the modal's rows.
// Opening re-reads both from the cursor either way (`gapAtSlot`, `depthAtCursor`), so a modal that
// fitted reads the spot it was placed for, and one that was shifted reads where the cursor is.

import { arrayMove } from '@dnd-kit/sortable';
import { DESCENDANTS_INDENT_PX } from '../cardMetrics';

// The gap kept between the modal and each window edge.
export const MODAL_EDGE_MARGIN_PX = 8;

// How far in from a row's own left edge the cursor rests: over its type pill, not its left edge.
// Depth is read from the cursor's x against the indents, so the same number places and reads it.
export const MODAL_CURSOR_INSET_PX = 16;

// What the cursor reads against the modal's rows once it is placed: the gap the ghost takes and
// the depth it is tabbed to.
export interface ModalReading {
  gap: number;
  depth: number;
}

// The cursor's x in a list of rows, from the list's left edge, when it is at `depth`. A row at
// depth `d` starts `(d + 1)` indents in (`cardMetrics.ts::descendantsIndentPx`).
export function cursorXInList(depth: number): number {
  return (depth + 1) * DESCENDANTS_INDENT_PX + MODAL_CURSOR_INSET_PX;
}

// The depth the cursor's x is at, against the modal's own indents: the inverse of `cursorXInList`,
// to the nearest level. It may come out negative, left of the first level, which the projection
// holds to the gap's range.
export function depthAtCursor(cursorX: number, listLeft: number): number {
  return Math.round((cursorX - listLeft - MODAL_CURSOR_INSET_PX) / DESCENDANTS_INDENT_PX) - 1;
}

export interface ModalPlacementInput {
  cursor: { x: number; y: number };
  viewport: { width: number; height: number };
  dialog: { width: number; height: number };
  /** Where the cursor lies in the dialog for the placement to be exact, from the dialog's left edge (`cursorXInList` and the list's own offset). */
  spotX: number;
  /** The spot's centre from the dialog's top edge, the list scrolled to its top. */
  spotY: number;
  /** How far the list can scroll. */
  maxScroll: number;
}

export interface ModalPlacement {
  left: number;
  top: number;
  scrollTop: number;
}

function fitInside(start: number, size: number, extent: number): number {
  return Math.max(MODAL_EDGE_MARGIN_PX, Math.min(start, extent - size - MODAL_EDGE_MARGIN_PX));
}

// The dialog's position and the list's scroll that put the spot under the cursor, or as near as
// the window allows. The window comes first: a dialog that would cross an edge is pulled inside
// it. The list's scroll then makes up what the dialog's position couldn't, as far as it can.
export function placeModal({ cursor, viewport, dialog, spotX, spotY, maxScroll }: ModalPlacementInput): ModalPlacement {
  const left = fitInside(cursor.x - spotX, dialog.width, viewport.width);
  const top = fitInside(cursor.y - spotY, dialog.height, viewport.height);
  const scrollTop = Math.max(0, Math.min(maxScroll, spotY - (cursor.y - top)));
  return { left, top, scrollTop };
}

// The dialog's position when nothing places it at the cursor: in the middle of the window, where a
// click opens it, and inside the margin when it is larger than the window.
export function centerModal(
  viewport: ModalPlacementInput['viewport'],
  dialog: ModalPlacementInput['dialog'],
): ModalPlacement {
  return placeModal({
    cursor: { x: viewport.width / 2, y: viewport.height / 2 },
    viewport,
    dialog,
    spotX: dialog.width / 2,
    spotY: dialog.height / 2,
    maxScroll: 0,
  });
}

// The gap the ghost lands in when the cursor is over the row at `overIndex` of the list's
// sortable `items`, as the count of rows before it that don't travel with it. dnd-kit's shuffle
// puts the ghost in the slot of the row `over` names, so this is the gap the projection reads off
// the named neighbor (`dragCollision.ts::dropAnchorFor`, `descendantsProjection.ts`), without
// asking dnd-kit. Null when the ghost isn't in the list.
export function gapAtSlot(
  items: readonly string[],
  activeId: string,
  overIndex: number,
  travels: (id: string) => boolean,
): number | null {
  const activeIndex = items.indexOf(activeId);
  if (activeIndex === -1) return null;
  const order = arrayMove([...items], activeIndex, overIndex);
  return order.slice(0, order.indexOf(activeId)).filter(id => !travels(id)).length;
}

// The row to rest the cursor on for the ghost to take `gap`: the first slot whose `gapAtSlot` is
// it. Null when no row's slot gives it.
export function slotForGap(
  items: readonly string[],
  activeId: string,
  gap: number,
  travels: (id: string) => boolean,
): number | null {
  for (let i = 0; i < items.length; i++) {
    if (gapAtSlot(items, activeId, i, travels) === gap) return i;
  }
  return null;
}

// The row whose vertical span the cursor's y is in, or, between rows or outside them, the nearest
// one. Null with no rows.
export function nearestRowIndex(spans: ReadonlyArray<{ top: number; bottom: number }>, y: number): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  spans.forEach(({ top, bottom }, i) => {
    const distance = y < top ? top - y : y > bottom ? y - bottom : 0;
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}
