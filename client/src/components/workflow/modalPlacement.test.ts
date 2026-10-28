import { describe, it, expect } from 'vitest';
import { DESCENDANTS_INDENT_PX, descendantsIndentPx } from '../cardMetrics';
import {
  MODAL_CURSOR_INSET_PX,
  MODAL_EDGE_MARGIN_PX,
  centerModal,
  cursorXInList,
  depthAtCursor,
  gapAtSlot,
  nearestRowIndex,
  placeModal,
  slotForGap,
} from './modalPlacement';

const viewport = { width: 1200, height: 800 };
const dialog = { width: 576, height: 400 };
const base = { viewport, dialog, spotX: 100, spotY: 150, maxScroll: 0 };

describe('placeModal', () => {
  it('DRAG-7.15: puts the spot under the cursor when the dialog fits', () => {
    const placed = placeModal({ ...base, cursor: { x: 600, y: 400 } });
    expect(placed).toEqual({ left: 500, top: 250, scrollTop: 0 });
    // The spot is where the cursor is.
    expect([placed.left + base.spotX, placed.top + base.spotY - placed.scrollTop]).toEqual([600, 400]);
  });

  it.each([
    ['the top', { x: 600, y: 40 }, { top: MODAL_EDGE_MARGIN_PX }],
    ['the bottom', { x: 600, y: 790 }, { top: viewport.height - dialog.height - MODAL_EDGE_MARGIN_PX }],
    ['the left', { x: 20, y: 400 }, { left: MODAL_EDGE_MARGIN_PX }],
    ['the right', { x: 1190, y: 400 }, { left: viewport.width - dialog.width - MODAL_EDGE_MARGIN_PX }],
  ])('DRAG-7.16: is pulled inside the window at %s', (_edge, cursor, expected) => {
    const placed = placeModal({ ...base, cursor });
    expect(placed).toMatchObject(expected);
    // Still under the cursor: the dialog is smaller than the window, so it contains the point.
    expect(cursor.x).toBeGreaterThanOrEqual(placed.left);
    expect(cursor.x).toBeLessThanOrEqual(placed.left + dialog.width);
    expect(cursor.y).toBeGreaterThanOrEqual(placed.top);
    expect(cursor.y).toBeLessThanOrEqual(placed.top + dialog.height);
  });

  it('DRAG-7.17: scrolls the list to bring a spot deep in it under the cursor', () => {
    // The spot is 700px down a list that scrolls 500px; the dialog can't move up past the window.
    const placed = placeModal({ ...base, cursor: { x: 600, y: 300 }, spotY: 700, maxScroll: 500 });
    expect(placed.top).toBe(MODAL_EDGE_MARGIN_PX);
    expect(placed.scrollTop).toBe(700 - (300 - MODAL_EDGE_MARGIN_PX));
    expect(placed.top + 700 - placed.scrollTop).toBe(300);
  });

  it('DRAG-7.17: scrolls no further than the list goes, and not at all for a short one', () => {
    const atEnd = placeModal({ ...base, cursor: { x: 600, y: 100 }, spotY: 700, maxScroll: 200 });
    expect(atEnd.scrollTop).toBe(200);
    expect(placeModal({ ...base, cursor: { x: 600, y: 100 }, spotY: 700, maxScroll: 0 }).scrollTop).toBe(0);
  });

  it('keeps a dialog taller or wider than the window at the margin', () => {
    const placed = placeModal({
      ...base,
      dialog: { width: 2000, height: 2000 },
      cursor: { x: 600, y: 400 },
    });
    expect(placed).toMatchObject({ left: MODAL_EDGE_MARGIN_PX, top: MODAL_EDGE_MARGIN_PX });
  });
});

describe('centerModal', () => {
  it('DRAG-7.25: puts a dialog that fits in the middle of the window, with the list unscrolled', () => {
    expect(centerModal(viewport, dialog)).toEqual({ left: 312, top: 200, scrollTop: 0 });
  });

  it('keeps a dialog taller or wider than the window at the margin', () => {
    expect(centerModal(viewport, { width: 2000, height: 2000 })).toEqual({
      left: MODAL_EDGE_MARGIN_PX,
      top: MODAL_EDGE_MARGIN_PX,
      scrollTop: 0,
    });
  });
});

describe('depth in the modal’s indents', () => {
  it('DRAG-7.15: rests the cursor the inset past where a row at that depth is drawn', () => {
    for (let depth = 0; depth < 12; depth++) {
      expect(cursorXInList(depth)).toBe(descendantsIndentPx(depth) + MODAL_CURSOR_INSET_PX);
    }
  });

  it('DRAG-7.15: reads back the depth the cursor was placed at, at every level', () => {
    for (let depth = 0; depth < 12; depth++) {
      expect(depthAtCursor(1000 + cursorXInList(depth), 1000)).toBe(depth);
    }
  });

  it('DRAG-7.16: a modal shifted sideways reads the depth the cursor is at, to the nearest level', () => {
    const listLeft = 300;
    expect(depthAtCursor(listLeft + cursorXInList(3) + DESCENDANTS_INDENT_PX * 0.4, listLeft)).toBe(3);
    expect(depthAtCursor(listLeft + cursorXInList(3) + DESCENDANTS_INDENT_PX * 0.6, listLeft)).toBe(4);
    // Left of the first level, which the projection holds to the gap's range.
    expect(depthAtCursor(listLeft - 50, listLeft)).toBeLessThan(0);
  });
});

describe('the ghost’s slot', () => {
  // The list as the modal draws it, the ghost X last, as a Card's last child previews.
  const items = ['A', 'Q', 'R', 'R1', 'R2', 'T', 'B', 'X'];
  const none = () => false;

  it('DRAG-7.15: the gap is the count of rows before the slot the ghost takes', () => {
    // dnd-kit puts the ghost in the slot of the row `over` names: over R1, it sits before R1.
    expect(gapAtSlot(items, 'X', items.indexOf('R1'), none)).toBe(3);
    expect(gapAtSlot(items, 'X', 0, none)).toBe(0);
    // Over its own slot, nothing moves: the last gap.
    expect(gapAtSlot(items, 'X', items.indexOf('X'), none)).toBe(7);
  });

  it('a ghost above the slot lands after the row it is moved to', () => {
    const fromAbove = ['X', 'A', 'Q', 'R'];
    expect(gapAtSlot(fromAbove, 'X', 2, none)).toBe(2);
  });

  it('rows that travel with the ghost are not counted', () => {
    // X carries X1: it is never a neighbor, so the gap counts A and B and not it. Over X1's own
    // slot the ghost sits right after A once X1 has moved up past it, with only A before it.
    const carried = ['A', 'X', 'X1', 'B'];
    const travels = (id: string) => id === 'X1';
    expect(gapAtSlot(carried, 'X', 2, travels)).toBe(1);
    expect(gapAtSlot(carried, 'X', 3, travels)).toBe(2);
    expect(gapAtSlot(carried, 'X', 0, travels)).toBe(0);
  });

  it('DRAG-7.15: slotForGap is the inverse, the row to rest the cursor on for a gap', () => {
    for (let gap = 0; gap <= 7; gap++) {
      const slot = slotForGap(items, 'X', gap, none);
      expect(slot, `gap ${gap}`).not.toBeNull();
      expect(gapAtSlot(items, 'X', slot!, none)).toBe(gap);
    }
    const fromAbove = ['X', 'A', 'Q', 'R'];
    for (let gap = 0; gap <= 3; gap++) {
      expect(gapAtSlot(fromAbove, 'X', slotForGap(fromAbove, 'X', gap, none)!, none)).toBe(gap);
    }
  });

  it('is null when the ghost is not in the list, or no row gives the gap', () => {
    expect(gapAtSlot(items, 'Z', 2, none)).toBeNull();
    expect(slotForGap(items, 'X', 99, none)).toBeNull();
  });
});

describe('nearestRowIndex', () => {
  const spans = [
    { top: 0, bottom: 24 },
    { top: 28, bottom: 52 },
    { top: 56, bottom: 80 },
  ];

  it('is the row the cursor is in, or the nearest one between and outside them', () => {
    expect(nearestRowIndex(spans, 40)).toBe(1);
    expect(nearestRowIndex(spans, 26)).toBe(0);
    expect(nearestRowIndex(spans, 27)).toBe(1);
    expect(nearestRowIndex(spans, -30)).toBe(0);
    expect(nearestRowIndex(spans, 500)).toBe(2);
    expect(nearestRowIndex([], 10)).toBeNull();
  });
});
