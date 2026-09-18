import { describe, it, expect, afterEach } from 'vitest';
import {
  bandBoundaries,
  bandFor,
  childRegionAt,
  clipToVisible,
  containsPoint,
  distanceOutside,
  measureRegions,
  resolveDragStructure,
  type Rect,
} from './dragRegions';
import { rect, region, column } from '../../test/dragFixtures';

// A real browser's DOMRect exposes its fields as accessor getters on
// `DOMRect.prototype`, not as the instance's own enumerable properties
// (unlike jsdom's, and unlike a plain-object fixture) — so `{ ...domRect }`
// silently drops every field instead of throwing. This is what actually
// caught it: every sub-row region resolved with `left`/`right`/`width`
// missing, so no point could ever match it. Shared by every test below that
// needs to prove a Rect-shaped function doesn't re-introduce the hazard
// (audit epic-3-5-story-3-reconciled #2 — it moved from being `clipToVisible`'s
// problem alone to being every `Rect`-touching function's, until `toRect`
// became the one place a DOMRect is read).
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

// Two columns 100 wide with a 20px gap; column B is expanded into two
// sub-rows stacked with a 30px label gap between them.
const colA = region('column:a', rect(0, 0, 100, 400));
const subB1 = region('subrow:b:w1', rect(120, 0, 100, 150));
const subB2 = region('subrow:b:w2', rect(120, 180, 100, 150));
const regions = [colA, subB1, subB2];

// Story 4.1 Phase 0: `childRegionAt(regions, point, null)` is Board's own
// lookup — every column/sub-row's `parentRegionKey` is null — replacing
// the old, separate `nonCardRegionAt`. `cardRegionAt` (a locked
// column/sub-row's own Cards, `parentKey` set) is the same function; see
// the `resolveDragStructure / measureRegions` describe block below for a
// Card-kind region.
describe('childRegionAt (Board layer: parentKey null)', () => {
  it('hits the region containing the point', () => {
    expect(childRegionAt(regions, { x: 50, y: 200 }, null)).toBe(colA);
    expect(childRegionAt(regions, { x: 150, y: 100 }, null)).toBe(subB1);
    expect(childRegionAt(regions, { x: 150, y: 200 }, null)).toBe(subB2);
  });

  it("is null between columns (a gap is nobody's region)", () => {
    expect(childRegionAt(regions, { x: 110, y: 200 }, null)).toBeNull();
  });

  it('is a bounded box (reconciliation #20): above or below it is nowhere, not the column', () => {
    expect(childRegionAt(regions, { x: 50, y: -40 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 50, y: 900 }, null)).toBeNull();
  });

  it('is null in the gap between two sub-rows (DRAG-1.6: sub-rows are distinct contexts, and the gap belongs to neither)', () => {
    expect(childRegionAt(regions, { x: 150, y: 160 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 179 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 180 }, null)).toBe(subB2);
  });
});

// DRAG-3.5 / Story 4.1 Phase 1: the boundaries are content-anchored pixels
// (`heightPx` in from each edge of `contentRect`, never a fraction of the
// region's height), with two collapses to a single band and one exception
// that halves the edge to `(heightPx + gapPx) / 2` — the Product Owner's
// three special rules (2026-09-16), against the fixed shortCard height and
// list gap (`KanbanCard.tsx`) rather than a tunable.
describe('bandFor', () => {
  const contentRect = rect(0, 100, 100, 200); // spans y 100..300
  const metrics = { heightPx: 40, gapPx: 8 };
  const twoCards = { contentRect, isTerminal: false, cardCount: 2 };

  it('switches exactly at the boundaries bandBoundaries reports — the guides draw from the same numbers', () => {
    const boundaries = bandBoundaries(twoCards, metrics);
    expect(boundaries).toEqual({ top: 140, bottom: 260 });
    expect(bandFor(139, twoCards, metrics)).toBe('top');
    expect(bandFor(141, twoCards, metrics)).toBe('middle');
    expect(bandFor(259, twoCards, metrics)).toBe('middle');
    expect(bandFor(261, twoCards, metrics)).toBe('bottom');
  });

  it('moves with the shortCard height — the gap plays no part in the 2+-card edge', () => {
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

  it('exactly one card halves the edge to (heightPx + gapPx) / 2, leaving it a real, unlabeled middle band', () => {
    const oneCard = { contentRect, isTerminal: false, cardCount: 1 };
    expect(bandBoundaries(oneCard, metrics)).toEqual({ top: 124, bottom: 276 }); // (40 + 8) / 2 = 24
    expect(bandFor(123, oneCard, metrics)).toBe('top');
    expect(bandFor(125, oneCard, metrics)).toBe('middle');
    expect(bandFor(275, oneCard, metrics)).toBe('middle');
    expect(bandFor(277, oneCard, metrics)).toBe('bottom');
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

describe('containsPoint', () => {
  const r = rect(100, 100, 50, 50); // 100..150 both axes
  it('is inclusive of every edge, and false just outside one', () => {
    expect(containsPoint(r, { x: 100, y: 100 })).toBe(true);
    expect(containsPoint(r, { x: 150, y: 150 })).toBe(true);
    expect(containsPoint(r, { x: 99, y: 120 })).toBe(false);
    expect(containsPoint(r, { x: 120, y: 151 })).toBe(false);
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

// Story 4.1 Phase 2 split `measureDragRegions` into a structural resolve
// (which elements exist, their kind/parent chain/scroll ancestor/column
// facts — everything that survives a layer change) and a scoped
// measurement (live rects and card count, for exactly the region matching
// `scope` plus its own children). Every case below runs both steps, the
// same way `useBoardDnd.ts` does.
describe('resolveDragStructure / measureRegions', () => {
  function mockRect(el: HTMLElement, r: ReturnType<typeof rect>) {
    Object.defineProperty(el, 'getBoundingClientRect', { value: () => ({ ...r, x: r.left, y: r.top }) });
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
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    const regions = measureRegions(structure, null); // Board scope: every column/sub-row
    expect(regions).toHaveLength(1);
    expect(regions[0].rect).toMatchObject({ top: 150, bottom: 200, height: 50 });
  });

  it('a sub-row scrolled fully out of view registers no region at all', () => {
    buildScrolledSubrow(rect(0, 400, 300, 150), rect(0, 0, 300, 200)); // sub-row y 400..550, box y 0..200
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    expect(measureRegions(structure, null)).toEqual([]);
  });

  // Story 4.1 Phase 0's one region-shape case per kind — column/sub-row
  // shape is already exercised throughout this file via the `region()`
  // fixture; this is the only place a `kind: 'card'` region is built.
  function buildCardInColumn(
    columnId: string,
    columnRectValue: ReturnType<typeof rect>,
    cardId: string,
    cardRectValue: ReturnType<typeof rect>,
  ) {
    const columnEl = document.createElement('div');
    columnEl.setAttribute('data-drag-region', `column:${columnId}`);
    mockRect(columnEl, columnRectValue);
    const cardEl = document.createElement('div');
    cardEl.setAttribute('data-drag-region', `card:${cardId}`);
    mockRect(cardEl, cardRectValue);
    columnEl.appendChild(cardEl);
    document.body.appendChild(columnEl);
  }

  it("registers a valid card as its own kind:'card' region, parented to the column that contains it — reachable by scoping to that column", () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], id => id === 'item-1');
    const regions = measureRegions(structure, 'column:col-1'); // the column itself, plus its own children
    expect(regions).toHaveLength(2);
    const card = regions.find(r => r.kind === 'card');
    expect(card).toMatchObject({
      key: 'card:item-1',
      kind: 'card',
      attachToCardId: 'item-1',
      parentRegionKey: 'column:col-1',
    });
  });

  it('an id isValidCard rejects resolves no region at all — same as an unresolvable column key', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    const regions = measureRegions(structure, 'column:col-1');
    expect(regions.find(r => r.kind === 'card')).toBeUndefined();
  });

  // The point of the split (F5): a locked column never reads another
  // column's Cards, and Board never reads a Card at all — `measureRegions`
  // enforces this by construction (the scope filter), not by the caller
  // remembering to throw the rest away.
  it('scopes to exactly the context region and its own children — never a sibling column, never a foreign card', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    buildCardInColumn('col-2', rect(120, 0, 100, 400), 'item-2', rect(125, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1']), column('col-2', ['w2'])], () => true);

    const scopedToCol1 = measureRegions(structure, 'column:col-1');
    expect(scopedToCol1.map(r => r.key).sort()).toEqual(['card:item-1', 'column:col-1']);

    const board = measureRegions(structure, null);
    expect(board.map(r => r.key).sort()).toEqual(['column:col-1', 'column:col-2']);
  });
});
