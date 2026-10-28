import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import HierarchyModal from './HierarchyModal';
import { DragSessionContext, type DescendantsProjection, type DragSession } from './workflow/DragSessionContext';
import { classifyDragTargets } from './workflow/dragClassification';
import { DRAG_REGION_ATTR, descendantsRegionKey, type Point } from './workflow/dragRegions';
import { cursorXInList } from './workflow/modalPlacement';
import { startPopSession } from './workflow/popSession';
import { rect, stubOrigin } from '../test/dragFixtures';
import { makeItem } from '../test/itemFixture';

// P's rows in the modal: B, D (the one carried), D1 (D's child, which travels with it), C.
const CARD = makeItem('p');
const B = makeItem('b', { parentId: 'p' });
const D = makeItem('d', { parentId: 'p' });
const D1 = makeItem('d1', { parentId: 'd' });
const C = makeItem('c', { parentId: 'p' });
const ALL = [CARD, B, D, D1, C];
const attachedChildren = (parentId: string) => ALL.filter(i => i.parentId === parentId);

// The ghost sits in the last gap, after C: two rows of P's that don't travel are before it.
const PROJECTION: DescendantsProjection = {
  gap: 2,
  depth: 0,
  valid: true,
  resolved: { parentId: 'p', anchor: null },
  atOwnSlot: false,
  slotHidden: false,
  overflowBeside: null,
};

function sessionOf(activeItem = D, projection: DescendantsProjection | null = PROJECTION): DragSession {
  return {
    activeItem,
    classification: classifyDragTargets(activeItem.id, ALL, 12),
    pop: startPopSession(descendantsRegionKey('p')),
    priorPlacement: null,
    origin: stubOrigin('p'),
    containingCardId: 'p',
    projection,
  };
}

const CURSOR: Point = { x: 400, y: 300 };

function modal(session: DragSession | null, anchor: Point | null, onPlaced = vi.fn()) {
  return (
    <DndContext>
      <DragSessionContext.Provider value={session}>
        <HierarchyModal
          card={CARD}
          itemTypes={[]}
          getAttachedChildren={attachedChildren}
          anchor={anchor}
          onPlaced={onPlaced}
          onClose={() => {}}
        />
      </DragSessionContext.Provider>
    </DndContext>
  );
}

// jsdom lays nothing out, so the measurements the placement reads are stood in for: a dialog of a
// fixed size wherever its inline style puts it, its list a fixed offset into it, and rows in a
// column of fixed steps down from the list's top.
const DIALOG = { width: 576, height: 400 };
const LIST = { x: 24, y: 80, width: 528, height: 300 };
const ROW = { step: 32, height: 28 };

function stubLayout() {
  const dialogOf = (el: Element) => {
    const dialog = el.closest<HTMLElement>('[role="dialog"]')!;
    return { left: parseFloat(dialog.style.left) || 0, top: parseFloat(dialog.style.top) || 0 };
  };
  const rowIndex = (el: HTMLElement) =>
    Array.from(el.closest(`[${DRAG_REGION_ATTR}]`)!.querySelectorAll('[data-item-id]')).indexOf(el);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const at = this.closest('[role="dialog"]') ? dialogOf(this) : { left: 0, top: 0 };
    if (this.getAttribute('role') === 'dialog') return rect(at.left, at.top, DIALOG.width, DIALOG.height) as DOMRect;
    if (this.hasAttribute(DRAG_REGION_ATTR)) {
      return rect(at.left + LIST.x, at.top + LIST.y, LIST.width, LIST.height) as DOMRect;
    }
    return rect(0, 0, 0, 0) as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-item-id') ? LIST.y + rowIndex(this) * ROW.step : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-item-id') ? ROW.height : 0;
  });
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    return this.hasAttribute(DRAG_REGION_ATTR) ? LIST.height : 0;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the hierarchy modal opened without a drag to place it', () => {
  it('DRAG-7.25: a modal that mounts with the cursor’s anchor and no drag running is centered, as a click opens it', () => {
    stubLayout();
    const onPlaced = vi.fn();
    // What a reload does to a modal a hold opened: the board comes back with the anchor still held
    // and the drag over.
    const { rerender } = render(modal(null, CURSOR, onPlaced));

    const dialog = screen.getByRole('dialog');
    expect(dialog.style.left).toBe('');
    expect(dialog.style.top).toBe('');
    expect(dialog.parentElement).toHaveClass('flex', 'items-center', 'justify-center');
    expect(onPlaced).not.toHaveBeenCalled();

    // A drag that begins afterward doesn't move it to the cursor.
    rerender(modal(sessionOf(), CURSOR, onPlaced));
    expect(screen.getByRole('dialog').style.left).toBe('');
    expect(onPlaced).not.toHaveBeenCalled();
  });

  it('a click centers it the same way', () => {
    stubLayout();
    const onPlaced = vi.fn();
    render(modal(null, null, onPlaced));

    const dialog = screen.getByRole('dialog');
    expect(dialog.style.left).toBe('');
    expect(dialog.parentElement).toHaveClass('flex', 'items-center', 'justify-center');
    expect(onPlaced).not.toHaveBeenCalled();
  });
});

describe('the hierarchy modal opened by a hold during a drag', () => {
  it('DRAG-7.15: rests the cursor on the row of the ghost’s gap, past the rows that travel with it, and reports the gap and depth there', () => {
    stubLayout();
    const onPlaced = vi.fn();
    render(modal(sessionOf(), CURSOR, onPlaced));

    // Gap 2 is after C. D1 travels with D, so it doesn't count toward the gap: C's row, the fourth
    // (offset 80 + 3 × 32, its middle 14 below), is the one the cursor rests on.
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.top).toBe(`${CURSOR.y - (LIST.y + 3 * ROW.step + ROW.height / 2)}px`);
    expect(dialog.style.left).toBe(`${CURSOR.x - (LIST.x + cursorXInList(0))}px`);
    expect(onPlaced).toHaveBeenCalledTimes(1);
    expect(onPlaced).toHaveBeenCalledWith({ gap: 2, depth: 0 });
  });

  it.each([
    ['the session has no projection to rest on', sessionOf(D, null)],
    ['the dragged item has no row in it', sessionOf(makeItem('elsewhere'))],
  ])('centers it, says so and reports nothing when %s', (_case, session) => {
    stubLayout();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onPlaced = vi.fn();
    render(modal(session, CURSOR, onPlaced));

    // Centered in jsdom's 1024 × 768 window.
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.left).toBe(`${(window.innerWidth - DIALOG.width) / 2}px`);
    expect(dialog.style.top).toBe(`${(window.innerHeight - DIALOG.height) / 2}px`);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(onPlaced).not.toHaveBeenCalled();
  });
});
