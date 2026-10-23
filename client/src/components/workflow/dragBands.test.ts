import { describe, it, expect } from 'vitest';
import { bandBoundaries, bandFor, distanceOutside, reservationFor } from './dragBands';
import { rect } from '../../test/dragFixtures';

// The boundaries are content-anchored pixels (`heightPx` in from
// each edge of `contentRect`, never a fraction of the region's height), with
// two collapses to a single band and one exception that halves the edge to
// `(heightPx + gapPx) / 2`, all measured against the fixed shortCard height
// and list gap rather than a tunable.
describe('bandFor', () => {
  const contentRect = rect(0, 100, 100, 200); // spans y 100..300
  const metrics = { heightPx: 40, gapPx: 8 };
  const twoCards = { contentRect, isTerminal: false, cardCount: 2 };

  it('DRAG-3.5: switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers', () => {
    const boundaries = bandBoundaries(twoCards, metrics);
    expect(boundaries).toEqual({ top: 140, bottom: 260 });
    expect(bandFor(139, twoCards, metrics)).toBe('top');
    expect(bandFor(141, twoCards, metrics)).toBe('middle');
    expect(bandFor(259, twoCards, metrics)).toBe('middle');
    expect(bandFor(261, twoCards, metrics)).toBe('bottom');
  });

  it('DRAG-3.5: moves with the shortCard height — the gap plays no part in the 2+-card edge', () => {
    const wide = { heightPx: 80, gapPx: 8 };
    expect(bandFor(170, twoCards, wide)).toBe('top'); // boundary now at 180
    expect(bandFor(215, twoCards, wide)).toBe('middle');
    expect(bandFor(225, twoCards, wide)).toBe('bottom'); // boundary now at 220
  });

  it('clamps a point outside the rect to the nearer edge band', () => {
    expect(bandFor(-50, twoCards, metrics)).toBe('top');
    expect(bandFor(999, twoCards, metrics)).toBe('bottom');
  });

  it('a terminal region is a single band regardless of card count', () => {
    expect(bandBoundaries({ contentRect, isTerminal: true, cardCount: 2 }, metrics)).toBeNull();
    expect(bandFor(105, { contentRect, isTerminal: true, cardCount: 2 }, metrics)).toBe('middle');
    expect(bandFor(295, { contentRect, isTerminal: true, cardCount: 2 }, metrics)).toBe('middle');
  });

  it('an empty region is a single band', () => {
    const empty = { contentRect, isTerminal: false, cardCount: 0 };
    expect(bandBoundaries(empty, metrics)).toBeNull();
    expect(bandFor(105, empty, metrics)).toBe('middle');
    expect(bandFor(295, empty, metrics)).toBe('middle');
  });

  it('DRAG-3.15: exactly one card halves the edge to (heightPx + gapPx) / 2, leaving it a real, unlabeled middle band', () => {
    const oneCard = { contentRect, isTerminal: false, cardCount: 1 };
    expect(bandBoundaries(oneCard, metrics)).toEqual({ top: 124, bottom: 276 }); // (40 + 8) / 2 = 24
    expect(bandFor(123, oneCard, metrics)).toBe('top');
    expect(bandFor(125, oneCard, metrics)).toBe('middle');
    expect(bandFor(275, oneCard, metrics)).toBe('middle');
    expect(bandFor(277, oneCard, metrics)).toBe('bottom');
  });
});

describe('reservationFor', () => {
  it('DRAG-3.5: with two or more cards, each dead zone is (heightPx + gapPx) / 2 tall and each divider heightPx in — from the metrics alone', () => {
    const cards = (cardCount: number) => ({ isTerminal: false, cardCount });
    expect(reservationFor(cards(2), { heightPx: 40, gapPx: 8 })).toEqual({
      shape: 'positional',
      zoneHeight: 24,
      edge: 40,
    });
    // Every number follows the metrics, and the card count past two changes none.
    expect(reservationFor(cards(5), { heightPx: 80, gapPx: 12 })).toEqual({
      shape: 'positional',
      zoneHeight: 46,
      edge: 80,
    });
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
