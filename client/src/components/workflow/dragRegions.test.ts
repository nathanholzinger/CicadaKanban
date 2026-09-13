import { describe, it, expect } from 'vitest';
import { DEFAULT_DRAG_TUNING } from './dragTuning';
import { bandFor, distanceOutside, regionAt } from './dragRegions';
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

  it("a column's full vertical stripe counts: above or below the body still resolves to it", () => {
    expect(regionAt(regions, { x: 50, y: -40 })).toBe(colA);
    expect(regionAt(regions, { x: 50, y: 900 })).toBe(colA);
  });

  it('between two sub-rows the nearer one wins (DRAG-1.6: sub-rows are distinct contexts)', () => {
    expect(regionAt(regions, { x: 150, y: 160 })).toBe(subB1);
    expect(regionAt(regions, { x: 150, y: 172 })).toBe(subB2);
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
