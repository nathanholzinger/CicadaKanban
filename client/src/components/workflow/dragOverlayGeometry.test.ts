import { describe, it, expect } from 'vitest';
import {
  clampAxis,
  clampToCurrentContext,
  overlayClampRect,
  overlayShapeFor,
  overlayWidthFor,
  reanchorOverlayTransform,
  type OverlayTransform,
} from './dragOverlayGeometry';
import { startPopSession } from './popSession';
import { CARD_CONTENT_INSET_PX, STUB_ROW_HEIGHT_PX } from '../cardMetrics';
import { descendantsRegion, rect, region } from '../../test/dragFixtures';

// Every transform here is in dnd-kit's delta space (a translation from the
// dragged node's resting position); every rect is in screen space.

function transform(x: number, y: number): OverlayTransform {
  return { x, y, scaleX: 1, scaleY: 1 };
}

describe('clampAxis', () => {
  // A box at origin 100, size 50, bounded to [0, 300]: it may translate
  // from -100 (its near edge on 0) to +150 (its far edge on 300).
  it.each([
    ['inside the bounds: unchanged', 20, 20],
    ['past the far edge: its far edge sits on max', 200, 150],
    ['past the near edge: its near edge sits on min', -150, -100],
    ['exactly on an edge: unchanged', 150, 150],
  ])('%s', (_, translate, expected) => {
    expect(clampAxis(translate, 100, 50, 0, 300)).toBe(expected);
  });

  it('pins a box exactly as wide as its bounds: no travel on that axis (the carried Stub at section width)', () => {
    for (const translate of [-40, 0, 40]) expect(clampAxis(translate, 100, 200, 100, 300)).toBe(0);
  });

  it('keeps a box wider than its bounds between its two edge positions rather than inverting them', () => {
    // size 250 in [100, 300]: near-edge bound 0, far-edge bound -50.
    expect(clampAxis(20, 100, 250, 100, 300)).toBe(0);
    expect(clampAxis(-80, 100, 250, 100, 300)).toBe(-50);
    expect(clampAxis(-20, 100, 250, 100, 300)).toBe(-20);
  });

  it('is a no-op on its own output, since the modifier chain runs it twice per frame', () => {
    const once = clampAxis(200, 100, 50, 0, 300);
    expect(clampAxis(once, 100, 50, 0, 300)).toBe(once);
  });
});

describe('clampToCurrentContext', () => {
  const overlay = rect(100, 100, 50, 20);
  const bounds = rect(0, 0, 200, 200);
  // Unclamped, the overlay would land at (600, 600), outside `bounds` both
  // ways. Clamped: x = 200 - 50 - 100 = 50, y = 200 - 20 - 100 = 80.
  const far = transform(500, 500);

  it.each([
    ['a merged column bounds x only', region('column:c1', bounds), { x: 50, y: 500 }],
    ['a sub-row bounds both axes', region('subrow:c1:w1', bounds), { x: 50, y: 80 }],
    ['a Card’s Descendants layer bounds both axes', descendantsRegion('p', bounds, 'column:c1'), { x: 50, y: 80 }],
  ])('DRAG-1.28: %s', (_, context, expected) => {
    expect(clampToCurrentContext(far, overlay, startPopSession(context.key), [context])).toEqual({
      ...far,
      ...expected,
    });
  });

  it('leaves a transform already inside the context untouched', () => {
    const inside = transform(10, 10);
    const context = region('subrow:c1:w1', bounds);
    expect(clampToCurrentContext(inside, overlay, startPopSession(context.key), [context])).toEqual(inside);
  });

  it.each([
    ['no pop session', null, [region('column:c1', bounds)]],
    ['popped out (no context)', startPopSession(null), [region('column:c1', bounds)]],
    ['a context with no measured region (clipped out of view)', startPopSession('column:c1'), []],
  ])('returns the transform unchanged with %s', (_, pop, regions) => {
    expect(clampToCurrentContext(far, overlay, pop, regions)).toBe(far);
  });

  it('returns the transform unchanged with no overlay rect yet', () => {
    const context = region('column:c1', bounds);
    expect(clampToCurrentContext(far, null, startPopSession(context.key), [context])).toBe(far);
  });

  it('is a no-op on its own output', () => {
    const context = region('subrow:c1:w1', bounds);
    const pop = startPopSession(context.key);
    const once = clampToCurrentContext(far, overlay, pop, [context]);
    expect(clampToCurrentContext(once, overlay, pop, [context])).toEqual(once);
  });
});

describe('overlayWidthFor', () => {
  it("is the modal list's own width: a row spans the whole list", () => {
    const list = descendantsRegion('p', rect(0, 0, 240, 100), 'column:c1', { boundsRect: rect(0, -40, 240, 140) });
    expect(overlayWidthFor(list)).toBe(240);
  });

  it("DRAG-3.22: on the board is the Card's width minus its content inset on both sides", () => {
    expect(overlayWidthFor(descendantsRegion('p', rect(0, 0, 240, 100), 'column:c1'))).toBe(
      240 - 2 * CARD_CONTENT_INSET_PX,
    );
  });

  it('is null for a card list (the carried copy is a shortCard there) and with no region', () => {
    expect(overlayWidthFor(region('column:c1', rect(0, 0, 240, 100)))).toBeNull();
    expect(overlayWidthFor(undefined)).toBeNull();
  });
});

describe('overlayShapeFor', () => {
  const cardP = descendantsRegion('p', rect(0, 0, 240, 100), 'column:c1');
  const modalList = descendantsRegion('p', rect(0, 0, 240, 100), 'column:c1', { boundsRect: rect(0, -40, 240, 140) });
  const columnC1 = region('column:c1', rect(0, 0, 240, 400));

  it("DRAG-3.22: locked at a Card's Descendants layer, or the modal that holds it: the Stub, at a row's width", () => {
    const cardWidth = 240 - 2 * CARD_CONTENT_INSET_PX;
    expect(overlayShapeFor(startPopSession(cardP.key), [cardP], null)).toEqual({ form: 'stub', widthPx: cardWidth });
    expect(overlayShapeFor(startPopSession(modalList.key), [modalList], null)).toEqual({ form: 'stub', widthPx: 240 });
  });

  it('anywhere else, or with no drag: the shortCard, with no width', () => {
    const noWidth = { form: 'short-card', widthPx: null };
    expect(overlayShapeFor(startPopSession(columnC1.key), [columnC1], null)).toEqual(noWidth);
    expect(overlayShapeFor(null, [columnC1], null)).toEqual(noWidth);
  });

  it("gives a Stub's drag its containing Card's width as a shortCard, in a card list and at Board", () => {
    const shortCard = { form: 'short-card', widthPx: 272 };
    expect(overlayShapeFor(startPopSession(columnC1.key), [columnC1], 272)).toEqual(shortCard);
    expect(overlayShapeFor(startPopSession(null), [columnC1], 272)).toEqual(shortCard);
  });

  it("keeps a row's width for the Stub form, whatever the containing Card's is", () => {
    expect(overlayShapeFor(startPopSession(modalList.key), [modalList], 272)).toEqual({ form: 'stub', widthPx: 240 });
  });
});

describe('overlayClampRect', () => {
  // dnd-kit's measurement of a shortCard a Stub's drag draws: the left of the row it mounted as, and
  // the tilted copy's bounding width.
  const measured = rect(100, 200, 275, 105);

  it('takes the width the copy is drawn at, and keeps the rest of the measurement', () => {
    expect(overlayClampRect(measured, { form: 'short-card', widthPx: 272 })).toEqual({
      ...measured,
      width: 272,
      right: 372,
    });
  });

  it('holds a copy as wide as its card list to the list’s own edges', () => {
    const list = region('column:c1', rect(100, 0, 272, 400));
    const pop = startPopSession(list.key);
    const clampRect = overlayClampRect(measured, { form: 'short-card', widthPx: 272 });
    for (const x of [-40, 0, 40]) {
      expect(clampToCurrentContext(transform(x, 0), clampRect, pop, [list]).x).toBe(0);
    }
  });

  it('is the measurement itself when the drag sets no width, and null with none', () => {
    expect(overlayClampRect(measured, { form: 'short-card', widthPx: null })).toBe(measured);
    expect(overlayClampRect(null, { form: 'short-card', widthPx: 272 })).toBeNull();
  });
});

describe('reanchorOverlayTransform', () => {
  // Picked up a quarter of the way across a 200px-wide row.
  const pickupRect = rect(100, 200, 200, 60);
  const pickupPointer = new MouseEvent('pointerdown', { clientX: 150, clientY: 230 });
  const pointerNow = { x: 400, y: 500 };
  const stubWidth = 120;
  const incoming = transform(300, 300);

  it("DRAG-3.22: keeps the pointer at the same fraction across the Stub's width, and on its vertical middle", () => {
    const result = reanchorOverlayTransform(
      incoming,
      pickupRect,
      pickupPointer,
      pointerNow,
      'short-card',
      'stub',
      stubWidth,
    );
    // The Stub's own box, drawn at the overlay's resting rect plus the transform.
    expect(pickupRect.left + result.x + 0.25 * stubWidth).toBe(pointerNow.x);
    expect(pickupRect.top + result.y + STUB_ROW_HEIGHT_PX / 2).toBe(pointerNow.y);
    expect(result.scaleX).toBe(incoming.scaleX);
    expect(result.scaleY).toBe(incoming.scaleY);
  });

  it('centers the pointer on a zero-width pickup rect', () => {
    const flat = rect(100, 200, 0, 60);
    const result = reanchorOverlayTransform(incoming, flat, pickupPointer, pointerNow, 'short-card', 'stub', stubWidth);
    expect(flat.left + result.x + 0.5 * stubWidth).toBe(pointerNow.x);
  });

  it('gives the same answer on its own output, since the modifier chain runs it twice per frame', () => {
    const once = reanchorOverlayTransform(
      incoming,
      pickupRect,
      pickupPointer,
      pointerNow,
      'short-card',
      'stub',
      stubWidth,
    );
    const twice = reanchorOverlayTransform(
      once,
      pickupRect,
      pickupPointer,
      pointerNow,
      'short-card',
      'stub',
      stubWidth,
    );
    expect(twice).toEqual(once);
  });

  it.each([
    ['the copy is not a Stub now', 'short-card', 'short-card'],
    ["the drag started as a Stub and is one of the same width (a Stub's own drag in its section)", 'stub', 'stub'],
  ] as const)('returns the transform unchanged when %s', (_, pickupForm, currentForm) => {
    const width = pickupRect.width;
    expect(
      reanchorOverlayTransform(incoming, pickupRect, pickupPointer, pointerNow, pickupForm, currentForm, width),
    ).toBe(incoming);
  });

  describe("a Stub's drag drawn as a shortCard", () => {
    // Picked up three quarters of the way across a 574px-wide row of the hierarchy modal.
    const modalRow = rect(100, 200, 574, 24);
    const grab = new MouseEvent('pointerdown', { clientX: 100 + 0.75 * 574, clientY: 210 });

    it('keeps the pointer at the same fraction across a copy narrower than the row, and leaves y alone', () => {
      const result = reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'short-card', 272);
      expect(modalRow.left + result.x + 0.75 * 272).toBe(pointerNow.x);
      expect(result.y).toBe(incoming.y);
    });

    it('gives the same answer on its own output', () => {
      const once = reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'short-card', 272);
      expect(reanchorOverlayTransform(once, modalRow, grab, pointerNow, 'stub', 'short-card', 272)).toEqual(once);
    });

    it.each([
      ['as wide as the row', 574],
      ['wider than the row', 600],
    ])('returns the transform unchanged for a copy %s', (_, width) => {
      expect(reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'short-card', width)).toBe(
        incoming,
      );
    });

    // Back into a Card's own section, where a row is narrower than the modal's.
    it('keeps the pointer at the same fraction across a Stub narrower than the row it was picked up as', () => {
      const result = reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'stub', 246);
      expect(modalRow.left + result.x + 0.75 * 246).toBe(pointerNow.x);
      expect(result.y).toBe(incoming.y);
    });

    it('returns the transform unchanged for a Stub as wide as the row it was picked up as', () => {
      expect(reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'stub', 574)).toBe(incoming);
    });

    it('returns the transform unchanged with no width', () => {
      expect(reanchorOverlayTransform(incoming, modalRow, grab, pointerNow, 'stub', 'short-card', null)).toBe(incoming);
    });
  });

  it.each([
    ['no pickup rect', null, pickupPointer, pointerNow, stubWidth],
    ['no pickup event', pickupRect, null, pointerNow, stubWidth],
    ['no live pointer', pickupRect, pickupPointer, null, stubWidth],
    ['no Stub width', pickupRect, pickupPointer, pointerNow, null],
    ['a pickup event with no pointer position', pickupRect, new KeyboardEvent('keydown'), pointerNow, stubWidth],
  ])('returns the transform unchanged with %s', (_, rectArg, eventArg, pointerArg, widthArg) => {
    const result = reanchorOverlayTransform(incoming, rectArg, eventArg, pointerArg, 'short-card', 'stub', widthArg);
    expect(result).toBe(incoming);
  });
});
