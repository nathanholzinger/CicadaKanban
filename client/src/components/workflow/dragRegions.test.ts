import { describe, it, expect, afterEach } from 'vitest';
import { DEFAULT_DRAG_TUNING } from './dragTuning';
import { bandFor, clipToVisible, distanceOutside, measureDragRegions, regionAt, type Rect } from './dragRegions';
import { rect, region } from '../../test/dragFixtures';

// Two columns 100 wide with a 20px gap; column B is expanded into two
// sub-rows stacked with a 30px label gap between them.
const colA = region('column:a', rect(0, 0, 100, 400));
const subB1 = region('subrow:b:w1', rect(120, 0, 100, 150));
const subB2 = region('subrow:b:w2', rect(120, 180, 100, 150));
const regions = [colA, subB1, subB2];

describe('regionAt', () => {
  it('hits the region containing the point', () => {
    expect(regionAt(regions, { x: 50, y: 200 })).toBe(colA);
    expect(regionAt(regions, { x: 150, y: 100 })).toBe(subB1);
    expect(regionAt(regions, { x: 150, y: 200 })).toBe(subB2);
  });

  it("is null between columns (a gap is nobody's region)", () => {
    expect(regionAt(regions, { x: 110, y: 200 })).toBeNull();
  });

  it('is a bounded box (reconciliation #20): above or below it is nowhere, not the column', () => {
    expect(regionAt(regions, { x: 50, y: -40 })).toBeNull();
    expect(regionAt(regions, { x: 50, y: 900 })).toBeNull();
  });

  it('is null in the gap between two sub-rows (DRAG-1.6: sub-rows are distinct contexts, and the gap belongs to neither)', () => {
    expect(regionAt(regions, { x: 150, y: 160 })).toBeNull();
    expect(regionAt(regions, { x: 150, y: 179 })).toBeNull();
    expect(regionAt(regions, { x: 150, y: 180 })).toBe(subB2);
  });
});

// DRAG-3.5: the bands are the configured values, not 20/60/20.
describe('bandFor', () => {
  const r = rect(0, 100, 100, 200); // spans y 100..300

  it('splits the rect by the configured fractions', () => {
    expect(bandFor(139, r, DEFAULT_DRAG_TUNING)).toBe('top'); // 19.5%
    expect(bandFor(141, r, DEFAULT_DRAG_TUNING)).toBe('middle'); // 20.5%
    expect(bandFor(259, r, DEFAULT_DRAG_TUNING)).toBe('middle'); // 79.5%
    expect(bandFor(261, r, DEFAULT_DRAG_TUNING)).toBe('bottom'); // 80.5%
  });

  it('moves with the configured values', () => {
    const wide = { columnTopBand: 0.4, columnBottomBand: 0.1 };
    expect(bandFor(170, r, wide)).toBe('top'); // 35%
    expect(bandFor(261, r, wide)).toBe('middle'); // 80.5% — bottom band now starts at 90%
    expect(bandFor(285, r, wide)).toBe('bottom');
  });

  it('clamps a point outside the rect to the nearer edge band', () => {
    expect(bandFor(-50, r, DEFAULT_DRAG_TUNING)).toBe('top');
    expect(bandFor(999, r, DEFAULT_DRAG_TUNING)).toBe('bottom');
  });

  it('a zero-height rect is all middle', () => {
    expect(bandFor(5, rect(0, 0, 100, 0), DEFAULT_DRAG_TUNING)).toBe('middle');
  });
});

describe('distanceOutside', () => {
  const r = rect(100, 100, 100, 100);
  it('is 0 inside and the straight-line distance to the nearest edge outside', () => {
    expect(distanceOutside({ x: 150, y: 150 }, r)).toBe(0);
    expect(distanceOutside({ x: 250, y: 150 }, r)).toBe(50);
    expect(distanceOutside({ x: 150, y: 20 }, r)).toBe(80);
    expect(distanceOutside({ x: 230, y: 60 }, r)).toBe(50); // 30 right, 40 up
  });
});

// Reconciliation #20/#21: a sub-row is clipped to its column's visible
// scroll box, not just bounded by its own extent.
describe('clipToVisible', () => {
  const bounds = rect(0, 100, 200, 200); // the scroll ancestor's own visible box, y 100..300

  it('clips the part of the rect outside the visible box, on either edge or both', () => {
    const partlyAbove = rect(0, 50, 200, 100); // y 50..150
    expect(clipToVisible(partlyAbove, bounds)).toEqual({ ...partlyAbove, top: 100, bottom: 150, height: 50 });

    const partlyBelow = rect(0, 250, 200, 100); // y 250..350
    expect(clipToVisible(partlyBelow, bounds)).toEqual({ ...partlyBelow, bottom: 300, height: 50 });

    const taller = rect(0, 50, 200, 300); // y 50..350 — taller than the box on both sides
    expect(clipToVisible(taller, bounds)).toEqual({ ...taller, top: 100, bottom: 300, height: 200 });
  });

  it('is null once none of the rect is left visible', () => {
    expect(clipToVisible(rect(0, 310, 200, 50), bounds)).toBeNull(); // fully below
    expect(clipToVisible(rect(0, 0, 200, 90), bounds)).toBeNull(); // fully above
  });

  // A real browser's DOMRect exposes its fields as accessor getters on
  // `DOMRect.prototype`, not as the instance's own enumerable properties
  // (unlike jsdom's, and unlike the plain-object fixture above) — so
  // `{ ...domRect }` silently drops every field instead of throwing. This
  // is what actually caught it: every subrow region resolved with
  // `left`/`right`/`width` missing, so no point could ever match it.
  function fakeDomRect(values: Rect): Rect {
    return Object.create({
      get top() {
        return values.top;
      },
      get bottom() {
        return values.bottom;
      },
      get left() {
        return values.left;
      },
      get right() {
        return values.right;
      },
      get width() {
        return values.width;
      },
      get height() {
        return values.height;
      },
    });
  }

  it('keeps left/right/width from a DOMRect-shaped object, not just a plain one', () => {
    const domRect = fakeDomRect(rect(10, 50, 80, 200)); // left 10, top 50, width 80, height 200 -> bottom 250
    expect({ ...domRect }).toEqual({}); // confirms the shape actually exercises the hazard
    expect(clipToVisible(domRect, bounds)).toEqual({
      top: 100,
      bottom: 250,
      left: 10,
      right: 90,
      width: 80,
      height: 150,
    });
  });
});

describe('measureDragRegions', () => {
  function mockRect(el: HTMLElement, r: ReturnType<typeof rect>) {
    Object.defineProperty(el, 'getBoundingClientRect', { value: () => ({ ...r, x: r.left, y: r.top }) });
  }

  function expandedColumn(id: string, workphaseId: string) {
    return {
      id,
      broken: false,
      displayMode: 'expanded' as const,
      entryWorkphaseId: workphaseId,
      subRows: [{ workphase: { id: workphaseId } }],
    };
  }

  // A sub-row's `[data-drag-region]` element sits inside its column's
  // `overflow-y-auto` scroll box (dragRegions.ts::findVerticalScrollAncestor
  // finds it by computed style, not by class name).
  function buildScrolledSubrow(subrowRectValue: ReturnType<typeof rect>, boxRectValue: ReturnType<typeof rect>) {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    mockRect(box, boxRectValue);
    const subrowEl = document.createElement('div');
    subrowEl.setAttribute('data-drag-region', 'subrow:col-1:w1');
    mockRect(subrowEl, subrowRectValue);
    box.appendChild(subrowEl);
    document.body.appendChild(box);
    return box;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("clips a sub-row's region to its column's visible scroll box", () => {
    buildScrolledSubrow(rect(0, 150, 300, 150), rect(0, 0, 300, 200)); // sub-row y 150..300, box y 0..200
    const regions = measureDragRegions(document, [expandedColumn('col-1', 'w1')]);
    expect(regions).toHaveLength(1);
    expect(regions[0].rect).toMatchObject({ top: 150, bottom: 200, height: 50 });
  });

  it('a sub-row scrolled fully out of view registers no region at all', () => {
    buildScrolledSubrow(rect(0, 400, 300, 150), rect(0, 0, 300, 200)); // sub-row y 400..550, box y 0..200
    expect(measureDragRegions(document, [expandedColumn('col-1', 'w1')])).toEqual([]);
  });
});
